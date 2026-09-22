/**
 * search.js - Búsqueda y filtrado avanzado de registros
 * 
 * Proporciona:
 * - Búsqueda en tiempo real
 * - Filtrado por múltiples criterios
 * - Paginación
 * - Ordenamiento
 */

class SearchManager {
    constructor() {
        this.data = [];
        this.originalData = [];
        this.filters = {};
        this.searchText = '';
        this.currentPage = 1;
        this.pageSize = APP_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE;
        this.sortField = null;
        this.sortDirection = 'asc';
    }

    /**
     * Inicializa el manejador de búsqueda con datos
     * @param {Array} data - Datos iniciales
     */
    setData(data) {
        this.data = [...data];
        this.originalData = [...data];
        this.currentPage = 1;
    }

    /**
     * Realiza búsqueda de texto en múltiples campos
     * @param {string} searchText - Texto a buscar
     * @param {Array<string>} fields - Campos donde buscar
     * @returns {Array} Resultados filtrados
     */
    search(searchText, fields = null) {
        this.searchText = searchText.toLowerCase();
        return this._applyFilters();
    }

    /**
     * Agrega un filtro
     * @param {string} filterId - ID único del filtro
     * @param {Function} filterFn - Función de filtrado
     */
    addFilter(filterId, filterFn) {
        this.filters[filterId] = filterFn;
        return this._applyFilters();
    }

    /**
     * Elimina un filtro
     * @param {string} filterId - ID del filtro a eliminar
     */
    removeFilter(filterId) {
        delete this.filters[filterId];
        return this._applyFilters();
    }

    /**
     * Limpia todos los filtros
     */
    clearAllFilters() {
        this.filters = {};
        this.searchText = '';
        this.currentPage = 1;
        this.sortField = null;
        return this.originalData;
    }

    /**
     * Establece el ordenamiento
     * @param {string} field - Campo a ordenar
     * @param {string} direction - 'asc' o 'desc'
     */
    setSort(field, direction = 'asc') {
        this.sortField = field;
        this.sortDirection = direction;
        return this._applyFilters();
    }

    /**
     * Obtiene la página especificada
     * @param {number} pageNum - Número de página (1-based)
     * @returns {Object} { data: Array, currentPage: number, totalPages: number, totalRecords: number }
     */
    getPage(pageNum = 1) {
        this.currentPage = Math.max(1, pageNum);
        const filtered = this._applyFilters();
        
        const totalRecords = filtered.length;
        const totalPages = Math.ceil(totalRecords / this.pageSize);
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;

        return {
            data: filtered.slice(start, end),
            currentPage: this.currentPage,
            totalPages: Math.max(1, totalPages),
            totalRecords: totalRecords,
            pageSize: this.pageSize,
            hasNextPage: this.currentPage < totalPages,
            hasPrevPage: this.currentPage > 1
        };
    }

    /**
     * Establece el tamaño de página
     * @param {number} size - Registros por página
     */
    setPageSize(size) {
        this.pageSize = Math.min(size, APP_CONFIG.PAGINATION.MAX_PAGE_SIZE);
        this.currentPage = 1;
    }

    /**
     * Obtiene toda la página anterior
     * @returns {Object}
     */
    getPreviousPage() {
        return this.getPage(this.currentPage - 1);
    }

    /**
     * Obtiene la página siguiente
     * @returns {Object}
     */
    getNextPage() {
        return this.getPage(this.currentPage + 1);
    }

