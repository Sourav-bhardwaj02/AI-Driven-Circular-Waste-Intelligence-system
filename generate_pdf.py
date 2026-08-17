import markdown
import subprocess
import os

with open('PRD.md', 'r', encoding='utf-8') as f:
    md_content = f.read()

html_content = markdown.markdown(md_content, extensions=['tables', 'fenced_code', 'toc', 'nl2br'])

full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>WasteWise — Product Requirement Document (PRD)</title>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    @page {{
        size: A4;
        margin: 20mm 15mm 20mm 15mm;
        @bottom-right {{
            content: "Page " counter(page);
            font-family: 'Inter', sans-serif;
            font-size: 9pt;
            color: #64748b;
        }}
    }}

    body {{
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #1e293b;
        line-height: 1.6;
        font-size: 10.5pt;
        background-color: #ffffff;
        margin: 0;
        padding: 0;
    }}

    /* Header Banner */
    .banner {{
        background: linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%);
        color: #ffffff;
        padding: 30px;
        border-radius: 12px;
        margin-bottom: 30px;
        box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.3);
    }}

    .banner h1 {{
        color: #ffffff !important;
        margin: 0 0 10px 0 !important;
        font-size: 24pt !important;
        font-weight: 800;
        border: none !important;
        padding: 0 !important;
    }}

    .banner p {{
        margin: 4px 0;
        font-size: 11pt;
        opacity: 0.95;
    }}

    h1, h2, h3, h4 {{
        color: #0f172a;
        font-weight: 700;
        page-break-after: avoid;
    }}

    h1 {{
        font-size: 20pt;
        border-bottom: 2.5px solid #10b981;
        padding-bottom: 8px;
        margin-top: 30px;
        margin-bottom: 16px;
    }}

    h2 {{
        font-size: 14pt;
        color: #047857;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 6px;
        margin-top: 26px;
        margin-bottom: 12px;
    }}

    h3 {{
        font-size: 12pt;
        color: #1e293b;
        margin-top: 20px;
        margin-bottom: 10px;
    }}

    h4 {{
        font-size: 11pt;
        color: #334155;
        margin-top: 14px;
        margin-bottom: 6px;
    }}

    p, li {{
        font-size: 10pt;
        color: #334155;
    }}

    /* Tables */
    table {{
        width: 100%;
        border-collapse: collapse;
        margin: 18px 0;
        font-size: 9.5pt;
        page-break-inside: avoid;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        border-radius: 8px;
        overflow: hidden;
    }}

    th {{
        background-color: #047857;
        color: #ffffff;
        text-align: left;
        padding: 10px 14px;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 8.5pt;
        letter-spacing: 0.5px;
    }}

    td {{
        padding: 9px 14px;
        border-bottom: 1px solid #f1f5f9;
        color: #334155;
    }}

    tr:nth-child(even) {{
        background-color: #f8fafc;
    }}

    tr:hover {{
        background-color: #f1f5f9;
    }}

    /* Code & Pre */
    code {{
        font-family: 'Consolas', 'Courier New', monospace;
        background-color: #f1f5f9;
        color: #0f766e;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 9pt;
    }}

    pre {{
        background-color: #0f172a;
        color: #e2e8f0;
        padding: 16px;
        border-radius: 8px;
        overflow-x: auto;
        font-size: 9pt;
        line-height: 1.5;
        page-break-inside: avoid;
    }}

    pre code {{
        background-color: transparent;
        color: #38bdf8;
        padding: 0;
    }}

    /* Blockquotes & Badges */
    blockquote {{
        border-left: 4px solid #10b981;
        background-color: #ecfdf5;
        margin: 16px 0;
        padding: 12px 18px;
        border-radius: 0 8px 8px 0;
        color: #065f46;
        font-style: italic;
    }}

    ul, ol {{
        padding-left: 22px;
        margin-top: 8px;
        margin-bottom: 14px;
    }}

    li {{
        margin-bottom: 4px;
    }}

    hr {{
        border: none;
        height: 1px;
        background: #e2e8f0;
        margin: 28px 0;
    }}
</style>
</head>
<body>

<div class="banner">
    <h1>WasteWise Platform PRD</h1>
    <p><strong>AI-Driven Circular Waste Intelligence System</strong></p>
    <p>Version: 2.0.0 | Author: Antigravity AI & WasteWise Core Engineering Team</p>
    <p>Date: August 2026 | Document Status: Approved Blueprint</p>
</div>

{html_content}

</body>
</html>
"""

with open('PRD.html', 'w', encoding='utf-8') as f:
    f.write(full_html)

print("Generated PRD.html successfully.")

cmd = "libreoffice --headless --convert-to pdf --outdir /home/sourav/Desktop/Projects/wastewise PRD.html"
subprocess.run(cmd, shell=True, check=True)
print("Converted PRD.html to PRD.pdf successfully!")
