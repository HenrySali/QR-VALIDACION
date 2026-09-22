/**
 * main.js - Archivo principal de inicialización
 * 
 * Coordina la inicialización de todos los módulos y configuración
 * de event listeners para la aplicación.
 */

// Esperar a que todos los módulos estén listos
function waitForModules() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50; // 2.5 segundos máximo
        
        const checkModules = () => {
            attempts++;
            if (
                typeof dbManager !== 'undefined' &&
                typeof uiController !== 'undefined' &&
                typeof formManager !== 'undefined' &&
                typeof equipmentManager !== 'undefined' &&
                typeof validationManager !== 'undefined' &&
                typeof uiManager !== 'undefined' &&
                typeof utilityManager !== 'undefined' &&
                typeof APP_CONFIG !== 'undefined'
            ) {
                console.log(`✓ Todos los módulos están listos (intento ${attempts})`);
                resolve();
            } else if (attempts >= maxAttempts) {
                console.warn('⚠️ Timeout esperando módulos, continuando de todas formas...');
                console.warn('Estado de módulos:', {
                    dbManager: typeof dbManager,
                    uiController: typeof uiController,
                    formManager: typeof formManager,
                    equipmentManager: typeof equipmentManager,
                    APP_CONFIG: typeof APP_CONFIG
                });
                resolve(); // Continuar de todas formas
            } else {
                setTimeout(checkModules, 50);
            }
        };
        checkModules();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando QR-VALIDACION v2.0...');

    try {
        // Esperar a que todos los módulos estén cargados
        await waitForModules();

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
            // Carga de archivos
            fileInput: 'fileInput',
            fileLabel: 'fileLabel',
            processBtn: 'processBtn',
            exportBtn: 'exportBtn',
            clearExcelBtn: 'clearExcelBtn',
            exportFileName: 'exportFileName',
            exportNameContainer: 'exportNameContainer',

            // Selector de hojas
            sheetSelector: 'sheetSelector',
            sheetSelectorContainer: 'sheetSelectorContainer',
            sheetInfo: 'sheetInfo',

            // Tabla
            table: 'resultsTable',
            tableContainer: 'tableContainer',

            // Acciones
            startScanBtn: 'startScanBtn',
            verifySerieBtn: 'verifySerieBtn',
            registerSerieBtn: 'registerSerieBtn',
            patronUbicacionContainer: 'patronUbicacionContainer',
            patronUbicacionSelect: 'patronUbicacionSelect',
            clearPatronBtn: 'clearPatronBtn',

            // Modales
            registerModal: 'registerModal',
            verifySerieModal: 'verifySerieModal',
            imageViewerModal: 'imageViewerModal',

            // Formulario de registro
            regSerieInput: 'regSerieInput',
            regLocationSelect: 'regLocationSelect',
            regObservaciones: 'regObservaciones',
            confirmRegBtn: 'confirmRegBtn',
            cancelRegBtn: 'cancelRegBtn',
            regFeedback: 'regFeedback',

            // Cámara
            startCameraBtn: 'startCameraBtn',
            capturePhotoBtn: 'capturePhotoBtn',
            retakePhotoBtn: 'retakePhotoBtn',
            deletPhotoBtn: 'deletPhotoBtn',
            cameraContainer: 'cameraContainer',
            cameraVideo: 'cameraVideo',
            capturedImage: 'capturedImage',

            // Verificación
            verifySerieInput: 'verifySerieInput',
            confirmVerifyBtn: 'confirmVerifyBtn',
            cancelVerifyBtn: 'cancelVerifyBtn',
            verifySuggestions: 'verifySuggestions',
            verifyFeedback: 'verifyFeedback',

            // Visor de imágenes
            fullSizeImage: 'fullSizeImage',
            closeImageViewer: 'closeImageViewer',
            imageViewerModal: 'imageViewerModal',

            // Exportación de imágenes
            exportImagesBtn: 'exportImagesBtn',
            importImagesInput: 'importImagesInput',
            backupStatus: 'backupStatus',

            // Generales
            loading: 'loading'
        });
        console.log('✓ Interfaz inicializada');

        // ============================================
        // 3. DEFINIR REGLAS DE VALIDACIÓN
        // ============================================
        console.log('✔️ Definiendo reglas de validación...');
        
        try {
            const serieRegex = (APP_CONFIG && APP_CONFIG.VALIDATION && APP_CONFIG.VALIDATION.SERIE_REGEX) 
                ? APP_CONFIG.VALIDATION.SERIE_REGEX 
                : /^[A-Z0-9\-]{3,}$/;

            formManager.defineRules('registerForm', {
                serie: {
                    required: true,
                    requiredMessage: 'El número de serie es requerido',
                    minLength: 3,
                    minLengthMessage: 'Mínimo 3 caracteres',
                    maxLength: 50,
                    pattern: serieRegex,
                    patternMessage: 'Solo letras, números y guiones permitidos'
                },
                ubicacion: {
                    required: true,
                    requiredMessage: 'La ubicación es requerida',
                    minLength: 2,
                    maxLength: 100
                },
                observaciones: {
                    required: false,
                    maxLength: 500
                }
            });

            formManager.defineRules('verifyForm', {
                verifySerie: {
                    required: true,
                    requiredMessage: 'Ingresa un número de serie',
                    minLength: 3
                }
            });

            console.log('✓ Reglas definidas');
        } catch (error) {
            console.error('⚠️ Error definiendo reglas (continuando):', error);
        }

        // ============================================
        // 4. CARGAR DATOS INICIALES
        // ============================================
        console.log('📥 Cargando datos iniciales...');
        await loadInitialData();
        console.log('✓ Datos iniciales cargados');

        // ============================================
        // 5. CONFIGURAR EVENT LISTENERS
        // ============================================
        console.log('🔌 Configurando eventos...');
        setupEventListeners();
        console.log('✓ Eventos configurados');

        console.log('✨ ¡Aplicación lista!');
    } catch (error) {
        console.error('❌ Error en inicialización:', error);
        UIManager.showFeedback(
            `Error inicializando: ${error.message}`,
            'error',
            document.getElementById('loading')
        );
    }
});

