# Referencia JSDoc - QR-VALIDACION

## 📚 Documentación de Funciones Complejas

Este documento proporciona una guía de referencia para toda la documentación JSDoc utilizada en el proyecto.

## Módulos y Clases

### DatabaseManager (db.js)

```javascript
/**
 * DatabaseManager - Gestor centralizado de IndexedDB
 * @class
 */
class DatabaseManager {
    /**
     * Inicializa la base de datos de equipos e imágenes
     * @returns {Promise<IDBDatabase>} Promesa que resuelve en la BD inicializada
     * @throws {Error} Si hay error abriendo la base de datos
     * @example
     * await dbManager.initImageDB();
     */
    initImageDB() {}

    /**
     * Inicializa la base de datos de estaciones de agua
     * @returns {Promise<IDBDatabase>} Promesa que resuelve en la BD inicializada
     * @example
     * await dbManager.initStationsDB();
     */
    initStationsDB() {}

    /**
     * Operación genérica ADD en IndexedDB
     * @param {string} dbType - 'image' o 'stations'
     * @param {string} storeName - Nombre del store
     * @param {Object} data - Datos a guardar
     * @returns {Promise<any>} ID del registro insertado
     * @example
     * await dbManager.dbAdd('image', 'images', { id: '123', dataUrl: '...' });
     */
    dbAdd(dbType, storeName, data) {}

    /**
     * Operación genérica PUT en IndexedDB
     * @param {string} dbType - 'image' o 'stations'
     * @param {string} storeName - Nombre del store
     * @param {Object} data - Datos a guardar
     * @returns {Promise<any>} ID del registro actualizado
     */
    dbPut(dbType, storeName, data) {}

    /**
     * Consulta por índice en IndexedDB
     * @param {string} dbType - 'image' o 'stations'
     * @param {string} storeName - Nombre del store
     * @param {string} indexName - Nombre del índice
     * @param {any} value - Valor a buscar
     * @returns {Promise<Array>} Array de registros que coinciden
     */
    dbQueryIndex(dbType, storeName, indexName, value) {}
}
```

### ValidationManager (validation.js)

```javascript
/**
 * ValidationManager - Validación centralizada de datos
 * @class
 */
class ValidationManager {
    /**
     * Valida el formato de número de serie
     * @param {string} serie - Número de serie a validar
     * @returns {Object} { isValid: boolean, error?: string, value?: string }
     * @example
     * const result = ValidationManager.validateSerie('ABC-123456');
     * if (result.isValid) {
     *   console.log('Serie válida:', result.value);
     * }
     */
    static validateSerie(serie) {}

    /**
     * Valida un archivo Excel
     * @param {File} file - Archivo a validar
     * @returns {Object} { isValid: boolean, error?: string }
     * @throws No lanza excepciones, retorna objeto de resultado
     */
    static validateExcelFile(file) {}

    /**
     * Valida que no hay campos vacíos en un formulario
     * @param {Object} formData - Objeto con datos del formulario
     * @param {Array<string>} requiredFields - Campos requeridos
     * @returns {Object} { isValid: boolean, missingFields?: Array, error?: string }
     */
    static validateRequiredFields(formData, requiredFields) {}
}
```

### EquipmentManager (equipment.js)

