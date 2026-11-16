"""Builds the Pixelbolt recipe for the README banner: Kuala Lumpur at dusk, six frames."""
import json
import math
import random
import sys

W, H = 192, 80
# The scene is drawn in its own 64-row space, then moved down by TOP rows to make room for the title bar.
TOP = 16
SHORE = 50
FRAMES = 6

PALETTE = {
    # sky, dark to warm
    'a': '#070b1f', 'b': '#0b1230', 'c': '#121a40', 'd': '#1c2050', 'e': '#2c2258',
    'f': '#43285e', 'g': '#5e2f5d', 'h': '#80395a', 'i': '#a84a52', 'j': '#d4694a',
    # stars, lights, beacons
    'S': '#fff6e0', 'T': '#9a96c8', 'L': '#ffd27a', 'l': '#7a6030', 'R': '#ff4a4a',
    # far skyline, shore
    'x': '#1a1f3f', 'X': '#2a3160',
    # Petronas towers
    's': '#8d9ac0', 't': '#6c789f', 'u': '#d6e0ff', 'v': '#4d5880', 'w': '#eef3ff', 'z': '#b6c2e6',
    'P': '#241d4a',
    # Merdeka 118
    'm': '#1b2750', 'n': '#4fd3e8', 'o': '#4a6aa8', 'q': '#121a38', 'p': '#ffd98a', 'N': '#1f6d7a',
    # KL Tower
    'K': '#7d86ae', 'Q': '#dfe5fb',
    # Sultan Abdul Samad Building
    'C': '#a9794f', 'D': '#e7cf9b', 'G': '#5cb8a0', 'Z': '#3a2418',
    # flag
    'r': '#d2202f', 'W': '#f4f1ee', 'B': '#1b2a7a', 'y': '#ffd23a',
    # lake
    '1': '#0b1226', '2': '#0a0f20', '3': '#16213f', '4': '#2a3a6a',
    # fireworks
    'F': '#ffd54a', 'H': '#ff5a6a', 'V': '#6fb1ff', 'E': '#8a6a10',
    # palms
    'M': '#14452b', 'O': '#1f5a37', 'k': '#1a2a2a',
    # title bar: its background, a crab in Claude orange, white text, a teal rule
    'Y': '#0b0d12', 'U': '#d97757', 'I': '#a8543a', '5': '#f3f6f8', '6': '#12141a', '7': '#00d2be',
}


def rect(x, y, w, h, c):
    return {'op': 'rect', 'x': x, 'y': y, 'w': w, 'h': h, 'color': c, 'filled': True}


def px(x, y, c):
    return {'op': 'pixel', 'x': x, 'y': y, 'color': c}


def shift(ops, dy):
    """Moves every operation down by dy rows."""
    return [{**o, 'y': o['y'] + dy} for o in ops]


def clip(ops):
    """Keeps every operation inside the canvas."""
    out = []
    for o in ops:
        if o['op'] == 'pixel':
            if 0 <= o['x'] < W and 0 <= o['y'] < H:
                out.append(o)
        else:
            x0, y0 = max(0, o['x']), max(0, o['y'])
            x1, y1 = min(W, o['x'] + o['w']), min(H, o['y'] + o['h'])
            if x1 > x0 and y1 > y0:
                out.append({**o, 'x': x0, 'y': y0, 'w': x1 - x0, 'h': y1 - y0})
    return out


def sky():
    stops = [(0, 'a'), (6, 'b'), (12, 'c'), (18, 'd'), (24, 'e'), (30, 'f'), (35, 'g'), (40, 'h'), (45, 'i'), (48, 'j')]
    ops = []
    for n, (y, c) in enumerate(stops):
        nxt = stops[n + 1][0] if n + 1 < len(stops) else SHORE
        ops.append(rect(0, y, W, nxt - y, c))
    return ops


def far_skyline():
    rnd = random.Random(7)
    ops, x = [], -1
    while x < W:
        w = 4 + rnd.randrange(7)
        h = 8 + rnd.randrange(10)
        ops.append(rect(x, SHORE - h, w, h, 'x'))
        ops.append(rect(x, SHORE - h, w, 1, 'X'))
        for wy in range(SHORE - h + 2, SHORE - 1, 2):
            for wx in range(x + 1, x + w - 1, 2):
                if rnd.random() < 0.18:
                    ops.append(px(wx, wy, 'l'))
        x += w
    return ops


def merdeka(cx):
    height = 38
    ops = []
    for t in range(height):
        y = SHORE - 1 - t
        hw = round(4 - 2 * (t / height) ** 1.1)
        ops.append(rect(cx - hw, y, 2 * hw + 1, 1, 'm'))
        ops.append(px(cx - hw, y, 'o'))
        ops.append(px(cx + hw, y, 'q'))
        for x in range(cx - hw + 1, cx + hw):
            if (x + t) % 5 == 0 or (x - t) % 5 == 0:
                ops.append(px(x, y, 'p' if t > height * 0.84 else 'n'))
    ops.append(rect(cx, SHORE - height - 6, 1, 6, 'z'))
    return ops


