/**
 * forms.js - Gestión centralizada de formularios con validación
 * 
 * Proporciona:
 * - Validación de formularios en tiempo real
 * - Manejo de errores de validación
 * - Feedback visual
 * - Prevención de envío duplicado
 */

class FormValidator {
    constructor() {
        this.rules = {};
        this.errors = {};
        this.touched = {};
    }

    /**
     * Define reglas de validación para un formulario
     * @param {string} formId - ID del formulario
     * @param {Object} validationRules - Reglas de validación
     */
    defineRules(formId, validationRules) {
        this.rules[formId] = validationRules;
        console.log(`Reglas definidas para formulario: ${formId}`);
    }

    /**
     * Valida un campo específico
     * @param {string} formId - ID del formulario
     * @param {string} fieldName - Nombre del campo
     * @param {any} value - Valor del campo
     * @returns {Object} { isValid: boolean, error?: string }
     */
    validateField(formId, fieldName, value) {
        const formRules = this.rules[formId];
        if (!formRules || !formRules[fieldName]) {
            return { isValid: true };
        }

        const fieldRules = formRules[fieldName];
        const errors = [];

        // Validar required
        if (fieldRules.required && (!value || value.toString().trim() === '')) {
            errors.push(fieldRules.requiredMessage || `${fieldName} es requerido`);
        }

        // Si está vacío y no es required, skip otros validadores
        if (!value || value.toString().trim() === '') {
            if (errors.length > 0) {
                return { isValid: false, error: errors[0] };
            }
            return { isValid: true };
        }

        // Validar minLength
        if (fieldRules.minLength && value.toString().length < fieldRules.minLength) {
            errors.push(
                fieldRules.minLengthMessage || 
                `${fieldName} debe tener mínimo ${fieldRules.minLength} caracteres`
            );
        }

        // Validar maxLength
        if (fieldRules.maxLength && value.toString().length > fieldRules.maxLength) {
            errors.push(
                fieldRules.maxLengthMessage || 
                `${fieldName} no puede exceder ${fieldRules.maxLength} caracteres`
            );
        }

        // Validar patrón regex
        if (fieldRules.pattern && !fieldRules.pattern.test(value.toString())) {
            errors.push(
                fieldRules.patternMessage || 
                `${fieldName} tiene formato inválido`
            );
        }

        // Validar función personalizada
        if (fieldRules.custom && typeof fieldRules.custom === 'function') {
            const customResult = fieldRules.custom(value);
            if (!customResult.isValid) {
                errors.push(customResult.error || `${fieldName} no es válido`);
            }
        }

        // Validar email
        if (fieldRules.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value.toString())) {
                errors.push(fieldRules.emailMessage || `${fieldName} debe ser un email válido`);
            }
        }

        // Validar número
        if (fieldRules.numeric && isNaN(value)) {
            errors.push(fieldRules.numericMessage || `${fieldName} debe ser un número`);
        }

        // Validar teléfono
        if (fieldRules.phone && !/^[\d\s\-\+\(\)]{7,}$/.test(value.toString())) {
            errors.push(fieldRules.phoneMessage || `${fieldName} debe ser un teléfono válido`);
        }

        if (errors.length > 0) {
            return { isValid: false, error: errors[0] };
        }

        return { isValid: true };
    }

    /**
     * Valida todo un formulario
     * @param {string} formId - ID del formulario
     * @param {FormData|Object} formData - Datos del formulario
     * @returns {Object} { isValid: boolean, errors?: Object }
     */
    validateForm(formId, formData) {
        const formRules = this.rules[formId];
        if (!formRules) {
            console.warn(`No hay reglas definidas para: ${formId}`);
            return { isValid: true };
        }

        const errors = {};
        let isValid = true;

        Object.entries(formRules).forEach(([fieldName, fieldRules]) => {
            const value = formData[fieldName] || '';
            const result = this.validateField(formId, fieldName, value);

            if (!result.isValid) {
                errors[fieldName] = result.error;
                isValid = false;
            }
        });

        this.errors[formId] = errors;
        return { isValid, errors };
    }

    /**
     * Obtiene los errores de un formulario
     * @param {string} formId - ID del formulario
     * @returns {Object}
     */
    getErrors(formId) {
        return this.errors[formId] || {};
    }

    /**
     * Limpia los errores de un formulario
     * @param {string} formId - ID del formulario
     */
    clearErrors(formId) {
        this.errors[formId] = {};
        this.touched[formId] = {};
    }

    /**
     * Marca un campo como tocado
     * @param {string} formId - ID del formulario
     * @param {string} fieldName - Nombre del campo
     */
    markFieldTouched(formId, fieldName) {
        if (!this.touched[formId]) {
            this.touched[formId] = {};
        }
        this.touched[formId][fieldName] = true;
    }

    /**
     * Verifica si un campo ha sido tocado
     * @param {string} formId - ID del formulario
     * @param {string} fieldName - Nombre del campo
     * @returns {boolean}
     */
    isFieldTouched(formId, fieldName) {
        return this.touched[formId]?.[fieldName] || false;
    }
}

/**
 * FormManager - Gestor centralizado de formularios
 */
class FormManager {
    constructor() {
        this.validator = new FormValidator();
        this.isSubmitting = {};
    }