```javascript
/**
 * EquipmentManager - Gestión de equipos y validación QR
 * @class
 */
class EquipmentManager {
    /**
     * Procesa un buffer de Excel y carga todas las hojas
     * @param {ArrayBuffer} buffer - Buffer del archivo Excel
     * @param {string} fileName - Nombre del archivo (opcional)
     * @returns {Object} { success: boolean, message: string, data?: Object }
     * @example
     * const result = equipmentManager.processExcelBuffer(buffer, 'inventario.xlsx');
     */
    processExcelBuffer(buffer, fileName = '') {}

    /**
     * Busca un equipo por número de serie
     * @param {string} serie - Número de serie
     * @returns {Object|null} Registro del equipo o null
     */
    findEquipmentBySerie(serie) {}

    /**
     * Registra un nuevo equipo
     * @param {Object} equipmentData - Datos del equipo
     * @param {string} equipmentData.serie - Número de serie (requerido)
     * @param {string} equipmentData.ubicacion - Ubicación técnica (requerido)
     * @param {string} equipmentData.observaciones - Observaciones
     * @param {string} equipmentData.photoId - ID de foto (opcional)
     * @param {string} equipmentData.photoData - Data URL de foto (opcional)
     * @returns {Promise<Object>} { success: boolean, message: string, data?: Object }
     */
    async registerEquipment(equipmentData) {}

    /**
     * Valida un equipo por QR/Serie
     * @param {string} serie - Número de serie
     * @param {string} ubicacion - Ubicación (opcional, usa patrón si no se proporciona)
     * @returns {Object} { success: boolean, message: string, data?: Object }
     */
    validateEquipment(serie, ubicacion = null) {}

    /**
     * Obtiene las ubicaciones únicas del inventario
     * @returns {Array<string>} Array de ubicaciones ordenadas alfabéticamente
     */
    getUniqueLocations() {}

    /**
     * Busca equipos usando múltiples criterios
     * @param {Object} criteria - Criterios de búsqueda
     * @param {string} criteria.serie - Búsqueda en serie (opcional)
     * @param {string} criteria.ubicacion - Búsqueda en ubicación (opcional)
     * @param {Object} criteria.sort - Ordenamiento (opcional)
     * @param {string} criteria.sort.field - Campo a ordenar
     * @param {string} criteria.sort.direction - 'asc' o 'desc'
     * @returns {Array} Equipos que coinciden con criterios
     */
    searchEquipment(criteria = {}) {}
}
```

### FileExportManager (fileUtils.js)

```javascript
/**
 * FileExportManager - Exportación de datos a diferentes formatos
 * @class
 */
class FileExportManager {
    /**
     * Exporta datos a archivo Excel
     * @param {Array} data - Datos a exportar
     * @param {string} fileName - Nombre del archivo (sin extensión)
     * @param {Array<string>} headers - Encabezados de columnas
     * @returns {Object} { success: boolean, message?: string, error?: string }
     * @requires XLSX global library
     */
    static exportToExcel(data, fileName, headers) {}

    /**
     * Exporta datos a archivo CSV
     * @param {Array} data - Datos a exportar
     * @param {string} fileName - Nombre del archivo (sin extensión)
     * @param {Array<string>} headers - Encabezados de columnas
     * @returns {Object} { success: boolean, message?: string, error?: string }
     */
    static exportToCSV(data, fileName, headers) {}

    /**
     * Exporta imágenes como archivo ZIP
     * @param {Array} images - Array de objetos { id, dataUrl }
     * @param {string} fileName - Nombre del archivo (sin extensión)
     * @returns {Promise<Object>} { success: boolean, message?: string, error?: string }
     * @requires JSZip global library
     */
    static async exportImagesToZip(images, fileName) {}
}
```

### SearchManager (search.js)

```javascript
/**
 * SearchManager - Búsqueda y filtrado avanzado
 * @class
 */
class SearchManager {
    /**
     * Realiza búsqueda de texto en múltiples campos
     * @param {string} searchText - Texto a buscar
     * @param {Array<string>} fields - Campos donde buscar (opcional)
     * @returns {Array} Resultados filtrados
     */
    search(searchText, fields = null) {}

    /**
     * Agrega un filtro personalizado
     * @param {string} filterId - ID único del filtro
     * @param {Function} filterFn - Función que retorna boolean
     * @returns {Array} Datos filtrados
     * @example
     * searchManager.addFilter('priceFilter', 
     *   (item) => item.price > 100
     * );
     */
    addFilter(filterId, filterFn) {}

    /**
     * Obtiene la página especificada
     * @param {number} pageNum - Número de página (1-based)
     * @returns {Object} {
     *   data: Array,
     *   currentPage: number,
     *   totalPages: number,
     *   totalRecords: number,
     *   pageSize: number,
     *   hasNextPage: boolean,
     *   hasPrevPage: boolean
     * }
     */
    getPage(pageNum = 1) {}

    /**
     * Obtiene estadísticas de búsqueda
     * @returns {Object} { 
     *   totalRecords: number, 
     *   filteredRecords: number,
     *   hasActiveFilters: boolean,
     *   sortField: string,
     *   sortDirection: string
     * }
     */
    getStatistics() {}
}
```

