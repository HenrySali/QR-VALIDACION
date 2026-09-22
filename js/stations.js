/**
 * stations.js - Gestión de estaciones de agua refactorizada
 * 
 * Módulo responsable de:
 * - CRUD de estaciones
 * - Registro de mantenimiento (preventivo/correctivo)
 * - Gestión de suministros
 * - Volúmenes mensuales
 * - Certificados
 */

class StationsManager {
    constructor() {
        this.stations = [];
        this.selectedStation = null;
        this.currentTab = 'preventivos';
    }

    /**
     * Inicializa el gestor de estaciones
     * @param {Array} seedStations - Estaciones iniciales
     * @returns {Promise<void>}
     */
    async init(seedStations = []) {
        try {
            // Cargar estaciones de BD
            const saved = await dbManager.dbGetAll('stations', APP_CONFIG.DB.ESTACIONES.STORES.ESTACIONES);
            
            if (saved.length === 0 && seedStations.length > 0) {
                // Guardar estaciones iniciales
                for (const station of seedStations) {
                    await dbManager.dbPut('stations', APP_CONFIG.DB.ESTACIONES.STORES.ESTACIONES, station);
                }
                this.stations = seedStations;
            } else {
                this.stations = saved;
            }

            console.log(`✓ ${this.stations.length} estaciones cargadas`);
        } catch (error) {
            console.error('Error inicializando estaciones:', error);
            throw error;
        }
    }

    /**
     * Obtiene todas las estaciones
     * @returns {Array}
     */
    getAllStations() {
        return this.stations;
    }

    /**
     * Obtiene una estación por ID
     * @param {string} stationId - ID de la estación
     * @returns {Object|null}
     */
    getStationById(stationId) {
        return this.stations.find(s => s.id === stationId) || null;
    }

    /**
     * Selecciona una estación actual
     * @param {string} stationId - ID de la estación
     */
    selectStation(stationId) {
        this.selectedStation = this.getStationById(stationId);
        if (this.selectedStation) {
            console.log(`Estación seleccionada: ${this.selectedStation.nombre}`);
        }
    }