    /**
     * Aplica todos los filtros y búsqueda
     * @private
     */
    _applyFilters() {
        let filtered = [...this.originalData];

        // Aplicar búsqueda de texto
        if (this.searchText) {
            filtered = filtered.filter(item => {
                return Object.values(item).some(value =>
                    String(value).toLowerCase().includes(this.searchText)
                );
            });
        }

        // Aplicar filtros personalizados
        Object.values(this.filters).forEach(filterFn => {
            filtered = filtered.filter(filterFn);
        });

        // Aplicar ordenamiento
        if (this.sortField) {
            filtered = [...filtered].sort((a, b) => {
                const aVal = a[this.sortField];
                const bVal = b[this.sortField];

                let comparison = 0;
                if (typeof aVal === 'string') {
                    comparison = aVal.localeCompare(bVal);
                } else if (typeof aVal === 'number') {
                    comparison = aVal - bVal;
                } else if (aVal instanceof Date) {
                    comparison = aVal - bVal;
                }

                return this.sortDirection === 'asc' ? comparison : -comparison;
            });
        }

        return filtered;
    }

    /**
     * Obtiene estadísticas de búsqueda
     * @returns {Object}
     */
    getStatistics() {
        const filtered = this._applyFilters();
        return {
            totalRecords: this.originalData.length,
            filteredRecords: filtered.length,
            currentPage: this.currentPage,
            pageSize: this.pageSize,
            totalPages: Math.ceil(filtered.length / this.pageSize),
            hasActiveFilters: Object.keys(this.filters).length > 0 || this.searchText !== '',
            searchText: this.searchText,
            sortField: this.sortField,
            sortDirection: this.sortDirection
        };
    }
}

/**
 * PaginationUI - Utilidades para renderizar paginación
 */
class PaginationUI {
    /**
     * Genera HTML de paginación
     * @param {Object} pageData - Datos de página
     * @returns {string} HTML
     */
    static generatePaginationHTML(pageData) {
        const { currentPage, totalPages, totalRecords, pageSize } = pageData;
        
        let html = '<div class="pagination">';
        html += `<span class="pagination-info">Mostrando ${pageSize} de ${totalRecords} registros | Página ${currentPage} de ${totalPages}</span>`;
        
        html += '<div class="pagination-controls">';
        
        // Botón anterior
        if (pageData.hasPrevPage) {
            html += `<button class="btn btn-small btn-secondary" data-action="prev-page">← Anterior</button>`;
        } else {
            html += `<button class="btn btn-small btn-secondary" disabled>← Anterior</button>`;
        }

        // Números de página
        html += '<div class="pagination-numbers">';
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            html += `<button class="btn btn-small btn-secondary" data-page="1">1</button>`;
            if (startPage > 2) {
                html += `<span class="pagination-dots">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            if (i === currentPage) {
                html += `<button class="btn btn-small btn-primary" disabled>${i}</button>`;
            } else {
                html += `<button class="btn btn-small btn-secondary" data-page="${i}">${i}</button>`;
            }
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<span class="pagination-dots">...</span>`;
            }
            html += `<button class="btn btn-small btn-secondary" data-page="${totalPages}">${totalPages}</button>`;
        }

        html += '</div>';

        // Botón siguiente
        if (pageData.hasNextPage) {
            html += `<button class="btn btn-small btn-secondary" data-action="next-page">Siguiente →</button>`;
        } else {
            html += `<button class="btn btn-small btn-secondary" disabled>Siguiente →</button>`;
        }

        html += '</div></div>';
        return html;
    }

    /**
     * Renderiza paginación en un contenedor
     * @param {string|HTMLElement} container - Contenedor
     * @param {Object} pageData - Datos de página
     * @param {Function} onPageChange - Callback al cambiar página
     */
    static render(container, pageData, onPageChange) {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        if (!container) return;

        container.innerHTML = this.generatePaginationHTML(pageData);

        // Agregar event listeners
        container.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action === 'prev-page' && onPageChange) {
                    onPageChange(pageData.currentPage - 1);
                } else if (action === 'next-page' && onPageChange) {
                    onPageChange(pageData.currentPage + 1);
                }
            });
        });

        container.querySelectorAll('[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.target.dataset.page);
                if (onPageChange) onPageChange(page);
            });
        });
    }
}

// Crear instancia global
const searchManager = new SearchManager();
