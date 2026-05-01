import os
import pandas as pd
import re
import io
import json
import base64
import json
import base64
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app, expose_headers=['X-Audit-Stats'])

# Pre-compiled regexes for maximum performance
RE_MULTIPLE = re.compile(r'[,/|;]|\band\b', re.IGNORECASE)
RE_NON_NUMERIC = re.compile(r'\D')
RE_MOBILE_PATTERN = re.compile(r'(?:(?:\+|00)?(?:91|091|0)[\s\-\(\)\.]*)?([6789](?:[\s\-\(\)\.]*\d){9})')
RE_DUMMY_MOBILE_SEQ = re.compile(r'(1234567|2345678|3456789|4567890|0987654|9876543|8765432|7654321)')
RE_REPEATED_DIGITS = re.compile(r'(.)\1{6,}')
RE_REPEATING_ZEROS = re.compile(r'0{5,}$')
ILLEGAL_CHARACTERS_RE = re.compile(r'[\000-\010]|[\013-\014]|[\016-\037]')

RE_EMAIL_FORMAT = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
RE_NAME_SPAM = re.compile(r'(.)\1{4,}')
RE_NAME_STARTS_WITH_NUM = re.compile(r'^\d')

def clean_phone_numbers(mobile_str):
    if pd.isna(mobile_str) or str(mobile_str).strip().lower() == 'nan' or not str(mobile_str).strip():
        return [], "Blank"
        
    p_str = str(mobile_str).strip()
    if p_str.endswith('.0'): p_str = p_str[:-2]
    
    matches = RE_MOBILE_PATTERN.findall(p_str)
    
    valid_numbers = []
    for match in matches:
        num = RE_NON_NUMERIC.sub('', match)
        if num and len(num) == 10:
            valid_numbers.append(num)
            
    seen = set()
    unique_numbers = []
    for num in valid_numbers:
        if num not in seen:
            if RE_DUMMY_MOBILE_SEQ.search(num):
                continue
            if RE_REPEATED_DIGITS.search(num):
                continue
            if RE_REPEATING_ZEROS.search(num):
                continue
            seen.add(num)
            unique_numbers.append(num)
            
    if not unique_numbers:
        return [], "Invalid Dummy/Repeating Number"
        
    return unique_numbers, None

def is_irrelevant_name(name):
    if pd.isna(name) or str(name).strip() == "":
        return "Blank"
    
    name_str = str(name).strip().lower()
    if len(name_str) < 2:
        return "Too Short"
        
    if '@' in name_str:
        return "Contains Email"
    
    if any(char in name_str for char in ['?', '!', '*', '#', '$', '%']):
        return "Contains Garbage Characters"
        
    if name_str.replace(" ", "").isdigit():
        return "Numeric Name"
        
    if RE_NAME_STARTS_WITH_NUM.match(name_str):
        return "Starts with Number"
        
    if RE_NAME_SPAM.search(name_str):
        return "Spam Name"
        
    irrelevant_terms = ['test', 'abc', 'xyz', 'na', 'n/a', 'unknown', 'null', 'none', '---', '...', '.', 'dummy']
    if name_str in irrelevant_terms:
        return "Irrelevant Term"
        
    return None

def validate_email_format(email):
    if pd.isna(email) or str(email).strip() == "":
        return "Blank"
    
    email_str = str(email).strip().lower()
    
    if RE_MULTIPLE.search(email_str):
        return "Multiple Emails Provided"
        
    dummy_emails = ['na@na.com', 'test@test.com', 'abc@xyz.com', 'none@none.com', 'nil@nil.com', 'null@null.com']
    if email_str in dummy_emails:
        return "Dummy/Irrelevant Email"
        
    if not RE_EMAIL_FORMAT.match(email_str):
        return "Invalid Format"
    
    return None

