/**
 * ui.js - Gestión centralizada de UI e interacciones
 * 
 * Maneja:
 * - Renderizado de tablas
 * - Diálogos modales
 * - Eventos de formularios
 * - Estados visuales
 */

class UIController {
    constructor() {
        this.elements = {};
        this.cameraStream = null;
        this.currentPhotoData = null;
        this.qrScanner = null;
    }

    /**
     * Inicializa los elementos del DOM
     * @param {Object} elementIds - Mapa de IDs de elementos
     */
    initElements(elementIds) {
        Object.entries(elementIds).forEach(([name, id]) => {
            this.elements[name] = document.getElementById(id);
        });
        console.log('UI Elements inicializados:', Object.keys(this.elements).length);
    }

    /**
     * Renderiza la tabla de equipos
     * @param {Array} data - Datos a mostrar
     * @param {Array} headers - Encabezados
     */
    renderTable(data, headers) {
        try {
            const table = this.elements.table;
            if (!table) {
                console.warn('Elemento table no encontrado');
                return;
            }

            table.innerHTML = '';

            // Crear encabezados
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Crear filas
            const tbody = document.createElement('tbody');
            data.forEach(row => {
                const tr = document.createElement('tr');
                headers.forEach(header => {
                    const td = document.createElement('td');
                    td.textContent = row[header] || '';
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);

            console.log(`Tabla renderizada: ${data.length} filas`);
        } catch (error) {
            console.error('Error renderizando tabla:', error);
        }
    }

    /**
     * Rellena un select con opciones
     * @param {HTMLElement} select - Elemento select
     * @param {Array} options - Array de opciones
     * @param {string} placeholder - Texto placeholder
     */
    populateSelect(select, options, placeholder = '-- Seleccionar --') {
        if (!select) return;

        select.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = placeholder;
        select.appendChild(defaultOption);

        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            select.appendChild(opt);
        });
    }

    /**
     * Muestra el modal de registro
     */
    showRegisterModal() {
        if (this.elements.registerModal) {
            UIManager.showModal(this.elements.registerModal);
            this.clearRegisterForm();
        }
    }

    /**
     * Oculta el modal de registro
     */
    hideRegisterModal() {
        if (this.elements.registerModal) {
            UIManager.hideModal(this.elements.registerModal);
            this.stopCamera();
        }
    }

    /**
     * Muestra el modal de verificación
     */
    showVerifyModal() {
        if (this.elements.verifySerieModal) {
            UIManager.showModal(this.elements.verifySerieModal);
        }
    }

    /**
     * Oculta el modal de verificación
     */
    hideVerifyModal() {
        if (this.elements.verifySerieModal) {
            UIManager.hideModal(this.elements.verifySerieModal);
        }
    }

    /**
     * Limpia el formulario de registro
     */
    clearRegisterForm() {
        if (this.elements.regSerieInput) this.elements.regSerieInput.value = '';
        if (this.elements.regLocationSelect) this.elements.regLocationSelect.value = '';
        if (this.elements.regObservaciones) this.elements.regObservaciones.value = '';
        this.currentPhotoData = null;
        this.updatePhotoUI();
    }

    /**
     * Inicia la captura de cámara
     */
    async startCamera() {
        try {
            UIManager.showLoading(this.elements.cameraContainer);
            this.cameraStream = await ImageManager.getCamera();
            if (this.elements.cameraVideo) {
                this.elements.cameraVideo.srcObject = this.cameraStream;
            }

            if (this.elements.startCameraBtn) this.elements.startCameraBtn.classList.add('hidden');
            if (this.elements.capturePhotoBtn) this.elements.capturePhotoBtn.classList.remove('hidden');
        } catch (error) {
            UIManager.showFeedback(
                error.message,
                'error',
                this.elements.regFeedback
            );
            console.error('Error iniciando cámara:', error);
        }
    }

    /**
     * Captura una foto de la cámara
     */
    capturePhoto() {
        try {
            if (!this.elements.cameraVideo) return;

            this.currentPhotoData = ImageManager.captureFromCamera(this.elements.cameraVideo);
            this.updatePhotoUI();

            UIManager.showFeedback(
                'Foto capturada correctamente',
                'success',
                this.elements.regFeedback,
                2000
            );
        } catch (error) {
            UIManager.showFeedback(
                'Error capturando foto',
                'error',
                this.elements.regFeedback
            );
            console.error('Error capturando foto:', error);
        }
    }

    /**
     * Detiene la cámara
     */
    stopCamera() {
        try {
            ImageManager.stopCamera(this.cameraStream);
            this.cameraStream = null;

            if (this.elements.cameraContainer) {
                UIManager.hideLoading(this.elements.cameraContainer);
            }
            if (this.elements.startCameraBtn) this.elements.startCameraBtn.classList.remove('hidden');
            if (this.elements.capturePhotoBtn) this.elements.capturePhotoBtn.classList.add('hidden');
        } catch (error) {
            console.error('Error deteniendo cámara:', error);
        }
    }

    /**
     * Actualiza la UI de la foto capturada
     */
    updatePhotoUI() {
        if (!this.currentPhotoData) {
            // No hay foto
            if (this.elements.capturedImage) this.elements.capturedImage.classList.add('hidden');
            if (this.elements.retakePhotoBtn) this.elements.retakePhotoBtn.classList.add('hidden');
            if (this.elements.deletPhotoBtn) this.elements.deletPhotoBtn.classList.add('hidden');
            if (this.elements.capturePhotoBtn) this.elements.capturePhotoBtn.classList.remove('hidden');
            if (this.elements.cameraContainer) this.elements.cameraContainer.classList.remove('hidden');
            return;
        }

        // Hay foto
        if (this.elements.capturedImage) {
            this.elements.capturedImage.src = this.currentPhotoData;
            this.elements.capturedImage.classList.remove('hidden');
        }
        if (this.elements.cameraContainer) this.elements.cameraContainer.classList.add('hidden');
        if (this.elements.capturePhotoBtn) this.elements.capturePhotoBtn.classList.add('hidden');
        if (this.elements.retakePhotoBtn) this.elements.retakePhotoBtn.classList.remove('hidden');
        if (this.elements.deletPhotoBtn) this.elements.deletPhotoBtn.classList.remove('hidden');
    }

    /**
     * Elimina la foto capturada
     */
    deletePhoto() {
        this.currentPhotoData = null;
        this.updatePhotoUI();
        UIManager.showFeedback(
            'Foto eliminada',
            'warning',
            this.elements.regFeedback,
            1500
        );
    }

    /**
     * Muestra el visor de imágenes
     * @param {string} imageSrc - URL de la imagen
     */
    showImageViewer(imageSrc) {
        if (this.elements.imageViewerModal) {
            this.elements.fullSizeImage.src = imageSrc;
            UIManager.showModal(this.elements.imageViewerModal);
        }
    }

    /**
     * Oculta el visor de imágenes
     */
    hideImageViewer() {
        if (this.elements.imageViewerModal) {
            UIManager.hideModal(this.elements.imageViewerModal);
        }
    }

    /**
     * Actualiza el estado de un botón de patrón
     * @param {boolean} isActive - Si está activo
     * @param {string} locationName - Nombre de la ubicación
     */
    updatePatronStatus(isActive, locationName = '') {
        const container = this.elements.patronUbicacionContainer;
        if (!container) return;

        if (isActive) {
            container.classList.remove('hidden');
            if (this.elements.patronUbicacionSelect) {
                this.elements.patronUbicacionSelect.value = locationName;
            }
        } else {
            container.classList.add('hidden');
            if (this.elements.patronUbicacionSelect) {
                this.elements.patronUbicacionSelect.value = '';
            }
        }
    }

    /**
     * Muestra sugerencias en un input
     * @param {Array} suggestions - Array de sugerencias
     * @param {HTMLElement} container - Contenedor de sugerencias
     * @param {Function} onSelectCallback - Callback al seleccionar
     */
    showSuggestions(suggestions, container, onSelectCallback) {
        if (!container) return;

        container.innerHTML = '';

        if (suggestions.length === 0) {
            container.classList.add('hidden');
            return;
        }

        suggestions.forEach(suggestion => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `<strong>${suggestion.value}</strong><small>${suggestion.description || ''}</small>`;
            div.addEventListener('click', () => {
                onSelectCallback(suggestion.value);
                container.classList.add('hidden');
            });
            container.appendChild(div);
        });

        container.classList.remove('hidden');
    }