    /**
     * Registra mantenimiento preventivo
     * @param {Object} data - Datos del mantenimiento
     * @returns {Promise<Object>}
     */
    async addPreventiveMaintenance(data) {
        try {
            if (!this.selectedStation) {
                throw new Error('No hay estación seleccionada');
            }

            const maintenance = {
                estacionId: this.selectedStation.id,
                fecha: data.fecha || new Date().toISOString(),
                descripcion: data.descripcion || '',
                tecnico: data.tecnico || '',
                observaciones: data.observaciones || '',
                createdAt: new Date().toISOString()
            };

            const id = await dbManager.dbAdd('stations', APP_CONFIG.DB.ESTACIONES.STORES.PREVENTIVOS, maintenance);
            maintenance.id = id;

            return { success: true, message: 'Mantenimiento registrado', data: maintenance };
        } catch (error) {
            console.error('Error registrando mantenimiento:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Registra mantenimiento correctivo
     * @param {Object} data - Datos del mantenimiento
     * @returns {Promise<Object>}
     */
    async addCorrectiveMaintenance(data) {
        try {
            if (!this.selectedStation) {
                throw new Error('No hay estación seleccionada');
            }

            const maintenance = {
                estacionId: this.selectedStation.id,
                fecha: data.fecha || new Date().toISOString(),
                problema: data.problema || '',
                solucion: data.solucion || '',
                tecnico: data.tecnico || '',
                costo: data.costo || 0,
                createdAt: new Date().toISOString()
            };

            const id = await dbManager.dbAdd('stations', APP_CONFIG.DB.ESTACIONES.STORES.CORRECTIVOS, maintenance);
            maintenance.id = id;

            return { success: true, message: 'Mantenimiento correctivo registrado', data: maintenance };
        } catch (error) {
            console.error('Error registrando correctivo:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Obtiene historial de mantenimiento de una estación
     * @param {string} stationId - ID de la estación
     * @param {string} type - 'preventivos' o 'correctivos'
     * @returns {Promise<Array>}
     */
    async getMaintenanceHistory(stationId, type = 'preventivos') {
        try {
            const storeName = type === 'preventivos' 
                ? APP_CONFIG.DB.ESTACIONES.STORES.PREVENTIVOS
                : APP_CONFIG.DB.ESTACIONES.STORES.CORRECTIVOS;

            const records = await dbManager.dbQueryIndex('stations', storeName, 'estacionId', stationId);
            
            // Ordenar por fecha descendente
            return records.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        } catch (error) {
            console.error('Error obteniendo historial:', error);
            return [];
        }
    }

    /**
     * Registra volumen mensual
     * @param {Object} data - Datos de volumen
     * @returns {Promise<Object>}
     */
    async addMonthlyVolume(data) {
        try {
            if (!this.selectedStation) {
                throw new Error('No hay estación seleccionada');
            }

            const volume = {
                estacionId: this.selectedStation.id,
                mes: data.mes || new Date().toISOString().substring(0, 7),
                volumen: data.volumen || 0,
                unidad: data.unidad || 'litros',
                observaciones: data.observaciones || '',
                createdAt: new Date().toISOString()
            };

            const id = await dbManager.dbAdd('stations', APP_CONFIG.DB.ESTACIONES.STORES.VOLUMENES, volume);
            volume.id = id;

            return { success: true, message: 'Volumen registrado', data: volume };
        } catch (error) {
            console.error('Error registrando volumen:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Obtiene volúmenes de una estación
     * @param {string} stationId - ID de la estación
     * @returns {Promise<Array>}
     */
    async getVolumes(stationId) {
        try {
            const records = await dbManager.dbQueryIndex('stations', APP_CONFIG.DB.ESTACIONES.STORES.VOLUMENES, 'estacionId', stationId);
            return records.sort((a, b) => b.mes.localeCompare(a.mes));
        } catch (error) {
            console.error('Error obteniendo volúmenes:', error);
            return [];
        }
    }

    /**
     * Registra un certificado
     * @param {Object} data - Datos del certificado
     * @returns {Promise<Object>}
     */
    async addCertificate(data) {
        try {
            if (!this.selectedStation) {
                throw new Error('No hay estación seleccionada');
            }

            const certificate = {
                estacionId: this.selectedStation.id,
                fecha: data.fecha || new Date().toISOString(),
                numero: data.numero || '',
                tipo: data.tipo || 'calidad',
                validoHasta: data.validoHasta || '',
                notas: data.notas || '',
                photoId: data.photoId || null,
                createdAt: new Date().toISOString()
            };

            const id = await dbManager.dbAdd('stations', APP_CONFIG.DB.ESTACIONES.STORES.CERTIFICADOS, certificate);
            certificate.id = id;

            // Guardar foto si existe
            if (data.photoId && data.photoData) {
                await dbManager.dbPut('stations', APP_CONFIG.DB.ESTACIONES.STORES.CERT_PHOTOS, {
                    id: data.photoId,
                    dataUrl: data.photoData,
                    certificateId: id
                });
            }

            return { success: true, message: 'Certificado registrado', data: certificate };
        } catch (error) {
            console.error('Error registrando certificado:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Obtiene certificados de una estación
     * @param {string} stationId - ID de la estación
     * @returns {Promise<Array>}
     */
    async getCertificates(stationId) {
        try {
            const records = await dbManager.dbQueryIndex('stations', APP_CONFIG.DB.ESTACIONES.STORES.CERTIFICADOS, 'estacionId', stationId);
            return records.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        } catch (error) {
            console.error('Error obteniendo certificados:', error);
            return [];
        }
    }

    /**
     * Obtiene foto de un certificado
     * @param {string} photoId - ID de la foto
     * @returns {Promise<string|null>}
     */
    async getCertificatePhoto(photoId) {
        try {
            const photo = await dbManager.dbGet('stations', APP_CONFIG.DB.ESTACIONES.STORES.CERT_PHOTOS, photoId);
            return photo?.dataUrl || null;
        } catch (error) {
            console.error('Error obteniendo foto de certificado:', error);
            return null;
        }
    }

    /**
     * Registra suministro
     * @param {Object} data - Datos del suministro
     * @returns {Promise<Object>}
     */
    async addSupply(data) {
        try {
            if (!this.selectedStation) {
                throw new Error('No hay estación seleccionada');
            }

            const supply = {
                estacionId: this.selectedStation.id,
                fecha: data.fecha || new Date().toISOString(),
                tipo: data.tipo || '',
                cantidad: data.cantidad || 1,
                unidad: data.unidad || 'unidad',
                costo: data.costo || 0,
                proveedor: data.proveedor || '',
                observaciones: data.observaciones || '',
                createdAt: new Date().toISOString()
            };

            const id = await dbManager.dbAdd('stations', APP_CONFIG.DB.ESTACIONES.STORES.SUMINISTROS, supply);
            supply.id = id;

            return { success: true, message: 'Suministro registrado', data: supply };
        } catch (error) {
            console.error('Error registrando suministro:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Obtiene suministros de una estación
     * @param {string} stationId - ID de la estación
     * @returns {Promise<Array>}
     */
    async getSupplies(stationId) {
        try {
            const records = await dbManager.dbQueryIndex('stations', APP_CONFIG.DB.ESTACIONES.STORES.SUMINISTROS, 'estacionId', stationId);
            return records.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        } catch (error) {
            console.error('Error obteniendo suministros:', error);
            return [];
        }
    }

    /**
     * Elimina un registro de mantenimiento
     * @param {string} recordId - ID del registro
     * @param {string} type - 'preventivos' o 'correctivos'
     * @returns {Promise<Object>}
     */
    async deleteMaintenanceRecord(recordId, type = 'preventivos') {
        try {
            const storeName = type === 'preventivos'
                ? APP_CONFIG.DB.ESTACIONES.STORES.PREVENTIVOS
                : APP_CONFIG.DB.ESTACIONES.STORES.CORRECTIVOS;

            await dbManager.dbDelete('stations', storeName, recordId);
            return { success: true, message: 'Registro eliminado' };
        } catch (error) {
            console.error('Error eliminando registro:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Obtiene estadísticas de una estación
     * @param {string} stationId - ID de la estación
     * @returns {Promise<Object>}
     */
    async getStationStatistics(stationId) {
        try {
            const preventivos = await this.getMaintenanceHistory(stationId, 'preventivos');
            const correctivos = await this.getMaintenanceHistory(stationId, 'correctivos');
            const volumenes = await this.getVolumes(stationId);
            const certificados = await this.getCertificates(stationId);
            const suministros = await this.getSupplies(stationId);

            const totalCost = correctivos.reduce((sum, m) => sum + (m.costo || 0), 0) +
                            suministros.reduce((sum, s) => sum + (s.costo || 0), 0);

            return {
                stationId,
                preventivos: preventivos.length,
                correctivos: correctivos.length,
                volumenes: volumenes.length,
                certificados: certificados.length,
                suministros: suministros.length,
                costTotal: totalCost,
                ultimoMantenimiento: [
                    ...preventivos,
                    ...correctivos
                ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0]?.fecha || null
            };
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return {};
        }
    }

    /**
     * Exporta datos de una estación a CSV
     * @param {string} stationId - ID de la estación
     * @param {string} fileType - 'preventivos', 'correctivos', 'volumenes', etc.
     * @returns {Promise<Object>}
     */
    async exportStationData(stationId, fileType = 'preventivos') {
        try {
            let data = [];
            let headers = [];

            switch (fileType) {
                case 'preventivos':
                    data = await this.getMaintenanceHistory(stationId, 'preventivos');
                    headers = ['fecha', 'descripcion', 'tecnico', 'observaciones'];
                    break;
                case 'correctivos':
                    data = await this.getMaintenanceHistory(stationId, 'correctivos');
                    headers = ['fecha', 'problema', 'solucion', 'tecnico', 'costo'];
                    break;
                case 'volumenes':
                    data = await this.getVolumes(stationId);
                    headers = ['mes', 'volumen', 'unidad', 'observaciones'];
                    break;
                case 'suministros':
                    data = await this.getSupplies(stationId);
                    headers = ['fecha', 'tipo', 'cantidad', 'unidad', 'costo', 'proveedor'];
                    break;
                default:
                    throw new Error(`Tipo desconocido: ${fileType}`);
            }

            const station = this.getStationById(stationId);
            const fileName = `${station.nombre}_${fileType}_${new Date().toISOString().split('T')[0]}`;

            return FileExportManager.exportToCSV(data, fileName, headers);
        } catch (error) {
            console.error('Error exportando datos:', error);
            return { success: false, message: error.message };
        }
    }
}

// Crear instancia global
const stationsManager = new StationsManager();