/**
 * Carga los datos iniciales de la aplicación
 */
async function loadInitialData() {
    try {
        // Intentar cargar Excel guardado
        const savedExcel = await dbManager.dbGet('image', APP_CONFIG.DB.EQUIPOS.STORES.EXCEL_DATA, 'currentExcel');
        
        if (savedExcel) {
            // Restaurar desde IndexedDB
            equipmentManager.allSheetsData = savedExcel.allSheetsData || {};
            equipmentManager.allSheetsHeaders = savedExcel.allSheetsHeaders || {};
            equipmentManager.sheetNames = savedExcel.sheetNames || [];
            equipmentManager.currentSheetName = savedExcel.currentSheetName || '';
            equipmentManager.dataRaw = equipmentManager.allSheetsData[equipmentManager.currentSheetName] || [];
            equipmentManager.headers = equipmentManager.allSheetsHeaders[equipmentManager.currentSheetName] || [];

            if (equipmentManager.dataRaw.length > 0) {
                uiController.renderTable(equipmentManager.dataRaw, equipmentManager.headers);
                populateLocationSelect();
                uiController.setScanControlsEnabled(true);
            }
        } else {
            // Intentar descargar desde URL remota
            await loadRemoteInventory();
        }
    } catch (error) {
        console.warn('No se pudieron cargar datos iniciales:', error);
    }
}

/**
 * Carga el inventario desde URL remota
 */
