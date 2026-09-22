/**
 * equipment.js - Gestión de equipos y validación QR
 * 
 * Módulo responsable de:
 * - Cargar y procesar archivos Excel
 * - Registrar y validar equipos
 * - Gestionar números de serie
 * - Manejar escaneo de QR
 */

class EquipmentManager {
    constructor() {
        this.workbook = null;
        this.allSheetsData = {};
        this.allSheetsHeaders = {};
        this.sheetNames = [];
        this.currentSheetName = '';
        this.dataRaw = [];
        this.headers = [];
        this.firstSheetName = '';
        this.patronUbicacion = null;
    }

    /**
     * Procesa un buffer de Excel y carga todas las hojas
     * @param {ArrayBuffer} buffer - Buffer del archivo Excel
     * @param {string} fileName - Nombre del archivo (opcional)
     * @returns {Object} { success: boolean, message: string, data?: Object }
     */
    processExcelBuffer(buffer, fileName = '') {
        try {
            if (!window.XLSX) {
                throw new Error('SheetJS no está cargado');
            }

            const data = new Uint8Array(buffer);
            this.workbook = XLSX.read(data, { type: 'array', cellDates: true });
            this.sheetNames = this.workbook.SheetNames;
            this.allSheetsData = {};
            this.allSheetsHeaders = {};

            // Procesar cada hoja
            this.sheetNames.forEach(sheetName => {
                const ws = this.workbook.Sheets[sheetName];
                const raw = XLSX.utils.sheet_to_json(ws, { defval: '' });

                if (raw.length > 0) {
                    const validHeaders = Object.keys(raw[0]).filter(h => !h.startsWith('__EMPTY'));
                    this.allSheetsHeaders[sheetName] = validHeaders;
                    this.allSheetsData[sheetName] = raw.filter(row =>
                        validHeaders.some(h => row[h] !== '' && row[h] !== null && row[h] !== undefined)
                    );
                } else {
                    this.allSheetsHeaders[sheetName] = [];
                    this.allSheetsData[sheetName] = [];
                }
            });

            // Establecer hoja inicial
            this.currentSheetName = this.sheetNames[0] || '';
            this.firstSheetName = this.currentSheetName;
            this.dataRaw = this.allSheetsData[this.currentSheetName] || [];
            this.headers = this.allSheetsHeaders[this.currentSheetName] || [];

            return {
                success: true,
                message: `Se cargaron ${this.sheetNames.length} hoja(s) con ${this.dataRaw.length} registros`,
                data: {
                    sheetNames: this.sheetNames,
                    currentSheet: this.currentSheetName,
                    recordCount: this.dataRaw.length,
                    headers: this.headers
                }
            };
        } catch (error) {
            console.error('Error procesando Excel:', error);
            return {
                success: false,
                message: `Error al procesar Excel: ${error.message}`
            };
        }
    }

    /**
     * Cambia la hoja actual
     * @param {string} sheetName - Nombre de la hoja
     * @returns {Object} { success: boolean, data?: Object }
     */
    switchSheet(sheetName) {
        if (!this.allSheetsData[sheetName]) {
            return { success: false, message: 'Hoja no encontrada' };
        }

        this.currentSheetName = sheetName;
        this.dataRaw = this.allSheetsData[sheetName];
        this.headers = this.allSheetsHeaders[sheetName];

        return {
            success: true,
            data: {
                currentSheet: this.currentSheetName,
                recordCount: this.dataRaw.length,
                headers: this.headers
            }
        };
    }

    /**
     * Busca un equipo por número de serie
     * @param {string} serie - Número de serie
     * @returns {Object|null} Registro del equipo
     */
    findEquipmentBySerie(serie) {
        const normalized = serie.trim().toUpperCase();
        return this.dataRaw.find(row => {
            const rowSerie = Object.values(row)
                .map(v => String(v).trim().toUpperCase())
                .some(v => v === normalized);
            return rowSerie;
        });
    }

    /**
     * Busca sugerencias de equipos por serie
     * @param {string} searchText - Texto de búsqueda
     * @param {number} limit - Número máximo de sugerencias
     * @returns {Array} Array de sugerencias
     */
    getSuggestionsBySerie(searchText, limit = 10) {
        const text = searchText.trim().toUpperCase();
        if (text.length < 2) return [];

        const matches = [];
        const seen = new Set();

        this.dataRaw.forEach(row => {
            Object.entries(row).forEach(([key, value]) => {
                const strVal = String(value).trim().toUpperCase();
                if (strVal.includes(text) && !seen.has(strVal)) {
                    seen.add(strVal);
                    matches.push({
                        value: strVal,
                        description: `${key}: ${strVal}`
                    });
                    if (matches.length >= limit) return;
                }
            });
        });

        return matches;
    }

