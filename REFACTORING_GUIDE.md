# Guía de Refactorización - QR-VALIDACION v2.0

## 📋 Descripción General

Este documento describe los cambios realizados en la refactorización del proyecto QR-VALIDACION v2.0, enfocándose en mejorar la organización del código, modularidad y mantenibilidad.

## 🏗️ Nueva Estructura de Archivos

```
QR-VALIDACION/
├── css/
│   └── style.css              # Estilos centralizados (sin duplicados)
├── js/
│   ├── config.js              # Configuración centralizada
│   ├── db.js                  # Gestión de IndexedDB
│   ├── validation.js          # Validación y utilidades UI
│   ├── fileUtils.js           # Exportación y manejo de archivos
│   ├── equipment.js           # Lógica de gestión de equipos
│   ├── stations.js            # Gestión de estaciones (en desarrollo)
│   ├── ui.js                  # Controlador de UI
│   └── main.js                # Archivo principal (en desarrollo)
├── index.html                 # Página principal actualizada
├── estaciones-agua.html       # Página de estaciones
├── estaciones-agua.js         # Lógica de estaciones (a refactorizar)
├── app.js                     # DEPRECATED - Se reemplaza con módulos
└── REFACTORING_GUIDE.md       # Este archivo
```

## 📦 Módulos Creados

### 1. **config.js**
Configuración centralizada de toda la aplicación.

```javascript
// Acceder a configuración
APP_CONFIG.DB.EQUIPOS.NAME           // Nombre de base de datos
APP_CONFIG.IMAGE.MAX_SIZE            // Tamaño máximo de imagen
APP_CONFIG.VALIDATION.SERIE_REGEX    // Regex de validación
APP_CONFIG.MESSAGES.SUCCESS.SAVED    // Mensajes
```

### 2. **db.js**
Gestión unificada de IndexedDB.

```javascript
// Inicializar bases de datos
await dbManager.initImageDB();
await dbManager.initStationsDB();

// Operaciones CRUD
await dbManager.dbAdd('image', 'images', data);
await dbManager.dbPut('image', 'images', data);
await dbManager.dbDelete('image', 'images', id);
await dbManager.dbGetAll('image', 'images');
```

### 3. **validation.js**
Validación de datos y utilidades de UI.

```javascript
// Validación
ValidationManager.validateSerie(serie)
ValidationManager.validateUbicacion(ubicacion)
ValidationManager.validateExcelFile(file)
ValidationManager.validateZipFile(file)

// UI Manager
UIManager.showFeedback(message, type, container, duration)
UIManager.showModal(element)
UIManager.hideModal(element)

// Utility Manager
UtilityManager.debounce(func, delay)
UtilityManager.generateId()
UtilityManager.downloadFile(blob, fileName)
UtilityManager.formatDate(date, format)
```

### 4. **fileUtils.js**
Manejo de exportación de archivos e imágenes.

```javascript
// Exportación
FileExportManager.exportToExcel(data, fileName, headers)
FileExportManager.exportToCSV(data, fileName, headers)
FileExportManager.exportImagesToZip(images, fileName)
FileExportManager.importImagesFromZip(zipFile)

// Gestión de imágenes
ImageManager.compressImage(dataUrl, maxSize)
ImageManager.getImageInfo(dataUrl)
ImageManager.captureFromCamera(videoElement)
ImageManager.getCamera()
ImageManager.stopCamera(stream)
ImageManager.createThumbnail(dataUrl, width, height)
```

### 5. **equipment.js**
Lógica de gestión de equipos.

```javascript
// Procesar Excel
equipmentManager.processExcelBuffer(buffer, fileName)

// Gestión de equipos
equipmentManager.findEquipmentBySerie(serie)
equipmentManager.getSuggestionsBySerie(searchText, limit)
equipmentManager.registerEquipment(equipmentData)
equipmentManager.validateEquipment(serie, ubicacion)

// Búsqueda y exportación
equipmentManager.searchEquipment(criteria)
equipmentManager.exportToExcel(fileName)
equipmentManager.exportToCSV(fileName)
equipmentManager.getUniqueLocations()
equipmentManager.getStatistics()
```

### 6. **ui.js**
Controlador centralizado de UI e interacciones.

```javascript
// Inicializar
uiController.initElements(elementIds)

// Renderizado
uiController.renderTable(data, headers)
uiController.populateSelect(select, options, placeholder)

// Modales
uiController.showRegisterModal()
uiController.showVerifyModal()
uiController.hideRegisterModal()
uiController.hideVerifyModal()

// Cámara
uiController.startCamera()
uiController.capturePhoto()
uiController.stopCamera()

// Visor de imágenes
uiController.showImageViewer(imageSrc)
uiController.hideImageViewer()

// Sugerencias
uiController.showSuggestions(suggestions, container, callback)
uiController.hideSuggestions(container)

// Estados
uiController.setScanControlsEnabled(enabled)
uiController.showProcessing(message)
uiController.hideProcessing()
```

## 🎨 CSS Actualizado

### Características principales:
- ✅ Sin duplicados (eliminadas las reglas repetidas)
- ✅ Bien organizado en secciones lógicas
- ✅ Comentarios descriptivos
- ✅ Variables de color consistentes
- ✅ Estilos responsive mejorados

