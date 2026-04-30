# EaseBiz RecruitGuard - ATS Data Audit Platform

![EaseBiz Logo](easebiz_logo.png)

## Overview
**EaseBiz RecruitGuard** is a high-performance, enterprise-grade ATS data audit and validation platform. Built for professional recruitment teams, it ensures 100% data integrity by strictly validating candidate records, mobile numbers, and critical fields like Skills, Experience, and Location.

## Key Features
- **Strict Mobile Validation**: Specialized logic for Indian mobile numbers, blocking dummy sequences (123456...) and repeating digits.
- **Multi-Number Extraction**: Automatically splits multiple numbers in a single cell into separate columns.
- **Dynamic Checkpoints**: Automatically detects and validates columns like Gender, Skills, Designation, Experience, and Location.
- **Detailed Audit Reports**: Generates a consolidated Excel report with a granular breakdown of every record.
- **Premium UI**: Modern glassmorphic interface with real-time audit stats and breakdown cards.
- **Crash-Proof**: Automatic filtering of illegal characters to prevent Excel file corruption.

## Tech Stack
- **Backend**: Python, Flask, Pandas, Openpyxl
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **Design**: Glassmorphism, 4D Aesthetics, Custom Animations

## Installation & Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/MihirBodana3011/EaseBiz-RecruitGuard-ATS-Audit.git
   ```
2. Install dependencies:
   ```bash
   pip install flask flask-cors pandas openpyxl
   ```
3. Run the application:
   ```bash
   python app.py
   ```
4. Open your browser and navigate to `http://localhost:5000`

## License
&copy; 2026 EaseBiz. All Rights Reserved.
