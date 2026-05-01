document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const previewSection = document.getElementById('preview-section');
    const statusSection = document.getElementById('status-section');
    const resultSection = document.getElementById('result-section');
    const uploadSection = document.getElementById('drop-zone');

    const previewHeader = document.getElementById('preview-header');
    const previewBody = document.getElementById('preview-body');
    const fileNameDisplay = document.getElementById('file-name-display');
    const rowCountDisplay = document.getElementById('row-count-display');
    const progressBar = document.getElementById('progress-bar');
    const progressMessage = document.getElementById('progress-message');

    const processBtn = document.getElementById('process-btn');
    const resetBtn = document.getElementById('reset-btn');
    const downloadBtn = document.getElementById('download-btn');
    const newAuditBtn = document.getElementById('new-audit-btn');

    const statTotal = document.getElementById('stat-total');
    const statIssues = document.getElementById('stat-issues');
    const issueSummary = document.getElementById('issue-summary');
    const breakdownSection = document.getElementById('breakdown-section');
    const breakdownGrid = document.getElementById('breakdown-grid');

    const RE_MULTIPLE = /[,/|;]|\band\b/i;
    const RE_NON_NUMERIC = /\D/g;
    const RE_MOBILE_PATTERN = /(?:(?:\+|00)?(?:91|091|0)[\s\-().]*)?([6789](?:[\s\-().]*\d){9})/g;
    const RE_DUMMY_MOBILE_SEQ = /(1234567|2345678|3456789|4567890|0987654|9876543|8765432|7654321)/;
    const RE_REPEATED_DIGITS = /(.)\1{6,}/;
    const RE_REPEATING_ZEROS = /0{5,}$/;
    const RE_EMAIL_FORMAT = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const RE_NAME_SPAM = /(.)\1{4,}/;
    const RE_NAME_STARTS_WITH_NUM = /^\d/;
    const ILLEGAL_CHARACTERS_RE = /[\x00-\x08\x0B-\x0C\x0E-\x1F]/g;

    const RULES = window.EASEBIZ_VALIDATION_RULES || {};
    const COLUMN_ALIASES = RULES.columnAliases || {};
    const MISSING_VALUES = new Set((RULES.missingValues || ['', 'nan', 'null', 'none', 'n/a']).map(normalizeTerm));
    const IRRELEVANT_NAME_TERMS = new Set((RULES.irrelevantNameTerms || []).map(normalizeTerm));
    const IGNORED_ROLE_PROFILE_TERMS = new Set((RULES.ignoredRoleProfileTerms || []).map(normalizeTerm));
    const ROLE_PROFILE_RESULT_LABEL = RULES.roleProfileResultLabel || 'Contains Designation/Profile/Role/Industry';
    const NAME_ROLE_PROFILE_TERMS = RULES.roleProfileTerms || [];
    const PROCESSING_CHUNK_SIZE = Number(RULES.processingChunkSize) || 1000;
    const NAME_ROLE_PROFILE_RE = buildNameRoleProfileRegex();

    let currentFile = null;
    let currentData = null;
    let downloadUrl = null;

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        dropZone.classList.remove('dragover');
        const files = event.dataTransfer.files;
        if (files.length) handleFile(files[0]);
    });

    fileInput.addEventListener('change', (event) => {
        if (event.target.files.length) handleFile(event.target.files[0]);
    });

    resetBtn.addEventListener('click', resetApp);
    newAuditBtn.addEventListener('click', resetApp);
    processBtn.addEventListener('click', processData);

    async function handleFile(file) {
        if (!window.XLSX) {
            showError('Excel reader is not available. Please refresh the page and try again.');
            return;
        }

        if (!/\.(csv|xlsx|xls)$/i.test(file.name)) {
            showError('Please upload a .csv, .xlsx, or .xls candidate file.');
            return;
        }

        try {
            currentFile = file;
            currentData = await parseWorkbook(file);
            showPreview(currentData);
        } catch (err) {
            showError(`Could not read this file. ${err.message}`);
            resetApp();
        }
    }

    async function parseWorkbook(file) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, {
            type: 'array',
            cellDates: false,
            raw: false
        });

        if (!workbook.SheetNames.length) {
            throw new Error('No worksheet was found.');
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, {
            header: 1,
            defval: '',
            raw: false
        });

        const headerRowIndex = rows.findIndex((row) => row.some((cell) => cleanCellValue(cell) !== ''));
        if (headerRowIndex === -1) {
            throw new Error('The file is blank.');
        }

        const columns = makeUniqueHeaders(rows[headerRowIndex]);
        if (!columns.length) {
            throw new Error('The first non-empty row must contain column names.');
        }

        const records = rows.slice(headerRowIndex + 1).map((row) => {
            const record = {};
            columns.forEach((column, index) => {
                record[column] = cleanCellValue(row[index]);
            });
            return record;
        });

        if (!records.length) {
            throw new Error('No data rows were found below the header row.');
        }

        return {
            filename: file.name,
            rowCount: records.length,
            columns,
            records,
            preview: records.slice(0, 20)
        };
    }

    function makeUniqueHeaders(rawHeaders) {
        const seen = {};
        return rawHeaders.map((header, index) => {
            const baseHeader = cleanCellValue(header) || `Column ${index + 1}`;
            const count = seen[baseHeader] || 0;
            seen[baseHeader] = count + 1;
            return count ? `${baseHeader}_${count + 1}` : baseHeader;
        });
    }

    function showPreview(data) {
        fileNameDisplay.textContent = data.filename;
        rowCountDisplay.textContent = `${data.rowCount} rows detected`;

        previewHeader.innerHTML = '';
        previewBody.innerHTML = '';

        data.columns.forEach((header) => {
            const th = document.createElement('th');
            th.textContent = header;
            previewHeader.appendChild(th);
        });

        data.preview.forEach((row) => {
            const tr = document.createElement('tr');
            data.columns.forEach((header) => {
                const td = document.createElement('td');
                td.textContent = row[header] || '';
                tr.appendChild(td);
            });
            previewBody.appendChild(tr);
        });

        uploadSection.classList.add('hidden');
        previewSection.classList.remove('hidden');
    }

    async function processData() {
        if (!currentData || !currentFile) return;

        previewSection.classList.add('hidden');
        statusSection.classList.remove('hidden');
        setProgress(8, 'Checking columns...');

        try {
            await waitForPaint();
            const result = await auditRecords(currentData, setProgress);

            setProgress(84, 'Creating Excel report...');
            const reportBlob = await buildExcelReport(result.rows, result.summaryData, result.finalColumns);
            if (downloadUrl) URL.revokeObjectURL(downloadUrl);
            downloadUrl = URL.createObjectURL(reportBlob);

            setProgress(100, 'Audit complete.');
            showResults(result.stats);

            downloadBtn.onclick = () => {
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = `Audit_Report_${stripExtension(currentFile.name)}.xlsx`;
                document.body.appendChild(link);
                link.click();
                link.remove();
            };
        } catch (err) {
            showError(`Processing stopped. ${err.message}`);
            resetApp();
        }
    }

    async function auditRecords(data, onProgress) {
        const { columns, records } = data;
        const cols = resolveColumns(columns);
        validateColumnCoverage(cols);

        const mobileCounts = {};
        const emailCounts = {};
        const totalRecords = records.length || 1;

        for (let start = 0; start < records.length; start += PROCESSING_CHUNK_SIZE) {
            const end = Math.min(start + PROCESSING_CHUNK_SIZE, records.length);
            for (let index = start; index < end; index += 1) {
                const row = records[index];

                if (cols.mobile) {
                    const extracted = cleanPhoneNumbers(row[cols.mobile]).numbers;
                    extracted.forEach((mobile) => {
                        mobileCounts[mobile] = (mobileCounts[mobile] || 0) + 1;
                    });
                }

                if (cols.email) {
                    const email = cleanCellValue(row[cols.email]).toLowerCase();
                    if (email) emailCounts[email] = (emailCounts[email] || 0) + 1;
                }
            }

            const percent = 12 + Math.round((end / totalRecords) * 20);
            onProgress(percent, `Scanning duplicates... ${end.toLocaleString()} / ${records.length.toLocaleString()}`);
            await waitForPaint();
        }

        const outputRows = [];
        let maxMobiles = 0;
        let totalValid = 0;
        let totalErrors = 0;

        for (let start = 0; start < records.length; start += PROCESSING_CHUNK_SIZE) {
            const end = Math.min(start + PROCESSING_CHUNK_SIZE, records.length);

            for (let index = start; index < end; index += 1) {
                const row = records[index];
                const rowErrors = [];
                const rowCopy = { ...row };

                if (isFullyBlank(row)) {
                    markFullyBlankRow(rowCopy, cols);
                    outputRows.push(rowCopy);
                    totalErrors += 1;
                    continue;
                }

                const nameIssue = isIrrelevantName(cols.name ? row[cols.name] : '');
                if (nameIssue) rowErrors.push(`Name: ${nameIssue}`);

                const mobileResult = cleanPhoneNumbers(cols.mobile ? row[cols.mobile] : '');
                let mobileIssue = mobileResult.issue;
                const finalMobiles = [];

                mobileResult.numbers.forEach((mobile) => {
                    if ((mobileCounts[mobile] || 0) > 1) {
                        rowErrors.push(`Mobile Duplicate (${mobile})`);
                        mobileIssue = 'Contains Duplicate';
                    } else {
                        finalMobiles.push(mobile);
                    }
                });

                if (mobileIssue && !String(mobileIssue).includes('Duplicate')) {
                    rowErrors.push(`Mobile: ${mobileIssue}`);
                }

                maxMobiles = Math.max(maxMobiles, finalMobiles.length);

                const emailValue = cols.email ? row[cols.email] : '';
                let emailIssue = validateEmailFormat(emailValue);
                const normalizedEmail = cleanCellValue(emailValue).toLowerCase();
                if (!emailIssue && normalizedEmail && (emailCounts[normalizedEmail] || 0) > 1) {
                    emailIssue = 'Duplicate';
                }

                if (emailIssue) rowErrors.push(`Email: ${emailIssue}`);

                let resumeIssue = null;
                if (cols.resume) {
                    const resumeValue = normalizeTerm(row[cols.resume]);
                    if (MISSING_VALUES.has(resumeValue)) {
                        resumeIssue = 'Missing';
                        rowErrors.push('Resume Missing');
                    }
                }

                rowCopy['Name Check'] = nameIssue || 'Valid';
                rowCopy['Mobile Check'] = mobileIssue || 'Valid';
                rowCopy['Email Check'] = emailIssue || 'Valid';
                if (cols.resume) rowCopy['Resume Check'] = resumeIssue || 'Valid';

                [
                    ['Gender', cols.gender],
                    ['CreatedBy', cols.createdBy],
                    ['Skills', cols.skills],
                    ['Designation', cols.designation],
                    ['Experience', cols.experience],
                    ['Location', cols.location]
                ].forEach(([label, column]) => {
                    if (!column) return;
                    const value = normalizeTerm(row[column]);
                    if (MISSING_VALUES.has(value)) {
                        rowErrors.push(`${label} Missing`);
                        rowCopy[`${label} Check`] = 'Blank';
                    } else {
                        rowCopy[`${label} Check`] = 'Valid';
                    }
                });

                rowCopy._tempMobiles = finalMobiles;
                rowCopy['All Errors'] = rowErrors.length ? rowErrors.join(' | ') : 'Clean Record';

                if (rowErrors.length) {
                    totalErrors += 1;
                } else {
                    totalValid += 1;
                }

                outputRows.push(rowCopy);
            }

            const percent = 35 + Math.round((end / totalRecords) * 38);
            onProgress(percent, `Validating records... ${end.toLocaleString()} / ${records.length.toLocaleString()}`);
            await waitForPaint();
        }

        const specialColumns = buildSpecialColumns(cols, maxMobiles);

        for (let start = 0; start < outputRows.length; start += PROCESSING_CHUNK_SIZE) {
            const end = Math.min(start + PROCESSING_CHUNK_SIZE, outputRows.length);
            for (let index = start; index < end; index += 1) {
                const row = outputRows[index];
                const mobiles = row._tempMobiles || [];
                delete row._tempMobiles;

                for (let mobileIndex = 0; mobileIndex < maxMobiles; mobileIndex += 1) {
                    const column = maxMobiles > 1 ? `Cleaned Mobile ${mobileIndex + 1}` : 'Cleaned Mobile No';
                    row[column] = mobiles[mobileIndex] || '';
                }
            }
            onProgress(74 + Math.round((end / totalRecords) * 6), 'Preparing report columns...');
            await waitForPaint();
        }

        const finalColumns = [
            ...columns.filter((column) => !specialColumns.includes(column)),
            ...specialColumns
        ].filter((column, index, list) => list.indexOf(column) === index);

        const reorderedRows = outputRows.map((row) => reorderRow(row, finalColumns));
        const breakdown = buildBreakdown(reorderedRows, specialColumns);
        const summaryData = buildSummaryData(records.length, totalValid, totalErrors, breakdown);

        return {
            rows: reorderedRows,
            summaryData,
            finalColumns,
            stats: {
                total: records.length,
                errors: totalErrors,
                breakdown
            }
        };
    }

    function resolveColumns(columns) {
        return {
            name: findColumn(columns, COLUMN_ALIASES.name || ['name', 'candidate', 'full name']),
            mobile: findColumn(columns, COLUMN_ALIASES.mobile || ['mobile', 'phone', 'contact']),
            email: findColumn(columns, COLUMN_ALIASES.email || ['email', 'mail']),
            resume: findColumn(columns, COLUMN_ALIASES.resume || ['resume', 'attached', 'cv']),
            gender: findColumn(columns, COLUMN_ALIASES.gender || ['gender']),
            createdBy: findColumn(columns, COLUMN_ALIASES.createdBy || ['createdby', 'created by']),
            skills: findColumn(columns, COLUMN_ALIASES.skills || ['key_skills', 'key skills', 'skills']),
            designation: findColumn(columns, COLUMN_ALIASES.designation || ['designation']),
            experience: findColumn(columns, COLUMN_ALIASES.experience || ['total_experi', 'total experi', 'experience']),
            location: findColumn(columns, COLUMN_ALIASES.location || ['current_loca', 'current loca', 'location', 'city'])
        };
    }

    function validateColumnCoverage(cols) {
        if (!cols.name && !cols.mobile && !cols.email) {
            throw new Error('Could not find Name, Mobile, or Email columns. Please check the header row.');
        }
    }

    function markFullyBlankRow(rowCopy, cols) {
        rowCopy['Name Check'] = 'Blank';
        rowCopy['Mobile Check'] = 'Blank';
        rowCopy['Email Check'] = 'Blank';
        if (cols.resume) rowCopy['Resume Check'] = 'Blank';
        if (cols.gender) rowCopy['Gender Check'] = 'Blank';
        if (cols.createdBy) rowCopy['CreatedBy Check'] = 'Blank';
        if (cols.skills) rowCopy['Skills Check'] = 'Blank';
        if (cols.designation) rowCopy['Designation Check'] = 'Blank';
        if (cols.experience) rowCopy['Experience Check'] = 'Blank';
        if (cols.location) rowCopy['Location Check'] = 'Blank';
        rowCopy._tempMobiles = [];
        rowCopy['All Errors'] = 'Fully Blank Record';
    }

    function buildSpecialColumns(cols, maxMobiles) {
        const specialColumns = ['Name Check', 'Mobile Check', 'Email Check'];

        if (cols.resume) specialColumns.push('Resume Check');
        if (cols.gender) specialColumns.push('Gender Check');
        if (cols.createdBy) specialColumns.push('CreatedBy Check');
        if (cols.skills) specialColumns.push('Skills Check');
        if (cols.designation) specialColumns.push('Designation Check');
        if (cols.experience) specialColumns.push('Experience Check');
        if (cols.location) specialColumns.push('Location Check');

        for (let index = 0; index < maxMobiles; index += 1) {
            specialColumns.push(maxMobiles > 1 ? `Cleaned Mobile ${index + 1}` : 'Cleaned Mobile No');
        }

        specialColumns.push('All Errors');
        return specialColumns;
    }

    function cleanPhoneNumbers(mobileValue) {
        if (isBlankValue(mobileValue)) {
            return { numbers: [], issue: 'Blank' };
        }

        let phoneString = cleanCellValue(mobileValue);
        if (phoneString.endsWith('.0')) {
            phoneString = phoneString.slice(0, -2);
        }

        const validNumbers = [];
        for (const match of phoneString.matchAll(RE_MOBILE_PATTERN)) {
            const number = match[1].replace(RE_NON_NUMERIC, '');
            if (number.length === 10) validNumbers.push(number);
        }

        const seen = new Set();
        const uniqueNumbers = [];
        validNumbers.forEach((number) => {
            if (seen.has(number)) return;
            if (RE_DUMMY_MOBILE_SEQ.test(number)) return;
            if (RE_REPEATED_DIGITS.test(number)) return;
            if (RE_REPEATING_ZEROS.test(number)) return;
            seen.add(number);
            uniqueNumbers.push(number);
        });

        if (!uniqueNumbers.length) {
            return { numbers: [], issue: 'Invalid Dummy/Repeating Number' };
        }

        return { numbers: uniqueNumbers, issue: null };
    }

    function isIrrelevantName(name) {
        if (isBlankValue(name)) return 'Blank';

        const rawName = cleanCellValue(name);
        const nameString = rawName.toLowerCase();
        if (nameString.length < 2) return 'Too Short';
        if (nameString.includes('@')) return 'Contains Email';
        if (['?', '!', '*', '#', '$', '%'].some((char) => nameString.includes(char))) {
            return 'Contains Garbage Characters';
        }
        if (nameString.replace(/\s/g, '').match(/^\d+$/)) return 'Numeric Name';
        if (RE_NAME_STARTS_WITH_NUM.test(nameString)) return 'Starts with Number';
        if (RE_NAME_SPAM.test(nameString)) return 'Spam Name';
        if (IRRELEVANT_NAME_TERMS.has(nameString)) return 'Irrelevant Term';
        if (findRoleProfileMatch(rawName)) return ROLE_PROFILE_RESULT_LABEL;

        return null;
    }

    function findRoleProfileMatch(rawName) {
        const nameString = rawName.toLowerCase();
        for (const match of nameString.matchAll(NAME_ROLE_PROFILE_RE)) {
            const matchedTerm = normalizeTerm(match[2]);
            if (!IGNORED_ROLE_PROFILE_TERMS.has(matchedTerm)) {
                return matchedTerm;
            }
        }
        return null;
    }

    function validateEmailFormat(email) {
        if (isBlankValue(email)) return 'Blank';

        const emailString = cleanCellValue(email).toLowerCase();
        if (RE_MULTIPLE.test(emailString)) return 'Multiple Emails Provided';

        const dummyEmails = new Set([
            'na@na.com', 'test@test.com', 'abc@xyz.com',
            'none@none.com', 'nil@nil.com', 'null@null.com'
        ]);
        if (dummyEmails.has(emailString)) return 'Dummy/Irrelevant Email';
        if (!RE_EMAIL_FORMAT.test(emailString)) return 'Invalid Format';

        return null;
    }

    function buildBreakdown(rows, specialColumns) {
        const breakdown = {};
        specialColumns.forEach((column) => {
            if (!column.endsWith('Check')) return;
            const metricName = column.replace(' Check', '');
            breakdown[metricName] = {};
            rows.forEach((row) => {
                const value = row[column] || 'Blank';
                breakdown[metricName][value] = (breakdown[metricName][value] || 0) + 1;
            });
        });
        return breakdown;
    }

    function buildSummaryData(totalRecords, totalValid, totalErrors, breakdown) {
        const summaryData = [
            { Metric: 'Total Records Processed', Count: totalRecords },
            { Metric: 'Perfectly Clean Records', Count: totalValid },
            { Metric: 'Records with Errors', Count: totalErrors },
            { Metric: '', Count: '' }
        ];

        Object.entries(breakdown).forEach(([metric, counts]) => {
            summaryData.push({ Metric: `--- ${metric} Breakdown ---`, Count: '' });
            sortBreakdownEntries(counts).forEach(([status, count]) => {
                summaryData.push({ Metric: `  - ${status}`, Count: count });
            });
            summaryData.push({ Metric: '', Count: '' });
        });

        return summaryData;
    }

    async function buildExcelReport(rows, summaryData, finalColumns) {
        if (window.ExcelJS) {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'EaseBiz RecruitGuard';
            workbook.created = new Date();

            addExcelWorksheet(workbook, 'Audit Summary', summaryData, ['Metric', 'Count']);
            addExcelWorksheet(workbook, 'Audited Data', rows, finalColumns);

            const buffer = await workbook.xlsx.writeBuffer();
            return new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
        }

        return buildSheetJsExcelReport(rows, summaryData, finalColumns);
    }

    function addExcelWorksheet(workbook, sheetName, rows, columns) {
        const worksheet = workbook.addWorksheet(sheetName, {
            views: [{ state: 'frozen', ySplit: 1 }]
        });

        worksheet.columns = columns.map((column) => ({
            header: column,
            key: column,
            width: computeColumnWidth(rows, column)
        }));

        rows.forEach((row) => {
            worksheet.addRow(columns.map((column) => cleanCellValue(row[column])));
        });
    }

    function buildSheetJsExcelReport(rows, summaryData, finalColumns) {
        const workbook = XLSX.utils.book_new();
        const summarySheet = XLSX.utils.json_to_sheet(summaryData, {
            header: ['Metric', 'Count']
        });
        const auditedSheet = XLSX.utils.json_to_sheet(rows, {
            header: finalColumns
        });

        summarySheet['!cols'] = buildSheetJsWidths(summaryData, ['Metric', 'Count']);
        auditedSheet['!cols'] = buildSheetJsWidths(rows, finalColumns);
        summarySheet['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };
        auditedSheet['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };

        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Audit Summary');
        XLSX.utils.book_append_sheet(workbook, auditedSheet, 'Audited Data');

        const buffer = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array'
        });

        return new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
    }

    function showResults(stats) {
        statusSection.classList.add('hidden');
        resultSection.classList.remove('hidden');

        statTotal.textContent = stats.total;
        statIssues.textContent = stats.errors;

        renderIssueSummary(stats);

        breakdownGrid.innerHTML = '';
        Object.entries(stats.breakdown).forEach(([metric, counts]) => {
            const card = document.createElement('div');
            card.className = 'breakdown-card';

            const title = document.createElement('h4');
            title.textContent = metric;
            card.appendChild(title);

            const list = document.createElement('ul');
            sortBreakdownEntries(counts).forEach(([key, value]) => {
                const li = document.createElement('li');
                const statusClass = getStatusClass(key);

                const keySpan = document.createElement('span');
                keySpan.className = `breakdown-key ${statusClass}`;
                keySpan.textContent = key;

                const valueSpan = document.createElement('span');
                valueSpan.className = 'breakdown-val';
                valueSpan.textContent = value;

                li.appendChild(keySpan);
                li.appendChild(valueSpan);
                list.appendChild(li);
            });

            card.appendChild(list);
            breakdownGrid.appendChild(card);
        });

        breakdownSection.classList.toggle('hidden', !Object.keys(stats.breakdown).length);
    }

    function renderIssueSummary(stats) {
        issueSummary.innerHTML = '';

        const cleanRecords = Math.max(stats.total - stats.errors, 0);
        const issueRate = stats.total ? Math.round((stats.errors / stats.total) * 100) : 0;
        const topIssues = collectTopIssues(stats.breakdown);

        issueSummary.appendChild(createIssueChip('Clean Records', cleanRecords.toLocaleString(), 'Rows without validation errors'));
        issueSummary.appendChild(createIssueChip('Issue Rate', `${issueRate}%`, `${stats.errors.toLocaleString()} records need review`));

        if (topIssues.length) {
            const topIssue = topIssues[0];
            issueSummary.appendChild(createIssueChip('Top Issue', topIssue.count.toLocaleString(), `${topIssue.metric}: ${topIssue.status}`));
        }

        issueSummary.classList.remove('hidden');
    }

    function collectTopIssues(breakdown) {
        const issues = [];
        Object.entries(breakdown).forEach(([metric, counts]) => {
            Object.entries(counts).forEach(([status, count]) => {
                if (status === 'Valid') return;
                issues.push({ metric, status, count });
            });
        });

        return issues.sort((left, right) => right.count - left.count).slice(0, 3);
    }

    function createIssueChip(label, value, detail) {
        const chip = document.createElement('div');
        chip.className = 'issue-chip';

        const labelEl = document.createElement('span');
        labelEl.textContent = label;

        const valueEl = document.createElement('strong');
        valueEl.textContent = value;

        const detailEl = document.createElement('p');
        detailEl.textContent = detail;

        chip.appendChild(labelEl);
        chip.appendChild(valueEl);
        chip.appendChild(detailEl);
        return chip;
    }

    function sortBreakdownEntries(counts) {
        return Object.entries(counts).sort(([leftStatus, leftCount], [rightStatus, rightCount]) => {
            if (leftStatus === 'Valid') return -1;
            if (rightStatus === 'Valid') return 1;
            if (leftStatus === 'Blank') return -1;
            if (rightStatus === 'Blank') return 1;
            return rightCount - leftCount;
        });
    }

    function getStatusClass(status) {
        const normalized = status.toLowerCase();
        if (normalized === 'valid') return 'status-valid';
        if (normalized === 'blank' || normalized.includes('missing')) return 'status-blank';
        return 'status-error';
    }

    function findColumn(columns, possibleNames) {
        return columns.find((column) => {
            const lowerColumn = column.toLowerCase();
            return possibleNames.some((name) => lowerColumn.includes(name.toLowerCase()));
        }) || null;
    }

    function isFullyBlank(row) {
        return Object.values(row).every((value) => cleanCellValue(value) === '');
    }

    function isBlankValue(value) {
        const normalized = normalizeTerm(value);
        return normalized === '' || normalized === 'nan';
    }

    function cleanCellValue(value) {
        if (value === null || value === undefined) return '';
        return String(value).replace(ILLEGAL_CHARACTERS_RE, '').trim();
    }

    function normalizeTerm(value) {
        return cleanCellValue(value).toLowerCase();
    }

    function reorderRow(row, columns) {
        const ordered = {};
        columns.forEach((column) => {
            ordered[column] = cleanCellValue(row[column]);
        });
        return ordered;
    }

    function buildNameRoleProfileRegex() {
        const escapedTerms = [...new Set(NAME_ROLE_PROFILE_TERMS)]
            .filter((term) => !IGNORED_ROLE_PROFILE_TERMS.has(normalizeTerm(term)))
            .sort((a, b) => b.length - a.length)
            .map(escapeRegex);

        if (!escapedTerms.length) {
            return /$a/g;
        }

        return new RegExp(`(^|[^a-z0-9])(${escapedTerms.join('|')})(?=$|[^a-z0-9])`, 'gi');
    }

    function computeColumnWidth(rows, column) {
        let maxLength = cleanCellValue(column).length;
        const sampleSize = Math.min(rows.length, 5000);

        for (let index = 0; index < sampleSize; index += 1) {
            maxLength = Math.max(maxLength, cleanCellValue(rows[index][column]).length);
        }

        return clamp(maxLength + 2, 12, 48);
    }

    function buildSheetJsWidths(rows, columns) {
        return columns.map((column) => ({ wch: computeColumnWidth(rows, column) }));
    }

    function setProgress(percent, message) {
        progressBar.style.width = `${clamp(percent, 0, 100)}%`;
        if (progressMessage) progressMessage.textContent = message;
    }

    function showError(message) {
        console.error(message);
        alert(message);
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function escapeRegex(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function stripExtension(filename) {
        return filename.replace(/\.[^/.]+$/, '');
    }

    function waitForPaint() {
        return new Promise((resolve) => setTimeout(resolve, 0));
    }

    function resetApp() {
        currentFile = null;
        currentData = null;
        fileInput.value = '';
        uploadSection.classList.remove('hidden');
        previewSection.classList.add('hidden');
        statusSection.classList.add('hidden');
        resultSection.classList.add('hidden');
        issueSummary.classList.add('hidden');
        breakdownSection.classList.add('hidden');
        setProgress(0, 'Preparing audit...');
        breakdownGrid.innerHTML = '';
        issueSummary.innerHTML = '';
        downloadBtn.onclick = null;

        if (downloadUrl) {
            URL.revokeObjectURL(downloadUrl);
            downloadUrl = null;
        }
    }
});
