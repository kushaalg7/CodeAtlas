"""
Generate clean QR code placeholder badges using PIL
"""
import os
from PIL import Image, ImageDraw

os.makedirs("docs/assets", exist_ok=True)

def draw_qr_badge(path, label):
    img = Image.new('RGB', (180, 180), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    # Draw border
    draw.rectangle([4, 4, 175, 175], outline=(30, 41, 59), width=3)
    
    # Draw corner position patterns (typical QR squares)
    for ox, oy in [(14, 14), (110, 14), (14, 110)]:
        draw.rectangle([ox, oy, ox+46, oy+46], fill=(15, 23, 42))
        draw.rectangle([ox+8, oy+8, ox+38, oy+38], fill=(255, 255, 255))
        draw.rectangle([ox+16, oy+16, ox+30, oy+30], fill=(15, 23, 42))
    
    # Draw data grid dots
    import random
    rng = random.Random(42 if "code" in label else 99)
    for x in range(12, 168, 8):
        for y in range(12, 168, 8):
            # Skip corners
            if (x < 70 and y < 70) or (x > 100 and y < 70) or (x < 70 and y > 100):
                continue
            if rng.random() > 0.45:
                draw.rectangle([x, y, x+6, y+6], fill=(15, 23, 42))
                
    img.save(path)

draw_qr_badge("docs/assets/qr_code.png", "code")
draw_qr_badge("docs/assets/qr_video.png", "video")
print("[SUCCESS] QR badges generated via PIL!")
