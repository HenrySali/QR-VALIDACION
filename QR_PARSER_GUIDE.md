# Guía de QRParser - Análisis de Códigos QR

## 📝 Descripción General

`qrParser.js` proporciona un sistema completo para **parsear y analizar códigos QR** que contienen:

- URLs de Google Drive (con carpetas de equipos)
- Nombres de equipos en formato `INICIALES-SERIE` (ej: `EQP-001234`)
- Números de serie directos

---

## 🎯 Formatos Soportados

### Formato 1: URL de Google Drive
```
https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsT
https://drive.google.com/file/d/1aBcDeFgHiJkLmNoPqRsT/view
```

**Resultado:**
- ID de carpeta extraído: `1aBcDeFgHiJkLmNoPqRsT`
- ⚠️ Nombre de carpeta requiere acceso a Drive API

### Formato 2: Nombre de Equipo (INICIALES-SERIE)
```
EQP-001234
AUTO-ABC123
USO-12345
```

**Resultado:**
- Equipo: `EQP-001234`
- Iniciales: `EQP`
- Serie: `001234`

### Formato 3: Solo Serie
```
001234
ABC123
```

**Resultado:**
- Serie: `001234`
- ⚠️ Sin iniciales (incompleto)

---

## 💻 Ejemplos de Uso

### Ejemplo 1: Parsear una URL de Drive

```javascript
const qrValue = 'https://drive.google.com/drive/folders/1aBcDefGhIjKlMnOpQrSt';

const result = QRParser.parse(qrValue);
console.log(result);

// Salida:
// {
//   success: true,
//   driveUrl: "https://drive.google.com/drive/folders/1aBcDefGhIjKlMnOpQrSt",
//   folderId: "1aBcDefGhIjKlMnOpQrSt",
//   message: "Se extrajo ID de Drive...",
//   requiresManualInput: true
// }
```

### Ejemplo 2: Parsear Nombre de Equipo

```javascript
const qrValue = 'EQP-001234';

const result = QRParser.parse(qrValue);
console.log(result);

// Salida:
// {
//   success: true,
//   equipoName: "EQP-001234",
//   iniciales: "EQP",
//   serie: "001234"
// }
```

### Ejemplo 3: Extraer Solo el Equipo

```javascript
const qrValue = 'https://drive.google.com/...'; // O cualquier formato

// Obtener solo el nombre del equipo
const equipoName = QRParser.getEquipoName(qrValue);
console.log(equipoName); // "EQP-001234" o null

// Obtener solo la serie
const serie = QRParser.getSerie(qrValue);
console.log(serie); // "001234" o null

// Obtener solo iniciales
const iniciales = QRParser.getIniciales(qrValue);
console.log(iniciales); // "EQP" o null
```

### Ejemplo 4: Extraer del Nombre de Carpeta

Si tienes acceso a la carpeta de Drive y quieres extraer el nombre:

```javascript
const folderName = "EQP-001234_Documentos_2024";

const result = QRParser.extractFromFolderName(folderName);
console.log(result);

// Salida:
// {
//   success: true,
//   equipoName: "EQP-001234",
//   iniciales: "EQP",
//   serie: "001234",
//   originalName: "EQP-001234_Documentos_2024"
// }
```

### Ejemplo 5: Validar si Dos QR Son Equivalentes

```javascript
const qr1 = 'EQP-001234';
const qr2 = 'https://drive.google.com/...'; // Misma carpeta

const areEqual = QRParser.areEquivalent(qr1, qr2);
console.log(areEqual); // true o false
```

### Ejemplo 6: Formatear Resultado para Mostrar

```javascript
const result = QRParser.parse('EQP-001234');

const mensaje = QRParser.formatResult(result);
console.log(mensaje);

// Salida:
// 📦 Equipo: EQP-001234
// 🏷️ Iniciales: EQP
// 🔢 Serie: 001234
```

---

## 🔍 Clase QRParser - API Completa

### `QRParser.parse(qrValue)`
Parsea cualquier formato de QR.