def kl_tower(cx):
    ops = [rect(cx - 1, SHORE - 6, 3, 6, 'K'), rect(cx, SHORE - 34, 1, 28, 'K')]
    pod_y = SHORE - 36
    for dy, hw in [(-2, 3), (-1, 4), (0, 4), (1, 4), (2, 3)]:
        ops.append(rect(cx - hw, pod_y + dy, 2 * hw + 1, 1, 'Q' if dy < 0 else 'K'))
    ops += [rect(cx, SHORE - 42, 1, 4, 'K'), rect(cx, SHORE - 47, 1, 5, 'z')]
    return ops


def samad(x0):
    ops = [rect(x0, SHORE - 6, 29, 6, 'C'), rect(x0, SHORE - 6, 29, 1, 'D')]
    for x in range(x0 + 2, x0 + 27, 3):
        ops += [rect(x, SHORE - 3, 1, 3, 'Z'), px(x, SHORE - 3, 'L')]
    cx = x0 + 14
    ops += [rect(cx - 2, SHORE - 18, 5, 12, 'C'), px(cx, SHORE - 13, 'W'), rect(cx - 2, SHORE - 20, 5, 2, 'G'),
            rect(cx - 1, SHORE - 22, 3, 2, 'G'), px(cx, SHORE - 23, 'D')]
    for tx in (x0 + 2, x0 + 24):
        ops += [rect(tx, SHORE - 9, 3, 3, 'C'), rect(tx, SHORE - 10, 3, 1, 'G')]
    return ops


def flag_pole(x):
    return [rect(x, SHORE - 32, 1, 32, 'z'), px(x, SHORE - 33, 'D')]


def flag(x, phase):
    """The Jalur Gemilang: 7 stripes, a blue canton with a crescent and a star, waving."""
    ops = []
    y0 = SHORE - 32
    for col in range(14):
        dy = round(math.sin(col * 0.7 + phase) * 1.3 * (col / 13))
        for row in range(7):
            in_canton = row < 4 and col < 7
            c = 'B' if in_canton else ('r' if row % 2 == 0 else 'W')
            ops.append(px(x + 1 + col, y0 + row + dy, c))
    ops += [px(x + 2, y0 + 1, 'y'), px(x + 2, y0 + 2, 'y'), px(x + 3, y0 + 3, 'y'), px(x + 5, y0 + 1, 'y'), px(x + 5, y0 + 2, 'y')]
    return ops


def petronas(centers):
    height = 42
    ops = [rect(centers[0] - 10, SHORE - 3, centers[1] - centers[0] + 21, 3, 'P')]
    for x in range(centers[0] - 8, centers[1] + 9, 3):
        ops.append(px(x, SHORE - 2, 'L'))
    for cx in centers:
        for t in range(height):
            y = SHORE - 1 - t
            f = t / height
            hw = 5 if f < 0.4 else 4 if f < 0.68 else 3 if f < 0.87 else 2
            for x in range(cx - hw, cx + hw + 1):
                ops.append(px(x, y, 'u' if x == cx - hw else 'v' if x == cx + hw else ('s' if x % 2 == 0 else 't')))
            if t % 4 == 3:
                ops.append(rect(cx - hw + 1, y, 2 * hw - 1, 1, 'w'))
        top = SHORE - height
        ops += [rect(cx - 1, top - 1, 3, 1, 'z'), rect(cx, top - 7, 1, 6, 'z')]
    # The skybridge and the inverted V that holds it up.
    mid = (centers[0] + centers[1]) // 2
    by = SHORE - 19
    ops.append(rect(mid - 3, by - 2, 7, 2, 'u'))
    for k in range(6):
        ops += [px(mid - round(k * 3 / 5), by + k, 'z'), px(mid + round(k * 3 / 5), by + k, 'z')]
    return ops


def palms(x0):
    ops = []
    for cx, h, lean in [(x0, 17, 2), (x0 + 8, 13, -2)]:
        for t in range(h):
            ops.append(px(cx + round(lean * (t / h) ** 2), SHORE - 1 - t, 'k'))
        tx, ty = cx + lean, SHORE - 1 - h
        for k in range(8):
            ang = k / 8 * math.tau
            for d in range(1, 6):
                ops.append(px(tx + round(math.cos(ang) * d), ty + round(math.sin(ang) * d * 0.5 + d * d * 0.07), 'O' if d > 3 else 'M'))
    return ops