    /**
     * Inicializa un formulario con validación
     * @param {string} formId - ID del formulario
     * @param {Object} options - Opciones del formulario
     */
    initForm(formId, options = {}) {
        const form = document.getElementById(formId);
        if (!form) {
            console.error(`Formulario no encontrado: ${formId}`);
            return;
        }

        const {
            rules = {},
            onSubmit = null,
            onValidationError = null,
            validateOnChange = true,
            validateOnBlur = true
        } = options;

        // Definir reglas
        if (Object.keys(rules).length > 0) {
            this.validator.defineRules(formId, rules);
        }

        // Inicializar estado de envío
        this.isSubmitting[formId] = false;

        // Validación en tiempo real
        if (validateOnBlur || validateOnChange) {
            form.querySelectorAll('input, textarea, select').forEach(input => {
                input.addEventListener('blur', (e) => {
                    if (validateOnBlur) {
                        this.validator.markFieldTouched(formId, input.name);
                        const result = this.validator.validateField(
                            formId,
                            input.name,
                            input.value
                        );
                        this._showFieldError(input, result, formId);
                    }
                });

                input.addEventListener('change', (e) => {
                    if (validateOnChange) {
                        const result = this.validator.validateField(
                            formId,
                            input.name,
                            input.value
                        );
                        this._showFieldError(input, result, formId);
                    }
                });

                input.addEventListener('input', (e) => {
                    if (validateOnChange && this.validator.isFieldTouched(formId, input.name)) {
                        const result = this.validator.validateField(
                            formId,
                            input.name,
                            input.value
                        );
                        this._showFieldError(input, result, formId);
                    }
                });
            });
        }

        // Manejo del envío
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (this.isSubmitting[formId]) {
                console.warn('Formulario ya está siendo enviado');
                return;
            }

            // Recopilar datos
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            // Validar
            const validation = this.validator.validateForm(formId, data);

            if (!validation.isValid) {
                // Mostrar errores
                form.querySelectorAll('input, textarea, select').forEach(input => {
                    const error = validation.errors[input.name];
                    const result = { isValid: !error, error };
                    this._showFieldError(input, result, formId);
                });

                if (onValidationError) {
                    onValidationError(validation.errors);
                }
                return;
            }

            // Ejecutar callback
            if (onSubmit) {
                this.isSubmitting[formId] = true;
                try {
                    await onSubmit(data);
                } catch (error) {
                    console.error('Error en onSubmit:', error);
                } finally {
                    this.isSubmitting[formId] = false;
                }
            }
        });

        console.log(`Formulario inicializado: ${formId}`);
    }

    /**
     * Muestra o limpia errores de un campo
     * @private
     */
    _showFieldError(input, result, formId) {
        const container = input.closest('.input-group') || input.parentElement;
        if (!container) return;

        let errorElement = container.querySelector('.field-error');

        if (!result.isValid) {
            // Mostrar error
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'field-error';
                container.appendChild(errorElement);
            }
            errorElement.textContent = result.error;
            errorElement.style.display = 'block';
            input.style.borderColor = '#ff6464';
        } else {
            // Limpiar error
            if (errorElement) {
                errorElement.style.display = 'none';
            }
            input.style.borderColor = '';
        }
    }

    /**
     * Obtiene los datos de un formulario como objeto
     * @param {string} formId - ID del formulario
     * @returns {Object}
     */
    getFormData(formId) {
        const form = document.getElementById(formId);
        if (!form) return {};

        const formData = new FormData(form);
        return Object.fromEntries(formData);
    }

    /**
     * Establece datos en un formulario
     * @param {string} formId - ID del formulario
     * @param {Object} data - Datos a establecer
     */
    setFormData(formId, data) {
        const form = document.getElementById(formId);
        if (!form) return;

        Object.entries(data).forEach(([name, value]) => {
            const input = form.querySelector(`[name="${name}"]`);
            if (input) {
                input.value = value || '';
            }
        });
    }

    /**
     * Limpia un formulario
     * @param {string} formId - ID del formulario
     */
    clearForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.reset();
        this.validator.clearErrors(formId);

        // Limpiar estilos de error
        form.querySelectorAll('input, textarea, select').forEach(input => {
            input.style.borderColor = '';
            const errorElement = input.closest('.input-group')?.querySelector('.field-error');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        });
    }

    /**
     * Deshabilita/habilita todos los campos de un formulario
     * @param {string} formId - ID del formulario
     * @param {boolean} disabled - True para deshabilitar
     */
    setFormDisabled(formId, disabled) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.querySelectorAll('input, textarea, select, button').forEach(input => {
            input.disabled = disabled;
        });
    }

    /**
     * Habilita un formulario para envío
     * @param {string} formId - ID del formulario
     */
    enableSubmit(formId) {
        this.isSubmitting[formId] = false;
    }

    /**
     * Desactiva el envío de un formulario
     * @param {string} formId - ID del formulario
     */
    disableSubmit(formId) {
        this.isSubmitting[formId] = true;
    }
}

// Crear instancia global
const formManager = new FormManager();

// Estilos CSS para errores de campos (agregar a style.css si no existe)
const errorStyles = `
.field-error {
    color: #ff6464;
    font-size: 0.75rem;
    margin-top: 4px;
    display: none;
}

.input-group input.error,
.input-group textarea.error,
.input-group select.error {
    border-color: #ff6464 !important;
    background-color: rgba(255, 100, 100, 0.05);
}
`;

// Inyectar estilos de error si no existen
if (!document.querySelector('style[data-error-styles]')) {
    const style = document.createElement('style');
    style.setAttribute('data-error-styles', 'true');
    style.textContent = errorStyles;
    document.head.appendChild(style);
}