async function loadRemoteInventory() {
    try {
        console.log('📡 Descargando inventario remoto...');
        console.log('URL:', APP_CONFIG.INVENTARIO_URL);
        uiController.showProcessing('Cargando inventario...');

        const response = await fetch(APP_CONFIG.INVENTARIO_URL, { cache: 'no-cache' });
        console.log('Response status:', response.status);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        const buffer = await response.arrayBuffer();
        console.log('✓ Buffer descargado:', buffer.byteLength, 'bytes');
        
        const result = equipmentManager.processExcelBuffer(buffer, 'Inventario');
        console.log('✓ Resultado procesamiento:', result);

        if (result.success) {
            uiController.renderTable(equipmentManager.dataRaw, equipmentManager.headers);
            populateLocationSelect();
            uiController.setScanControlsEnabled(true);
            
            UIManager.showFeedback(result.message, 'success', uiController.elements.loading, 2000);
            await saveExcelToDB();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('❌ Error descargando inventario remoto:', error);
        UIManager.showFeedback('⚠️ Cargando localmente...', 'warning', uiController.elements.loading);
    } finally {
        uiController.hideProcessing();
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
                uiController.showProcessing('Procesando Excel...');

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
            } finally {
                uiController.hideProcessing();
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

    // === EXPORTAR EXCEL ===
    if (uiController.elements.exportBtn) {
        uiController.elements.exportBtn.addEventListener('click', () => {
            const fileName = uiController.elements.exportFileName?.value || 'equipos_exportados';
            const result = equipmentManager.exportToExcel(fileName);
            
            if (result.success) {
                UIManager.showFeedback(result.message, 'success', uiController.elements.loading, 2000);
            } else {
                UIManager.showFeedback(result.error, 'error', uiController.elements.loading);
            }
        });
    }

    // === EXPORTAR CSV ===
    // (Se puede agregar un botón en el HTML)

    // === REGISTRAR EQUIPO ===
    if (uiController.elements.registerSerieBtn) {
        uiController.elements.registerSerieBtn.addEventListener('click', () => {
            uiController.showRegisterModal();
            
            // Si hay patrón activo, mostrar indicación visual
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
                usarPatron: !!equipmentManager.patronUbicacion  // Usar patrón si está activo
            };

            // Validar
            if (!formData.serie) {
                UIManager.showFeedback('❌ Ingresa el número de serie', 'error', uiController.elements.regFeedback);
                return;
            }

            // Si NO hay patrón activo, validar que eligió ubicación
            if (!equipmentManager.patronUbicacion && !formData.ubicacion) {
                UIManager.showFeedback('❌ Selecciona una ubicación técnica', 'error', uiController.elements.regFeedback);
                return;
            }

            const result = await equipmentManager.registerEquipment(formData);

            if (result.success) {
                UIManager.showFeedback(result.message, 'success', uiController.elements.regFeedback, 2000);
                
                // Mostrar modo utilizado
                const modoTexto = formData.usarPatron ? '📍 [MODO FIJO]' : '🔓 [MODO MANUAL]';
                console.log(`${modoTexto} ${result.message}`);
                
                uiController.hideRegisterModal();
                await saveExcelToDB();
            } else {
                UIManager.showFeedback(result.message, 'error', uiController.elements.regFeedback);
            }
        });
    }

    // === CANCELAR REGISTRO ===
    if (uiController.elements.cancelRegBtn) {
        uiController.elements.cancelRegBtn.addEventListener('click', () => {
            uiController.hideRegisterModal();
        });
    }

    // === CÁMARA ===
    if (uiController.elements.startCameraBtn) {
        uiController.elements.startCameraBtn.addEventListener('click', () => {
            uiController.startCamera();
        });
    }

    if (uiController.elements.capturePhotoBtn) {
        uiController.elements.capturePhotoBtn.addEventListener('click', () => {
            uiController.capturePhoto();
        });
    }

    if (uiController.elements.retakePhotoBtn) {
        uiController.elements.retakePhotoBtn.addEventListener('click', () => {
            uiController.currentPhotoData = null;
            uiController.startCamera();
        });
    }

    if (uiController.elements.deletPhotoBtn) {
        uiController.elements.deletPhotoBtn.addEventListener('click', () => {
            uiController.deletePhoto();
        });
    }

    // === PATRÓN DE UBICACIÓN ===
    if (uiController.elements.patronUbicacionSelect) {
        uiController.elements.patronUbicacionSelect.addEventListener('change', (e) => {
            const value = e.target.value;
            equipmentManager.setPatronUbicacion(value);
            UIManager.showFeedback(
                value ? `Patrón: ${value}` : 'Patrón desactivado',
                'warning',
                uiController.elements.loading,
                1500
            );
        });
    }

    if (uiController.elements.clearPatronBtn) {
        uiController.elements.clearPatronBtn.addEventListener('click', () => {
            if (uiController.elements.patronUbicacionSelect) {
                uiController.elements.patronUbicacionSelect.value = '';
            }
            equipmentManager.setPatronUbicacion(null);
        });
    }

    console.log('✓ Event listeners configurados');
}
