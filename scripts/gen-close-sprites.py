#!/usr/bin/env python3
"""Generates the high-resolution close-up sprite atlas for close-view exercises:
bundle/assets/close/sprites.png and bundle/assets/close/sprites.json
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "bundle" / "assets" / "close"
OUT_DIR.mkdir(parents=True, exist_ok=True)

FRAME_SIZE = 128
COLUMNS = 4

# Colors
DOG_BASE = (240, 230, 215, 255) # Neutral light coat for tinting
DOG_SHADOW = (200, 190, 175, 255)
DOG_DARK = (80, 70, 60, 255) # Nose, eyes
COLLAR_COLOR = (220, 60, 50, 255) # Red collar

DISTRACTOR_COAT = (70, 65, 75, 255) # Dark distractor dog
DISTRACTOR_EYE = (255, 200, 80, 255)
DISTRACTOR_COLLAR = (80, 160, 240, 255)

HANDLER_TORSO = (60, 85, 120, 255) # Blue coat
HANDLER_SKIN = (240, 195, 160, 255) # Hands
HANDLER_GLOVE = (180, 140, 110, 255)

SIDEWALK_COLOR = (195, 190, 185, 255)
SIDEWALK_LINE = (165, 160, 155, 255)
CURB_COLOR = (140, 135, 130, 255)
WALL_COLOR = (170, 110, 90, 255)

frames_dict = {}

def create_sprite(draw_fn):
    im = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    draw_fn(draw)
    return im

def draw_dog_neutral(draw):
    # Body
    draw.ellipse([30, 55, 95, 105], fill=DOG_BASE, outline=DOG_SHADOW)
    # Haunches & chest
    draw.ellipse([45, 45, 90, 90], fill=DOG_BASE)
    # Neck & Head
    draw.ellipse([65, 25, 105, 65], fill=DOG_BASE, outline=DOG_SHADOW)
    # Snout
    draw.polygon([(85, 40), (115, 50), (95, 62)], fill=DOG_BASE)
    # Nose
    draw.ellipse([110, 48, 116, 54], fill=DOG_DARK)
    # Eye
    draw.ellipse([88, 38, 94, 44], fill=DOG_DARK)
    # Ear (neutral downward fold)
    draw.polygon([(68, 25), (60, 48), (76, 42)], fill=DOG_SHADOW)
    # Collar
    draw.line([(70, 60), (84, 52)], fill=COLLAR_COLOR, width=4)
    # Legs (sitting/stance)
    draw.rectangle([40, 85, 52, 118], fill=DOG_BASE)
    draw.rectangle([75, 85, 87, 118], fill=DOG_BASE)
    # Tail
    draw.arc([15, 65, 45, 95], start=90, end=270, fill=DOG_BASE, width=6)

def draw_dog_alert(draw):
    # Body tense
    draw.ellipse([32, 52, 95, 102], fill=DOG_BASE, outline=DOG_SHADOW)
    # Upright chest
    draw.ellipse([50, 40, 92, 85], fill=DOG_BASE)
    # Elevated Head
    draw.ellipse([68, 16, 106, 56], fill=DOG_BASE, outline=DOG_SHADOW)
    # Snout forward
    draw.polygon([(88, 30), (120, 38), (98, 52)], fill=DOG_BASE)
    # Nose
    draw.ellipse([115, 36, 122, 42], fill=DOG_DARK)
    # Focused eye
    draw.ellipse([92, 28, 99, 35], fill=DOG_DARK)
    # Pricked ears (high and alert)
    draw.polygon([(72, 18), (78, 2), (85, 18)], fill=DOG_SHADOW)
    draw.polygon([(60, 22), (64, 6), (72, 22)], fill=DOG_SHADOW)
    # Collar
    draw.line([(72, 52), (86, 44)], fill=COLLAR_COLOR, width=4)
    # Legs upright
    draw.rectangle([44, 80, 56, 118], fill=DOG_BASE)
    draw.rectangle([80, 80, 92, 118], fill=DOG_BASE)
    # Tail raised
    draw.line([(32, 65), (18, 45)], fill=DOG_BASE, width=6)

def draw_dog_strained(draw):
    # Forward-leaning body straining against leash
    draw.ellipse([25, 58, 92, 105], fill=DOG_BASE, outline=DOG_SHADOW)
    # Forward thrust chest
    draw.ellipse([55, 48, 102, 92], fill=DOG_BASE)
    # Strained neck
    draw.ellipse([78, 30, 118, 70], fill=DOG_BASE, outline=DOG_SHADOW)
    # Snout pulled forward
    draw.polygon([(100, 44), (126, 50), (105, 66)], fill=DOG_BASE)
    # Open mouth / tense jaw
    draw.line([(108, 58), (124, 52)], fill=DOG_DARK, width=2)
    # Nose
    draw.ellipse([122, 48, 128, 54], fill=DOG_DARK)
    # Tense eye
    draw.ellipse([102, 38, 108, 44], fill=DOG_DARK)
    # Pinned back ears
    draw.polygon([(78, 32), (60, 38), (75, 46)], fill=DOG_SHADOW)
    # Strained taut collar
    draw.line([(82, 65), (96, 56)], fill=COLLAR_COLOR, width=5)
    # Leaning braced paws
    draw.polygon([(35, 90), (22, 120), (36, 120)], fill=DOG_BASE)
    draw.polygon([(75, 88), (65, 120), (79, 120)], fill=DOG_BASE)

def draw_dog_relaxed(draw):
    # Soft curved resting body
    draw.ellipse([28, 62, 96, 110], fill=DOG_BASE, outline=DOG_SHADOW)
    draw.ellipse([46, 55, 88, 95], fill=DOG_BASE)
    # Soft lowered head
    draw.ellipse([64, 38, 100, 75], fill=DOG_BASE, outline=DOG_SHADOW)
    # Snout sniffing slightly downward
    draw.polygon([(82, 54), (110, 68), (90, 76)], fill=DOG_BASE)
    # Nose
    draw.ellipse([106, 66, 112, 72], fill=DOG_DARK)
    # Soft almond eye
    draw.arc([85, 48, 93, 56], start=0, end=180, fill=DOG_DARK, width=2)
    # Drooped relaxed ear
    draw.polygon([(64, 40), (52, 65), (70, 58)], fill=DOG_SHADOW)
    # Loose collar
    draw.line([(68, 72), (80, 66)], fill=COLLAR_COLOR, width=3)
    # Settled paws
    draw.rectangle([40, 95, 55, 118], fill=DOG_BASE)
    draw.rectangle([72, 95, 87, 118], fill=DOG_BASE)

def draw_dog_head_turn(draw):
    # Body facing right/forward
    draw.ellipse([30, 55, 95, 105], fill=DOG_BASE, outline=DOG_SHADOW)
    # Head turned back towards handler (looking left/upward)
    draw.ellipse([45, 22, 85, 62], fill=DOG_BASE, outline=DOG_SHADOW)
    # Snout turned leftward
    draw.polygon([(52, 38), (22, 32), (45, 52)], fill=DOG_BASE)
    # Nose
    draw.ellipse([20, 30, 26, 36], fill=DOG_DARK)
    # Eye looking back at handler
    draw.ellipse([46, 30, 53, 37], fill=DOG_DARK)
    # Perked ear
    draw.polygon([(62, 22), (68, 6), (78, 22)], fill=DOG_SHADOW)
    # Collar
    draw.line([(62, 58), (76, 52)], fill=COLLAR_COLOR, width=4)
    # Paws
    draw.rectangle([40, 85, 52, 118], fill=DOG_BASE)
    draw.rectangle([75, 85, 87, 118], fill=DOG_BASE)

def draw_distractor_walk0(draw):
    # Approaching distractor dog walk frame 0
    draw.ellipse([32, 50, 96, 100], fill=DISTRACTOR_COAT)
    draw.ellipse([65, 22, 105, 62], fill=DISTRACTOR_COAT)
    draw.polygon([(85, 38), (118, 46), (95, 60)], fill=DISTRACTOR_COAT)
    draw.ellipse([114, 44, 120, 50], fill=(20, 20, 20, 255))
    draw.ellipse([88, 34, 95, 41], fill=DISTRACTOR_EYE)
    draw.polygon([(70, 22), (76, 4), (86, 22)], fill=DISTRACTOR_COAT)
    draw.line([(70, 58), (84, 50)], fill=DISTRACTOR_COLLAR, width=4)
    # Walk legs: front forward, back backward
    draw.line([(45, 85), (35, 118)], fill=DISTRACTOR_COAT, width=7)
    draw.line([(80, 85), (92, 118)], fill=DISTRACTOR_COAT, width=7)

def draw_distractor_walk1(draw):
    # Approaching distractor dog walk frame 1
    draw.ellipse([32, 50, 96, 100], fill=DISTRACTOR_COAT)
    draw.ellipse([65, 22, 105, 62], fill=DISTRACTOR_COAT)
    draw.polygon([(85, 38), (118, 46), (95, 60)], fill=DISTRACTOR_COAT)
    draw.ellipse([114, 44, 120, 50], fill=(20, 20, 20, 255))
    draw.ellipse([88, 34, 95, 41], fill=DISTRACTOR_EYE)
    draw.polygon([(70, 22), (76, 4), (86, 22)], fill=DISTRACTOR_COAT)
    draw.line([(70, 58), (84, 50)], fill=DISTRACTOR_COLLAR, width=4)
    # Walk legs: front backward, back forward
    draw.line([(45, 85), (55, 118)], fill=DISTRACTOR_COAT, width=7)
    draw.line([(80, 85), (70, 118)], fill=DISTRACTOR_COAT, width=7)

def draw_distractor_alert(draw):
    draw.ellipse([32, 45, 96, 95], fill=DISTRACTOR_COAT)
    draw.ellipse([68, 14, 108, 54], fill=DISTRACTOR_COAT)
    draw.polygon([(88, 28), (122, 36), (98, 50)], fill=DISTRACTOR_COAT)
    draw.ellipse([118, 34, 124, 40], fill=(20, 20, 20, 255))
    draw.ellipse([92, 26, 100, 33], fill=DISTRACTOR_EYE)
    draw.polygon([(72, 16), (78, 2), (88, 16)], fill=DISTRACTOR_COAT)
    draw.line([(72, 50), (86, 42)], fill=DISTRACTOR_COLLAR, width=4)
    draw.rectangle([42, 80, 54, 118], fill=DISTRACTOR_COAT)
    draw.rectangle([78, 80, 90, 118], fill=DISTRACTOR_COAT)

def draw_distractor_lunge(draw):
    draw.ellipse([25, 52, 98, 100], fill=DISTRACTOR_COAT)
    draw.ellipse([75, 26, 118, 68], fill=DISTRACTOR_COAT)
    draw.polygon([(98, 38), (128, 44), (105, 62)], fill=DISTRACTOR_COAT)
    draw.ellipse([124, 42, 130, 48], fill=(20, 20, 20, 255))
    draw.ellipse([102, 34, 110, 42], fill=(255, 60, 40, 255)) # Fierce red eye
    draw.polygon([(80, 26), (65, 12), (78, 34)], fill=DISTRACTOR_COAT)
    draw.line([(80, 62), (94, 52)], fill=DISTRACTOR_COLLAR, width=5)
    draw.line([(40, 85), (20, 118)], fill=DISTRACTOR_COAT, width=8)
    draw.line([(75, 85), (105, 118)], fill=DISTRACTOR_COAT, width=8)

def draw_handler_torso(draw):
    # Handler upper torso & shoulders (neutral)
    draw.rectangle([34, 40, 94, 110], fill=HANDLER_TORSO)
    # Head / collar
    draw.ellipse([48, 15, 80, 47], fill=HANDLER_SKIN)
    # Coat collar
    draw.polygon([(46, 40), (64, 60), (82, 40)], fill=(40, 60, 90, 255))
    # Arms at side
    draw.line([(34, 45), (25, 95)], fill=HANDLER_TORSO, width=12)
    draw.line([(94, 45), (103, 95)], fill=HANDLER_TORSO, width=12)
    draw.ellipse([18, 92, 30, 104], fill=HANDLER_SKIN)
    draw.ellipse([98, 92, 110, 104], fill=HANDLER_SKIN)

def draw_handler_hands_gather(draw):
    # Handler hands gathering leash in loops
    draw.ellipse([45, 50, 83, 88], fill=HANDLER_GLOVE)
    # Leash coils in hand
    draw.arc([42, 46, 86, 92], start=30, end=330, fill=(40, 40, 40, 255), width=4)
    draw.arc([46, 50, 82, 88], start=20, end=340, fill=(40, 40, 40, 255), width=4)
    # Thumbs & grip
    draw.ellipse([40, 62, 54, 76], fill=HANDLER_SKIN)
    draw.ellipse([74, 62, 88, 76], fill=HANDLER_SKIN)

def draw_handler_hands_release(draw):
    # Open hands with loose leash strand
    draw.ellipse([35, 60, 50, 78], fill=HANDLER_SKIN)
    draw.ellipse([78, 60, 93, 78], fill=HANDLER_SKIN)
    # Single smooth leash strand passing through
    draw.line([(20, 68), (108, 68)], fill=(40, 40, 40, 255), width=3)

def draw_handler_shield_left(draw):
    # Handler stepping left with body angled to block line of sight
    draw.polygon([(25, 30), (75, 20), (85, 115), (35, 115)], fill=HANDLER_TORSO)
    draw.ellipse([40, 10, 68, 38], fill=HANDLER_SKIN)
    # Protective arm position
    draw.line([(35, 45), (15, 80), (35, 90)], fill=HANDLER_TORSO, width=10)

def draw_handler_shield_right(draw):
    # Handler stepping right with body angled to block line of sight
    draw.polygon([(53, 20), (103, 30), (93, 115), (43, 115)], fill=HANDLER_TORSO)
    draw.ellipse([60, 10, 88, 38], fill=HANDLER_SKIN)
    # Protective arm position
    draw.line([(93, 45), (113, 80), (93, 90)], fill=HANDLER_TORSO, width=10)

def draw_handler_anchor(draw):
    # Braced low stance, locked hands
    draw.rectangle([38, 48, 90, 112], fill=HANDLER_TORSO)
    draw.ellipse([50, 22, 78, 50], fill=HANDLER_SKIN)
    # Both hands locked at hip
    draw.ellipse([52, 75, 76, 95], fill=HANDLER_GLOVE)
    draw.line([(38, 52), (58, 82)], fill=HANDLER_TORSO, width=12)
    draw.line([(90, 52), (70, 82)], fill=HANDLER_TORSO, width=12)

def draw_scenery_pavement(draw):
    # Isometric stone pavement block
    draw.polygon([(64, 20), (120, 50), (64, 80), (8, 50)], fill=SIDEWALK_COLOR, outline=SIDEWALK_LINE)
    draw.polygon([(8, 50), (64, 80), (64, 108), (8, 78)], fill=CURB_COLOR)
    draw.polygon([(64, 80), (120, 50), (120, 78), (64, 108)], fill=(120, 115, 110, 255))

def draw_scenery_curb(draw):
    # Street curb
    draw.polygon([(64, 30), (116, 56), (64, 82), (12, 56)], fill=CURB_COLOR, outline=(100, 95, 90, 255))
    draw.polygon([(12, 56), (64, 82), (64, 105), (12, 79)], fill=(90, 85, 80, 255))
    draw.polygon([(64, 82), (116, 56), (116, 79), (64, 105)], fill=(80, 75, 70, 255))

SPRITE_DEFS = [
    ("dog_close_neutral", draw_dog_neutral, (0.5, 0.9)),
    ("dog_close_alert", draw_dog_alert, (0.5, 0.9)),
    ("dog_close_strained", draw_dog_strained, (0.5, 0.9)),
    ("dog_close_relaxed", draw_dog_relaxed, (0.5, 0.9)),
    ("dog_close_head_turn", draw_dog_head_turn, (0.5, 0.9)),
    ("distractor_close_walk0", draw_distractor_walk0, (0.5, 0.9)),
    ("distractor_close_walk1", draw_distractor_walk1, (0.5, 0.9)),
    ("distractor_close_alert", draw_distractor_alert, (0.5, 0.9)),
    ("distractor_close_lunge", draw_distractor_lunge, (0.5, 0.9)),
    ("handler_close_torso", draw_handler_torso, (0.5, 0.9)),
    ("handler_close_hands_gather", draw_handler_hands_gather, (0.5, 0.5)),
    ("handler_close_hands_release", draw_handler_hands_release, (0.5, 0.5)),
    ("handler_close_shield_left", draw_handler_shield_left, (0.5, 0.9)),
    ("handler_close_shield_right", draw_handler_shield_right, (0.5, 0.9)),
    ("handler_close_anchor", draw_handler_anchor, (0.5, 0.9)),
    ("pavement_narrow_path", draw_scenery_pavement, (0.5, 0.6)),
    ("street_curb", draw_scenery_curb, (0.5, 0.6)),
]

def main():
    num_sprites = len(SPRITE_DEFS)
    rows = (num_sprites + COLUMNS - 1) // COLUMNS
    atlas_w = COLUMNS * FRAME_SIZE
    atlas_h = rows * FRAME_SIZE

    atlas_img = Image.new("RGBA", (atlas_w, atlas_h), (0, 0, 0, 0))
    atlas_json = {"frames": {}}

    for idx, (name, fn, pivot) in enumerate(SPRITE_DEFS):
        col = idx % COLUMNS
        row = idx // COLUMNS
        x = col * FRAME_SIZE
        y = row * FRAME_SIZE

        sprite_im = create_sprite(fn)
        atlas_img.paste(sprite_im, (x, y))

        atlas_json["frames"][name] = {
            "frame": {"x": x, "y": y, "w": FRAME_SIZE, "h": FRAME_SIZE},
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": FRAME_SIZE, "h": FRAME_SIZE},
            "sourceSize": {"w": FRAME_SIZE, "h": FRAME_SIZE},
            "pivot": {"x": pivot[0], "y": pivot[1]},
            "res": 1.0,
        }

    atlas_img.save(OUT_DIR / "sprites.png")
    with open(OUT_DIR / "sprites.json", "w") as f:
        json.dump(atlas_json, f, indent=2)

    print(f"Generated {num_sprites} close-up sprites to {OUT_DIR}")

if __name__ == "__main__":
    main()
