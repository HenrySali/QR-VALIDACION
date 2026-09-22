# Estándares de Codificación - QR-VALIDACION

## 📝 Codificación de Caracteres

### Estándar: UTF-8 sin BOM
- **Codificación**: UTF-8 (sin marca de orden de byte)
- **Saltos de línea**: LF (Unix/Linux), NO CRLF (Windows)
- **Final de archivo**: Nueva línea
- **Espacios al final**: Ninguno

### Cómo verificar la codificación:
```bash
# Ver la codificación de un archivo
file nombre_archivo.js

# Convertir a UTF-8 sin BOM (Linux/Mac)
iconv -f UTF-8 -t UTF-8 nombre_archivo.js > temp && mv temp nombre_archivo.js

# Corregir line endings (CRLF → LF)
sed -i 's/\r$//' nombre_archivo.js

# En VS Code
# Haz clic en "UTF-8" en la esquina inferior derecha
# Luego "Reopen with Encoding" → "UTF-8"
```

## 🏗️ Estructura de Archivos

### Estructura Recomendada:
```
proyecto/
├── css/
│   └── *.css                 # Espacios: 2
├── js/
│   ├── config.js            # Espacios: 4
│   ├── db.js                # Espacios: 4
│   ├── validation.js        # Espacios: 4
│   ├── equipment.js         # Espacios: 4
│   ├── fileUtils.js         # Espacios: 4
│   ├── forms.js             # Espacios: 4
│   ├── ui.js                # Espacios: 4
│   └── main.js              # Espacios: 4
├── *.html                    # Espacios: 2
├── .editorconfig            # Configuración de estilos
└── CODING_STANDARDS.md      # Este archivo
```

## 📐 Estilos de Indentación

### JavaScript
```javascript
// Usar espacios (4 espacios)
class EquipmentManager {
    constructor() {
        this.data = [];
    }

    // ✓ Correcto
    processData(input) {
        try {
            const result = this.validate(input);
            return result;
        } catch (error) {
            console.error(error);
        }
    }

    // ✗ Incorrecto (mezclar tabs y espacios)
    badFormat() {
    	const x = 1;  // Tab aquí
        const y = 2;  // Espacios aquí
    }
}
```

### HTML
```html
<!-- Usar espacios (2 espacios) -->
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Título</title>
  </head>
  <body>
    <div class="container">
      <h1>Encabezado</h1>
    </div>
  </body>
</html>
```

### CSS
```css
/* Usar espacios (2 espacios) */
.container {
  max-width: 1200px;
  margin: 0 auto;
}

.card {
  padding: 20px;
  border-radius: 8px;
}
```

## 📌 Convenciones de Nombres

### Variables y Funciones
```javascript
// ✓ Correcto: camelCase
const equipmentData = [];
function processEquipment() {}
let patronUbicacion = null;

// ✗ Incorrecto: snake_case o PascalCase para variables
const equipment_data = [];
function ProcessEquipment() {}
let PatronUbicacion = null;
```

### Clases
```javascript
// ✓ Correcto: PascalCase
class EquipmentManager {}
class ValidationManager {}
class DatabaseManager {}

// ✗ Incorrecto
class equipmentManager {}
class validation_manager {}
```

### Constantes
```javascript
// ✓ Correcto: UPPER_SNAKE_CASE para constantes globales
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const DEFAULT_TIMEOUT = 5000;

// Pero para objetos de configuración, usar camelCase
const APP_CONFIG = {
    maxFileSize: 50 * 1024 * 1024,
    defaultTimeout: 5000
};
```

### Atributos de HTML
```html
<!-- ✓ Correcto: kebab-case -->
<div id="register-modal" class="modal-overlay" data-type="form">
  <input type="text" id="user-name" placeholder="Nombre">
</div>

<!-- ✗ Incorrecto: camelCase o snake_case -->
<div id="registerModal" class="modalOverlay">
</div>
```

## 💬 Comentarios y Documentación

### JSDoc para funciones
```javascript
/**
 * Procesa un archivo Excel y extrae datos
 * @param {File} file - Archivo Excel
 * @param {string} sheetName - Nombre de la hoja (opcional)
 * @returns {Promise<Object>} Objeto con datos y headers
 * @throws {Error} Si el archivo no es válido
 */
async function processExcel(file, sheetName = null) {
    // implementación
}

/**
 * Valida un número de serie
 * @param {string} serie - Serie a validar
 * @returns {Object} { isValid: boolean, error?: string }
 */
function validateSerie(serie) {
    // implementación
}
```

