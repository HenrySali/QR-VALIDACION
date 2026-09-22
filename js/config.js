/**
 * config.js - Configuración centralizada del proyecto QR-VALIDACION
 * 
 * Este archivo contiene todas las constantes, URLs y configuraciones
 * que se utilizan en toda la aplicación.
 */

const APP_CONFIG = {
    // === INFORMACIÓN DE LA APLICACIÓN ===
    APP_NAME: 'QR-VALIDACION',
    APP_VERSION: '2.0.0',
    
    // === URLs ===
    INVENTARIO_URL: 'https://electrocenter3cma-lang.github.io/validacion/Inventario2.xlsx',
    
    // === CONFIGURACIÓN DE INDEXEDDB ===
    DB: {
        // Base de datos para equipos e imágenes
        EQUIPOS: {
            NAME: 'EquiposImageDB',
            VERSION: 2,
            STORES: {
                IMAGES: 'images',
                EXCEL_DATA: 'excelData'
            }
        },
        // Base de datos para estaciones de agua
        ESTACIONES: {
            NAME: 'EstacionesAguaDB',
            VERSION: 4,
            STORES: {
                PREVENTIVOS: 'preventivos',
                CORRECTIVOS: 'correctivos',
                SUMINISTROS: 'suministros',
                VOLUMENES: 'volumenes',
                CERTIFICADOS: 'certificados',
                CERT_PHOTOS: 'certPhotos',
                ESTACIONES: 'estaciones'
            }
        }
    },
    
    // === CONFIGURACIÓN DE IMÁGENES ===
    IMAGE: {
        MAX_SIZE: 100000,           // Máximo 100KB por defecto
        COMPRESSION_QUALITY: 0.4,   // Calidad de compresión JPEG (0-1)
        MAX_DIMENSION: 600,         // Máxima dimensión en píxeles
        FORMATS: {
            JPEG: 'image/jpeg',
            PNG: 'image/png',
            WEBP: 'image/webp'
        }
    },
    
    // === CONFIGURACIÓN DE ARCHIVOS ===
    FILE: {
        EXCEL_FORMATS: ['.xlsx', '.xls'],
        EXCEL_MIME_TYPES: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
        ZIP_FORMAT: '.zip',
        ZIP_MIME_TYPE: 'application/zip',
        CSV_FORMAT: '.csv',
        CSV_MIME_TYPE: 'text/csv',
        MAX_FILE_SIZE: 50 * 1024 * 1024  // 50MB
    },
    
    // === VALIDACIÓN ===
    VALIDATION: {
        MIN_SERIE_LENGTH: 3,
        MAX_SERIE_LENGTH: 50,
        MIN_UBICACION_LENGTH: 2,
        MAX_UBICACION_LENGTH: 100,
        SERIE_REGEX: /^[A-Z0-9\-]{3,}$/,  // Alfanuméricos y guiones
        LOCATIONS_PER_PAGE: 10
    },
    
    // === ESTACIONES DE AGUA - DATOS INICIALES ===
    ESTACIONES_SEED: [
        { id: 'A',     nombre: 'Estación A', serie: 'EST-01543',            proveedor: 'Abbott' },
        { id: 'B',     nombre: 'Estación B', serie: 'EST-MR120H2732252',    proveedor: 'Abbott' },
        { id: 'C',     nombre: 'Estación C', serie: 'EST-MP00003507',       proveedor: 'Abbott' },
        { id: 'D',     nombre: 'Estación D', serie: 'EST-AGU-MP00005085',   proveedor: 'Roche'  },
        { id: 'PRE01', nombre: 'PRE 01',     serie: 'N/A',                  proveedor: 'N/A'    },
        { id: 'PRE02', nombre: 'PRE 02',     serie: 'N/A',                  proveedor: 'N/A'    }
    ],
    
    // === MENSAJES ===
    MESSAGES: {
        SUCCESS: {
            SAVED: 'Guardado exitosamente',
            LOADED: 'Cargado exitosamente',
            DELETED: 'Eliminado exitosamente',
            EXPORTED: 'Exportado exitosamente'
        },
        ERROR: {
            SAVE_FAILED: 'Error al guardar',
            LOAD_FAILED: 'Error al cargar',
            DELETE_FAILED: 'Error al eliminar',
            FILE_INVALID: 'Archivo inválido',
            FILE_TOO_LARGE: 'El archivo es demasiado grande',
            SERIES_DUPLICATE: 'El número de serie ya existe',
            VALIDATION_FAILED: 'Error en la validación de datos',
            GENERAL: 'Ocurrió un error inesperado'
        },
        WARNING: {
            UNSAVED_CHANGES: 'Hay cambios sin guardar',
            CONFIRM_DELETE: '¿Confirma la eliminación?',
            NO_DATA: 'No hay datos disponibles'
        }
    },
    
    // === PAGINACIÓN ===
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 20,
        MAX_PAGE_SIZE: 100
    },
    
    // === TIMEOUTS ===
    TIMEOUTS: {
        MODAL_ANIMATION: 300,
        FEEDBACK_DURATION: 3000,
        DEBOUNCE: 300
    }
};

// Exportar para uso en módulos ES6 (si es necesario)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONFIG;
}
