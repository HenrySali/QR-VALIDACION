/**
 * qrParser.js - Análisis y parseo de códigos QR
 * 
 * Proporciona funcionalidad para:
 * - Extraer información de URLs de Google Drive
 * - Parsear formatos de QR
 * - Extraer nombre de equipo (INICIALES-SERIE)
 * - Validar estructura de URLs
 */

class QRParser {
    /**
     * Parsea un valor de QR que puede ser:
     * - URL de Google Drive (https://drive.google.com/...)
     * - Número de serie directo
     * - Nombre de equipo (INICIALES-SERIE)
     * 
     * @param {string} qrValue - Valor escaneado del QR
     * @returns {Object} { 
     *   success: boolean,
     *   equipoName?: string,      // INICIALES-SERIE (ej: EQP-001234)
     *   serie?: string,           // Solo la serie (ej: 001234)
     *   iniciales?: string,       // Solo iniciales (ej: EQP)
     *   driveUrl?: string,        // URL original de Drive
     *   folderId?: string,        // ID de la carpeta en Drive (si existe)
     *   error?: string
     * }
     */
    static parse(qrValue) {
        try {
            if (!qrValue || typeof qrValue !== 'string') {
                return { success: false, error: 'QR vacío o inválido' };
            }

            const trimmedValue = qrValue.trim();

            // Caso 1: URL de Google Drive
            if (this._isGoogleDriveUrl(trimmedValue)) {
                return this._parseGoogleDriveUrl(trimmedValue);
            }

            // Caso 2: Formato INICIALES-SERIE (ej: EQP-001234)
            if (this._isEquipoFormat(trimmedValue)) {
                return this._parseEquipoFormat(trimmedValue);
            }

            // Caso 3: Solo serie numérica o alfanumérica
            if (this._isSerie(trimmedValue)) {
                return { 
                    success: true, 
                    serie: trimmedValue,
                    error: 'Solo serie. Se requieren iniciales del equipo.'
                };
            }

            return { 
                success: false, 
                error: 'Formato de QR no reconocido. Esperado: URL de Drive, INICIALES-SERIE, o número de serie' 
            };
        } catch (error) {
            console.error('Error parseando QR:', error);
            return { success: false, error: `Error al procesar QR: ${error.message}` };
        }
    }

    /**
     * Valida si es una URL de Google Drive
     * @private
     */
    static _isGoogleDriveUrl(value) {
        return /^https:\/\/(drive\.google\.com|docs\.google\.com)/.test(value);
    }

