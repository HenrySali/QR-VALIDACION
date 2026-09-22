/**
 * estaciones-agua.js
 * Lógica unificada para Gestión de Estaciones de Agua.
 * Utilizado tanto por index.html (sección embebida) como por estaciones-agua.html (standalone).
 *
 * Requiere:
 *   - SheetJS  (window.XLSX)   — para exportar/importar Excel
 *   - Elementos del DOM descritos en cada sección
 */

(function () {
    'use strict';

    // =========================================================
    // CONFIGURACIÓN DE ESTACIONES (persiste en IndexedDB)
    // =========================================================
    // Las estaciones se cargan desde DB al iniciar; el array de abajo
    // se usa solo como semilla la primera vez (si la DB está vacía).
    const ESTACIONES_SEED = [
        { id: 'A',     nombre: 'Estación A', serie: 'EST-01543',            proveedor: 'Abbott' },
        { id: 'B',     nombre: 'Estación B', serie: 'EST-MR120H2732252',    proveedor: 'Abbott' },
        { id: 'C',     nombre: 'Estación C', serie: 'EST-MP00003507',       proveedor: 'Abbott' },
        { id: 'D',     nombre: 'Estación D', serie: 'EST-AGU-MP00005085',   proveedor: 'Roche'  },
        { id: 'PRE01', nombre: 'PRE 01',     serie: 'N/A',                  proveedor: 'N/A'    },
        { id: 'PRE02', nombre: 'PRE 02',     serie: 'N/A',                  proveedor: 'N/A'    }
    ];

    let ESTACIONES = []; // se populará desde DB

    // =========================================================
    // INDEXEDDB
    // =========================================================
    let db = null;
    const DB_NAME    = 'EstacionesAguaDB';
    const DB_VERSION = 4; // ↑ versión para agregar store 'estaciones' y 'certPhotos'

    function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => { db = request.result; resolve(db); };

            request.onupgradeneeded = (e) => {
                const database = e.target.result;

                const ensureStore = (name, options, indices = []) => {
                    if (!database.objectStoreNames.contains(name)) {
                        const store = database.createObjectStore(name, options);
                        indices.forEach(([idxName, keyPath, opts]) => store.createIndex(idxName, keyPath, opts));
                    }
                };

                ensureStore('preventivos',  { keyPath: 'id', autoIncrement: true }, [['estacionId','estacionId',{unique:false}],['fecha','fecha',{unique:false}]]);
                ensureStore('correctivos',  { keyPath: 'id', autoIncrement: true }, [['estacionId','estacionId',{unique:false}],['fecha','fecha',{unique:false}]]);
                ensureStore('suministros',  { keyPath: 'id', autoIncrement: true }, [['estacionId','estacionId',{unique:false}],['fecha','fecha',{unique:false}]]);
                ensureStore('volumenes',    { keyPath: 'id', autoIncrement: true }, [['estacionId','estacionId',{unique:false}],['mes','mes',{unique:false}]]);
                ensureStore('certificados', { keyPath: 'id', autoIncrement: true }, [['estacionId','estacionId',{unique:false}],['fecha','fecha',{unique:false}]]);
                ensureStore('certPhotos',   { keyPath: 'id' });           // ← fotos separadas del registro
                ensureStore('estaciones',   { keyPath: 'id' });           // ← estaciones dinámicas
            };
        });
    }

    // ---- CRUD genérico ----
    function dbAdd(storeName, data) {
        return new Promise((resolve, reject) => {
            const tx    = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req   = store.add(data);
            req.onsuccess = () => resolve(req.result);
            req.onerror   = () => reject(req.error);
        });
    }

    function dbPut(storeName, data) {
        return new Promise((resolve, reject) => {
            const tx    = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req   = store.put(data);
            req.onsuccess = () => resolve(req.result);
            req.onerror   = () => reject(req.error);
        });
    }

    function dbDelete(storeName, id) {
        return new Promise((resolve, reject) => {
            const tx    = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req   = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror   = () => reject(req.error);
        });
    }

    function dbGetAll(storeName) {
        return new Promise((resolve, reject) => {
            const tx    = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req   = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror   = () => reject(req.error);
        });
    }

    function dbGetByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const tx    = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const index = store.index(indexName);
            const req   = index.getAll(value);
            req.onsuccess = () => {
                const records = req.result || [];
                records.sort((a, b) => new Date(b.fecha || b.mes) - new Date(a.fecha || a.mes));
                resolve(records);
            };
            req.onerror = () => reject(req.error);
        });
    }

    function dbGet(storeName, id) {
        return new Promise((resolve, reject) => {
            const tx    = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req   = store.get(id);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror   = () => reject(req.error);
        });
    }

    // =========================================================
    // GESTIÓN DE ESTACIONES DINÁMICAS
    // =========================================================
    async function loadEstaciones() {
        let stored = await dbGetAll('estaciones');
        if (stored.length === 0) {
            // Semilla: primera vez
            for (const e of ESTACIONES_SEED) {
                await dbPut('estaciones', e);
            }
            stored = [...ESTACIONES_SEED];
        }
        ESTACIONES = stored;
    }

    async function saveEstacion(est) {
        await dbPut('estaciones', est);
        await loadEstaciones();
    }

    async function removeEstacion(id) {
        await dbDelete('estaciones', id);
        // Borrar registros huérfanos
        for (const store of ['preventivos','correctivos','suministros','volumenes','certificados']) {
            const records = await dbGetByIndex(store, 'estacionId', id);
            for (const r of records) await dbDelete(store, r.id);
        }
        await loadEstaciones();
    }

    // =========================================================
    // UTILIDADES
    // =========================================================
    function formatDate(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function formatMonthYear(monthStr) {
        const [year, month] = monthStr.split('-');
        return new Date(year, parseInt(month) - 1, 1)
            .toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
    }

    function todayISO() {
        return new Date().toISOString().split('T')[0];
    }

    function currentMonthISO() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function compressPhoto(dataUrl) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                const maxDim = 800;
                let { width, height } = img;
                if (width > maxDim || height > maxDim) {
                    const ratio = Math.min(maxDim / width, maxDim / height);
                    width  = Math.round(width  * ratio);
                    height = Math.round(height * ratio);
                }
                const canvas = document.createElement('canvas');
                canvas.width  = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
            img.onerror = () => resolve(dataUrl);
            img.src = dataUrl;
        });
    }

    // =========================================================
    // DOM HELPERS — resolución diferida para compatibilidad
    // con el contexto standalone (estaciones-agua.html) y
    // el embebido en index.html
    // =========================================================
    const $ = id => document.getElementById(id);

    // =========================================================
    // VARIABLES GLOBALES DE LA SECCIÓN
    // =========================================================
    let currentStationId  = null;
    let certCameraStream  = null;
    let certCapturedPhoto = null;

    // =========================================================
    // INICIALIZAR TABS
    // =========================================================
    function initializeTabs() {
        document.querySelectorAll('.station-tab, .tab').forEach(tab => {
            const newTab = tab.cloneNode(true);
            tab.parentNode.replaceChild(newTab, tab);
        });

        document.querySelectorAll('.station-tab, .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.station-tab, .tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.station-tab-content, .tab-content').forEach(tc => tc.classList.remove('active'));

                tab.classList.add('active');
                const content = $(`${tab.dataset.tab}-content`);
                if (content) content.classList.add('active');
                loadCurrentTabData();
            });
        });
    }

    // =========================================================
    // RENDERIZAR GRID DE ESTACIONES
    // =========================================================
    async function renderStations() {
        const grid = $('stationsGrid');
        if (!grid) return;
        grid.innerHTML = '';

        for (const estacion of ESTACIONES) {
            const [prev, corr, sum, vol, cert] = await Promise.all([
                dbGetByIndex('preventivos',  'estacionId', estacion.id),
                dbGetByIndex('correctivos',  'estacionId', estacion.id),
                dbGetByIndex('suministros',  'estacionId', estacion.id),
                dbGetByIndex('volumenes',    'estacionId', estacion.id),
                dbGetByIndex('certificados', 'estacionId', estacion.id)
            ]);

            const card = document.createElement('div');
            card.className = 'station-card' + (currentStationId === estacion.id ? ' active' : '');
            card.innerHTML = `
                <div class="station-header">
                    <div class="station-name">${escHtml(estacion.nombre)}</div>
                    <div class="station-provider">${escHtml(estacion.proveedor)}</div>
                </div>
                <div class="station-serie">Serie: ${escHtml(estacion.serie)}</div>
                <div class="station-stats">
                    <div class="stat-item"><div class="stat-value">${prev.length}</div><div class="stat-label">Preventivos</div></div>
                    <div class="stat-item"><div class="stat-value">${corr.length}</div><div class="stat-label">Correctivos</div></div>
                    <div class="stat-item"><div class="stat-value">${sum.length}</div><div class="stat-label">Suministros</div></div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;padding:8px;background:rgba(79,172,254,.1);border-radius:8px;text-align:center;">
                    <div><div style="font-size:.7rem;color:#888;">Volumen</div><div style="font-size:1rem;font-weight:600;color:#4facfe;">${vol.length}</div></div>
                    <div><div style="font-size:.7rem;color:#888;">Certificados</div><div style="font-size:1rem;font-weight:600;color:#43e97b;">${cert.length}</div></div>
                </div>
                <div style="display:flex;gap:6px;margin-top:12px;">
                    <button class="btn-edit-station btn btn-secondary btn-small" data-id="${escHtml(estacion.id)}" style="flex:1;font-size:.8rem;">✏️ Editar</button>
                    <button class="btn-delete-station btn btn-danger btn-small"  data-id="${escHtml(estacion.id)}" style="font-size:.8rem;">🗑️</button>
                </div>`;

            card.addEventListener('click', e => {
                if (e.target.closest('.btn-edit-station') || e.target.closest('.btn-delete-station')) return;
                selectStation(estacion.id);
            });
            grid.appendChild(card);
        }

        // Botones de editar/eliminar estación
        grid.querySelectorAll('.btn-edit-station').forEach(btn => {
            btn.addEventListener('click', e => { e.stopPropagation(); openEditStationModal(btn.dataset.id); });
        });
        grid.querySelectorAll('.btn-delete-station').forEach(btn => {
            btn.addEventListener('click', e => { e.stopPropagation(); confirmDeleteStation(btn.dataset.id); });
        });
    }

    function escHtml(str) {
        return String(str ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    // =========================================================
    // SELECCIONAR ESTACIÓN
    // =========================================================
    async function selectStation(estacionId) {
        currentStationId = estacionId;
        const estacion   = ESTACIONES.find(e => e.id === estacionId);

        const titleEl = $('currentStationTitle');
        if (titleEl) titleEl.innerHTML = `💧 ${escHtml(estacion.nombre)} <span style="font-size:.9rem;color:#888;font-weight:400;">(${escHtml(estacion.serie)} - ${escHtml(estacion.proveedor)})</span>`;

        const panel = $('managementPanel');
        if (panel) panel.classList.remove('hidden');

        initializeTabs();
        await renderStations();
        await loadCurrentTabData();

        if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // =========================================================
    // CARGA DEL TAB ACTIVO
    // =========================================================
    async function loadCurrentTabData() {
        if (!currentStationId) return;
        const activeTab = document.querySelector('.station-tab.active, .tab.active');
        if (!activeTab) return;

        const map = {
            preventivos:  loadPreventivos,
            correctivos:  loadCorrectivos,
            suministros:  loadSuministros,
            volumenes:    loadVolumenes,
            certificados: loadCertificados
        };
        const fn = map[activeTab.dataset.tab];
        if (fn) await fn();
    }

    // =========================================================
    // PREVENTIVOS
    // =========================================================
    async function loadPreventivos() {
        const list = $('preventivosList');
        if (!list) return;
        const records = await dbGetByIndex('preventivos', 'estacionId', currentStationId);
        list.innerHTML = records.length === 0
            ? `<div class="empty-state"><div class="empty-state-icon">📅</div><div>No hay preventivos registrados</div></div>`
            : records.map(p => `
                <div class="timeline-item">
                    <div class="timeline-date">${formatDate(p.fecha)}</div>
                    <div class="timeline-content">${escHtml(p.novedades)}</div>
                    <div class="timeline-actions">
                        <button class="btn btn-danger btn-small" onclick="window.__est.deletePreventivo(${p.id})">🗑️ Eliminar</button>
                    </div>
                </div>`).join('');
    }

    function bindPreventivo() {
        const btn = $('addPreventivoBtn');
        if (!btn || btn._estBound) return;
        btn._estBound = true;
        btn.addEventListener('click', () => {
            $('preventivoFecha').value    = todayISO();
            $('preventivoNovedades').value = '';
            $('preventivoModal').classList.remove('hidden');
        });
        $('savePreventivoBtn').addEventListener('click', async () => {
            const fecha    = $('preventivoFecha').value;
            const novedades = $('preventivoNovedades').value.trim();
            if (!fecha || !novedades) { alert('Completá todos los campos'); return; }
            await dbAdd('preventivos', { estacionId: currentStationId, fecha, novedades, createdAt: new Date().toISOString() });
            $('preventivoModal').classList.add('hidden');
            await loadPreventivos(); await renderStations();
        });
        $('cancelPreventivoBtn').addEventListener('click', () => $('preventivoModal').classList.add('hidden'));
    }

    window.__est = window.__est || {};
    window.__est.deletePreventivo = async id => {
        if (!confirm('¿Eliminar este preventivo?')) return;
        await dbDelete('preventivos', id);
        await loadPreventivos(); await renderStations();
    };

    // =========================================================
    // CORRECTIVOS
    // =========================================================
    async function loadCorrectivos() {
        const list = $('correctivosList');
        if (!list) return;
        const records = await dbGetByIndex('correctivos', 'estacionId', currentStationId);
        list.innerHTML = records.length === 0
            ? `<div class="empty-state"><div class="empty-state-icon">🔧</div><div>No hay correctivos registrados</div></div>`
            : records.map(c => `
                <div class="timeline-item">
                    <div class="timeline-date">${formatDate(c.fecha)}</div>
                    <div style="color:#ffc800;font-weight:600;font-size:.85rem;margin-bottom:6px;">${escHtml(c.clase)}</div>
                    <div class="timeline-content">${escHtml(c.novedades)}</div>
                    <div class="timeline-actions">
                        <button class="btn btn-danger btn-small" onclick="window.__est.deleteCorrectivo(${c.id})">🗑️ Eliminar</button>
                    </div>
                </div>`).join('');
    }

    function bindCorrectivo() {
        const btn = $('addCorrectivoBtn');
        if (!btn || btn._estBound) return;
        btn._estBound = true;
        btn.addEventListener('click', () => {
            $('correctivoFecha').value    = todayISO();
            $('correctivoClase').value    = '';
            $('correctivoNovedades').value = '';
            $('correctivoModal').classList.remove('hidden');
        });
        $('saveCorrectivoBtn').addEventListener('click', async () => {
            const fecha    = $('correctivoFecha').value;
            const clase    = $('correctivoClase').value;
            const novedades = $('correctivoNovedades').value.trim();
            if (!fecha || !clase || !novedades) { alert('Completá todos los campos'); return; }
            await dbAdd('correctivos', { estacionId: currentStationId, fecha, clase, novedades, createdAt: new Date().toISOString() });
            $('correctivoModal').classList.add('hidden');
            await loadCorrectivos(); await renderStations();
        });
        $('cancelCorrectivoBtn').addEventListener('click', () => $('correctivoModal').classList.add('hidden'));
    }

    window.__est.deleteCorrectivo = async id => {
        if (!confirm('¿Eliminar este correctivo?')) return;
        await dbDelete('correctivos', id);
        await loadCorrectivos(); await renderStations();
    };

    // =========================================================
    // SUMINISTROS
    // =========================================================
    async function loadSuministros() {
        const list = $('suministrosList');
        if (!list) return;
        const records = await dbGetByIndex('suministros', 'estacionId', currentStationId);
        list.innerHTML = records.length === 0
            ? `<div class="empty-state"><div class="empty-state-icon">📦</div><div>No hay suministros registrados</div></div>`
            : records.map(s => `
                <div class="timeline-item">
                    <div class="timeline-date">${formatDate(s.fecha)}</div>
                    <div style="color:#43e97b;font-weight:600;font-size:.95rem;margin-bottom:6px;">${escHtml(s.accesorio)} (x${s.cantidad})</div>
                    <div class="timeline-content">${escHtml(s.observaciones || 'Sin observaciones')}</div>
                    <div class="timeline-actions">
                        <button class="btn btn-danger btn-small" onclick="window.__est.deleteSuministro(${s.id})">🗑️ Eliminar</button>
                    </div>
                </div>`).join('');
    }

    function bindSuministro() {
        const btn = $('addSuministroBtn');
        if (!btn || btn._estBound) return;
        btn._estBound = true;
        btn.addEventListener('click', () => {
            $('suministroFecha').value        = todayISO();
            $('suministroAccesorio').value    = '';
            $('suministroCantidad').value     = '1';
            $('suministroObservaciones').value = '';
            $('suministroModal').classList.remove('hidden');
        });
        $('saveSuministroBtn').addEventListener('click', async () => {
            const fecha        = $('suministroFecha').value;
            const accesorio    = $('suministroAccesorio').value;
            const cantidad     = parseInt($('suministroCantidad').value);
            const observaciones = $('suministroObservaciones').value.trim();
            if (!fecha || !accesorio || !cantidad) { alert('Completá los campos requeridos'); return; }
            await dbAdd('suministros', { estacionId: currentStationId, fecha, accesorio, cantidad, observaciones, createdAt: new Date().toISOString() });
            $('suministroModal').classList.add('hidden');
            await loadSuministros(); await renderStations();
        });
        $('cancelSuministroBtn').addEventListener('click', () => $('suministroModal').classList.add('hidden'));
    }

    window.__est.deleteSuministro = async id => {
        if (!confirm('¿Eliminar este suministro?')) return;
        await dbDelete('suministros', id);
        await loadSuministros(); await renderStations();
    };

    // =========================================================
    // VOLÚMENES
    // =========================================================
    async function loadVolumenes() {
        const list = $('volumenesList');
        if (!list) return;
        const records = await dbGetByIndex('volumenes', 'estacionId', currentStationId);
        list.innerHTML = records.length === 0
            ? `<div class="empty-state"><div class="empty-state-icon">💧</div><div>No hay volúmenes registrados</div></div>`
            : records.map(v => `
                <div class="timeline-item">
                    <div class="timeline-date">${formatMonthYear(v.mes)}</div>
                    <div style="color:#4facfe;font-weight:600;font-size:1.1rem;margin-bottom:6px;">${parseFloat(v.litros).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})} Litros</div>
                    <div class="timeline-content">${escHtml(v.observaciones || 'Sin observaciones')}</div>
                    <div class="timeline-actions">
                        <button class="btn btn-danger btn-small" onclick="window.__est.deleteVolumen(${v.id})">🗑️ Eliminar</button>
                    </div>
                </div>`).join('');
    }

    function bindVolumen() {
        const btn = $('addVolumenBtn');
        if (!btn || btn._estBound) return;
        btn._estBound = true;
        btn.addEventListener('click', () => {
            $('volumenMes').value           = currentMonthISO();
            $('volumenLitros').value        = '';
            $('volumenObservaciones').value = '';
            $('volumenModal').classList.remove('hidden');
        });
        $('saveVolumenBtn').addEventListener('click', async () => {
            const mes          = $('volumenMes').value;
            const litrosRaw    = $('volumenLitros').value;
            const observaciones = $('volumenObservaciones').value.trim();
            if (!mes || !litrosRaw) { alert('Completá los campos requeridos'); return; }
            const litros = parseFloat(litrosRaw);
            if (isNaN(litros) || litros < 0) { alert('Ingresá un volumen válido'); return; }
            await dbAdd('volumenes', { estacionId: currentStationId, mes, litros, observaciones, createdAt: new Date().toISOString() });
            $('volumenModal').classList.add('hidden');
            await loadVolumenes(); await renderStations();
        });
        $('cancelVolumenBtn').addEventListener('click', () => $('volumenModal').classList.add('hidden'));
    }

    window.__est.deleteVolumen = async id => {
        if (!confirm('¿Eliminar este registro de volumen?')) return;
        await dbDelete('volumenes', id);
        await loadVolumenes(); await renderStations();
    };

    // =========================================================
    // CERTIFICADOS — foto guardada en store separado 'certPhotos'
    // =========================================================
    async function loadCertificados() {
        const list = $('certificadosList');
        if (!list) return;
        const records = await dbGetByIndex('certificados', 'estacionId', currentStationId);

        if (records.length === 0) {
            list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📜</div><div>No hay certificados registrados</div></div>`;
            return;
        }

        list.innerHTML = '';
        for (const cert of records) {
            // Cargar foto desde certPhotos
            const photoRecord = await dbGet('certPhotos', cert.photoId);
            const thumbSrc    = photoRecord ? photoRecord.dataUrl : '';

            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = `
                <div class="timeline-date">${formatDate(cert.fecha)}</div>
                <div style="margin-bottom:10px;">
                    ${thumbSrc
                        ? `<img src="${thumbSrc}" style="width:100px;height:100px;object-fit:cover;border-radius:8px;cursor:pointer;border:1px solid rgba(255,255,255,.1);" data-photoid="${cert.photoId}">`
                        : `<div style="width:100px;height:100px;border-radius:8px;background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;color:#666;font-size:.8rem;">Sin foto</div>`
                    }
                </div>
                <div class="timeline-actions">
                    ${thumbSrc ? `<button class="btn btn-secondary btn-small" data-photoid="${cert.photoId}">📄 Ver</button>` : ''}
                    <button class="btn btn-danger btn-small" onclick="window.__est.deleteCertificado(${cert.id}, '${cert.photoId}')">🗑️ Eliminar</button>
                </div>`;

            // Listener ver/zoom
            item.querySelectorAll('[data-photoid]').forEach(el => {
                el.addEventListener('click', async () => {
                    const pr = await dbGet('certPhotos', el.dataset.photoid);
                    if (pr) showCertImageViewer(pr.dataUrl);
                });
            });

            list.appendChild(item);
        }
    }

    function bindCertificado() {
        const btn = $('addCertBtn');
        if (!btn || btn._estBound) return;
        btn._estBound = true;
        btn.addEventListener('click', () => {
            $('certFecha').value = todayISO();
            resetCertModal();
            $('certificadoModal').classList.remove('hidden');
        });
        $('saveCertBtn').addEventListener('click', saveCertificado);
        $('cancelCertBtn').addEventListener('click', () => { stopCertCamera(); $('certificadoModal').classList.add('hidden'); });
        $('startCertCameraBtn').addEventListener('click', startCertCamera);
        $('captureCertBtn').addEventListener('click',    captureCertPhoto);
        $('retakeCertBtn').addEventListener('click',     () => { resetCertModal(); startCertCamera(); });
    }

    async function saveCertificado() {
        const fecha = $('certFecha').value;
        if (!fecha || !certCapturedPhoto) { alert('Seleccioná una fecha y tomá una foto'); return; }

        const photoId      = generateId();
        const compressed   = await compressPhoto(certCapturedPhoto);
        await dbPut('certPhotos', { id: photoId, dataUrl: compressed });
        await dbAdd('certificados', { estacionId: currentStationId, fecha, photoId, createdAt: new Date().toISOString() });

        $('certificadoModal').classList.add('hidden');
        resetCertModal();
        await loadCertificados();
        await renderStations();
    }

    window.__est.deleteCertificado = async (id, photoId) => {
        if (!confirm('¿Eliminar este certificado?')) return;
        await dbDelete('certificados', id);
        if (photoId) await dbDelete('certPhotos', photoId);
        await loadCertificados();
        await renderStations();
    };

    // ---- Cámara certificados ----
    function resetCertModal() {
        stopCertCamera();
        certCapturedPhoto = null;
        const img = $('certCapturedImg');
        if (img) { img.src = ''; img.classList.add('hidden'); }
        const vid = $('certCameraContainer');
        if (vid) vid.classList.add('hidden');
        $('startCertCameraBtn')?.classList.remove('hidden');
        $('captureCertBtn')?.classList.add('hidden');
        $('retakeCertBtn')?.classList.add('hidden');
    }

    async function startCertCamera() {
        try {
            certCameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            const video = $('certVideo');
            video.srcObject = certCameraStream;
            $('certCameraContainer').classList.remove('hidden');
            $('startCertCameraBtn').classList.add('hidden');
            $('captureCertBtn').classList.remove('hidden');
        } catch (err) {
            console.error('Error cámara:', err);
            alert('No se pudo acceder a la cámara. Revisá los permisos (se requiere HTTPS o localhost).');
        }
    }

    function stopCertCamera() {
        if (certCameraStream) {
            certCameraStream.getTracks().forEach(t => t.stop());
            certCameraStream = null;
        }
    }

    function captureCertPhoto() {
        const video  = $('certVideo');
        const canvas = document.createElement('canvas');
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        certCapturedPhoto = canvas.toDataURL('image/jpeg', 0.6);

        const img = $('certCapturedImg');
        img.src = certCapturedPhoto;
        img.classList.remove('hidden');
        $('certCameraContainer').classList.add('hidden');
        $('captureCertBtn').classList.add('hidden');
        $('retakeCertBtn').classList.remove('hidden');
        stopCertCamera();
    }

    // ---- Visor imagen certificado ----
    function showCertImageViewer(src) {
        const modal = $('certImageViewerModal');
        const img   = $('fullSizeCertImage');
        if (modal && img) { img.src = src; modal.classList.remove('hidden'); }
    }

    function bindCertImageViewer() {
        const modal = $('certImageViewerModal');
        const btn   = $('closeCertImageViewer');
        if (!modal) return;
        btn?.addEventListener('click', () => { modal.classList.add('hidden'); $('fullSizeCertImage').src = ''; });
        modal.addEventListener('click', e => {
            if (e.target === modal) { modal.classList.add('hidden'); $('fullSizeCertImage').src = ''; }
        });
    }

    // =========================================================
    // GESTIÓN DINÁMICA DE ESTACIONES — modal
    // =========================================================
    function ensureStationModal() {
        if ($('stationEditModal')) return;

        const html = `
        <div id="stationEditModal" class="modal-overlay hidden">
            <div class="modal">
                <h3 id="stationModalTitle">➕ Nueva Estación</h3>
                <div class="input-group">
                    <label>Nombre</label>
                    <input type="text" id="stationModalNombre" placeholder="Ej: Estación E">
                </div>
                <div class="input-group">
                    <label>Serie</label>
                    <input type="text" id="stationModalSerie" placeholder="Ej: EST-12345">
                </div>
                <div class="input-group">
                    <label>Proveedor</label>
                    <input type="text" id="stationModalProveedor" placeholder="Ej: Abbott">
                </div>
                <div style="display:flex;gap:10px;margin-top:20px;">
                    <button id="saveStationModalBtn"   class="btn btn-success"   style="flex:1;">Guardar</button>
                    <button id="cancelStationModalBtn" class="btn btn-secondary" style="flex:1;">Cancelar</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);

        $('cancelStationModalBtn').addEventListener('click', () => $('stationEditModal').classList.add('hidden'));
        $('saveStationModalBtn').addEventListener('click', saveStationFromModal);
    }

    let editingStationId = null;

    function openAddStationModal() {
        ensureStationModal();
        editingStationId = null;
        $('stationModalTitle').textContent    = '➕ Nueva Estación';
        $('stationModalNombre').value         = '';
        $('stationModalSerie').value          = '';
        $('stationModalProveedor').value      = '';
        $('stationEditModal').classList.remove('hidden');
    }

    function openEditStationModal(id) {
        ensureStationModal();
        const est = ESTACIONES.find(e => e.id === id);
        if (!est) return;
        editingStationId = id;
        $('stationModalTitle').textContent    = '✏️ Editar Estación';
        $('stationModalNombre').value         = est.nombre;
        $('stationModalSerie').value          = est.serie;
        $('stationModalProveedor').value      = est.proveedor;
        $('stationEditModal').classList.remove('hidden');
    }

    async function saveStationFromModal() {
        const nombre    = $('stationModalNombre').value.trim();
        const serie     = $('stationModalSerie').value.trim();
        const proveedor = $('stationModalProveedor').value.trim();

        if (!nombre) { alert('El nombre es obligatorio'); return; }

        const id = editingStationId || generateId();
        await saveEstacion({ id, nombre, serie: serie || 'N/A', proveedor: proveedor || 'N/A' });

        $('stationEditModal').classList.add('hidden');
        await renderStations();
    }

    async function confirmDeleteStation(id) {
        const est = ESTACIONES.find(e => e.id === id);
        if (!confirm(`¿Eliminar "${est?.nombre}"? También se borrarán todos sus registros.`)) return;
        if (currentStationId === id) {
            currentStationId = null;
            $('managementPanel')?.classList.add('hidden');
        }
        await removeEstacion(id);
        await renderStations();
    }

    function bindAddStationBtn() {
        const btn = $('addStationBtn');
        if (!btn || btn._estBound) return;
        btn._estBound = true;
        btn.addEventListener('click', openAddStationModal);
    }

    // =========================================================
    // EXPORTAR A EXCEL
    // =========================================================
    function bindExport() {
        const btn = $('exportEstacionesBtn');
        if (!btn || btn._estBound) return;
        btn._estBound = true;
        btn.addEventListener('click', exportToExcel);
    }

    async function exportToExcel() {
        if (!window.XLSX) { alert('SheetJS no disponible'); return; }
        const btn = $('exportEstacionesBtn');
        if (btn) { btn.disabled = true; btn.textContent = '⏳ Exportando...'; }

        try {
            const [preventivos, correctivos, suministros, volumenes] = await Promise.all([
                dbGetAll('preventivos'), dbGetAll('correctivos'),
                dbGetAll('suministros'), dbGetAll('volumenes')
            ]);

            const estNombre = id => ESTACIONES.find(e => e.id === id)?.nombre || id;
            const estSerie  = id => ESTACIONES.find(e => e.id === id)?.serie  || '';
            const estProv   = id => ESTACIONES.find(e => e.id === id)?.proveedor || '';

            const wb = window.XLSX.utils.book_new();

            const addSheet = (rows, name) => {
                if (rows.length > 0) {
                    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(rows), name);
                }
            };

            addSheet(preventivos.map(p => ({ 'Estación': estNombre(p.estacionId), 'Serie': estSerie(p.estacionId), 'Proveedor': estProv(p.estacionId), 'Fecha': p.fecha, 'Novedades': p.novedades, 'Registrado': new Date(p.createdAt).toLocaleString('es-ES') })), 'Preventivos');
            addSheet(correctivos.map(c => ({ 'Estación': estNombre(c.estacionId), 'Serie': estSerie(c.estacionId), 'Proveedor': estProv(c.estacionId), 'Fecha': c.fecha, 'Clase': c.clase, 'Novedades': c.novedades, 'Registrado': new Date(c.createdAt).toLocaleString('es-ES') })), 'Correctivos');
            addSheet(suministros.map(s => ({ 'Estación': estNombre(s.estacionId), 'Serie': estSerie(s.estacionId), 'Proveedor': estProv(s.estacionId), 'Fecha': s.fecha, 'Accesorio/Insumo': s.accesorio, 'Cantidad': s.cantidad, 'Observaciones': s.observaciones || '', 'Registrado': new Date(s.createdAt).toLocaleString('es-ES') })), 'Suministros');
            addSheet(volumenes.map(v => ({ 'Estación': estNombre(v.estacionId), 'Serie': estSerie(v.estacionId), 'Proveedor': estProv(v.estacionId), 'Mes': v.mes, 'Volumen (Litros)': v.litros, 'Observaciones': v.observaciones || '', 'Registrado': new Date(v.createdAt).toLocaleString('es-ES') })), 'Volumenes');

            if (wb.SheetNames.length === 0) { showFeedback('No hay datos para exportar', 'warning'); return; }

            window.XLSX.writeFile(wb, `Estaciones_Agua_${new Date().toISOString().slice(0,10)}.xlsx`);
            showFeedback('✅ Excel exportado correctamente', 'success');
        } catch (err) {
            console.error(err);
            showFeedback('Error al exportar', 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = '💾 Exportar a Excel'; }
        }
    }

    // =========================================================
    // IMPORTAR DESDE EXCEL
    // =========================================================
    function bindImport() {
        const input = $('importEstacionesInput');
        if (!input || input._estBound) return;
        input._estBound = true;
        input.addEventListener('change', importFromExcel);
    }

    async function importFromExcel(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (!window.XLSX) { alert('SheetJS no disponible'); return; }

        showFeedback('⏳ Importando datos...', 'warning');
        try {
            const data     = await file.arrayBuffer();
            const workbook = window.XLSX.read(data, { type: 'array' });
            let count      = 0;

            const findEst = row => ESTACIONES.find(e => e.nombre === row['Estación'] || e.serie === row['Serie']);

            const sheetMap = {
                'Preventivos': async row => {
                    const est = findEst(row);
                    if (est && row['Fecha'] && row['Novedades']) {
                        await dbAdd('preventivos', { estacionId: est.id, fecha: row['Fecha'], novedades: row['Novedades'], createdAt: new Date().toISOString() });
                        count++;
                    }
                },
                'Correctivos': async row => {
                    const est = findEst(row);
                    if (est && row['Fecha'] && row['Clase'] && row['Novedades']) {
                        await dbAdd('correctivos', { estacionId: est.id, fecha: row['Fecha'], clase: row['Clase'], novedades: row['Novedades'], createdAt: new Date().toISOString() });
                        count++;
                    }
                },
                'Suministros': async row => {
                    const est = findEst(row);
                    if (est && row['Fecha'] && row['Accesorio/Insumo'] && row['Cantidad']) {
                        await dbAdd('suministros', { estacionId: est.id, fecha: row['Fecha'], accesorio: row['Accesorio/Insumo'], cantidad: parseInt(row['Cantidad']) || 1, observaciones: row['Observaciones'] || '', createdAt: new Date().toISOString() });
                        count++;
                    }
                },
                'Volumenes': async row => {
                    const est = findEst(row);
                    if (est && row['Mes'] && row['Volumen (Litros)'] !== undefined) {
                        await dbAdd('volumenes', { estacionId: est.id, mes: row['Mes'], litros: parseFloat(row['Volumen (Litros)']) || 0, observaciones: row['Observaciones'] || '', createdAt: new Date().toISOString() });
                        count++;
                    }
                }
            };

            for (const [sheetName, handler] of Object.entries(sheetMap)) {
                if (workbook.SheetNames.includes(sheetName)) {
                    const rows = window.XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                    for (const row of rows) await handler(row);
                }
            }

            showFeedback(`✅ ${count} registros importados`, 'success');
            await renderStations();
            if (currentStationId) await loadCurrentTabData();
        } catch (err) {
            console.error(err);
            showFeedback('Error al importar el archivo', 'error');
        }
        e.target.value = '';
    }

    // =========================================================
    // FEEDBACK
    // =========================================================
    function showFeedback(msg, type = 'success') {
        const el = $('estacionesFeedback');
        if (!el) return;
        el.textContent  = msg;
        el.className    = `feedback ${type}`;
        el.classList.remove('hidden');
        clearTimeout(el._timer);
        el._timer = setTimeout(() => el.classList.add('hidden'), 4000);
    }

    // =========================================================
    // AVISO HTTPS / FILE PROTOCOL (Punto 5)
    // =========================================================
    function checkHttpsWarning() {
        if (location.protocol === 'file:') {
            const banner = document.createElement('div');
            banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#7c3c00;color:#ffd580;padding:10px 16px;font-size:.85rem;z-index:9999;text-align:center;';
            banner.innerHTML = '⚠️ Estás abriendo el archivo con <strong>file://</strong>. Las funciones de cámara y QR requieren <strong>HTTPS</strong> o <strong>localhost</strong> para funcionar. Publicá el archivo en un servidor o usá Live Server.';
            document.body.appendChild(banner);
        }
    }

    // =========================================================
    // OPEN / CLOSE SECTION (index.html embebido)
    // =========================================================
    function bindOpenClose() {
        $('openEstacionesBtn')?.addEventListener('click', () => {
            $('estacionesSection')?.classList.remove('hidden');
            $('estacionesSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        $('closeEstacionesBtn')?.addEventListener('click', () => {
            $('estacionesSection')?.classList.add('hidden');
            document.querySelector('.actions-grid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    }

    // =========================================================
    // INICIALIZACIÓN
    // =========================================================
    async function init() {
        checkHttpsWarning();

        await initDB();
        await loadEstaciones();

        // Bind de botones (tolerante a ausencia de elemento)
        bindOpenClose();
        bindExport();
        bindImport();
        bindPreventivo();
        bindCorrectivo();
        bindSuministro();
        bindVolumen();
        bindCertificado();
        bindCertImageViewer();
        bindAddStationBtn();

        await renderStations();
        console.log('EstacionesAgua inicializado. Estaciones:', ESTACIONES.length);
    }

    // Arrancar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