### Comentarios en línea
```javascript
// ✓ Correcto: Comentarios útiles
// Verificar si el usuario tiene permisos antes de procesar
if (user.hasPermission('edit')) {
    processData();
}

// ✗ Incorrecto: Comentarios obvios
// Asignar x a 1
let x = 1;
```

### Comentarios de sección
```javascript
// === INICIALIZACIÓN DE BASE DE DATOS ===
function initDatabase() {
    // ...
}

// === VALIDACIÓN DE FORMULARIOS ===
function validateForm() {
    // ...
}
```

## 🚀 Mejores Prácticas

### 1. Manejo de Errores
```javascript
// ✓ Correcto
try {
    const result = await process();
    console.log('Éxito:', result);
} catch (error) {
    console.error('Error:', error.message);
    UIManager.showFeedback(error.message, 'error', feedbackEl);
}

// ✗ Incorrecto
try {
    const result = await process();
} catch (e) {
    // Ignorar errores
}
```

### 2. Const vs Let vs Var
```javascript
// ✓ Correcto: Preferir const
const data = [];
let index = 0;

// ✗ Incorrecto: Usar var
var data = [];
```

### 3. Async/Await
```javascript
// ✓ Correcto
async function loadData() {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
    }
}

// ✗ Incorrecto
function loadData() {
    fetch(url).then(res => res.json()).then(data => {
        // sin manejo de errores
    });
}
```

### 4. Destructuring
```javascript
// ✓ Correcto
const { success, message, data } = result;

// ✓ También correcto
const { 
    username, 
    email, 
    settings: { theme } 
} = user;

// ✗ Innecesario
const success = result.success;
const message = result.message;
const data = result.data;
```

## 🔍 Herramientas de Validación

### EditorConfig
- Mantiene estilos consistentes entre editores
- Archivos: `.editorconfig`
- Plugins para VS Code, Sublime Text, etc.

### Checklist de Codificación
- [ ] UTF-8 sin BOM
- [ ] LF (no CRLF)
- [ ] Sin espacios al final de líneas
- [ ] Nueva línea al final del archivo
- [ ] Indentación consistente (2 o 4 espacios)
- [ ] Nombres en camelCase (variables/funciones)
- [ ] Nombres en PascalCase (clases)
- [ ] Nombres en UPPER_SNAKE_CASE (constantes globales)
- [ ] JSDoc para funciones públicas
- [ ] Try-catch para operaciones async
- [ ] Sin comentarios obvios

## 📋 Proceso de Revisión de Código

Antes de hacer commit:

1. **Verificar codificación**
   ```bash
   file *.js *.html *.css
   ```

2. **Verificar estilos**
   ```bash
   # Buscar tabs
   grep -P '\t' *.js | wc -l
   ```

3. **Verificar comentarios**
   - ¿Todos los módulos tienen descripción?
   - ¿Las funciones públicas tienen JSDoc?

4. **Verificar nombres**
   - ¿Variables en camelCase?
   - ¿Clases en PascalCase?

## 🔧 Configuración de VS Code

Crear `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.tabSize": 4,
  "editor.insertSpaces": true,
  "editor.renderWhitespace": "all",
  "files.encoding": "utf8",
  "files.insertFinalNewline": true,
  "files.trimTrailingWhitespace": true,
  "[html]": {
    "editor.tabSize": 2
  },
  "[css]": {
    "editor.tabSize": 2
  }
}
```

## 📞 Preguntas Frecuentes

**P: ¿Debo usar Prettier?**
R: Sí, recomendado para formateo automático.

**P: ¿Qué pasa si mezclo tabs y espacios?**
R: Puede causar errores sutiles. Usa EditorConfig para prevenir.

**P: ¿Necesito comentar todo el código?**
R: Solo lo que no sea obvio. Prefiere código claro a comentarios.

**P: ¿Cuántas líneas debería tener una función?**
R: 30-50 líneas como máximo. Si es más, considera dividirla.

---

**Última actualización:** Septiembre 2026  
**Versión:** 1.0
