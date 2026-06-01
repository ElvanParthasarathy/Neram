from fontTools.ttLib import TTFont
import sys

font_path = sys.argv[1]
extra_space = int(sys.argv[2])

font = TTFont(font_path)
hmtx = font['hmtx']
for glyph_name in hmtx.metrics:
    width, lsb = hmtx.metrics[glyph_name]
    # Add extra_space to width to push next character further
    # Add extra_space//2 to LSB to shift the glyph slightly to the right, centering the extra space
    hmtx.metrics[glyph_name] = (width + extra_space, lsb + extra_space // 2)
font.save(font_path)
