/**
 * db.js - Gestión centralizada de IndexedDB
 * 
 * Proporciona funciones para inicializar y gestionar las bases de datos
 * de equipos e imágenes, y estaciones de agua.
 */

class DatabaseManager {
    constructor() {
        this.imageDB = null;
        this.stationsDB = null;
    }

    /**
     * Inicializa la base de datos de equipos e imágenes
     * @returns {Promise<IDBDatabase>}
     */
    initImageDB() {
        return new Promise((resolve, reject) => {
            const config = APP_CONFIG.DB.EQUIPOS;
            const request = indexedDB.open(config.NAME, config.VERSION);

            request.onerror = () => {
                console.error('Error abriendo ImageDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.imageDB = request.result;
                console.log('ImageDB inicializado correctamente');
                resolve(this.imageDB);
            };

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                this._ensureImageStores(db);
            };
        });
    }

    /**
     * Inicializa la base de datos de estaciones de agua
     * @returns {Promise<IDBDatabase>}
     */
    initStationsDB() {
        return new Promise((resolve, reject) => {
            const config = APP_CONFIG.DB.ESTACIONES;
            const request = indexedDB.open(config.NAME, config.VERSION);

            request.onerror = () => {
                console.error('Error abriendo StationsDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.stationsDB = request.result;
                console.log('StationsDB inicializado correctamente');
                resolve(this.stationsDB);
            };

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                this._ensureStationStores(db);
            };
        });
    }

