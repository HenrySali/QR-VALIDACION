/**
 * validation.js - Funciones de validación y utilidades
 * 
 * Proporciona funciones para validar datos, archivos y entrada del usuario.
 */

class ValidationManager {
    /**
     * Valida el formato de número de serie
     * @param {string} serie - Número de serie a validar
     * @returns {Object} { isValid: boolean, error?: string }
     */
    static validateSerie(serie) {
        if (!serie || typeof serie !== 'string') {
            return { isValid: false, error: 'El número de serie es requerido' };
        }

        const trimmed = serie.trim().toUpperCase();

        if (trimmed.length < APP_CONFIG.VALIDATION.MIN_SERIE_LENGTH) {
            return { 
                isValid: false, 
                error: `El número de serie debe tener al menos ${APP_CONFIG.VALIDATION.MIN_SERIE_LENGTH} caracteres` 
            };
        }

        if (trimmed.length > APP_CONFIG.VALIDATION.MAX_SERIE_LENGTH) {
            return { 
                isValid: false, 
                error: `El número de serie no puede exceder ${APP_CONFIG.VALIDATION.MAX_SERIE_LENGTH} caracteres` 
            };
        }

        if (!APP_CONFIG.VALIDATION.SERIE_REGEX.test(trimmed)) {
            return { 
                isValid: false, 
                error: 'El número de serie solo puede contener letras, números y guiones' 
            };
        }

        return { isValid: true, value: trimmed };
    }

    /**
     * Valida la ubicación técnica
     * @param {string} ubicacion - Ubicación a validar
     * @returns {Object} { isValid: boolean, error?: string }
     */
    static validateUbicacion(ubicacion) {
        if (!ubicacion || typeof ubicacion !== 'string') {
            return { isValid: false, error: 'La ubicación es requerida' };
        }

        const trimmed = ubicacion.trim();

        if (trimmed.length < APP_CONFIG.VALIDATION.MIN_UBICACION_LENGTH) {
            return { 
                isValid: false, 
                error: `La ubicación debe tener al menos ${APP_CONFIG.VALIDATION.MIN_UBICACION_LENGTH} caracteres` 
            };
        }

        if (trimmed.length > APP_CONFIG.VALIDATION.MAX_UBICACION_LENGTH) {
            return { 
                isValid: false, 
                error: `La ubicación no puede exceder ${APP_CONFIG.VALIDATION.MAX_UBICACION_LENGTH} caracteres` 
            };
        }

        return { isValid: true, value: trimmed };
    }

    /**
     * Valida un archivo Excel
     * @param {File} file - Archivo a validar
     * @returns {Object} { isValid: boolean, error?: string }
     */
    static validateExcelFile(file) {
        if (!file) {
            return { isValid: false, error: 'No se seleccionó ningún archivo' };
        }

        const config = APP_CONFIG.FILE;
        const fileName = file.name.toLowerCase();
        const mimeType = file.type;

        // Validar extensión
        const hasValidExtension = config.EXCEL_FORMATS.some(fmt => fileName.endsWith(fmt));
        if (!hasValidExtension) {
            return { 
                isValid: false, 
                error: `Solo se aceptan archivos Excel (${config.EXCEL_FORMATS.join(', ')})` 
            };
        }

        // Validar tipo MIME
        if (!config.EXCEL_MIME_TYPES.includes(mimeType)) {
            console.warn('Tipo MIME no estándar, pero continuando:', mimeType);
        }

        // Validar tamaño
        if (file.size > config.MAX_FILE_SIZE) {
            return { 
                isValid: false, 
                error: `El archivo es demasiado grande (máximo: ${this._formatFileSize(config.MAX_FILE_SIZE)})` 
            };
        }

        return { isValid: true };
    }

    /**
     * Valida un archivo ZIP
     * @param {File} file - Archivo a validar
     * @returns {Object} { isValid: boolean, error?: string }
     */
    static validateZipFile(file) {
        if (!file) {
            return { isValid: false, error: 'No se seleccionó ningún archivo' };
        }

        const config = APP_CONFIG.FILE;
        const fileName = file.name.toLowerCase();

        if (!fileName.endsWith(config.ZIP_FORMAT)) {
            return { 
                isValid: false, 
                error: `Solo se aceptan archivos ZIP` 
            };
        }

        if (file.size > config.MAX_FILE_SIZE) {
            return { 
                isValid: false, 
                error: `El archivo es demasiado grande (máximo: ${this._formatFileSize(config.MAX_FILE_SIZE)})` 
            };
        }

        return { isValid: true };
    }

    /**
     * Valida un archivo de imagen
     * @param {File} file - Archivo a validar
     * @returns {Object} { isValid: boolean, error?: string }
     */
    static validateImageFile(file) {
        if (!file) {
            return { isValid: false, error: 'No se seleccionó ningún archivo' };
        }

        const validFormats = ['image/jpeg', 'image/png', 'image/webp'];
        
        if (!validFormats.includes(file.type)) {
            return { 
                isValid: false, 
                error: 'Solo se aceptan archivos JPEG, PNG o WebP' 
            };
        }

        return { isValid: true };
    }

