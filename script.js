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

    const processBtn = document.getElementById('process-btn');
    const resetBtn = document.getElementById('reset-btn');
    const downloadBtn = document.getElementById('download-btn');
    const newAuditBtn = document.getElementById('new-audit-btn');

    const statTotal = document.getElementById('stat-total');
    const statIssues = document.getElementById('stat-issues');
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

    const NAME_ROLE_PROFILE_TERMS = [
        'profile', 'resume', 'cv', 'candidate', 'job', 'opening', 'vacancy',
        'walkin', 'walk-in', 'fresher', 'experienced', 'experience', 'exp',
        'male', 'female', 'senior', 'junior', 'lead', 'head', 'chief',
        'manager', 'assistant manager', 'deputy manager', 'general manager',
        'executive', 'senior executive', 'officer', 'coordinator', 'incharge',
        'in-charge', 'supervisor', 'team leader', 'associate', 'specialist',
        'consultant', 'analyst', 'trainee', 'intern', 'internship',
        'apprentice', 'director', 'founder', 'co founder', 'co-founder',
        'owner', 'partner', 'president', 'vice president', 'vp', 'ceo', 'cfo',
        'coo', 'cto', 'cmo', 'chro',
        'hr', 'human resource', 'human resources', 'recruiter', 'recruitment',
        'talent acquisition', 'hr executive', 'hr manager', 'hr recruiter',
        'sales', 'sales executive', 'sales manager', 'field sales',
        'area sales manager', 'regional sales manager', 'territory sales',
        'business development', 'business development executive',
        'business development manager', 'bd', 'bde', 'bdm', 'marketing',
        'marketing executive', 'marketing manager', 'digital marketing',
        'seo', 'social media', 'telecaller', 'telesales', 'inside sales',
        'customer support', 'customer care', 'customer service',
        'relationship manager', 'client servicing', 'account manager',
        'key account manager', 'front office', 'receptionist', 'counsellor',
        'counselor',
        'it', 'software', 'developer', 'engineer', 'software engineer',
        'software developer', 'programmer', 'web developer', 'frontend',
        'front end', 'backend', 'back end', 'full stack', 'fullstack',
        'java developer', 'python developer', 'php developer',
        'dot net developer', '.net developer', 'react developer',
        'angular developer', 'node developer', 'android developer',
        'ios developer', 'mobile developer', 'devops', 'cloud engineer',
        'network engineer', 'system administrator', 'database administrator',
        'dba', 'data entry', 'data operator', 'data analyst',
        'business analyst', 'data scientist', 'data engineer', 'mis',
        'mis executive', 'qa', 'qc', 'tester', 'test engineer',
        'software tester', 'automation tester', 'quality analyst',
        'product manager', 'project manager', 'scrum master',
        'finance', 'financial analyst', 'account', 'accounts', 'accountant',
        'account executive', 'accounts executive', 'accounts manager',
        'account assistant', 'audit', 'auditor', 'tax', 'taxation', 'gst',
        'tally', 'sap', 'erp', 'payroll', 'banker', 'banking', 'insurance',
        'ca', 'cs', 'cma', 'admin', 'administration', 'admin executive',
        'office assistant', 'back office', 'back office executive',
        'legal', 'lawyer', 'advocate', 'company secretary',
        'operations', 'operation', 'production', 'maintenance', 'quality',
        'quality control', 'quality engineer', 'purchase', 'procurement',
        'supply chain', 'logistics', 'warehouse', 'store', 'store keeper',
        'store incharge', 'inventory', 'dispatch', 'plant', 'operator',
        'machine operator', 'technician', 'fitter', 'welder', 'electrician',
        'plumber', 'mechanic', 'mechanical engineer', 'electrical engineer',
        'civil engineer', 'site engineer', 'service engineer',
        'design engineer', 'architect', 'interior designer', 'draftsman',
        'draughtsman',
        'doctor', 'nurse', 'pharmacist', 'physiotherapist', 'lab technician',
        'medical representative', 'teacher', 'faculty', 'professor',
        'lecturer', 'trainer', 'academic', 'graphic designer', 'ui designer',
        'ux designer', 'ui ux designer', 'video editor', 'content writer',
        'copywriter', 'chef', 'cook', 'steward', 'housekeeping', 'cashier',
        'retail', 'store manager', 'security guard', 'driver', 'delivery',
        'courier',
        'manufacturing', 'pharma', 'pharmaceutical', 'healthcare', 'hospital',
        'education', 'automobile', 'automotive', 'construction',
        'real estate', 'telecom', 'fmcg', 'chemical', 'textile', 'garment',
        'jewellery', 'jewelry', 'hospitality', 'hotel', 'restaurant',
        'travel', 'tourism', 'import export', 'export', 'agriculture',
        'food', 'beverage', 'ecommerce', 'e-commerce', 'fintech', 'ites',
        'bpo', 'kpo', 'media', 'advertising', 'oil', 'gas', 'energy',
        'power', 'solar', 'steel', 'cement', 'plastic', 'packaging',
        'printing', 'mba', 'mca', 'btech', 'b.tech', 'mtech', 'm.tech',
        'diploma', 'iti'
    ];
    const NAME_KEYWORD_ACRONYMS = new Set([
        'bd', 'bde', 'bdm', 'bpo', 'ca', 'ceo', 'cfo', 'chro', 'cma', 'cmo',
        'coo', 'cs', 'cto', 'cv', 'dba', 'erp', 'fmcg', 'gst', 'hr', 'ios',
        'it', 'ites', 'iti', 'kpo', 'mba', 'mca', 'mis', 'qa', 'qc', 'sap',
        'seo', 'ui', 'ux', 'vp'
    ]);
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
            alert('Excel engine load nahi hua. Please internet connection check karke page refresh karo.');
            return;
        }

        try {
            currentFile = file;
            currentData = await parseWorkbook(file);
            showPreview(currentData);
        } catch (err) {
            alert(`Error reading file: ${err.message}`);
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
            throw new Error('No worksheet found in this file');
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, {
            header: 1,
            defval: '',
            raw: false
        });

        if (!rows.length) {
            throw new Error('File is blank');
        }

        const columns = makeUniqueHeaders(rows[0]);
        const records = rows.slice(1).map((row) => {
            const record = {};
            columns.forEach((column, index) => {
                record[column] = cleanCellValue(row[index]);
            });
            return record;
        });

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

    function cleanCellValue(value) {
        if (value === null || value === undefined) return '';
        return String(value).replace(ILLEGAL_CHARACTERS_RE, '').trim();
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
        progressBar.style.width = '35%';

        try {
            await waitForPaint();
            const result = auditRecords(currentData);
            progressBar.style.width = '75%';

            const reportBlob = buildExcelReport(result.rows, result.summaryData, result.finalColumns);
            if (downloadUrl) URL.revokeObjectURL(downloadUrl);
            downloadUrl = URL.createObjectURL(reportBlob);

            progressBar.style.width = '100%';
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
            alert(`Error processing data: ${err.message}`);
            resetApp();
        }
    }

    function auditRecords(data) {
        const { columns, records } = data;

        const nameCol = findColumn(columns, ['name', 'candidate', 'full name']);
        const mobileCol = findColumn(columns, ['mobile', 'phone', 'contact']);
        const emailCol = findColumn(columns, ['email', 'mail']);
        const resumeCol = findColumn(columns, ['resume', 'attached', 'cv']);
        const genderCol = findColumn(columns, ['gender']);
        const createdByCol = findColumn(columns, ['createdby', 'created by']);
        const skillsCol = findColumn(columns, ['key_skills', 'key skills', 'skills']);
        const designationCol = findColumn(columns, ['designation']);
        const experienceCol = findColumn(columns, ['total_experi', 'total experi', 'experience']);
        const locationCol = findColumn(columns, ['current_loca', 'current loca', 'location', 'city']);

        const mobileCounts = {};
        const emailCounts = {};

        records.forEach((row) => {
            if (mobileCol) {
                const extracted = cleanPhoneNumbers(row[mobileCol]).numbers;
                extracted.forEach((mobile) => {
                    mobileCounts[mobile] = (mobileCounts[mobile] || 0) + 1;
                });
            }

            if (emailCol) {
                const email = cleanCellValue(row[emailCol]).toLowerCase();
                if (email) emailCounts[email] = (emailCounts[email] || 0) + 1;
            }
        });

        const outputRows = [];
        let maxMobiles = 0;
        let totalValid = 0;
        let totalErrors = 0;

        records.forEach((row) => {
            const rowErrors = [];
            const rowCopy = { ...row };

            if (isFullyBlank(row)) {
                rowCopy['Name Check'] = 'Blank';
                rowCopy['Mobile Check'] = 'Blank';
                rowCopy['Email Check'] = 'Blank';
                if (resumeCol) rowCopy['Resume Check'] = 'Blank';
                if (genderCol) rowCopy['Gender Check'] = 'Blank';
                if (createdByCol) rowCopy['CreatedBy Check'] = 'Blank';
                if (skillsCol) rowCopy['Skills Check'] = 'Blank';
                if (designationCol) rowCopy['Designation Check'] = 'Blank';
                if (experienceCol) rowCopy['Experience Check'] = 'Blank';
                if (locationCol) rowCopy['Location Check'] = 'Blank';
                rowCopy._tempMobiles = [];
                rowCopy['All Errors'] = 'Fully Blank Record';
                outputRows.push(rowCopy);
                totalErrors += 1;
                return;
            }

            const nameValue = nameCol ? row[nameCol] : '';
            const nameIssue = isIrrelevantName(nameValue);
            if (nameIssue) rowErrors.push(`Name: ${nameIssue}`);

            const mobileResult = cleanPhoneNumbers(mobileCol ? row[mobileCol] : '');
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

            const emailValue = emailCol ? row[emailCol] : '';
            let emailIssue = validateEmailFormat(emailValue);
            const normalizedEmail = cleanCellValue(emailValue).toLowerCase();
            if (!emailIssue && normalizedEmail && (emailCounts[normalizedEmail] || 0) > 1) {
                emailIssue = 'Duplicate';
            }

            if (emailIssue) rowErrors.push(`Email: ${emailIssue}`);

            let resumeIssue = null;
            if (resumeCol) {
                const resumeValue = cleanCellValue(row[resumeCol]).toLowerCase();
                if (['no', 'n', '', 'null', 'none', 'nan'].includes(resumeValue)) {
                    resumeIssue = 'Missing';
                    rowErrors.push('Resume Missing');
                }
            }

            rowCopy['Name Check'] = nameIssue || 'Valid';
            rowCopy['Mobile Check'] = mobileIssue || 'Valid';
            rowCopy['Email Check'] = emailIssue || 'Valid';
            if (resumeCol) rowCopy['Resume Check'] = resumeIssue || 'Valid';

            [
                ['Gender', genderCol],
                ['CreatedBy', createdByCol],
                ['Skills', skillsCol],
                ['Designation', designationCol],
                ['Experience', experienceCol],
                ['Location', locationCol]
            ].forEach(([label, column]) => {
                if (!column) return;
                const value = cleanCellValue(row[column]).toLowerCase();
                if (['', 'nan', 'null', 'none', 'n/a'].includes(value)) {
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
        });

        const specialColumns = [
            'Name Check',
            'Mobile Check',
            'Email Check'
        ];

        if (resumeCol) specialColumns.push('Resume Check');
        if (genderCol) specialColumns.push('Gender Check');
        if (createdByCol) specialColumns.push('CreatedBy Check');
        if (skillsCol) specialColumns.push('Skills Check');
        if (designationCol) specialColumns.push('Designation Check');
        if (experienceCol) specialColumns.push('Experience Check');
        if (locationCol) specialColumns.push('Location Check');

        for (let index = 0; index < maxMobiles; index += 1) {
            specialColumns.push(maxMobiles > 1 ? `Cleaned Mobile ${index + 1}` : 'Cleaned Mobile No');
        }
        specialColumns.push('All Errors');

        outputRows.forEach((row) => {
            const mobiles = row._tempMobiles || [];
            delete row._tempMobiles;
            for (let index = 0; index < maxMobiles; index += 1) {
                const column = maxMobiles > 1 ? `Cleaned Mobile ${index + 1}` : 'Cleaned Mobile No';
                row[column] = mobiles[index] || '';
            }
        });

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

        const nameString = cleanCellValue(name).toLowerCase();
        if (nameString.length < 2) return 'Too Short';
        if (nameString.includes('@')) return 'Contains Email';
        if (['?', '!', '*', '#', '$', '%'].some((char) => nameString.includes(char))) {
            return 'Contains Garbage Characters';
        }
        if (nameString.replace(/\s/g, '').match(/^\d+$/)) return 'Numeric Name';
        if (RE_NAME_STARTS_WITH_NUM.test(nameString)) return 'Starts with Number';
        if (RE_NAME_SPAM.test(nameString)) return 'Spam Name';

        const irrelevantTerms = new Set([
            'test', 'abc', 'xyz', 'na', 'n/a', 'unknown', 'null',
            'none', '---', '...', '.', 'dummy'
        ]);
        if (irrelevantTerms.has(nameString)) return 'Irrelevant Term';

        const roleProfileMatch = nameString.match(NAME_ROLE_PROFILE_RE);
        if (roleProfileMatch) {
            return 'Contains Designation/Profile/Role/Industry';
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
        const normalized = cleanCellValue(value).toLowerCase();
        return normalized === '' || normalized === 'nan';
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
            Object.entries(counts).forEach(([status, count]) => {
                summaryData.push({ Metric: `  - ${status}`, Count: count });
            });
            summaryData.push({ Metric: '', Count: '' });
        });

        return summaryData;
    }

    function buildExcelReport(rows, summaryData, finalColumns) {
        const workbook = XLSX.utils.book_new();
        const summarySheet = XLSX.utils.json_to_sheet(summaryData, {
            header: ['Metric', 'Count']
        });
        const auditedSheet = XLSX.utils.json_to_sheet(rows, {
            header: finalColumns
        });

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

        breakdownGrid.innerHTML = '';
        Object.entries(stats.breakdown).forEach(([metric, counts]) => {
            const card = document.createElement('div');
            card.className = 'breakdown-card';

            const title = document.createElement('h4');
            title.textContent = metric;
            card.appendChild(title);

            const list = document.createElement('ul');
            Object.entries(counts).forEach(([key, value]) => {
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

    function getStatusClass(status) {
        const normalized = status.toLowerCase();
        if (normalized.includes('valid')) return 'status-valid';
        if (normalized.includes('blank')) return 'status-blank';
        return 'status-error';
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
            .sort((a, b) => b.length - a.length)
            .map(escapeRegex);
        return new RegExp(`(^|[^a-z0-9])(${escapedTerms.join('|')})(?=$|[^a-z0-9])`, 'i');
    }

    function formatNameKeyword(keyword) {
        return keyword.trim().split(/(\W+)/).map((part) => {
            return NAME_KEYWORD_ACRONYMS.has(part.toLowerCase()) ? part.toUpperCase() : toTitleCase(part);
        }).join('');
    }

    function toTitleCase(value) {
        if (!value) return value;
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    }

    function escapeRegex(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function stripExtension(filename) {
        return filename.replace(/\.[^/.]+$/, '');
    }

    function waitForPaint() {
        return new Promise((resolve) => setTimeout(resolve, 50));
    }

    function resetApp() {
        currentFile = null;
        currentData = null;
        fileInput.value = '';
        uploadSection.classList.remove('hidden');
        previewSection.classList.add('hidden');
        statusSection.classList.add('hidden');
        resultSection.classList.add('hidden');
        breakdownSection.classList.add('hidden');
        progressBar.style.width = '0%';
        breakdownGrid.innerHTML = '';
        downloadBtn.onclick = null;

        if (downloadUrl) {
            URL.revokeObjectURL(downloadUrl);
            downloadUrl = null;
        }
    }
});
