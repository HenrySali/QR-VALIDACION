document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando...');
    
    try {
        // Descargar Excel
        const url = 'https://henrysali.github.io/QR-VALIDACION/Inventario2.xlsx';
        console.log('📥 Descargando:', url);
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('No se pudo descargar');
        
        const buffer = await response.arrayBuffer();
        console.log('✓ Descargado:', buffer.byteLength, 'bytes');
        
        // Procesar Excel
        const data = new Uint8Array(buffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet);
        
        console.log('✓ Datos leídos:', rows.length, 'filas');
        
        // Mostrar en tabla
        const table = document.getElementById('resultsTable');
        if (!table) throw new Error('No hay tabla en el HTML');
        
        const headers = Object.keys(rows[0]);
        
        // Limpiar tabla
        table.innerHTML = '';
        
        // Encabezados
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        headers.forEach(h => {
            const th = document.createElement('th');
            th.textContent = h;
            headerRow.appendChild(th);
        });
        
        // Filas
        const tbody = table.createTBody();
        rows.forEach(row => {
            const tr = tbody.insertRow();
            headers.forEach(h => {
                const td = tr.insertCell();
                td.textContent = row[h] || '';
            });
        });
        
        console.log('✓ Tabla renderizada');
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error: ' + error.message);
    }
});