    /**
     * Formatea el tamaño de un archivo en bytes a formato legible
     * @param {number} bytes - Tamaño en bytes
     * @returns {string} Tamaño formateado
     */
    static _formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Valida que no hay campos vacíos en un formulario
     * @param {Object} formData - Objeto con datos del formulario
     * @param {Array<string>} requiredFields - Campos requeridos
     * @returns {Object} { isValid: boolean, missingFields?: Array }
     */
    static validateRequiredFields(formData, requiredFields) {
        const missingFields = requiredFields.filter(field => !formData[field] || formData[field].toString().trim() === '');
        
        if (missingFields.length > 0) {
            return { 
                isValid: false, 
                missingFields,
                error: `Campos requeridos: ${missingFields.join(', ')}` 
            };
        }

        return { isValid: true };
    }
}

/**
 * UIManager - Gestión centralizada de UI
 */
class UIManager {
    /**
     * Muestra un mensaje de retroalimentación
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - 'success', 'error', 'warning'
     * @param {HTMLElement} container - Contenedor del mensaje
     * @param {number} duration - Duración en ms (0 = indefinido)
     */
    static showFeedback(message, type, container, duration = APP_CONFIG.TIMEOUTS.FEEDBACK_DURATION) {
        if (!container) return;

        container.textContent = message;
        container.className = `feedback ${type}`;
        container.classList.remove('hidden');

        if (duration > 0) {
            setTimeout(() => {
                container.classList.add('hidden');
            }, duration);
        }
    }

    /**
     * Muestra un modal
     * @param {HTMLElement} modal - Elemento modal
     */
    static showModal(modal) {
        if (!modal) return;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Oculta un modal
     * @param {HTMLElement} modal - Elemento modal
     */
    static hideModal(modal) {
        if (!modal) return;
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    /**
     * Muestra un indicador de carga
     * @param {HTMLElement} element - Elemento a mostrar
     */
    static showLoading(element) {
        if (element) element.classList.remove('hidden');
    }

    /**
     * Oculta un indicador de carga
     * @param {HTMLElement} element - Elemento a ocultar
     */
    static hideLoading(element) {
        if (element) element.classList.add('hidden');
    }

    /**
     * Habilita o deshabilita un botón
     * @param {HTMLElement} button - Botón
     * @param {boolean} enabled - true para habilitar
     */
    static setButtonEnabled(button, enabled) {
        if (!button) return;
        button.disabled = !enabled;
        if (!enabled) {
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
        } else {
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
        }
    }

    /**
     * Limpia los campos de un formulario
     * @param {HTMLElement} form - Formulario
     */
    static clearForm(form) {
        if (!form) return;
        form.reset();
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.value = '';
            input.classList.remove('error');
        });
    }
}

/**
 * UtilityManager - Funciones de utilidad general
 */
class UtilityManager {
    /**
     * Debounce para funciones
     * @param {Function} func - Función a ejecutar
     * @param {number} delay - Delay en ms
     * @returns {Function}
     */
    static debounce(func, delay = APP_CONFIG.TIMEOUTS.DEBOUNCE) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * Throttle para funciones
     * @param {Function} func - Función a ejecutar
     * @param {number} limit - Límite en ms
     * @returns {Function}
     */
    static throttle(func, limit = APP_CONFIG.TIMEOUTS.DEBOUNCE) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Genera un ID único
     * @returns {string}
     */
    static generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Copia texto al portapapeles
     * @param {string} text - Texto a copiar
     * @returns {Promise<void>}
     */
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return { success: true };
        } catch (error) {
            console.error('Error copiando al portapapeles:', error);
            return { success: false, error };
        }
    }

    /**
     * Descarga un archivo
     * @param {Blob} blob - Contenido del archivo
     * @param {string} fileName - Nombre del archivo
     */
    static downloadFile(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Formatea una fecha
     * @param {Date|string} date - Fecha
     * @param {string} format - Formato (ej: 'DD/MM/YYYY')
     * @returns {string}
     */
    static formatDate(date, format = 'DD/MM/YYYY') {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        
        return format
            .replace('DD', day)
            .replace('MM', month)
            .replace('YYYY', year);
    }

    /**
     * Ordena un array por una propiedad
     * @param {Array} array - Array a ordenar
     * @param {string} property - Propiedad
     * @param {string} direction - 'asc' o 'desc'
     * @returns {Array}
     */
    static sortArray(array, property, direction = 'asc') {
        return [...array].sort((a, b) => {
            const aVal = a[property];
            const bVal = b[property];
            
            if (direction === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }

    /**
     * Filtra un array por búsqueda de texto
     * @param {Array} array - Array a filtrar
     * @param {string} searchText - Texto de búsqueda
     * @param {Array<string>} fields - Campos dónde buscar
     * @returns {Array}
     */
    static searchArray(array, searchText, fields) {
        const text = searchText.toLowerCase();
        return array.filter(item => 
            fields.some(field => 
                String(item[field]).toLowerCase().includes(text)
            )
        );
    }
}



// ============================================
// Crear instancias globales de los managers
// ============================================
const validationManager = new ValidationManager();
const uiManager = new UIManager();
const utilityManager = new UtilityManager();