### ImageManager (fileUtils.js)

```javascript
/**
 * ImageManager - Gestión de imágenes con compresión
 * @class
 */
class ImageManager {
    /**
     * Comprime una imagen
     * @param {string} dataUrl - Data URL de la imagen
     * @param {number} maxSize - Tamaño máximo en bytes
     * @returns {Promise<string>} Data URL comprimida
     */
    static async compressImage(dataUrl, maxSize = APP_CONFIG.IMAGE.MAX_SIZE) {}

    /**
     * Obtiene información de una imagen
     * @param {string} dataUrl - Data URL de la imagen
     * @returns {Promise<Object>} { width: number, height: number, size: number, formattedSize: string }
     */
    static async getImageInfo(dataUrl) {}

    /**
     * Captura una foto desde la cámara
     * @param {HTMLVideoElement} videoElement - Elemento video
     * @param {number} width - Ancho de captura (opcional)
     * @param {number} height - Alto de captura (opcional)
     * @returns {string} Data URL de la imagen
     */
    static captureFromCamera(videoElement, width = null, height = null) {}

    /**
     * Accede a la cámara
     * @returns {Promise<MediaStream>} Stream de cámara
     * @throws {Error} Si no se puede acceder a la cámara
     */
    static async getCamera() {}

    /**
     * Crea una miniatura de una imagen
     * @param {string} dataUrl - Data URL de la imagen
     * @param {number} maxWidth - Ancho máximo
     * @param {number} maxHeight - Alto máximo
     * @returns {Promise<string>} Data URL de miniatura
     */
    static async createThumbnail(dataUrl, maxWidth = 150, maxHeight = 150) {}
}
```

### FormManager (forms.js)

```javascript
/**
 * FormManager - Gestor centralizado de formularios
 * @class
 */
class FormManager {
    /**
     * Inicializa un formulario con validación
     * @param {string} formId - ID del formulario
     * @param {Object} options - Opciones del formulario
     * @param {Object} options.rules - Reglas de validación
     * @param {Function} options.onSubmit - Callback al enviar
     * @param {boolean} options.validateOnChange - Validar en tiempo real
     * @param {boolean} options.validateOnBlur - Validar al perder foco
     * @example
     * formManager.initForm('registerForm', {
     *   rules: {
     *     email: { required: true, email: true },
     *     password: { required: true, minLength: 8 }
     *   },
     *   onSubmit: async (data) => { await register(data); }
     * });
     */
    initForm(formId, options = {}) {}

    /**
     * Valida un campo específico
     * @param {string} formId - ID del formulario
     * @param {string} fieldName - Nombre del campo
     * @param {any} value - Valor del campo
     * @returns {Object} { isValid: boolean, error?: string }
     */
    validateField(formId, fieldName, value) {}

    /**
     * Valida todo un formulario
     * @param {string} formId - ID del formulario
     * @param {FormData|Object} formData - Datos del formulario
     * @returns {Object} { isValid: boolean, errors?: Object }
     */
    validateForm(formId, formData) {}

    /**
     * Obtiene los datos de un formulario como objeto
     * @param {string} formId - ID del formulario
     * @returns {Object}
     */
    getFormData(formId) {}
}
```

### LazyLoadManager (lazyLoad.js)

```javascript
/**
 * LazyLoadManager - Carga perezosa de imágenes
 * @class
 */
class LazyLoadManager {
    /**
     * Inicializa el observador de lazy loading
     * @param {Object} options - Opciones del observador
     * @param {Element} options.root - Elemento raíz (null = viewport)
     * @param {string} options.rootMargin - Margen (ej: '50px')
     * @param {number} options.threshold - Umbral de visibilidad (0-1)
     */
    init(options = {}) {}

    /**
     * Observa una imagen para lazy loading
     * @param {HTMLImageElement} img - Elemento imagen
     * @description La imagen debe tener atributo data-src
     */
    observe(img) {}

    /**
     * Observa múltiples imágenes
     * @param {Array|NodeList} images - Imágenes a observar
     */
    observeAll(images) {}

    /**
     * Precarga una imagen
     * @param {string|Array} src - URL(s) de la imagen
     * @returns {Promise}
     */
    preload(src) {}

    /**
     * Limpia el observador
     */
    destroy() {}
}
```