```javascript
const result = QRParser.parse(qrValue);

// Retorna:
{
  success: boolean,           // Éxito del parseo
  equipoName?: string,        // INICIALES-SERIE (ej: "EQP-001234")
  serie?: string,             // Solo serie (ej: "001234")
  iniciales?: string,         // Solo iniciales (ej: "EQP")
  driveUrl?: string,          // URL de Drive original
  folderId?: string,          // ID de carpeta extraído
  error?: string,             // Mensaje de error si fracasa
  requiresManualInput?: boolean // Si se necesita intervención manual
}
```

### `QRParser.extractFromFolderName(folderName)`
Extrae equipo del nombre de una carpeta.

```javascript
const result = QRParser.extractFromFolderName("EQP-001234_Documentos");
```

### `QRParser.areEquivalent(qr1, qr2)`
Compara si dos QR son del mismo equipo.

```javascript
const isSame = QRParser.areEquivalent(qr1, qr2);
```

### `QRParser.formatResult(parseResult)`
Formatea resultado para mostrar al usuario.

```javascript
const mensaje = QRParser.formatResult(result);
// Retorna string con emojis y información legible
```

### `QRParser.getEquipoName(qrValue)`
Extrae solo el nombre del equipo.

```javascript
const equipo = QRParser.getEquipoName(qrValue);
// Retorna: "EQP-001234" o null
```

### `QRParser.getSerie(qrValue)`
Extrae solo la serie.

```javascript
const serie = QRParser.getSerie(qrValue);
// Retorna: "001234" o null
```

### `QRParser.getIniciales(qrValue)`
Extrae solo las iniciales.

```javascript
const iniciales = QRParser.getIniciales(qrValue);
// Retorna: "EQP" o null
```

---

## 📱 Clase QRScanner - Escaneo en Tiempo Real

### Iniciar Escaneo

```javascript
const qrScanner = new QRScanner();

await qrScanner.start('qr-scanner-container', (qrValue) => {
    // Se ejecuta cuando se detecta un QR
    const procesado = qrScanner.processScannedQR(qrValue);
    
    console.log('Equipo:', procesado.equipoName);
    console.log('Serie:', procesado.serie);
    console.log('Mensaje:', procesado.displayMessage);
    
    // Hacer algo con el resultado
    handleQRScanned(procesado);
});
```

### Procesar QR Escaneado

```javascript
const qrValue = '...'; // Valor del QR escaneado

const resultado = qrScanner.processScannedQR(qrValue);

// Estructura del resultado:
{
  parseResult: { ... },        // Resultado completo de parseo
  equipoName: "EQP-001234",   // Nombre del equipo
  serie: "001234",             // Solo serie
  iniciales: "EQP",            // Solo iniciales
  displayMessage: "..."        // Mensaje formateado
}
```

### Detener Escaneo

```javascript
await qrScanner.stop();
```

---

## 🔗 Integración con Equipment Manager

### Escenario: Validar Equipo por QR

```javascript
// 1. Escanear QR
await qrScanner.start('qr-container', async (qrValue) => {
    // 2. Procesar QR
    const qrData = qrScanner.processScannedQR(qrValue);
    
    if (!qrData.equipoName) {
        UIManager.showFeedback('❌ No se pudo extraer el nombre del equipo', 'error', feedbackEl);
        return;
    }
    
    // 3. Validar con Equipment Manager
    const result = equipmentManager.validateEquipment(
        qrData.equipoName,
        ubicacionPatron
    );
    
    if (result.success) {
        UIManager.showFeedback(`✓ Equipo válido: ${qrData.equipoName}`, 'success', feedbackEl);
        // Guardar validación
        await saveValidation(result.data);
    } else {
        UIManager.showFeedback(`❌ ${result.message}`, 'error', feedbackEl);
    }
    
    // 4. Detener escaneo
    await qrScanner.stop();
});
```

---

## 📊 Flujo de Validación de Equipos

```
┌─────────────────────────┐
│  Escanear código QR     │
└────────────┬────────────┘
             │
             ↓
┌─────────────────────────────────┐
│  QRParser.parse(qrValue)        │
│  Determina formato del QR       │
└────────────┬────────────────────┘
             │
       ┌─────┴──────────────────────┐
       │                            │
       ↓                            ↓
  URL de Drive?            Nombre de Equipo?
       │                            │
       ↓                            ↓
  Extraer ID            EQP-001234 ✓
  (Manual después)
       │
       └──────────────┬─────────────┘
                      ↓
         ┌────────────────────────┐
         │  getEquipoName()       │
         │  getSerie()            │
         │  getIniciales()        │
         └────────────┬───────────┘
                      ↓
        ┌─────────────────────────────┐
        │ equipmentManager.            │
        │ validateEquipment()         │
        │ (Busca en inventario)       │
        └────────────┬────────────────┘
                     ↓
              ¿Encontrado?
              Sí    │    No
              ↓     ↓
            ✓      ❌
         (Guardar) (Error)
```