### Variables de color utilizadas:
```css
/* Primarios */
#00d9ff   /* Cyan brillante */
#00ff88   /* Verde brillante */
#4facfe   /* Azul oscuro */

/* Fondos */
#1a1a2e   /* Fondo principal */
#16213e   /* Fondo secundario */
#0f3460   /* Fondo terciario */

/* Estados */
#ff6464   /* Error */
#ffc800   /* Warning */
#00ff88   /* Success */
```

## 🔄 Cambios en el Flujo de Inicialización

### Antes (app.js monolítico):
```javascript
// Todo mezclado en un archivo de ~2000 líneas
document.addEventListener('DOMContentLoaded', () => {
    // IndexedDB setup
    // Excel processing
    // QR scanning
    // UI events
    // Image handling
    // ... todo junto
});
```

### Después (modular):
```javascript
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Inicializar bases de datos
        await dbManager.initImageDB();
        await dbManager.initStationsDB();

        // 2. Inicializar UI
        uiController.initElements({
            fileInput: 'fileInput',
            registerModal: 'registerModal',
            // ... más elementos
        });

        // 3. Cargar datos iniciales
        const excelData = await loadExcelFromDB();
        if (excelData) {
            equipmentManager.processExcelBuffer(excelData);
        }

        // 4. Configurar event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Error inicializando app:', error);
        UIManager.showFeedback(error.message, 'error', feedbackElement);
    }
});
```

## ✅ Beneficios de la Refactorización

| Aspecto | Antes | Después |
|--------|-------|---------|
| **Tamaño de app.js** | ~2500 líneas | Módulos <300 líneas cada uno |
| **Duplicación de código** | Sí (reglas CSS repetidas) | No |
| **Testabilidad** | Difícil | Fácil (funciones puras) |
| **Mantenibilidad** | Compleja | Modular y clara |
| **Reutilización** | Limitada | Alto acoplamiento con módulos |
| **Codificación** | Inconsistente | UTF-8 standardizado |
| **Documentación** | Mínima | JSDoc en todas las funciones |

## 🚀 Próximos Pasos

### Tareas Pendientes:
- [ ] Crear main.js para inicialización centralizada
- [ ] Refactorizar estaciones-agua.js
- [ ] Crear estaciones.js módulo
- [ ] Agregar paginación a renderizado de tablas
- [ ] Agregar búsqueda y filtrado avanzado
- [ ] Crear lazy loading para imágenes
- [ ] Agregar pruebas unitarias
- [ ] Implementar service worker para offline

### Migración desde app.js:
1. Los funcionalidades de app.js se han migrado a los módulos
2. El archivo app.js puede ser deprecado después de probar los nuevos módulos
3. Se recomienda incluir en orden:
   ```html
   <script src="js/config.js"></script>
   <script src="js/db.js"></script>
   <script src="js/validation.js"></script>
   <script src="js/fileUtils.js"></script>
   <script src="js/equipment.js"></script>
   <script src="js/ui.js"></script>
   <script src="js/main.js"></script>
   ```

## 📝 Ejemplos de Uso

### Procesar un archivo Excel:
```javascript
const input = document.getElementById('fileInput');
input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    const validation = ValidationManager.validateExcelFile(file);
    
    if (!validation.isValid) {
        UIManager.showFeedback(validation.error, 'error', feedbackEl);
        return;
    }
    
    const buffer = await file.arrayBuffer();
    const result = equipmentManager.processExcelBuffer(buffer, file.name);
    
    if (result.success) {
        uiController.renderTable(equipmentManager.dataRaw, equipmentManager.headers);
    }
});
```

### Registrar un equipo:
```javascript
async function handleRegisterEquipment() {
    const result = await equipmentManager.registerEquipment({
        serie: document.getElementById('serieInput').value,
        ubicacion: document.getElementById('ubicacionSelect').value,
        observaciones: document.getElementById('obsInput').value,
        photoId: 'photo_123',
        photoData: currentPhotoData
    });
    
    if (result.success) {
        UIManager.showFeedback(result.message, 'success', feedbackEl);
        uiController.hideRegisterModal();
    } else {
        UIManager.showFeedback(result.message, 'error', feedbackEl);
    }
}
```

### Validar equipo por QR:
```javascript
function validateByQR(qrValue) {
    const result = equipmentManager.validateEquipment(
        qrValue,
        equipmentManager.patronUbicacion
    );
    
    if (result.success) {
        UIManager.showFeedback('✓ Equipo válido', 'success', feedbackEl);
        // Guardar validación en BD
    } else {
        UIManager.showFeedback(result.message, 'error', feedbackEl);
    }
}
```

## 🔗 Referencias

- [Config.js](./js/config.js) - Configuración centralizada
- [DB.js](./js/db.js) - Gestión de bases de datos
- [Validation.js](./js/validation.js) - Validación y utilities
- [FileUtils.js](./js/fileUtils.js) - Manejo de archivos
- [Equipment.js](./js/equipment.js) - Gestión de equipos
- [UI.js](./js/ui.js) - Control de interfaz
- [style.css](./css/style.css) - Estilos centralizados

## 📞 Soporte

Para preguntas o issues sobre la refactorización, consultar la documentación JSDoc en cada módulo.

---

**Versión:** 2.0  
**Última actualización:** Septiembre 2026  
**Estado:** En desarrollo