## Patrones de Uso Comunes

### Patrón 1: Cargar y Procesar Excel
```javascript
/**
 * Carga un archivo Excel y procesa sus datos
 * @param {File} file - Archivo Excel
 * @returns {Promise<void>}
 */
async function loadAndProcessExcel(file) {
    try {
        // Validar archivo
        const validation = ValidationManager.validateExcelFile(file);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }

        // Procesar
        const buffer = await file.arrayBuffer();
        const result = equipmentManager.processExcelBuffer(buffer, file.name);
        
        if (!result.success) {
            throw new Error(result.message);
        }

        // Guardar en BD
        await dbManager.dbPut('image', 'excelData', {
            id: 'currentExcel',
            data: equipmentManager.dataRaw,
            headers: equipmentManager.headers,
            savedAt: new Date().toISOString()
        });

        UIManager.showFeedback('Datos cargados exitosamente', 'success', feedbackEl);
    } catch (error) {
        UIManager.showFeedback(error.message, 'error', feedbackEl);
    }
}
```

### Patrón 2: Búsqueda con Paginación
```javascript
/**
 * Realiza búsqueda con paginación
 * @param {string} searchText - Texto a buscar
 * @param {number} pageNum - Número de página
 * @returns {void}
 */
function performSearch(searchText, pageNum = 1) {
    // Buscar
    searchManager.search(searchText, equipmentManager.headers);

    // Obtener página
    const pageData = searchManager.getPage(pageNum);

    // Renderizar
    uiController.renderTable(pageData.data, equipmentManager.headers);
    PaginationUI.render('paginationContainer', pageData, (page) => {
        performSearch(searchText, page);
    });
}
```

### Patrón 3: Validación de Formulario
```javascript
/**
 * Configura validación de formulario
 * @param {string} formId - ID del formulario
 * @returns {void}
 */
function setupFormValidation(formId) {
    formManager.initForm(formId, {
        rules: {
            serie: {
                required: true,
                minLength: 3,
                pattern: /^[A-Z0-9\-]+$/,
                patternMessage: 'Solo alfanuméricos y guiones'
            },
            email: {
                required: true,
                email: true
            }
        },
        onSubmit: async (data) => {
            const result = await submitForm(data);
            if (result.success) {
                formManager.clearForm(formId);
                UIManager.showFeedback('Enviado exitosamente', 'success', feedbackEl);
            }
        }
    });
}
```

## Comentarios en el Código

### Buen Comentario
```javascript
// Validar que la serie no existe en el inventario
// para evitar duplicados
const existing = equipmentManager.findEquipmentBySerie(serie);
if (existing) {
    throw new Error('La serie ya existe');
}
```

### Mal Comentario
```javascript
// Buscar equipo
const existing = equipmentManager.findEquipmentBySerie(serie);
// Si existe
if (existing) {
    // Lanzar error
    throw new Error('La serie ya existe');
}
```

## Convenciones de Documentación

### Para funciones async
```javascript
/**
 * Descripción breve
 * @param {type} name - Descripción
 * @returns {Promise<type>} Descripción del resultado
 * @throws {ErrorType} Cuándo se lanza
 * @async
 */
async function asyncFunction() {}
```

### Para funciones estáticas
```javascript
/**
 * Descripción breve
 * @static
 * @param {type} name - Descripción
 * @returns {type}
 */
static staticMethod() {}
```

### Para callbacks
```javascript
/**
 * @typedef {Function} FilterCallback
 * @param {Object} item - Elemento a filtrar
 * @returns {boolean} True si pasa el filtro
 */

/**
 * @param {FilterCallback} filterFn - Función de filtrado
 */
function applyFilter(filterFn) {}
```

---

**Última actualización:** Septiembre 2026  
**Versión:** 1.0
