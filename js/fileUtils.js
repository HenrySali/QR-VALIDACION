/**
 * fileUtils.js - Utilidades para manejo de archivos
 * 
 * Proporciona funciones para exportar a Excel, CSV, y manejar archivos comprimidos.
 */

class FileExportManager {
    /**
     * Exporta datos a archivo Excel
     * @param {Array} data - Datos a exportar
     * @param {string} fileName - Nombre del archivo (sin extensión)
     * @param {Array<string>} headers - Encabezados de columnas
     * @returns {void}
     */
    static exportToExcel(data, fileName, headers) {
        try {
            if (!window.XLSX) {
                throw new Error('SheetJS no está cargado');
            }

            // Crear libro de trabajo
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
            
            // Ajustar ancho de columnas
            const maxWidth = 20;
            const colWidths = headers.map(() => maxWidth);
            worksheet['!cols'] = colWidths.map(w => ({ wch: w }));

            XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
            XLSX.writeFile(workbook, `${fileName}.xlsx`);

            return { success: true, message: 'Archivo Excel exportado correctamente' };
        } catch (error) {
            console.error('Error exportando a Excel:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Exporta datos a archivo CSV
     * @param {Array} data - Datos a exportar
     * @param {string} fileName - Nombre del archivo (sin extensión)
     * @param {Array<string>} headers - Encabezados de columnas
     * @returns {void}
     */
    static exportToCSV(data, fileName, headers) {
        try {
            if (!data || data.length === 0) {
                throw new Error('No hay datos para exportar');
            }

            // Crear CSV con encabezados
            const csvHeaders = headers.join(',');
            const csvRows = data.map(row => {
                return headers.map(header => {
                    const value = row[header] || '';
                    // Escapar comillas y envolver en comillas si contiene comas
                    const escaped = String(value).replace(/"/g, '""');
                    return escaped.includes(',') ? `"${escaped}"` : escaped;
                }).join(',');
            });

            const csv = [csvHeaders, ...csvRows].join('\n');
            
            // Agregar BOM para caracteres UTF-8
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
            UtilityManager.downloadFile(blob, `${fileName}.csv`);

            return { success: true, message: 'Archivo CSV exportado correctamente' };
        } catch (error) {
            console.error('Error exportando a CSV:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Exporta imágenes como archivo ZIP
     * @param {Array} images - Array de objetos { id, dataUrl }
     * @param {string} fileName - Nombre del archivo (sin extensión)
     * @returns {Promise<Object>}
     */
    static async exportImagesToZip(images, fileName) {
        try {
            if (!window.JSZip) {
                throw new Error('JSZip no está cargado');
            }

            if (!images || images.length === 0) {
                throw new Error('No hay imágenes para exportar');
            }

            const zip = new JSZip();
            const folder = zip.folder('imágenes');

            // Agregar cada imagen al ZIP
            images.forEach((img, index) => {
                const base64Data = img.dataUrl.split(',')[1];
                folder.file(`imagen_${img.id}.jpg`, base64Data, { base64: true });
            });

            // Generar y descargar ZIP
            const blob = await zip.generateAsync({ type: 'blob' });
            UtilityManager.downloadFile(blob, `${fileName}.zip`);

            return { success: true, message: `${images.length} imágenes exportadas correctamente` };
        } catch (error) {
            console.error('Error exportando a ZIP:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Importa imágenes desde archivo ZIP
     * @param {File} zipFile - Archivo ZIP
     * @returns {Promise<Array>}
     */
    static async importImagesFromZip(zipFile) {
        try {
            if (!window.JSZip) {
                throw new Error('JSZip no está cargado');
            }

            const zip = await JSZip.loadAsync(zipFile);
            const images = [];

            for (const [path, file] of Object.entries(zip.files)) {
                if (!file.dir && /\.(jpg|png|webp)$/i.test(path)) {
                    const blob = await file.async('blob');
                    const dataUrl = await this._blobToDataUrl(blob);
                    const fileName = path.split('/').pop();
                    
                    images.push({
                        id: `imported_${UtilityManager.generateId()}`,
                        dataUrl,
                        fileName,
                        importedAt: new Date().toISOString()
                    });
                }
            }

            return images;
        } catch (error) {
            console.error('Error importando ZIP:', error);
            throw error;
        }
    }

    /**
     * Convierte un Blob a Data URL
     * @private
     * @param {Blob} blob - Blob
     * @returns {Promise<string>}
     */
    static _blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
}

/**
 * ImageManager - Gestión de imágenes con compresión
 */
class ImageManager {
    /**
     * Comprime una imagen
     * @param {string} dataUrl - Data URL de la imagen
     * @param {number} maxSize - Tamaño máximo en bytes
     * @returns {Promise<string>}
     */
    static async compressImage(dataUrl, maxSize = APP_CONFIG.IMAGE.MAX_SIZE) {
        try {
            // Si ya es pequeña, retornar
            if (dataUrl.length < maxSize) {
                return dataUrl;
            }

            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Reducir tamaño si es muy grande
                    if (width > APP_CONFIG.IMAGE.MAX_DIMENSION || height > APP_CONFIG.IMAGE.MAX_DIMENSION) {
                        const ratio = Math.min(
                            APP_CONFIG.IMAGE.MAX_DIMENSION / width,
                            APP_CONFIG.IMAGE.MAX_DIMENSION / height
                        );
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }

                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d').drawImage(img, 0, 0, width, height);

                    // Comprimir con calidad progresiva
                    let quality = 0.8;
                    let compressed = canvas.toDataURL('image/jpeg', quality);

                    // Si sigue siendo muy grande, reducir calidad más
                    while (compressed.length > maxSize && quality > 0.2) {
                        quality -= 0.1;
                        compressed = canvas.toDataURL('image/jpeg', quality);
                    }

                    resolve(compressed);
                };
                img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
                img.src = dataUrl;
            });
        } catch (error) {
            console.error('Error comprimiendo imagen:', error);
            throw error;
        }
    }

    /**
     * Obtiene información de una imagen
     * @param {string} dataUrl - Data URL de la imagen
     * @returns {Promise<Object>}
     */
    static async getImageInfo(dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height,
                    size: dataUrl.length,
                    formattedSize: UtilityManager.formatFileSize ? UtilityManager.formatFileSize(dataUrl.length) : 'N/A'
                });
            };
            img.onerror = reject;
            img.src = dataUrl;
        });
    }

    /**
     * Captura una foto desde la cámara
     * @param {HTMLVideoElement} videoElement - Elemento video
     * @param {number} width - Ancho de captura (opcional)
     * @param {number} height - Alto de captura (opcional)
     * @returns {string} Data URL de la imagen
     */
    static captureFromCamera(videoElement, width = null, height = null) {
        if (!videoElement) {
            throw new Error('Elemento de video no proporcionado');
        }

        const canvas = document.createElement('canvas');
        canvas.width = width || videoElement.videoWidth;
        canvas.height = height || videoElement.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        return canvas.toDataURL('image/jpeg', 0.8);
    }

    /**
     * Accede a la cámara
     * @returns {Promise<MediaStream>}
     */
    static async getCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            return stream;
        } catch (error) {
            console.error('Error accediendo a la cámara:', error);
            throw new Error('No se pudo acceder a la cámara. Verifica los permisos.');
        }
    }

    /**
     * Detiene una transmisión de cámara
     * @param {MediaStream} stream - Stream de cámara
     */
    static stopCamera(stream) {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }

    /**
     * Crea una miniatura de una imagen
     * @param {string} dataUrl - Data URL de la imagen
     * @param {number} maxWidth - Ancho máximo
     * @param {number} maxHeight - Alto máximo
     * @returns {Promise<string>}
     */
    static async createThumbnail(dataUrl, maxWidth = 150, maxHeight = 150) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);

                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = reject;
            img.src = dataUrl;
        });
    }
}
