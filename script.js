document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const previewSection = document.getElementById('preview-section');
    const statusSection = document.getElementById('status-section');
    const resultSection = document.getElementById('result-section');
    const uploadSection = document.getElementById('drop-zone');
    
    const previewTable = document.getElementById('preview-table');
    const previewHeader = document.getElementById('preview-header');
    const previewBody = document.getElementById('preview-body');
    const fileNameDisplay = document.getElementById('file-name-display');
    const rowCountDisplay = document.getElementById('row-count-display');
    const progressBar = document.getElementById('progress-bar');
    
    const processBtn = document.getElementById('process-btn');
    const resetBtn = document.getElementById('reset-btn');
    const downloadBtn = document.getElementById('download-btn');
    const newAuditBtn = document.getElementById('new-audit-btn');
    
    const statTotal = document.getElementById('stat-total');
    const statIssues = document.getElementById('stat-issues');

    let currentFile = null;
    const API_URL = 'http://localhost:5000';

    // --- Event Listeners ---

    dropZone.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length) handleFile(files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    resetBtn.addEventListener('click', resetApp);
    newAuditBtn.addEventListener('click', resetApp);

    processBtn.addEventListener('click', processData);

    // --- Backend Communication ---

    async function handleFile(file) {
        currentFile = file;
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (result.error) throw new Error(result.error);

            showPreview(result);
        } catch (err) {
            alert(`Error uploading file: ${err.message}`);
            resetApp();
        }
    }

    function showPreview(data) {
        // Display info
        fileNameDisplay.textContent = data.filename;
        rowCountDisplay.textContent = `${data.rowCount} rows detected`;

        // Clear table
        previewHeader.innerHTML = '';
        previewBody.innerHTML = '';

        // Get headers
        const headers = data.columns;
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            previewHeader.appendChild(th);
        });

        // Show preview rows
        data.preview.forEach(row => {
            const tr = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = row[header] !== null ? row[header] : "";
                tr.appendChild(td);
            });
            previewBody.appendChild(tr);
        });

        uploadSection.classList.add('hidden');
        previewSection.classList.remove('hidden');
    }

    async function processData() {
        if (!currentFile) return;

        previewSection.classList.add('hidden');
        statusSection.classList.remove('hidden');
        progressBar.style.width = '30%';

        const formData = new FormData();
        formData.append('file', currentFile);

        try {
            const response = await fetch(`${API_URL}/process`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Processing failed');
            
            progressBar.style.width = '100%';
            
            // Get the blob for download
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            
            // Show results
            statusSection.classList.add('hidden');
            resultSection.classList.remove('hidden');

            // Try to extract detailed stats from headers
            const statsHeader = response.headers.get('X-Audit-Stats');
            if (statsHeader) {
                try {
                    const stats = JSON.parse(atob(statsHeader));
                    statTotal.textContent = stats.total;
                    statIssues.textContent = stats.errors;
                    
                    const breakdownSection = document.getElementById('breakdown-section');
                    const breakdownGrid = document.getElementById('breakdown-grid');
                    breakdownGrid.innerHTML = '';
                    
                    if (stats.breakdown && Object.keys(stats.breakdown).length > 0) {
                        for (const [metric, counts] of Object.entries(stats.breakdown)) {
                            const card = document.createElement('div');
                            card.className = 'breakdown-card';
                            
                            const title = document.createElement('h4');
                            title.textContent = metric;
                            card.appendChild(title);
                            
                            const list = document.createElement('ul');
                            for (const [key, val] of Object.entries(counts)) {
                                const li = document.createElement('li');
                                const statusClass = key.toLowerCase().includes('valid') ? 'status-valid' : 
                                                  key.toLowerCase().includes('blank') ? 'status-blank' : 'status-error';
                                li.innerHTML = `<span class="breakdown-key ${statusClass}">${key}</span><span class="breakdown-val">${val}</span>`;
                                list.appendChild(li);
                            }
                            card.appendChild(list);
                            breakdownGrid.appendChild(card);
                        }
                        breakdownSection.classList.remove('hidden');
                    }
                } catch (e) {
                    console.error("Error parsing stats:", e);
                    statTotal.textContent = rowCountDisplay.textContent.split(' ')[0];
                    statIssues.textContent = "Calculated in report";
                }
            } else {
                statTotal.textContent = rowCountDisplay.textContent.split(' ')[0];
                statIssues.textContent = "Calculated in report";
            }

            downloadBtn.onclick = () => {
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `Audit_Report_${currentFile.name.split('.')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            };

        } catch (err) {
            alert(`Error processing data: ${err.message}`);
            resetApp();
        }
    }

    function resetApp() {
        currentFile = null;
        fileInput.value = '';
        uploadSection.classList.remove('hidden');
        previewSection.classList.add('hidden');
        statusSection.classList.add('hidden');
        resultSection.classList.add('hidden');
        document.getElementById('breakdown-section').classList.add('hidden');
        progressBar.style.width = '0%';
    }
});
