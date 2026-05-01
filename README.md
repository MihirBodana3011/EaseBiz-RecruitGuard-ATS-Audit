# EaseBiz RecruitGuard - ATS Data Audit Platform

![EaseBiz Logo](easebiz_logo.png)

## Overview
**EaseBiz RecruitGuard** is a high-performance, enterprise-grade ATS data audit and validation platform. Built for professional recruitment teams, it ensures 100% data integrity by strictly validating candidate records, mobile numbers, and critical fields like Skills, Experience, and Location.

## Key Features
- **Strict Mobile Validation**: Specialized logic for Indian mobile numbers, blocking dummy sequences (123456...) and repeating digits.
- **Multi-Number Extraction**: Automatically splits multiple numbers in a single cell into separate columns.
- **Name Intelligence**: Detects if a name field contains designations, roles, or job titles (e.g. "Rahul Engineer", "Priya HR Manager").
- **Dynamic Checkpoints**: Automatically detects and validates columns like Gender, Skills, Designation, Experience, and Location.
- **Detailed Audit Reports**: Generates a consolidated Excel report with a granular breakdown of every record.
- **Premium UI**: Modern glassmorphic interface with real-time audit stats and breakdown cards.
- **Crash-Proof**: Automatic filtering of illegal characters to prevent Excel file corruption.

## Tech Stack
- **Backend**: Python 3.8+, Flask, Pandas, Openpyxl
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **Design**: Glassmorphism, 4D Aesthetics, Custom Animations

---

## ⚡ Installation & Setup (Fresh System / After GitHub Pull)

### Step 1 — Make sure Python is installed
```bash
python --version
```
> If not installed, download from: https://www.python.org/downloads/
> ✅ Make sure to check **"Add Python to PATH"** during installation.

---

### Step 2 — Install all dependencies
Open terminal/command prompt **inside the project folder** and run:
```bash
pip install -r requirements.txt
```
> This installs Flask, Flask-CORS, Pandas, and Openpyxl automatically.

If `pip` doesn't work, try:
```bash
pip3 install -r requirements.txt
```

---

### Step 3 — Run the application
```bash
python app.py
```
You should see:
```
 * Running on http://127.0.0.1:5000
```

---

### Step 4 — Open in browser
Open your browser and go to:
```
http://localhost:5000
```

> ⚠️ **IMPORTANT**: Do NOT open `index.html` directly by double-clicking it.
> Always open via `http://localhost:5000` after running `python app.py`.

---

## ❌ Common Errors & Fixes

| Error | Reason | Fix |
|-------|--------|-----|
| `ModuleNotFoundError: No module named 'flask'` | Dependencies not installed | Run `pip install -r requirements.txt` |
| `ModuleNotFoundError: No module named 'pandas'` | Pandas missing | Run `pip install -r requirements.txt` |
| `Address already in use` / Port 5000 busy | Another app using port 5000 | Close other apps or change port in `app.py` |
| Page loads but file upload fails | Backend not running | Make sure `python app.py` is running in terminal |
| `python` not recognized | Python not in PATH | Reinstall Python with "Add to PATH" checked |

---

## 📁 Project Structure
```
EaseBiz-RecruitGuard-ATS-Audit/
├── app.py              ← Flask backend (main logic)
├── index.html          ← Frontend UI
├── style.css           ← Styling
├── script.js           ← Frontend JS
├── requirements.txt    ← Python dependencies
├── easebiz_logo.png    ← Logo
└── README.md           ← This file
```

---

## License
&copy; 2026 EaseBiz. All Rights Reserved.