    /**
     * Registra un nuevo equipo
     * @param {Object} equipmentData - Datos del equipo
     * @returns {Promise<Object>}
     */
    async registerEquipment(equipmentData) {
        try {
            const validation = ValidationManager.validateRequiredFields(
                equipmentData,
                ['serie', 'ubicacion']
            );

            if (!validation.isValid) {
                throw new Error(validation.error);
            }

            const serieValidation = ValidationManager.validateSerie(equipmentData.serie);
            if (!serieValidation.isValid) {
                throw new Error(serieValidation.error);
            }

            const ubicacionValidation = ValidationManager.validateUbicacion(equipmentData.ubicacion);
            if (!ubicacionValidation.isValid) {
                throw new Error(ubicacionValidation.error);
            }

            // Preparar datos del equipo
            const newEquipment = {
                serie: serieValidation.value,
                ubicacion: ubicacionValidation.value,
                observaciones: equipmentData.observaciones || '',
                registeredAt: new Date().toISOString(),
                photoId: equipmentData.photoId || null
            };

            // Guardar en IndexedDB si hay foto
            if (equipmentData.photoId && equipmentData.photoData) {
                await dbManager.dbPut('image', 'images', {
                    id: equipmentData.photoId,
                    dataUrl: equipmentData.photoData
                });
            }

            // Guardar equipamiento
            await dbManager.dbPut('image', 'excelData', {
                id: `equipment_${equipmentData.serie}`,
                ...newEquipment
            });

            return {
                success: true,
                message: `Equipo "${equipmentData.serie}" registrado correctamente`,
                data: newEquipment
            };
        } catch (error) {
            console.error('Error registrando equipo:', error);
            return {
                success: false,
                message: `Error al registrar equipo: ${error.message}`
            };
        }
    }

    /**
     * Valida un equipo por QR/Serie
     * @param {string} serie - Número de serie
     * @param {string} ubicacion - Ubicación (opcional, usa patrón si no se proporciona)
     * @returns {Object}
     */
    validateEquipment(serie, ubicacion = null) {
        try {
            const serieValidation = ValidationManager.validateSerie(serie);
            if (!serieValidation.isValid) {
                throw new Error(serieValidation.error);
            }

            const equipment = this.findEquipmentBySerie(serieValidation.value);
            if (!equipment) {
                throw new Error('Equipo no encontrado en el inventario');
            }

            // Usar patrón de ubicación si está definido
            const finalUbicacion = ubicacion || this.patronUbicacion;
            if (!finalUbicacion) {
                throw new Error('Se requiere ubicación o patrón de ubicación');
            }

            const validation = {
                serie: serieValidation.value,
                ubicacion: finalUbicacion,
                equipment: equipment,
                validatedAt: new Date().toISOString(),
                status: 'válido'
            };

            return {
                success: true,
                message: 'Equipo validado correctamente',
                data: validation
            };
        } catch (error) {
            console.error('Error validando equipo:', error);
            return {
                success: false,
                message: `Error: ${error.message}`,
                status: 'inválido'
            };
        }
    }

    /**
     * Establece ubicación patrón
     * @param {string} ubicacion - Ubicación patrón
     */
    setPatronUbicacion(ubicacion) {
        this.patronUbicacion = ubicacion || null;
    }

    /**
     * Obtiene las ubicaciones únicas del inventario
     * @returns {Array}
     */
    getUniqueLocations() {
        const locations = new Set();

        this.dataRaw.forEach(row => {
            Object.entries(row).forEach(([key, value]) => {
                if (key.toLowerCase().includes('ubicacion') || key.toLowerCase().includes('location')) {
                    const val = String(value).trim();
                    if (val && val !== '' && val !== 'undefined') {
                        locations.add(val);
                    }
                }
            });
        });

        return Array.from(locations).sort();
    }

    /**
     * Exporta datos actuales a Excel
     * @param {string} fileName - Nombre del archivo
     * @returns {Object}
     */
    exportToExcel(fileName) {
        try {
            return FileExportManager.exportToExcel(
                this.dataRaw,
                fileName || 'equipos_exportados',
                this.headers
            );
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Exporta datos actuales a CSV
     * @param {string} fileName - Nombre del archivo
     * @returns {Object}
     */
    exportToCSV(fileName) {
        try {
            return FileExportManager.exportToCSV(
                this.dataRaw,
                fileName || 'equipos_exportados',
                this.headers
            );
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Busca equipos usando múltiples criterios
     * @param {Object} criteria - Criterios de búsqueda
     * @returns {Array}
     */
    searchEquipment(criteria = {}) {
        let results = [...this.dataRaw];

        if (criteria.serie) {
            results = UtilityManager.searchArray(results, criteria.serie, this.headers);
        }

        if (criteria.ubicacion) {
            results = results.filter(row => {
                return Object.values(row).some(val =>
                    String(val).toLowerCase().includes(criteria.ubicacion.toLowerCase())
                );
            });
        }

        if (criteria.sort) {
            results = UtilityManager.sortArray(results, criteria.sort.field, criteria.sort.direction);
        }

        return results;
    }

    /**
     * Obtiene estadísticas del inventario
     * @returns {Object}
     */
    getStatistics() {
        return {
            totalRecords: this.dataRaw.length,
            totalSheets: this.sheetNames.length,
            currentSheet: this.currentSheetName,
            totalHeaders: this.headers.length,
            sheetNames: this.sheetNames
        };
    }
}

// Crear instancia global
const equipmentManager = new EquipmentManager();
