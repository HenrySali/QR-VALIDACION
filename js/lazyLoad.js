/**
 * lazyLoad.js - Carga perezosa de imágenes para optimización
 * 
 * Proporciona:
 * - Lazy loading de imágenes
 * - Observador de intersección
 * - Manejo de errores de carga
 * - Precarga de imágenes
 */

class LazyLoadManager {
    constructor() {
        this.observer = null;
        this.loadedImages = new Set();
        this.imageQueue = [];
        this.isSupported = 'IntersectionObserver' in window;
    }

    /**
     * Inicializa el observador de lazy loading
     * @param {Object} options - Opciones del observador
     */
    init(options = {}) {
        if (!this.isSupported) {
            console.warn('IntersectionObserver no soportado, cargando todas las imágenes');
            this._loadAllImages();
            return;
        }

        const {
            root = null,
            rootMargin = '50px',
            threshold = 0.01
        } = options;

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this._loadImage(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, { root, rootMargin, threshold });

        console.log('LazyLoadManager inicializado');
    }

    /**
     * Observa una imagen para lazy loading
     * @param {HTMLImageElement} img - Elemento imagen
     */
    observe(img) {
        if (!this.isSupported || !this.observer) {
            this._loadImage(img);
            return;
        }

        if (img.dataset.src) {
            this.observer.observe(img);
        } else {
            this._loadImage(img);
        }
    }

    /**
     * Observa múltiples imágenes
     * @param {Array|NodeList} images - Imágenes a observar
     */
    observeAll(images) {
        images.forEach(img => this.observe(img));
    }

    /**
     * Carga una imagen
     * @private
     */
    _loadImage(img) {
        const src = img.dataset.src || img.src;
        if (!src || this.loadedImages.has(src)) {
            return;
        }

        const imageId = this._generateImageId(src);
        if (this.loadedImages.has(imageId)) {
            return;
        }

        // Crear imagen temporal para precargar
        const tempImg = new Image();
        tempImg.onload = () => {
            img.src = src;
            img.classList.add('lazy-loaded');
            this.loadedImages.add(imageId);
            img.dispatchEvent(new CustomEvent('lazyloaded'));
        };

        tempImg.onerror = () => {
            img.classList.add('lazy-error');
            img.src = this._getErrorPlaceholder();
            img.dispatchEvent(new CustomEvent('lazyerror'));
        };

        tempImg.src = src;
    }

    /**
     * Carga todas las imágenes inmediatamente
     * @private
     */
    _loadAllImages() {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => this._loadImage(img));
    }

    /**
     * Genera un ID único para una imagen
     * @private
     */
    _generateImageId(src) {
        return `img_${src.hashCode ? src.hashCode() : Math.abs(src.split('').reduce((a, b) => a + b.charCodeAt(0), 0))}`;
    }

    /**
     * Retorna placeholder para errores
     * @private
     */
    _getErrorPlaceholder() {
        return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23444" width="200" height="200"/%3E%3Ctext x="50%" y="50%" font-size="14" fill="%23999" text-anchor="middle" dy=".3em"%3EError cargando imagen%3C/text%3E%3C/svg%3E';
    }

    /**
     * Precarga una imagen
     * @param {string|Array} src - URL(s) de la imagen
     * @returns {Promise}
     */
    preload(src) {
        if (Array.isArray(src)) {
            return Promise.all(src.map(s => this._preloadSingle(s)));
        }
        return this._preloadSingle(src);
    }

    /**
     * Precarga una única imagen
     * @private
     */
    _preloadSingle(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.loadedImages.add(src);
                resolve(img);
            };
            img.onerror = () => reject(new Error(`Error precargando: ${src}`));
            img.src = src;
        });
    }

    /**
     * Limpia el observador
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
}

/**
 * Utilidades para crear HTML con lazy loading
 */
class LazyLoadHTML {
    /**
     * Crea un elemento img con lazy loading
     * @param {Object} options - Opciones
     * @returns {HTMLImageElement}
     */
    static createLazyImage(options = {}) {
        const {
            src = '',
            alt = 'Imagen',
            placeholder = null,
            width = null,
            height = null,
            className = ''
        } = options;

        const img = document.createElement('img');
        img.alt = alt;
        img.className = `lazy-image ${className}`;
        
        if (placeholder) {
            img.src = placeholder;
            img.dataset.src = src;
        } else {
            img.src = src;
        }

        if (width) img.width = width;
        if (height) img.height = height;

        return img;
    }

    /**
     * Crea un contenedor de galería con lazy loading
     * @param {Array} images - Array de URLs de imágenes
     * @param {Object} options - Opciones
     * @returns {HTMLElement}
     */
    static createLazyGallery(images, options = {}) {
        const {
            columns = 3,
            gap = '12px',
            maxWidth = '800px'
        } = options;

        const gallery = document.createElement('div');
        gallery.className = 'lazy-gallery';
        gallery.style.cssText = `
            display: grid;
            grid-template-columns: repeat(${columns}, 1fr);
            gap: ${gap};
            max-width: ${maxWidth};
            margin: 0 auto;
        `;

        images.forEach(imgSrc => {
            const item = document.createElement('div');
            item.className = 'lazy-gallery-item';
            item.style.cssText = `
                position: relative;
                padding-bottom: 100%;
                overflow: hidden;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.05);
            `;

            const img = this.createLazyImage({
                src: imgSrc,
                className: 'gallery-image',
                placeholder: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23222" width="300" height="300"/%3E%3C/svg%3E'
            });

            img.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
            `;

            item.appendChild(img);
            gallery.appendChild(item);
        });

        return gallery;
    }
}

// Crear instancia global
const lazyLoadManager = new LazyLoadManager();

// Inicializar automáticamente
document.addEventListener('DOMContentLoaded', () => {
    lazyLoadManager.init();
});
