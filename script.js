document.addEventListener('DOMContentLoaded', () => {
    // Works on localhost AND any deployed URL automatically
    const API = window.location.origin;

    // ── Sections ──
    const secUpload    = document.getElementById('drop-zone');
    const secPreview   = document.getElementById('preview-section');
    const secMapping   = document.getElementById('mapping-section');
    const secToggles   = document.getElementById('toggles-section');
    const secStatus    = document.getElementById('status-section');
    const secResult    = document.getElementById('result-section');

    const fileInput        = document.getElementById('file-input');
    const fileNameDisplay  = document.getElementById('file-name-display');
    const rowCountDisplay  = document.getElementById('row-count-display');
    const previewHeader    = document.getElementById('preview-header');
    const previewBody      = document.getElementById('preview-body');
    const progressBar      = document.getElementById('progress-bar');
    const progressPct      = document.getElementById('progress-pct');
    const statusTitle      = document.getElementById('status-title');
    const statusMessage    = document.getElementById('status-message');
    const mappingGrid      = document.getElementById('mapping-grid');

    let currentFile    = null;
    let detectedCols   = [];
    let currentJobId   = null;
    let pieChart       = null;
    let barChart       = null;

    // ── FIELD DEFINITIONS for mapping ──
    const FIELDS = [
        { key: 'name',        label: '👤 Name Column',        hints: ['name','candidate','full name'] },
        { key: 'mobile',      label: '📱 Mobile Column',      hints: ['mobile','phone','contact'] },
        { key: 'email',       label: '📧 Email Column',       hints: ['email','mail'] },
        { key: 'resume',      label: '📄 Resume Column',      hints: ['resume','attached','cv'] },
        { key: 'gender',      label: '⚧ Gender Column',      hints: ['gender'] },
        { key: 'created_by',  label: '🧑‍💼 Created By Column',  hints: ['createdby','created by','created_by'] },
        { key: 'skills',      label: '🛠️ Skills Column',       hints: ['key_skills','key skills','skills'] },
        { key: 'designation', label: '💼 Designation Column', hints: ['designation'] },
        { key: 'experience',  label: '📅 Experience Column',  hints: ['total_experi','total experi','experience'] },
        { key: 'location',    label: '📍 Location Column',    hints: ['current_loca','current loca','location','city'] },
    ];

    // ── STEP MAP ──
    const STEP_IDS = {
        parsing: 'step-parsing', counting: 'step-counting',
        processing: 'step-processing', building: 'step-building',
        excel: 'step-excel', done: 'step-done'
    };
    const STEP_ORDER = ['parsing','counting','processing','building','excel','done'];

    // ── helpers ──
    function show(el)  { el.classList.remove('hidden'); }
    function hide(el)  { el.classList.add('hidden'); }
    function hideAll() { [secUpload,secPreview,secMapping,secToggles,secStatus,secResult].forEach(hide); }

    function autoDetect(cols, hints) {
        return cols.find(c => hints.some(h => c.toLowerCase().includes(h))) || '';
    }

    // ── DRAG & DROP ──
    secUpload.addEventListener('click', () => fileInput.click());
    secUpload.addEventListener('dragover', e => { e.preventDefault(); secUpload.classList.add('dragover'); });
    secUpload.addEventListener('dragleave', () => secUpload.classList.remove('dragover'));
    secUpload.addEventListener('drop', e => {
        e.preventDefault(); secUpload.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', e => { if (e.target.files.length) handleFile(e.target.files[0]); });

    // ── UPLOAD ──
    async function handleFile(file) {
        currentFile = file;
        const fd = new FormData(); fd.append('file', file);
        try {
            const res  = await fetch(`${API}/upload`, { method: 'POST', body: fd });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            showPreview(data);
        } catch(err) { alert(`Upload error: ${err.message}`); resetApp(); }
    }

    function showPreview(data) {
        fileNameDisplay.textContent  = data.filename;
        rowCountDisplay.textContent  = `${data.rowCount} rows detected`;
        detectedCols = data.columns;

        previewHeader.innerHTML = '';
        previewBody.innerHTML   = '';
        data.columns.forEach(h => { const th = document.createElement('th'); th.textContent = h; previewHeader.appendChild(th); });
        data.preview.forEach(row => {
            const tr = document.createElement('tr');
            data.columns.forEach(h => { const td = document.createElement('td'); td.textContent = row[h] ?? ''; tr.appendChild(td); });
            previewBody.appendChild(tr);
        });
        hideAll(); show(secPreview);
    }

    // ── PREVIEW BUTTONS ──
    document.getElementById('reset-btn').addEventListener('click', resetApp);
    document.getElementById('next-mapping-btn').addEventListener('click', showMappingScreen);

    // ── COLUMN MAPPING SCREEN ──
    function showMappingScreen() {
        mappingGrid.innerHTML = '';
        FIELDS.forEach(f => {
            const detected = autoDetect(detectedCols, f.hints);
            const row = document.createElement('div');
            row.className = 'mapping-row';
            row.innerHTML = `
                <label class="mapping-label">${f.label}</label>
                <select class="mapping-select" data-key="${f.key}">
                    <option value="">(Not in this file)</option>
                    ${detectedCols.map(c => `<option value="${c}" ${c === detected ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
                ${detected ? `<span class="auto-tag">Auto ✓</span>` : `<span class="skip-tag">Not found</span>`}
            `;
            mappingGrid.appendChild(row);
        });
        hideAll(); show(secMapping);
    }

    document.getElementById('back-preview-btn').addEventListener('click', () => { hideAll(); show(secPreview); });
    document.getElementById('next-toggles-btn').addEventListener('click', () => { hideAll(); show(secToggles); });
    document.getElementById('back-mapping-btn').addEventListener('click', () => { hideAll(); show(secMapping); });

    // ── PROCESS ──
    document.getElementById('process-btn').addEventListener('click', startAudit);

    async function startAudit() {
        if (!currentFile) return;

        // Build column mapping from selects
        const columnMapping = {};
        document.querySelectorAll('.mapping-select').forEach(sel => {
            if (sel.value) columnMapping[sel.dataset.key] = sel.value;
        });

        // Build validation config from toggles
        const validationConfig = {
            check_name:              document.getElementById('tog-name').checked,
            flag_designation_in_name:document.getElementById('tog-desig-name').checked,
            check_mobile:            document.getElementById('tog-mobile').checked,
            check_email:             document.getElementById('tog-email').checked,
            check_resume:            document.getElementById('tog-resume').checked,
            check_gender:            document.getElementById('tog-gender').checked,
            check_skills:            document.getElementById('tog-skills').checked,
            check_designation_col:   document.getElementById('tog-desig-col').checked,
            check_experience:        document.getElementById('tog-exp').checked,
            check_location:          document.getElementById('tog-loc').checked,
        };

        hideAll(); show(secStatus);
        resetSteps();
        setProgress(0, 'Starting audit engine...');

        const fd = new FormData();
        fd.append('file',              currentFile);
        fd.append('column_mapping',    JSON.stringify(columnMapping));
        fd.append('validation_config', JSON.stringify(validationConfig));

        try {
            const res  = await fetch(`${API}/process`, { method: 'POST', body: fd });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            currentJobId = data.job_id;
            listenToStream(currentJobId);
        } catch(err) {
            alert(`Processing error: ${err.message}`);
            resetApp();
        }
    }

    // ── SSE STREAM ──
    function listenToStream(jobId) {
        const es = new EventSource(`${API}/stream/${jobId}`);
        es.onmessage = e => {
            const d = JSON.parse(e.data);
            setProgress(d.progress, d.message);
            markStep(d.step);

            if (d.status === 'done') {
                es.close();
                setTimeout(() => showResults(d.stats, jobId), 600);
            }
            if (d.status === 'error') {
                es.close();
                alert(`Audit failed: ${d.error}`);
                resetApp();
            }
        };
        es.onerror = () => { es.close(); };
    }

    function setProgress(pct, msg) {
        progressBar.style.width = `${pct}%`;
        progressPct.textContent = `${pct}%`;
        if (msg) statusMessage.textContent = msg;
    }

    function resetSteps() {
        Object.values(STEP_IDS).forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.classList.remove('step-done','step-active'); el.querySelector('.step-icon').textContent = '⏳'; }
        });
    }

    function markStep(step) {
        const idx = STEP_ORDER.indexOf(step);
        STEP_ORDER.forEach((s, i) => {
            const el = document.getElementById(STEP_IDS[s]);
            if (!el) return;
            if (i < idx)      { el.classList.add('step-done');   el.classList.remove('step-active'); el.querySelector('.step-icon').textContent = '✅'; }
            else if (i === idx){ el.classList.add('step-active'); el.classList.remove('step-done');  el.querySelector('.step-icon').textContent = '🔄'; }
            else               { el.classList.remove('step-done','step-active');                     el.querySelector('.step-icon').textContent = '⏳'; }
        });
    }

    // ── RESULTS ──
    function showResults(stats, jobId) {
        if (!stats) { hideAll(); show(secResult); return; }
        document.getElementById('stat-total').textContent  = stats.total  || 0;
        document.getElementById('stat-valid').textContent  = stats.valid  || 0;
        document.getElementById('stat-issues').textContent = stats.errors || 0;

        renderCharts(stats);
        renderBreakdown(stats.breakdown);

        document.getElementById('download-btn').onclick = () => {
            window.location.href = `${API}/download/${jobId}`;
        };

        hideAll(); show(secResult);
    }

    function renderCharts(stats) {
        const valid  = stats.valid  || 0;
        const errors = stats.errors || 0;

        // Destroy old charts
        if (pieChart) { pieChart.destroy(); pieChart = null; }
        if (barChart) { barChart.destroy(); barChart = null; }

        // Pie chart
        pieChart = new Chart(document.getElementById('pie-chart'), {
            type: 'doughnut',
            data: {
                labels: ['Clean Records','Records with Issues'],
                datasets: [{ data: [valid, errors], backgroundColor: ['#22c55e','#ef4444'], borderWidth: 0, hoverOffset: 8 }]
            },
            options: { plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1', font: { family: 'Outfit' } } } }, cutout: '65%' }
        });

        // Bar chart from breakdown
        const bd = stats.breakdown || {};
        const labels = [], errCounts = [];
        Object.entries(bd).forEach(([field, counts]) => {
            const errCount = Object.entries(counts).filter(([k]) => k !== 'Valid').reduce((a,[,v]) => a + v, 0);
            if (errCount > 0) { labels.push(field); errCounts.push(errCount); }
        });

        barChart = new Chart(document.getElementById('bar-chart'), {
            type: 'bar',
            data: {
                labels,
                datasets: [{ label: 'Issues', data: errCounts, backgroundColor: '#6366f1', borderRadius: 6 }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#94a3b8', font: { family: 'Outfit' } }, grid: { display: false } },
                    y: { ticks: { color: '#94a3b8', font: { family: 'Outfit' } }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });
    }

    function renderBreakdown(breakdown) {
        const section = document.getElementById('breakdown-section');
        const grid    = document.getElementById('breakdown-grid');
        grid.innerHTML = '';
        if (!breakdown || !Object.keys(breakdown).length) { hide(section); return; }
        Object.entries(breakdown).forEach(([metric, counts]) => {
            const card  = document.createElement('div');
            card.className = 'breakdown-card';
            const title = document.createElement('h4');
            title.textContent = metric;
            card.appendChild(title);
            const list = document.createElement('ul');
            Object.entries(counts).forEach(([k, v]) => {
                const li = document.createElement('li');
                const cls = k === 'Valid' ? 'status-valid' : k.toLowerCase().includes('blank') ? 'status-blank' : 'status-error';
                li.innerHTML = `<span class="breakdown-key ${cls}">${k}</span><span class="breakdown-val">${v}</span>`;
                list.appendChild(li);
            });
            card.appendChild(list);
            grid.appendChild(card);
        });
        show(section);
    }

    // ── RESET ──
    document.getElementById('new-audit-btn').addEventListener('click', resetApp);
    function resetApp() {
        currentFile = null; currentJobId = null;
        fileInput.value = '';
        if (pieChart) { pieChart.destroy(); pieChart = null; }
        if (barChart) { barChart.destroy(); barChart = null; }
        hideAll(); show(secUpload);
        progressBar.style.width = '0%';
        progressPct.textContent = '0%';
    }
});