def water():
    ops = [rect(0, SHORE, W, 1, 'X'), rect(0, SHORE + 1, W, 13, '1'), rect(0, SHORE + 6, W, 8, '2')]
    for x in range(2, W, 6):
        ops.append(px(x, SHORE - 1, 'L'))
    # Reflections: Petronas, Merdeka and KL Tower, as broken columns.
    for cx, c, wd in [(139, '4', 5), (157, '4', 5), (22, 'N', 3), (104, 'l', 1)]:
        for r in range(0, 10, 2):
            ops.append(rect(cx - wd + (r % 4) // 2, SHORE + 2 + r, 2 * wd, 1, c))
    return ops


def stars(i):
    rnd = random.Random(3)
    ops = []
    for n in range(34):
        x, y = rnd.randrange(W), int(rnd.random() ** 1.6 * 30)
        phase = (i + n) % 3
        if n % 3 == 0:
            ops.append(px(x, y, 'S' if phase else 'T'))
        else:
            ops.append(px(x, y, 'T'))
    return ops


def firework(cx, cy, stage, colors):
    hot, mid, dim = colors
    ops = []
    if stage == 0:
        ops += [px(cx, cy, 'W'), px(cx, cy + 1, mid), px(cx, cy + 2, dim)]
    elif stage in (1, 2, 3):
        r = {1: 3, 2: 6, 3: 8}[stage]
        for k in range(14):
            ang = k / 14 * math.tau
            c = hot if stage < 3 else dim
            ops.append(px(cx + round(math.cos(ang) * r), cy + round(math.sin(ang) * r), c))
        if stage == 1:
            ops.append(px(cx, cy, 'W'))
    elif stage == 4:
        for k in range(10):
            ang = k / 10 * math.tau
            ops.append(px(cx + round(math.cos(ang) * 8), cy + round(math.sin(ang) * 8) + 2, dim))
    return ops


def lake_shimmer(i):
    ops = []
    for row, y in enumerate((SHORE + 3, SHORE + 6, SHORE + 9, SHORE + 12)):
        for x in range((i * 3 + row * 7) % 9, W, 9):
            ops.append(rect(x, y, 2 + row % 2, 1, '3'))
    return ops


def beacons(i):
    on = i < FRAMES // 2
    ops = [px(139, SHORE - 49, 'R' if on else 'z'), px(157, SHORE - 49, 'R' if on else 'z'),
           px(22, SHORE - 45, 'R' if on else 'z'), px(104, SHORE - 48, 'R' if not on else 'z')]
    return ops


def kl_lights(i):
    pod_y = SHORE - 36
    return [px(104 + dx, pod_y, 'L' if (dx + i) % 2 == 0 else 'Q') for dx in range(-3, 4)]


def place(ops):
    return clip(shift(ops, TOP))


def crab(x0, y0, i):
    """A small pixel crab in Claude orange. Its claws go up and down with the frames."""
    up = 0 if i % 2 == 0 else 1
    ops = []
    for cx, arm_x, body_x in ((x0, x0 + 1, x0 + 2), (x0 + 12, x0 + 13, x0 + 12)):
        ops += [rect(cx, y0 + up, 3, 3, 'U'), px(cx + 1, y0 + 1 + up, 'Y'), px(arm_x, y0 + 3 + up, 'U'), px(body_x, y0 + 4, 'U')]
    ops += [rect(x0 + 4, y0 + 3, 7, 1, 'U'), rect(x0 + 3, y0 + 4, 9, 3, 'U'), rect(x0 + 4, y0 + 7, 7, 1, 'I')]
    ops += [px(x0 + 5, y0 + 4, '6'), px(x0 + 9, y0 + 4, '6'), px(x0 + 7, y0 + 6, 'I')]
    ops += [px(x0 + x, y0 + 8, 'I') for x in (4, 6, 8, 10)] + [px(x0 + 3, y0 + 9, 'I'), px(x0 + 11, y0 + 9, 'I')]
    return ops


def title_bar():
    """The strip at the top: a dark bar, a teal rule under it and the repo name."""
    return [rect(0, 0, W, TOP, 'Y'), rect(0, TOP - 1, W, 1, '7'),
            {'op': 'text', 'x': 26, 'y': 5, 'text': 'claude-code-themes', 'color': '5', 'align': 'left'}]


base_ops = (sky() + far_skyline() + merdeka(22) + kl_tower(104) + samad(52) + flag_pole(46) + petronas((139, 157))
            + palms(176) + water())

frames = [{'name': 'base', 'duration': 100, 'ops': title_bar() + place(base_ops)}]
for i in range(FRAMES):
    ops = stars(i) + lake_shimmer(i) + flag(46, i * math.pi / 3) + beacons(i) + kl_lights(i)
    ops += firework(78, 14, (i + 0) % FRAMES, ('F', 'F', 'E'))
    ops += firework(122, 11, (i + 3) % FRAMES, ('H', 'H', 'E'))
    ops += firework(180, 18, (i + 5) % FRAMES, ('V', 'V', 'E'))
    frames.append({'name': f'f{i}', 'duration': 170, 'from': 'base', 'ops': place(ops) + crab(6, 3, i)})

recipe = {
    'version': 1, 'name': 'claude-code-themes-banner', 'width': W, 'height': H,
    'palette': PALETTE, 'frames': frames,
    'animations': {'main': {'frames': [f'f{i}' for i in range(FRAMES)]}},
}
json.dump(recipe, open(sys.argv[1], 'w'))
print('wrote', sys.argv[1], 'ops in base:', len(frames[0]['ops']))