    /**
     * Asegura que existan los stores para ImageDB
     * @private
     */
    _ensureImageStores(db) {
        const config = APP_CONFIG.DB.EQUIPOS;
        const storeNames = Object.values(config.STORES);

        storeNames.forEach(storeName => {
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: 'id' });
                console.log(`Store creado: ${storeName}`);
            }
        });
    }

    /**
     * Asegura que existan los stores para StationsDB
     * @private
     */
    _ensureStationStores(db) {
        const config = APP_CONFIG.DB.ESTACIONES;
        const stores = {
            [config.STORES.PREVENTIVOS]: ['estacionId', 'fecha'],
            [config.STORES.CORRECTIVOS]: ['estacionId', 'fecha'],
            [config.STORES.SUMINISTROS]: ['estacionId', 'fecha'],
            [config.STORES.VOLUMENES]: ['estacionId', 'mes'],
            [config.STORES.CERTIFICADOS]: ['estacionId', 'fecha'],
            [config.STORES.CERT_PHOTOS]: null,
            [config.STORES.ESTACIONES]: null
        };

        Object.entries(stores).forEach(([storeName, indices]) => {
            if (!db.objectStoreNames.contains(storeName)) {
                const store = db.createObjectStore(storeName, 
                    storeName === config.STORES.PREVENTIVOS ? { keyPath: 'id', autoIncrement: true } :
                    storeName === config.STORES.CORRECTIVOS ? { keyPath: 'id', autoIncrement: true } :
                    storeName === config.STORES.SUMINISTROS ? { keyPath: 'id', autoIncrement: true } :
                    storeName === config.STORES.VOLUMENES ? { keyPath: 'id', autoIncrement: true } :
                    storeName === config.STORES.CERTIFICADOS ? { keyPath: 'id', autoIncrement: true } :
                    { keyPath: 'id' }
                );
                
                if (indices) {
                    indices.forEach(keyPath => {
                        store.createIndex(keyPath, keyPath, { unique: false });
                    });
                }
                console.log(`Store creado: ${storeName}`);
            }
        });
    }

    /**
     * Operación genérica ADD en IndexedDB
     * @param {string} dbType - 'image' o 'stations'
     * @param {string} storeName - Nombre del store
     * @param {Object} data - Datos a guardar
     * @returns {Promise<any>}
     */
    dbAdd(dbType, storeName, data) {
        return new Promise((resolve, reject) => {
            try {
                const db = dbType === 'image' ? this.imageDB : this.stationsDB;
                if (!db) throw new Error(`Database no inicializada: ${dbType}`);

                const tx = db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                const req = store.add(data);

                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
                tx.onerror = () => reject(tx.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Operación genérica PUT en IndexedDB
     * @param {string} dbType - 'image' o 'stations'
     * @param {string} storeName - Nombre del store
     * @param {Object} data - Datos a guardar
     * @returns {Promise<any>}
     */
    dbPut(dbType, storeName, data) {
        return new Promise((resolve, reject) => {
            try {
                const db = dbType === 'image' ? this.imageDB : this.stationsDB;
                if (!db) throw new Error(`Database no inicializada: ${dbType}`);

                const tx = db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                const req = store.put(data);

                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
                tx.onerror = () => reject(tx.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Operación genérica DELETE en IndexedDB
     * @param {string} dbType - 'image' o 'stations'
     * @param {string} storeName - Nombre del store
     * @param {any} id - ID del registro a eliminar
     * @returns {Promise<void>}
     */
    dbDelete(dbType, storeName, id) {
        return new Promise((resolve, reject) => {
            try {
                const db = dbType === 'image' ? this.imageDB : this.stationsDB;
                if (!db) throw new Error(`Database no inicializada: ${dbType}`);

                const tx = db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                const req = store.delete(id);

                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
                tx.onerror = () => reject(tx.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Obtiene todos los registros de un store
     * @param {string} dbType - 'image' o 'stations'
     * @param {string} storeName - Nombre del store
     * @returns {Promise<Array>}
     */
    dbGetAll(dbType, storeName) {
        return new Promise((resolve, reject) => {
            try {
                const db = dbType === 'image' ? this.imageDB : this.stationsDB;
                if (!db) throw new Error(`Database no inicializada: ${dbType}`);

                const tx = db.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                const req = store.getAll();

                req.onsuccess = () => resolve(req.result || []);
                req.onerror = () => reject(req.error);
                tx.onerror = () => reject(tx.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Obtiene un registro específico por ID
     * @param {string} dbType - 'image' o 'stations'
     * @param {string} storeName - Nombre del store
     * @param {any} id - ID del registro
     * @returns {Promise<Object|null>}
     */
    dbGet(dbType, storeName, id) {
        return new Promise((resolve, reject) => {
            try {
                const db = dbType === 'image' ? this.imageDB : this.stationsDB;
                if (!db) throw new Error(`Database no inicializada: ${dbType}`);

                const tx = db.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                const req = store.get(id);

                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => reject(req.error);
                tx.onerror = () => reject(tx.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Consulta por índice
     * @param {string} dbType - 'image' o 'stations'
     * @param {string} storeName - Nombre del store
     * @param {string} indexName - Nombre del índice
     * @param {any} value - Valor a buscar
     * @returns {Promise<Array>}
     */
    dbQueryIndex(dbType, storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            try {
                const db = dbType === 'image' ? this.imageDB : this.stationsDB;
                if (!db) throw new Error(`Database no inicializada: ${dbType}`);

                const tx = db.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                const index = store.index(indexName);
                const req = index.getAll(value);

                req.onsuccess = () => resolve(req.result || []);
                req.onerror = () => reject(req.error);
                tx.onerror = () => reject(tx.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Limpia todos los datos de un store
     * @param {string} dbType - 'image' o 'stations'
     * @param {string} storeName - Nombre del store
     * @returns {Promise<void>}
     */
    dbClear(dbType, storeName) {
        return new Promise((resolve, reject) => {
            try {
                const db = dbType === 'image' ? this.imageDB : this.stationsDB;
                if (!db) throw new Error(`Database no inicializada: ${dbType}`);

                const tx = db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                const req = store.clear();

                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
                tx.onerror = () => reject(tx.error);
            } catch (error) {
                reject(error);
            }
        });
    }
}

// Crear instancia global
const dbManager = new DatabaseManager();
