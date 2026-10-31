"""
Generate high-density, real scannable QR codes using python-qrcode
"""
import os
import qrcode
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

os.makedirs("docs/assets", exist_ok=True)
os.makedirs(r"C:\Users\Student\Downloads", exist_ok=True)

# 1. Generate real QR code for complete source code
# Primary URL: Local network IP so judges/students can scan and load full code
code_url = "http://128.0.88.136:3000/code"

qr = qrcode.QRCode(
    version=None, # auto
    error_correction=qrcode.constants.ERROR_CORRECT_H, # High error correction (30%)
    box_size=12,
    border=2,
)
qr.add_data(code_url)
qr.make(fit=True)
img_code = qr.make_image(fill_color="#0F172A", back_color="white")
img_code.save("docs/assets/qr_code.png")
img_code.save(r"C:\Users\Student\Downloads\CODE_ATLAS_CODE_QR.png")
print(f"[SUCCESS] QR code for code generated at {code_url}")

# 2. Generate real QR code for demo video
video_url = "http://128.0.88.136:3000"
qr_v = qrcode.QRCode(
    version=None,
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=12,
    border=2,
)
qr_v.add_data(video_url)
qr_v.make(fit=True)
img_video = qr_v.make_image(fill_color="#0F172A", back_color="white")
img_video.save("docs/assets/qr_video.png")

# 3. Create a clean PDF flyer for the QR Code
pdf_path = r"C:\Users\Student\Downloads\CODE_ATLAS_CODE_QR.pdf"
doc = SimpleDocTemplate(
    pdf_path,
    pagesize=letter,
    leftMargin=54,
    rightMargin=54,
    topMargin=54,
    bottomMargin=54
)

styles = getSampleStyleSheet()
title_style = ParagraphStyle(
    'QRTitle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=24,
    leading=28,
    textColor=colors.HexColor("#0F172A"),
    alignment=1
)
sub_style = ParagraphStyle(
    'QRSub',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=13,
    leading=17,
    textColor=colors.HexColor("#2563EB"),
    alignment=1
)
url_style = ParagraphStyle(
    'QRUrl',
    parent=styles['Normal'],
    fontName='Courier-Bold',
    fontSize=12,
    leading=15,
    textColor=colors.HexColor("#0F172A"),
    alignment=1
)
desc_style = ParagraphStyle(
    'QRDesc',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=10,
    leading=14,
    textColor=colors.HexColor("#475569"),
    alignment=1
)

story = [
    Spacer(1, 20),
    Paragraph("CODE ATLAS", title_style),
    Spacer(1, 6),
    Paragraph("Scan to Access Complete Project Source Code", sub_style),
    Spacer(1, 4),
    Paragraph("CODEMIND Spec v2  |  GenAI Hackathon 2026", desc_style),
    Spacer(1, 24),
    RLImage(r"C:\Users\Student\Downloads\CODE_ATLAS_CODE_QR.png", width=280, height=280),
    Spacer(1, 20),
    Paragraph(code_url, url_style),
    Spacer(1, 10),
    Paragraph("Point your smartphone camera at this QR code to view and download all 39 consolidated source code files (6,365 lines).", desc_style),
    Spacer(1, 20),
    Paragraph("Local File: <code>CODE_ATLAS_ALL_SOURCE_CODE.txt</code> (220 KB)", desc_style),
]

doc.build(story)
print(f"[SUCCESS] QR Code PDF flyer generated at {pdf_path}")