---

## 🛠️ Casos de Uso Prácticos

### Caso 1: Validar Equipo Nuevo

```javascript
// Usuario escanea QR con URL de Drive
const qrUrl = 'https://drive.google.com/drive/folders/...';

const result = QRParser.parse(qrUrl);

if (result.requiresManualInput) {
    // Mostrar cuadro para que ingrese nombre de carpeta
    const folderName = await askUserForFolderName();
    const equipoData = QRParser.extractFromFolderName(folderName);
    
    // Registrar equipo
    await equipmentManager.registerEquipment({
        serie: equipoData.serie,
        ubicacion: userLocation,
        driveUrl: qrUrl,
        folderId: result.folderId
    });
}
```

### Caso 2: Verificar Equivalencia

```javascript
// Verificar si dos QR son del mismo equipo
const qr1 = 'EQP-001234';
const qr2 = 'https://drive.google.com/...'; // Carpeta EQP-001234

if (QRParser.areEquivalent(qr1, qr2)) {
    console.log('Son el mismo equipo');
} else {
    console.log('Son equipos diferentes');
}
```

### Caso 3: Búsqueda por Equipo

```javascript
// Usuario ingresa nombre de equipo
const equipoBuscado = 'EQP-001234';

// Buscar en inventario
const coincidencias = equipmentManager.searchEquipment({
    serie: QRParser.getSerie(equipoBuscado)
});

console.log(coincidencias);
```

---

## ⚠️ Limitaciones y Notas

### URL de Google Drive
- **Limitación:** El nombre de la carpeta NO está disponible en la URL
- **Solución:** Se extrae el ID de la carpeta, luego se pide al usuario el nombre manual
- **Alternativa:** Usar Google Drive API (requiere autenticación)

### Formato de Nombre
- **Requerido:** Iniciales de 2-5 caracteres + guión + 3+ caracteres de serie
- **Válido:** `EQP-001234`, `AUTO-ABC123`, `USO-12345`
- **Inválido:** `E-001234`, `EQUIPOS-1`, `EQP001234` (sin guión)

### Evitar Duplicados
- El QRScanner evita procesar el mismo código dos veces en menos de 1 segundo
- Configurable vía `minScanInterval`

---

## 🧪 Pruebas

### Prueba 1: Parsear Diferentes Formatos

```javascript
const testCases = [
    'EQP-001234',
    'https://drive.google.com/drive/folders/1abc123',
    '001234',
    'AUTO-ABC123'
];

testCases.forEach(qr => {
    const result = QRParser.parse(qr);
    console.log(`${qr} →`, result);
});
```

### Prueba 2: Validar Equivalencia

```javascript
const tests = [
    ['EQP-001234', 'EQP-001234'],           // Mismo formato
    ['EQP-001234', 'https://drive.../EQP-001234'],  // Diferentes
    ['001234', '001234']                    // Mismo número
];

tests.forEach(([qr1, qr2]) => {
    console.log(`¿"${qr1}" === "${qr2}"?`, QRParser.areEquivalent(qr1, qr2));
});
```

---

## 📞 API Reference Rápida

| Función | Entrada | Salida | Uso |
|---------|---------|--------|-----|
| `parse()` | string (QR) | Object | Parsear cualquier formato |
| `getEquipoName()` | string (QR) | string \| null | Extraer nombre |
| `getSerie()` | string (QR) | string \| null | Extraer serie |
| `getIniciales()` | string (QR) | string \| null | Extraer iniciales |
| `extractFromFolderName()` | string (carpeta) | Object | Extraer de carpeta Drive |
| `areEquivalent()` | string, string | boolean | Comparar dos QR |
| `formatResult()` | Object (resultado) | string | Formato legible |

---

**Documentación actualizada para QR Parser v1.0**  
**Última actualización:** Septiembre 2026
