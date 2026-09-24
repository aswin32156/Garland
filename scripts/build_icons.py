import os
import base64
from PIL import Image

def build_all_icons():
    # Load the clean full logo with the garland and MALLIGAI GARLANDS branding
    src = Image.open('public/logo_full_clean.png').convert('RGBA')
    
    os.makedirs('app', exist_ok=True)
    os.makedirs('public', exist_ok=True)
    
    # 1. Master site logo
    src.save('public/logo.png', format='PNG', optimize=True)
    
    # 2. 512x512 icons (PWA & Next.js icon)
    icon_512 = src.resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save('app/icon.png', format='PNG', optimize=True)
    icon_512.save('public/icon.png', format='PNG', optimize=True)
    icon_512.save('public/icon-512.png', format='PNG', optimize=True)
    icon_512.save('public/android-chrome-512x512.png', format='PNG', optimize=True)
    
    # 3. 192x192 icons (Mobile Android)
    icon_192 = src.resize((192, 192), Image.Resampling.LANCZOS)
    icon_192.save('public/icon-192.png', format='PNG', optimize=True)
    icon_192.save('public/android-chrome-192x192.png', format='PNG', optimize=True)
    
    # 4. 180x180 icons (Apple Touch Icon)
    icon_180 = src.resize((180, 180), Image.Resampling.LANCZOS)
    icon_180.save('app/apple-icon.png', format='PNG', optimize=True)
    icon_180.save('public/apple-icon.png', format='PNG', optimize=True)
    icon_180.save('public/apple-touch-icon.png', format='PNG', optimize=True)
    
    # 5. Multi-size Favicon ICO (16, 32, 48, 64, 128, 256)
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    icon_256 = src.resize((256, 256), Image.Resampling.LANCZOS)
    icon_256.save('app/favicon.ico', format='ICO', sizes=ico_sizes)
    icon_256.save('public/favicon.ico', format='ICO', sizes=ico_sizes)
    
    # 6. Scalable SVG Favicon
    with open('public/icon.png', 'rb') as f:
        png_b64 = base64.b64encode(f.read()).decode('ascii')
        
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,{png_b64}" width="512" height="512" />
</svg>'''
    
    with open('public/favicon.svg', 'w', encoding='utf-8') as f:
        f.write(svg_content)
    with open('app/icon.svg', 'w', encoding='utf-8') as f:
        f.write(svg_content)
        
    print("All icons generated from the Malligai Garlands brand logo successfully!")

if __name__ == '__main__':
    build_all_icons()
