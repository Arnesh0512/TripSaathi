import os
from PIL import Image

ORIGINAL_JPG = r"C:\Users\Arnesh\.gemini\antigravity\brain\4b4aebbc-f8c7-4601-bffc-c4f46f1615d5\tripsaathi_logo_1792324805568.jpg"
ASSETS_DIR = r"C:\Users\Arnesh\Desktop\TripSaathi\frontend\assets"

def create_transparent_emblem(img):
    w, h = img.size
    px = img.load()
    
    # Sample background color near corners
    samples = [
        px[20, 20], px[w - 20, 20],
        px[20, 100], px[w - 20, 100]
    ]
    bg_r = sum(s[0] for s in samples) // len(samples)
    bg_g = sum(s[1] for s in samples) // len(samples)
    bg_b = sum(s[2] for s in samples) // len(samples)
    bg_color = (bg_r, bg_g, bg_b)
    print("Detected background color:", bg_color)
    
    # Create RGBA image
    rgba = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    rgba_px = rgba.load()
    
    min_x, max_x = w, 0
    min_y, max_y = h, 0
    
    # Emblem is situated above y=635 (text begins below 635)
    for y in range(h):
        for x in range(w):
            if y >= 635:
                continue
            r, g, b = px[x, y]
            # Euclidean distance in RGB
            dist = ((r - bg_r)**2 + (g - bg_g)**2 + (b - bg_b)**2) ** 0.5
            
            if dist > 14:
                # Alpha antialiasing ramp between 14 and 35
                alpha = min(255, int(255 * (dist - 12) / 20.0))
                rgba_px[x, y] = (r, g, b, alpha)
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y
                
    print(f"Emblem bbox: left={min_x}, top={min_y}, right={max_x}, bottom={max_y}")
    
    # Crop to emblem with a small 12px margin
    pad = 12
    crop_box = (
        max(0, min_x - pad),
        max(0, min_y - pad),
        min(w, max_x + pad),
        min(h, max_y + pad)
    )
    emblem_crop = rgba.crop(crop_box)
    return emblem_crop, bg_color

def main():
    im = Image.open(ORIGINAL_JPG).convert("RGB")
    emblem, bg_color = create_transparent_emblem(im)
    ew, eh = emblem.size
    print(f"Extracted emblem size: {ew}x{eh}, bg_color: {bg_color}")
    
    # 1. 1024x1024 Square App Icon
    icon_canvas = Image.new("RGBA", (1024, 1024), bg_color + (255,))
    scale = min(720 / ew, 720 / eh)
    nw, nh = int(ew * scale), int(eh * scale)
    scaled_emblem = emblem.resize((nw, nh), Image.Resampling.LANCZOS)
    px = (1024 - nw) // 2
    py = (1024 - nh) // 2
    icon_canvas.paste(scaled_emblem, (px, py), scaled_emblem)
    
    icon_rgb = icon_canvas.convert("RGB")
    icon_path = os.path.join(ASSETS_DIR, "icon.png")
    icon_rgb.save(icon_path, "PNG")
    
    preview_path = r"C:\Users\Arnesh\.gemini\antigravity\brain\4b4aebbc-f8c7-4601-bffc-c4f46f1615d5\tripsaathi_square_logo.png"
    icon_rgb.save(preview_path, "PNG")
    print(f"Saved {preview_path} and {icon_path}")

    # 2. logo.png (512x512) for in-app headers
    logo_512 = icon_rgb.resize((512, 512), Image.Resampling.LANCZOS)
    logo_path = os.path.join(ASSETS_DIR, "logo.png")
    logo_512.save(logo_path, "PNG")
    print(f"Saved {logo_path}")

    # 3. Android adaptive foreground (1024x1024 RGBA)
    fg_canvas = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    scale_fg = min(530 / ew, 530 / eh)
    fg_w, fg_h = int(ew * scale_fg), int(eh * scale_fg)
    scaled_fg = emblem.resize((fg_w, fg_h), Image.Resampling.LANCZOS)
    fg_px = (1024 - fg_w) // 2
    fg_py = (1024 - fg_h) // 2
    fg_canvas.paste(scaled_fg, (fg_px, fg_py), scaled_fg)
    fg_path = os.path.join(ASSETS_DIR, "android-icon-foreground.png")
    fg_canvas.save(fg_path, "PNG")
    print(f"Saved {fg_path}")

    # 4. Android adaptive background (1024x1024 RGB)
    bg_canvas = Image.new("RGB", (1024, 1024), bg_color)
    bg_path = os.path.join(ASSETS_DIR, "android-icon-background.png")
    bg_canvas.save(bg_path, "PNG")
    print(f"Saved {bg_path}")

    # 5. Favicon (192x192)
    fav = icon_rgb.resize((192, 192), Image.Resampling.LANCZOS)
    fav_path = os.path.join(ASSETS_DIR, "favicon.png")
    fav.save(fav_path, "PNG")
    print(f"Saved {fav_path}")

    # 6. Splash icon (512x512 RGBA)
    splash_canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    scale_sp = min(360 / ew, 360 / eh)
    sp_w, sp_h = int(ew * scale_sp), int(eh * scale_sp)
    scaled_sp = emblem.resize((sp_w, sp_h), Image.Resampling.LANCZOS)
    sp_px = (512 - sp_w) // 2
    sp_py = (512 - sp_h) // 2
    splash_canvas.paste(scaled_sp, (sp_px, sp_py), scaled_sp)
    splash_path = os.path.join(ASSETS_DIR, "splash-icon.png")
    splash_canvas.save(splash_path, "PNG")
    print(f"Saved {splash_path}")

    print("Success: Generated all assets cleanly with Pillow!")

if __name__ == "__main__":
    main()
