/**
 * main.js - Archivo principal de inicialización
 * 
 * Coordina la inicialización de todos los módulos y configuración
 * de event listeners para la aplicación.
 */

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando QR-VALIDACION v2.0...');

    try {
        // ============================================
        // 1. INICIALIZAR BASES DE DATOS
        // ============================================
        console.log('📊 Inicializando bases de datos...');
        await dbManager.initImageDB();
        await dbManager.initStationsDB();
        console.log('✓ Bases de datos inicializadas');

        // ============================================
        // 2. INICIALIZAR ELEMENTOS DEL DOM
        // ============================================
        console.log('🎨 Inicializando interfaz...');
        uiController.initElements({
            fileInput: 'fileInput',
            fileLabel: 'fileLabel',
            processBtn: 'processBtn',
            exportBtn: 'exportBtn',
            clearExcelBtn: 'clearExcelBtn',
            exportFileName: 'exportFileName',
            exportNameContainer: 'exportNameContainer',
            sheetSelector: 'sheetSelector',
            sheetSelectorContainer: 'sheetSelectorContainer',
            sheetInfo: 'sheetInfo',
            table: 'resultsTable',
            tableContainer: 'tableContainer',
            startScanBtn: 'startScanBtn',
            verifySerieBtn: 'verifySerieBtn',
            registerSerieBtn: 'registerSerieBtn',
            patronUbicacionContainer: 'patronUbicacionContainer',
            patronUbicacionSelect: 'patronUbicacionSelect',
            clearPatronBtn: 'clearPatronBtn',
            registerModal: 'registerModal',
            verifySerieModal: 'verifySerieModal',
            imageViewerModal: 'imageViewerModal',
            regSerieInput: 'regSerieInput',
            regLocationSelect: 'regLocationSelect',
            regObservaciones: 'regObservaciones',
            confirmRegBtn: 'confirmRegBtn',
            cancelRegBtn: 'cancelRegBtn',
            regFeedback: 'regFeedback',
            startCameraBtn: 'startCameraBtn',
            capturePhotoBtn: 'capturePhotoBtn',
            retakePhotoBtn: 'retakePhotoBtn',
            deletPhotoBtn: 'deletPhotoBtn',
            cameraContainer: 'cameraContainer',
            cameraVideo: 'cameraVideo',
            capturedImage: 'capturedImage',
            verifySerieInput: 'verifySerieInput',
            confirmVerifyBtn: 'confirmVerifyBtn',
            cancelVerifyBtn: 'cancelVerifyBtn',
            verifySuggestions: 'verifySuggestions',
            verifyFeedback: 'verifyFeedback',
            fullSizeImage: 'fullSizeImage',
            closeImageViewer: 'closeImageViewer',
            exportImagesBtn: 'exportImagesBtn',
            importImagesInput: 'importImagesInput',
            backupStatus: 'backupStatus',
            loading: 'loading'
        });
        console.log('✓ Interfaz inicializada');

        // ============================================
        // 3. CARGAR DATOS INICIALES
        // ============================================
        console.log('📥 Cargando datos iniciales...');
        await loadInitialData();
        console.log('✓ Datos iniciales cargados');

        // ============================================
        // 4. CONFIGURAR EVENT LISTENERS
        // ============================================
        console.log('🔌 Configurando eventos...');
        setupEventListeners();
        console.log('✓ Eventos configurados');

        console.log('✨ ¡Aplicación lista!');
    } catch (error) {
        console.error('❌ Error en inicialización:', error);
        if (uiController.elements.loading) {
            UIManager.showFeedback(
                `Error inicializando: ${error.message}`,
                'error',
                uiController.elements.loading
            );
        }
    }
});

/**
 * Carga los datos iniciales de la aplicación
 */
async function loadInitialData() {
    try {
        // Intentar cargar Excel guardado en IndexedDB
        const savedExcel = await dbManager.dbGet('image', APP_CONFIG.DB.EQUIPOS.STORES.EXCEL_DATA, 'currentExcel');
        
        if (savedExcel && savedExcel.dataRaw && savedExcel.dataRaw.length > 0) {
            console.log('✓ Cargando desde IndexedDB');
            equipmentManager.allSheetsData = savedExcel.allSheetsData || {};
            equipmentManager.allSheetsHeaders = savedExcel.allSheetsHeaders || {};
            equipmentManager.sheetNames = savedExcel.sheetNames || [];
            equipmentManager.currentSheetName = savedExcel.currentSheetName || '';
            equipmentManager.dataRaw = savedExcel.dataRaw;
            equipmentManager.headers = savedExcel.headers || [];

            uiController.renderTable(equipmentManager.dataRaw, equipmentManager.headers);
            populateLocationSelect();
            uiController.setScanControlsEnabled(true);
        } else {
            // Descargar desde URL remota
            await loadRemoteInventory();
        }
    } catch (error) {
        console.warn('Error cargando desde IndexedDB:', error);
        await loadRemoteInventory();
    }
}