def find_column(df, possible_names):
    for col in df.columns:
        if any(p.lower() in col.lower() for p in possible_names):
            return col
    return None

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    try:
        if file.filename.endswith('.csv'):
            try:
                df = pd.read_csv(file, encoding_errors='replace', dtype=str)
            except Exception:
                file.seek(0)
                try:
                    df = pd.read_csv(file, encoding='latin-1', encoding_errors='replace', dtype=str)
                except Exception:
                    file.seek(0)
                    df = pd.read_csv(file, encoding='cp1252', encoding_errors='replace', dtype=str)
        else:
            df = pd.read_excel(file, dtype=str)
        
        preview_data = df.head(20).fillna("").to_dict(orient='records')
        return jsonify({
            "filename": file.filename,
            "rowCount": len(df),
            "preview": preview_data,
            "columns": list(df.columns)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/process', methods=['POST'])
def process_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    try:
        if file.filename.endswith('.csv'):
            try:
                df = pd.read_csv(file, dtype=str, encoding_errors='replace')
            except Exception:
                file.seek(0)
                try:
                    df = pd.read_csv(file, encoding='latin-1', dtype=str, encoding_errors='replace')
                except Exception:
                    file.seek(0)
                    df = pd.read_csv(file, encoding='cp1252', dtype=str, encoding_errors='replace')
        else:
            df = pd.read_excel(file, dtype=str)
        
        df = df.fillna("")

        name_col = find_column(df, ['name', 'candidate', 'full name'])
        mobile_col = find_column(df, ['mobile', 'phone', 'contact'])
        email_col = find_column(df, ['email', 'mail'])
        resume_col = find_column(df, ['resume', 'attached', 'cv'])
        
        # Additional Column Checks
        gender_col = find_column(df, ['gender'])
        created_by_col = find_column(df, ['createdby', 'created by'])
        skills_col = find_column(df, ['key_skills', 'key skills', 'skills'])
        designation_col = find_column(df, ['designation'])
        experience_col = find_column(df, ['total_experi', 'total experi', 'experience'])
        location_col = find_column(df, ['current_loca', 'current loca', 'location', 'city'])

        records = df.to_dict('records')
        
        mobile_counts = {}
        email_counts = {}
        
        # Pass 1: Duplicate Counts
        for row in records:
            if mobile_col:
                m_val = str(row.get(mobile_col, "")).strip()
                extracted, _ = clean_phone_numbers(m_val)
                for m in extracted:
                    mobile_counts[m] = mobile_counts.get(m, 0) + 1
            
            if email_col:
                e_val = str(row.get(email_col, "")).strip().lower()
                if e_val:
                    email_counts[e_val] = email_counts.get(e_val, 0) + 1

        output_data = []
        max_mobiles = 0
        total_valid = 0
        total_errors = 0

        # Pass 2: Main Processing
        for idx, row in enumerate(records):
            try:
                row_errors = []
                
                # Check Fully Blank
                if all(str(v).strip() == "" for v in row.values()):
                    row_copy = row.copy()
                    row_copy["Name Check"] = "Blank"
                    row_copy["Mobile Check"] = "Blank"
                    row_copy["Email Check"] = "Blank"
                    if resume_col: row_copy["Resume Check"] = "Blank"
                    if gender_col: row_copy["Gender Check"] = "Blank"
                    if created_by_col: row_copy["CreatedBy Check"] = "Blank"
                    if skills_col: row_copy["Skills Check"] = "Blank"
                    if designation_col: row_copy["Designation Check"] = "Blank"
                    if experience_col: row_copy["Experience Check"] = "Blank"
                    if location_col: row_copy["Location Check"] = "Blank"
                    
                    row_copy["All Errors"] = "Fully Blank Record"
                    output_data.append(row_copy)
                    total_errors += 1
                    continue

                # Name Validation
                name_val = str(row.get(name_col, "")).strip() if name_col else ""
                n_issue = is_irrelevant_name(name_val)
                if n_issue:
                    row_errors.append(f"Name: {n_issue}")

                # Mobile Validation
                raw_mobile = str(row.get(mobile_col, "")).strip() if mobile_col else ""
                extracted_mobiles, m_issue = clean_phone_numbers(raw_mobile)
                
                final_mobiles = []
                for m in extracted_mobiles:
                    if mobile_counts.get(m, 0) > 1:
                        row_errors.append(f"Mobile Duplicate ({m})")
                        m_issue = "Contains Duplicate"
                    else:
                        final_mobiles.append(m)
                
                if m_issue and not "Duplicate" in str(m_issue):
                    row_errors.append(f"Mobile: {m_issue}")
                    
                max_mobiles = max(max_mobiles, len(final_mobiles))

                # Email Validation
                email_val = str(row.get(email_col, "")).strip() if email_col else ""
                e_issue = validate_email_format(email_val)
                if not e_issue and email_val:
                    if email_counts.get(email_val.lower(), 0) > 1:
                        e_issue = "Duplicate"
                
                if e_issue:
                    row_errors.append(f"Email: {e_issue}")

                # Resume Validation
                r_issue = None
                if resume_col:
                    res_val = str(row.get(resume_col, "")).strip().lower()
                    if res_val in ["no", "n", "", "null", "none", "nan"]:
                        r_issue = "Missing"
                        row_errors.append("Resume Missing")

                # Construct Row
                row_copy = row.copy()
                row_copy["Name Check"] = n_issue if n_issue else "Valid"
                row_copy["Mobile Check"] = m_issue if m_issue else "Valid"
                row_copy["Email Check"] = e_issue if e_issue else "Valid"
                if resume_col:
                    row_copy["Resume Check"] = r_issue if r_issue else "Valid"
                    
                # Extra Column Blank Checks
                extra_checks = [
                    ("Gender", gender_col),
                    ("CreatedBy", created_by_col),
                    ("Skills", skills_col),
                    ("Designation", designation_col),
                    ("Experience", experience_col),
                    ("Location", location_col)
                ]
                
                for col_name, col_key in extra_checks:
                    if col_key:
                        val = str(row.get(col_key, "")).strip().lower()
                        if val in ["", "nan", "null", "none", "n/a"]:
                            row_errors.append(f"{col_name} Missing")
                            row_copy[f"{col_name} Check"] = "Blank"
                        else:
                            row_copy[f"{col_name} Check"] = "Valid"
                
                row_copy["_temp_mobiles"] = final_mobiles
                row_copy["All Errors"] = " | ".join(row_errors) if row_errors else "Clean Record"
                
                if not row_errors:
                    total_valid += 1
                else:
                    total_errors += 1
                    
                output_data.append(row_copy)
            except Exception as e:
                row_copy = row.copy()
                row_copy["All Errors"] = f"Processing Error: {str(e)}"
                output_data.append(row_copy)
                total_errors += 1

        # Post-process columns
        for row in output_data:
            if "_temp_mobiles" in row:
                mobiles = row.pop("_temp_mobiles")
                for i in range(max_mobiles):
                    col_name = f"Cleaned Mobile {i+1}" if max_mobiles > 1 else "Cleaned Mobile No"
                    row[col_name] = mobiles[i] if i < len(mobiles) else ""

        # Reorder columns to put appended columns at the end
        if output_data:
            df_final = pd.DataFrame(output_data)
            cols = df_final.columns.tolist()
            # Bring special columns to end
            special_cols = ["Name Check", "Mobile Check", "Email Check"]
            if resume_col: special_cols.append("Resume Check")
            
            if gender_col: special_cols.append("Gender Check")
            if created_by_col: special_cols.append("CreatedBy Check")
            if skills_col: special_cols.append("Skills Check")
            if designation_col: special_cols.append("Designation Check")
            if experience_col: special_cols.append("Experience Check")
            if location_col: special_cols.append("Location Check")
            
            for i in range(max_mobiles):
                col_name = f"Cleaned Mobile {i+1}" if max_mobiles > 1 else "Cleaned Mobile No"
                special_cols.append(col_name)
            special_cols.append("All Errors")
            
            for col in special_cols:
                if col in cols:
                    cols.append(cols.pop(cols.index(col)))
            
            df_final = df_final[cols]
            
            # Clean illegal characters to prevent Excel corruption
            def remove_illegal_chars(val):
                if isinstance(val, str):
                    return ILLEGAL_CHARACTERS_RE.sub('', val)
                return val
            
            df_final = df_final.apply(lambda col: col.map(remove_illegal_chars))
        else:
            df_final = pd.DataFrame()

        # Build detailed summary
        summary_data = [
            {"Metric": "Total Records Processed", "Count": len(records)},
            {"Metric": "Perfectly Clean Records", "Count": total_valid},
            {"Metric": "Records with Errors", "Count": total_errors},
            {"Metric": "", "Count": ""}
        ]
        
        breakdown_dict = {}
        for col in special_cols:
            if col.endswith("Check"):
                metric_name = col.replace(" Check", "")
                summary_data.append({"Metric": f"--- {metric_name} Breakdown ---", "Count": ""})
                counts = df_final[col].value_counts().to_dict()
                breakdown_dict[metric_name] = counts
                for k, v in counts.items():
                    summary_data.append({"Metric": f"  • {k}", "Count": v})
                summary_data.append({"Metric": "", "Count": ""})

        # Generate Excel in memory
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            pd.DataFrame(summary_data).to_excel(writer, sheet_name='Audit Summary', index=False)
            df_final.to_excel(writer, sheet_name='Audited Data', index=False)

        # Encode stats for frontend UI
        stats = {
            "total": len(records),
            "errors": total_errors,
            "breakdown": breakdown_dict
        }
        stats_b64 = base64.b64encode(json.dumps(stats).encode('utf-8')).decode('utf-8')

        output.seek(0)
        response = send_file(
            output,
            as_attachment=True,
            download_name=f"Audit_Report_{file.filename.split('.')[0]}.xlsx",
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response.headers['X-Audit-Stats'] = stats_b64
        return response

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/')
def index():
    return send_file('index.html')

@app.route('/style.css')
def serve_css():
    return send_file('style.css')

@app.route('/script.js')
def serve_js():
    return send_file('script.js')

@app.route('/easebiz_logo.png')
def serve_logo():
    return send_file('easebiz_logo.png')

if __name__ == '__main__':
    app.run(port=5000, debug=True)