    /**
     * Oculta las sugerencias
     * @param {HTMLElement} container - Contenedor de sugerencias
     */
    hideSuggestions(container) {
        if (container) {
            container.classList.add('hidden');
        }
    }

    /**
     * Habilita o deshabilita controles de escaneo
     * @param {boolean} enabled - True para habilitar
     */
    setScanControlsEnabled(enabled) {
        if (this.elements.startScanBtn) {
            this.elements.startScanBtn.classList.toggle('disabled', !enabled);
        }
        if (this.elements.verifySerieBtn) {
            this.elements.verifySerieBtn.classList.toggle('disabled', !enabled);
        }
        if (this.elements.registerSerieBtn) {
            this.elements.registerSerieBtn.classList.toggle('disabled', !enabled);
        }
    }

    /**
     * Actualiza el archivo cargado
     * @param {File} file - Archivo
     */
    updateFileLabel(file) {
        if (this.elements.fileLabel && file) {
            this.elements.fileLabel.textContent = `✓ ${file.name}`;
            this.elements.fileLabel.style.color = '#00ff88';
        }
    }

    /**
     * Muestra indicador de carga
     * @param {string} message - Mensaje
     */
    showProcessing(message = 'Procesando...') {
        if (this.elements.loading) {
            this.elements.loading.textContent = message;
            UIManager.showLoading(this.elements.loading);
        }
    }

    /**
     * Oculta indicador de carga
     */
    hideProcessing() {
        if (this.elements.loading) {
            UIManager.hideLoading(this.elements.loading);
        }
    }
}

// Crear instancia global
const uiController = new UIController();