    /**
     * Parsea una URL de Google Drive para extraer nombre de carpeta
     * @private
     */
    static _parseGoogleDriveUrl(url) {
        try {
            // Extraer ID de la carpeta o archivo
            let folderId = null;
            
            // Formatos posibles:
            // https://drive.google.com/drive/folders/FOLDER_ID
            // https://drive.google.com/file/d/FILE_ID/view
            // https://drive.google.com/open?id=FOLDER_ID

            let foldersMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
            if (foldersMatch) {
                folderId = foldersMatch[1];
            } else {
                let fileMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
                if (fileMatch) {
                    folderId = fileMatch[1];
                } else {
                    let idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                    if (idMatch) {
                        folderId = idMatch[1];
                    }
                }
            }

            // Nota: El nombre de la carpeta está en la URL pero no siempre es accesible
            // sin permisos de Drive API. Intentamos extraer del path si existe.
            
            // En algunos casos, el nombre aparece en el título de la pestaña o en metadatos
            // Por ahora, retornamos el ID y esperamos que el usuario proporcione el nombre
            
            // Intenta extraer nombre si está en la URL (algunos clientes Drive lo incluyen)
            let nameMatch = url.match(/[\/#&?]([\w\-\.]+)(?:[#&?\/]|$)/);
            
            if (folderId) {
                return {
                    success: true,
                    driveUrl: url,
                    folderId: folderId,
                    message: 'Se extrajo ID de Drive. El nombre de la carpeta no está disponible en la URL.',
                    requiresManualInput: true
                };
            }

            return { 
                success: false, 
                error: 'No se pudo extraer ID de la carpeta de la URL de Drive' 
            };
        } catch (error) {
            console.error('Error parseando URL de Drive:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Valida si tiene formato INICIALES-SERIE
     * Ejemplos válidos: EQP-001234, AUTO-ABC123, USO-12345
     * @private
     */
    static _isEquipoFormat(value) {
        // Formato: 2-5 caracteres (iniciales) + guión + 3+ caracteres (serie)
        return /^[A-Z]{2,5}-[A-Z0-9]{3,}$/i.test(value);
    }

    /**
     * Parsea formato INICIALES-SERIE
     * @private
     */
    static _parseEquipoFormat(value) {
        const parts = value.toUpperCase().split('-');
        if (parts.length !== 2) {
            return { success: false, error: 'Formato inválido' };
        }

        const [iniciales, serie] = parts;

        return {
            success: true,
            equipoName: value.toUpperCase(),
            iniciales: iniciales,
            serie: serie
        };
    }

    /**
     * Valida si es una serie (números o alfanuméricos)
     * @private
     */
    static _isSerie(value) {
        return /^[A-Z0-9]{3,}$/i.test(value);
    }

    /**
     * Extrae el nombre de equipo de una carpeta de Drive
     * Útil cuando ya tienes acceso a la carpeta
     * @param {string} folderName - Nombre de la carpeta
     * @returns {Object}
     */
    static extractFromFolderName(folderName) {
        try {
            if (!folderName || typeof folderName !== 'string') {
                return { success: false, error: 'Nombre de carpeta inválido' };
            }

            const trimmed = folderName.trim().toUpperCase();

            // Si ya tiene formato INICIALES-SERIE
            if (this._isEquipoFormat(trimmed)) {
                return this._parseEquipoFormat(trimmed);
            }

            // Intentar extraer patrón INICIALES-SERIE dentro del nombre
            const match = trimmed.match(/([A-Z]{2,5})-([A-Z0-9]{3,})/);
            if (match) {
                return {
                    success: true,
                    equipoName: match[0],
                    iniciales: match[1],
                    serie: match[2],
                    originalName: folderName
                };
            }

            return { 
                success: false, 
                error: `No se encontró patrón INICIALES-SERIE en: "${folderName}"` 
            };
        } catch (error) {
            console.error('Error extrayendo nombre de carpeta:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Valida si dos valores de QR son equivalentes
     * (podrían ser formatos diferentes del mismo equipo)
     * @param {string} qr1 - Primer QR
     * @param {string} qr2 - Segundo QR
     * @returns {boolean}
     */
    static areEquivalent(qr1, qr2) {
        const parsed1 = this.parse(qr1);
        const parsed2 = this.parse(qr2);

        if (!parsed1.success || !parsed2.success) {
            return false;
        }

        // Comparar serie (si ambos la tienen)
        if (parsed1.serie && parsed2.serie) {
            return parsed1.serie === parsed2.serie;
        }

        // Comparar nombre de equipo
        if (parsed1.equipoName && parsed2.equipoName) {
            return parsed1.equipoName === parsed2.equipoName;
        }

        // Comparar ID de Drive (si ambos lo tienen)
        if (parsed1.folderId && parsed2.folderId) {
            return parsed1.folderId === parsed2.folderId;
        }

        return false;
    }

    /**
     * Formatea el resultado de parseo para mostrar al usuario
     * @param {Object} parseResult - Resultado de parse()
     * @returns {string} Mensaje legible
     */
    static formatResult(parseResult) {
        if (!parseResult.success) {
            return `❌ Error: ${parseResult.error}`;
        }

        const parts = [];

        if (parseResult.equipoName) {
            parts.push(`📦 Equipo: ${parseResult.equipoName}`);
        }
        if (parseResult.iniciales) {
            parts.push(`🏷️ Iniciales: ${parseResult.iniciales}`);
        }
        if (parseResult.serie) {
            parts.push(`🔢 Serie: ${parseResult.serie}`);
        }
        if (parseResult.folderId) {
            parts.push(`🗂️ Carpeta Drive: ${parseResult.folderId}`);
        }
        if (parseResult.driveUrl) {
            parts.push(`🔗 URL: ${parseResult.driveUrl}`);
        }

        if (parseResult.requiresManualInput) {
            parts.push(`⚠️ Se requiere verificación manual del nombre de carpeta`);
        }

        return parts.join('\n');
    }

    /**
     * Extrae solo el campo equipo (INICIALES-SERIE)
     * desde cualquier formato de QR
     * @param {string} qrValue - Valor del QR
     * @returns {string|null} El equipo en formato INICIALES-SERIE o null
     */
    static getEquipoName(qrValue) {
        const result = this.parse(qrValue);
        return result.success && result.equipoName ? result.equipoName : null;
    }

    /**
     * Extrae solo la serie desde cualquier formato de QR
     * @param {string} qrValue - Valor del QR
     * @returns {string|null} La serie o null
     */
    static getSerie(qrValue) {
        const result = this.parse(qrValue);
        return result.success && result.serie ? result.serie : null;
    }

    /**
     * Extrae solo las iniciales desde cualquier formato de QR
     * @param {string} qrValue - Valor del QR
     * @returns {string|null} Las iniciales o null
     */
    static getIniciales(qrValue) {
        const result = this.parse(qrValue);
        return result.success && result.iniciales ? result.iniciales : null;
    }
}

/**
 * QRScanner - Manejo de escaneo de códigos QR
 */
class QRScanner {
    constructor() {
        this.scanner = null;
        this.isScanning = false;
        this.lastScannedValue = null;
        this.lastScanTime = null;
        this.minScanInterval = 1000; // No escanear el mismo código en menos de 1 segundo
    }

    /**
     * Inicia el escaneo de QR
     * @param {string|HTMLElement} elemId - ID del elemento o elemento donde mostrar el lector
     * @param {Function} onScanCallback - Callback cuando se detecta QR
     * @returns {Promise<void>}
     */
    async start(elemId, onScanCallback) {
        try {
            if (this.isScanning) {
                console.warn('Ya hay un escaneo en progreso');
                return;
            }

            if (!window.Html5Qrcode) {
                throw new Error('Html5Qrcode no está cargado');
            }

            const element = typeof elemId === 'string' 
                ? document.getElementById(elemId) 
                : elemId;

            if (!element) {
                throw new Error(`Elemento no encontrado: ${elemId}`);
            }

            this.scanner = new Html5Qrcode(element.id || 'qr-scanner');

            this.isScanning = true;

            await this.scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 300, height: 300 }
                },
                async (decodedText, decodedResult) => {
                    const now = Date.now();
                    
                    // Evitar duplicados rápidos
                    if (this.lastScannedValue === decodedText && 
                        this.lastScanTime && 
                        (now - this.lastScanTime) < this.minScanInterval) {
                        return;
                    }

                    this.lastScannedValue = decodedText;
                    this.lastScanTime = now;

                    if (onScanCallback) {
                        onScanCallback(decodedText);
                    }
                },
                (errorMessage) => {
                    // Ignorar errores de no detectar QR
                }
            );

            console.log('✓ Escaneo de QR iniciado');
        } catch (error) {
            console.error('Error iniciando escaneo:', error);
            this.isScanning = false;
            throw error;
        }
    }

    /**
     * Detiene el escaneo de QR
     * @returns {Promise<void>}
     */
    async stop() {
        try {
            if (!this.scanner || !this.isScanning) return;

            await this.scanner.stop();
            this.isScanning = false;
            this.lastScannedValue = null;
            this.lastScanTime = null;

            console.log('✓ Escaneo de QR detenido');
        } catch (error) {
            console.error('Error deteniendo escaneo:', error);
        }
    }

    /**
     * Procesa un valor de QR escaneado
     * @param {string} qrValue - Valor escaneado
     * @returns {Object} Resultado procesado con información del equipo
     */
    processScannedQR(qrValue) {
        const parseResult = QRParser.parse(qrValue);

        return {
            parseResult,
            equipoName: QRParser.getEquipoName(qrValue),
            serie: QRParser.getSerie(qrValue),
            iniciales: QRParser.getIniciales(qrValue),
            displayMessage: QRParser.formatResult(parseResult)
        };
    }

    /**
     * Limpia el scanner
     */
    destroy() {
        this.stop();
        this.scanner = null;
    }
}

// Crear instancia global
const qrParser = new QRParser();
const qrScanner = new QRScanner();
