from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


IOS_SPECS = [
    ("iphone", "20x20", "2x", 40, "Icon-App-20x20@2x.png"),
    ("iphone", "20x20", "3x", 60, "Icon-App-20x20@3x.png"),
    ("iphone", "29x29", "2x", 58, "Icon-App-29x29@2x.png"),
    ("iphone", "29x29", "3x", 87, "Icon-App-29x29@3x.png"),
    ("iphone", "40x40", "2x", 80, "Icon-App-40x40@2x.png"),
    ("iphone", "40x40", "3x", 120, "Icon-App-40x40@3x.png"),
    ("iphone", "60x60", "2x", 120, "Icon-App-60x60@2x.png"),
    ("iphone", "60x60", "3x", 180, "Icon-App-60x60@3x.png"),
    ("ios-marketing", "1024x1024", "1x", 1024, "Icon-App-1024x1024@1x.png"),
]

ANDROID_SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}


def compose_icon(
    logo_path: Path,
    background_hex: str,
    *,
    size: int = 1024,
    max_logo_ratio: float = 0.86,
) -> Image.Image:
    if not logo_path.exists():
        raise FileNotFoundError(f"Logo file not found: {logo_path}")

    logo = Image.open(logo_path).convert("RGBA")
    canvas = Image.new("RGBA", (size, size), background_hex)

    max_w = int(size * max_logo_ratio)
    max_h = int(size * max_logo_ratio)
    logo.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)

    x = (size - logo.width) // 2
    y = (size - logo.height) // 2
    canvas.paste(logo, (x, y), logo)

    return canvas.convert("RGB")



def ensure_icons(project_root: Path) -> None:
    logo_light_path = project_root / "public" / "Site_Logo" / "color_big.png"
    logo_dark_path = project_root / "public" / "Site_Logo" / "color_big_white.png"

    source_dir = project_root / "src" / "assets" / "app-icon"
    source_dir.mkdir(parents=True, exist_ok=True)

    source_icon_light = compose_icon(
        logo_light_path,
        "#FFFFFF",
    )
    source_icon_dark = compose_icon(
        logo_dark_path,
        "#000000",
    )

    source_light_path = source_dir / "icon-light-source-1024.png"
    source_dark_path = source_dir / "icon-dark-source-1024.png"
    source_legacy_path = source_dir / "icon-source-1024.png"

    source_icon_light.save(source_light_path, format="PNG")
    source_icon_dark.save(source_dark_path, format="PNG")
    source_icon_light.save(source_legacy_path, format="PNG")

    appicon_dir = project_root / "ios" / "SmartLife" / "Images.xcassets" / "AppIcon.appiconset"
    appicon_dir.mkdir(parents=True, exist_ok=True)

    contents_images = []
    for idiom, size_text, scale, px, filename in IOS_SPECS:
        light_icon = source_icon_light.resize((px, px), Image.Resampling.LANCZOS)
        dark_icon = source_icon_dark.resize((px, px), Image.Resampling.LANCZOS)

        dark_filename = filename.replace(".png", "-dark.png")

        light_icon.save(appicon_dir / filename, format="PNG")
        dark_icon.save(appicon_dir / dark_filename, format="PNG")

        contents_images.append(
            {
                "idiom": idiom,
                "size": size_text,
                "scale": scale,
                "filename": filename,
            }
        )
        contents_images.append(
            {
                "idiom": idiom,
                "size": size_text,
                "scale": scale,
                "filename": dark_filename,
                "appearances": [
                    {
                        "appearance": "luminosity",
                        "value": "dark",
                    }
                ],
            }
        )

    contents = {
        "images": contents_images,
        "info": {"author": "xcode", "version": 1},
    }
    (appicon_dir / "Contents.json").write_text(json.dumps(contents, indent=2) + "\n", encoding="utf-8")

    res_dir = project_root / "android" / "app" / "src" / "main" / "res"
    for folder, px in ANDROID_SIZES.items():
        dst_dir = res_dir / folder
        dst_dir.mkdir(parents=True, exist_ok=True)
        light_icon = source_icon_light.resize((px, px), Image.Resampling.LANCZOS)
        light_icon.save(dst_dir / "ic_launcher.png", format="PNG")
        light_icon.save(dst_dir / "ic_launcher_round.png", format="PNG")

        night_dir = res_dir / folder.replace("mipmap-", "mipmap-night-")
        night_dir.mkdir(parents=True, exist_ok=True)
        dark_icon = source_icon_dark.resize((px, px), Image.Resampling.LANCZOS)
        dark_icon.save(night_dir / "ic_launcher.png", format="PNG")
        dark_icon.save(night_dir / "ic_launcher_round.png", format="PNG")

    print("Generated light icon:", source_light_path)
    print("Generated dark icon:", source_dark_path)
    print("Updated iOS + Android launcher icons (light and dark variants).")


if __name__ == "__main__":
    ensure_icons(Path(__file__).resolve().parents[1])