/**
 * Carga el inventario desde URL remota
 */
async function loadRemoteInventory() {
    try {
        console.log('📡 Descargando inventario remoto desde:', APP_CONFIG.INVENTARIO_URL);
        
        if (uiController.elements.loading) {
            uiController.elements.loading.textContent = '⏳ Descargando inventario...';
            uiController.elements.loading.style.display = 'block';
        }
        
        const response = await fetch(APP_CONFIG.INVENTARIO_URL, { cache: 'no-cache' });
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        console.log('✓ Buffer descargado:', buffer.byteLength, 'bytes');
        
        const result = equipmentManager.processExcelBuffer(buffer, 'Inventario');
        console.log('✓ Excel procesado:', result);

        if (result.success) {
            console.log('📊 Renderizando tabla con', equipmentManager.dataRaw.length, 'registros');
            uiController.renderTable(equipmentManager.dataRaw, equipmentManager.headers);
            populateLocationSelect();
            uiController.setScanControlsEnabled(true);
            
            UIManager.showFeedback(result.message, 'success', uiController.elements.loading, 2000);
            await saveExcelToDB();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Error descargando inventario:', error);
        const errorMsg = `⚠️ No se pudo cargar el inventario automáticamente.\n\nError: ${error.message}\n\nSolución: Carga un archivo Excel manualmente usando el botón "📂 Cargar Archivo Excel"`;
        
        if (uiController.elements.loading) {
            uiController.elements.loading.innerHTML = `<div style="color: #ff6464; padding: 20px; text-align: center; white-space: pre-line;">${errorMsg}</div>`;
            uiController.elements.loading.style.display = 'block';
        }
        
        UIManager.showFeedback(errorMsg, 'error', uiController.elements.loading);
    }
}

/**
 * Rellena el select de ubicaciones
 */
function populateLocationSelect() {
    const locations = equipmentManager.getUniqueLocations();
    uiController.populateSelect(
        uiController.elements.regLocationSelect,
        locations,
        '-- Seleccionar ubicación --'
    );
    uiController.populateSelect(
        uiController.elements.patronUbicacionSelect,
        locations,
        '— Sin patrón (manual) —'
    );
}

/**
 * Guarda Excel en IndexedDB
 */
async function saveExcelToDB() {
    try {
        const excelData = {
            id: 'currentExcel',
            allSheetsData: equipmentManager.allSheetsData,
            allSheetsHeaders: equipmentManager.allSheetsHeaders,
            sheetNames: equipmentManager.sheetNames,
            currentSheetName: equipmentManager.currentSheetName,
            dataRaw: equipmentManager.dataRaw,
            headers: equipmentManager.headers,
            fileName: uiController.elements.exportFileName?.value || 'equipos',
            savedAt: new Date().toISOString()
        };

        await dbManager.dbPut('image', APP_CONFIG.DB.EQUIPOS.STORES.EXCEL_DATA, excelData);
        console.log('✓ Excel guardado en BD');
    } catch (error) {
        console.error('Error guardando Excel:', error);
    }
}

/**
 * Configura todos los event listeners de la aplicación
 */
function setupEventListeners() {
    // === CARGA DE ARCHIVO ===
    if (uiController.elements.fileInput) {
        uiController.elements.fileInput.addEventListener('change', async (e) => {
            try {
                const file = e.target.files[0];
                if (!file) return;

                const validation = ValidationManager.validateExcelFile(file);
                if (!validation.isValid) {
                    UIManager.showFeedback(validation.error, 'error', uiController.elements.loading);
                    return;
                }

                uiController.updateFileLabel(file);

                const buffer = await file.arrayBuffer();
                const result = equipmentManager.processExcelBuffer(buffer, file.name);

                if (result.success) {
                    uiController.renderTable(equipmentManager.dataRaw, equipmentManager.headers);
                    populateLocationSelect();
                    uiController.setScanControlsEnabled(true);
                    await saveExcelToDB();
                    
                    UIManager.showFeedback(result.message, 'success', uiController.elements.loading, 2000);
                } else {
                    UIManager.showFeedback(result.message, 'error', uiController.elements.loading);
                }
            } catch (error) {
                UIManager.showFeedback(`Error: ${error.message}`, 'error', uiController.elements.loading);
                console.error('Error procesando archivo:', error);
            }
        });
    }

    // === CAMBIO DE HOJA ===
    if (uiController.elements.sheetSelector) {
        uiController.elements.sheetSelector.addEventListener('change', async (e) => {
            const sheetName = e.target.value;
            if (sheetName) {
                const result = equipmentManager.switchSheet(sheetName);
                if (result.success) {
                    uiController.renderTable(equipmentManager.dataRaw, equipmentManager.headers);
                    await saveExcelToDB();
                }
            }
        });
    }

    // === REGISTRO DE SERIE ===
    if (uiController.elements.registerSerieBtn) {
        uiController.elements.registerSerieBtn.addEventListener('click', () => {
            uiController.showRegisterModal();
            
            if (equipmentManager.patronUbicacion) {
                UIManager.showFeedback(
                    `📍 Modo FIJO: Ubicación patrón "${equipmentManager.patronUbicacion}" aplicada automáticamente`,
                    'warning',
                    uiController.elements.regFeedback,
                    3000
                );
            } else {
                UIManager.showFeedback(
                    '🔓 Modo MANUAL: Selecciona la ubicación técnica',
                    'warning',
                    uiController.elements.regFeedback,
                    3000
                );
            }
        });
    }

    if (uiController.elements.confirmRegBtn) {
        uiController.elements.confirmRegBtn.addEventListener('click', async () => {
            const formData = {
                serie: uiController.elements.regSerieInput?.value || '',
                ubicacion: uiController.elements.regLocationSelect?.value || '',
                observaciones: uiController.elements.regObservaciones?.value || '',
                photoId: uiController.currentPhotoData ? `photo_${UtilityManager.generateId()}` : null,
                photoData: uiController.currentPhotoData,
                usarPatron: !!equipmentManager.patronUbicacion
            };

            if (!formData.serie) {
                UIManager.showFeedback('❌ Ingresa el número de serie', 'error', uiController.elements.regFeedback);
                return;
            }

            if (!equipmentManager.patronUbicacion && !formData.ubicacion) {
                UIManager.showFeedback('❌ Selecciona una ubicación técnica', 'error', uiController.elements.regFeedback);
                return;
            }

            const result = await equipmentManager.registerEquipment(formData);

            if (result.success) {
                UIManager.showFeedback(result.message, 'success', uiController.elements.regFeedback, 2000);
                const modoTexto = formData.usarPatron ? '📍 [MODO FIJO]' : '🔓 [MODO MANUAL]';
                console.log(`${modoTexto} ${result.message}`);
                
                uiController.hideRegisterModal();
                await saveExcelToDB();
            } else {
                UIManager.showFeedback(result.message, 'error', uiController.elements.regFeedback);
            }
        });
    }

    if (uiController.elements.cancelRegBtn) {
        uiController.elements.cancelRegBtn.addEventListener('click', () => {
            uiController.hideRegisterModal();
        });
    }

    // === ESCANEAR QR ===
    if (uiController.elements.startScanBtn) {
        uiController.elements.startScanBtn.addEventListener('click', async () => {
            try {
                await qrScanner.start();
            } catch (error) {
                UIManager.showFeedback(`Error: ${error.message}`, 'error', uiController.elements.loading);
            }
        });
    }

    // === VERIFICAR SERIE ===
    if (uiController.elements.verifySerieBtn) {
        uiController.elements.verifySerieBtn.addEventListener('click', () => {
            uiController.showVerifySerieModal();
        });
    }

    if (uiController.elements.confirmVerifyBtn) {
        uiController.elements.confirmVerifyBtn.addEventListener('click', async () => {
            const serie = uiController.elements.verifySerieInput?.value || '';
            if (!serie) {
                UIManager.showFeedback('Ingresa un número de serie', 'error', uiController.elements.verifyFeedback);
                return;
            }

            const result = equipmentManager.searchEquipment({ serie });
            if (result.length > 0) {
                UIManager.showFeedback(`✓ Se encontraron ${result.length} coincidencias`, 'success', uiController.elements.verifyFeedback);
                uiController.renderTable(result, equipmentManager.headers);
            } else {
                UIManager.showFeedback('❌ No se encontraron coincidencias', 'error', uiController.elements.verifyFeedback);
            }
        });
    }

    // === UBICACIÓN PATRÓN ===
    if (uiController.elements.patronUbicacionSelect) {
        uiController.elements.patronUbicacionSelect.addEventListener('change', (e) => {
            equipmentManager.patronUbicacion = e.target.value || null;
            console.log('Ubicación patrón:', equipmentManager.patronUbicacion);
        });
    }

    if (uiController.elements.clearPatronBtn) {
        uiController.elements.clearPatronBtn.addEventListener('click', () => {
            equipmentManager.patronUbicacion = null;
            uiController.elements.patronUbicacionSelect.value = '';
            UIManager.showFeedback('✓ Ubicación patrón eliminada', 'success', uiController.elements.loading, 1500);
        });
    }

    console.log('✓ Event listeners configurados');
}
