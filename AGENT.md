# AGENT.md

This file tells an AI coding agent how to set up this project, how to work on it, and what to avoid. Read it before you change anything. The user-facing guide is [README.md](README.md).

## What this project is

A Claude Code plugin. It adds "looks" to the Claude **desktop and mobile apps**. A look is:

- a color **theme** (built with `makeColors`), and
- an animated pixel-art **backdrop**, an SVG drawn in code, and
- **chat colors**: colors for headings, quotes and inline code in the chat.

The terminal and the editor extensions draw no looks.

| Fact | Value |
| --- | --- |
| Plugin name | `looks-malaysia` (version in `.claude-plugin/plugin.json`) |
| Marketplace name | `looks-malaysia` (in `.claude-plugin/marketplace.json`) |
| Install id | `looks-malaysia@looks-malaysia` |
| Repo | `aimanamri/claude-code-themes` on GitHub, public, MIT licence |
| Default branch | `main` |
| Looks | 6: `petronas-kl`, `penang`, `terengganu` (light), `sepang`, `kelantan`, `kelantan-day` (light) |
| Language | TypeScript (`.ts`, `.tsx`), run by the app. No build step. No npm dependencies. |

## Provenance: keep this repo clean

This repo is **written from scratch**, so that it can be public. Keep it so.

- Do not copy code from another repo unless its licence allows it. Many repos have no licence, and then you may not copy them.
- Write helpers from the ideas, not from another project's source. If you read another project, write your own code afterwards, in your own words and structure.
- The only copied files are `hooks/make-colors.js` and `hooks/make-colors.d.ts`. Claude Code's plugin-authoring guide tells mod authors to copy them from the guide, and to leave them as they are. **Never edit them.** To update them, copy the newer files from the guide again.
- The drawings use no logos and no copied artwork. Do not add any. The crab in the banner is a small drawing made for this repo, and is not the official Claude mark.
- Landmarks are drawn from memory, in a simple style. Say so in the README, and say that the project is unofficial.

## Set up from nothing

You need: Claude Code (the `claude` command), `git`, `gh` (GitHub CLI), Node 24 or later (tested on Node 26) and Google Chrome for the pictures.

```bash
git clone https://github.com/aimanamri/claude-code-themes.git
cd claude-code-themes
claude plugin validate .
claude plugin test .
node tools/render-look.mjs --list
```

Expected: validate says `Validation passed`, the tests say `0 fail`, and the list shows every look with its scene size.

To use the plugin in the app, from GitHub:

```bash
claude plugin marketplace add aimanamri/claude-code-themes
claude plugin install looks-malaysia@looks-malaysia
```

To edit and see changes at once, add your local clone instead: `claude plugin marketplace add ./claude-code-themes`. Then run `/reload-plugins` and `/look <id>`.

## Repo map

| Path | What it holds |
| --- | --- |
| `hooks/looks/<id>.ts` | One file per look: theme, scene SVG, and the exported `LookSpec`. |
| `hooks/looks/index.ts` | The list `LOOKS` (its order is the order of `/look`) and `FIRST_LOOK`. |
| `hooks/looks/types.ts` | The `LookSpec` and `Scene` types. |
| `hooks/kit/art.ts` | `Art`, a canvas of cells that packs into SVG paths; `px`, `grad`, `glow`, `hash`, `seeded`; the grid constants. |
| `hooks/kit/layout.ts` | `skyBands`, the veil (`SCRIM`, `scrimGradient`), `visible`, `view`, `layout`, `SVG_OPEN`. |
| `hooks/kit/fx.ts` | `stars`, `firework`, `reflection`, `lampRow`, `Windows`, `hazeCity`, `mist`, `ripples`, and the motion CSS (`MOTION_CSS`, `FIREWORK_CSS`, `calm`). |
| `hooks/register.tsx` | The plugin: `/look`, the backdrop, and the chat colors hooks. |
| `hooks/chat-colors.ts`, `hooks/chat-view.tsx` | `CHAT_COLORS` and the code that splits a message; how a message is drawn. |
| `hooks/make-colors.js`, `.d.ts` | Official, copied. Do not edit. |
| `tests/` | `switching.test.ts` (`/look`), `kit.test.ts`, `chat-colors.test.tsx`. |
| `tools/render-look.mjs` | Renders a look to SVG and an HTML page, and checks its limits. |
| `art/make_banner_recipe.py`, `assets/banner.gif` | The README banner, made with Pixelbolt. |
| `preview-*.png` | Pictures for the README. |

The API types of the `claude-code` package are written by the app when the plugin loads, into `.claude-plugin/types/` (ignored by git). The `plugin-authoring` skill also ships them, with a guide to looks (`look.md`).

## How it works

- `hooks/hooks.json` points at `register.tsx`. At `session.start` it registers `/look`, reads the choice, and calls `$.theme.set(look.theme)`.
- The choice is one shared file, `~/.claude/looks-malaysia.json`, with the plugin store as a copy. Every open chat checks the file's modified time every 4 seconds (`$.clock.every`) and on `session.attach`, and draws a newer pick. The state of a chat is the small object `here` in `register.tsx`.
- `ui.render` on `Backdrop` draws the scene SVG of the look in use.
- `ui.render` on `AssistantMessage` and on `UserMessage` draws the chat colors, only for looks that have an entry in `CHAT_COLORS`.
  - `splitChat` cuts a message into plain text, headings, quotes and "prose" (paragraphs or lists with inline code).
  - The hook draws headings, quotes and prose itself. The app's markdown renderer draws everything else, so links stay clickable and tables keep their layout.
  - Only prompts with the origin `composer`, `bridge` or `sdk` are drawn. The desktop app sends `sdk`.
  - A prompt is wrapped in a right-aligned, rounded box, because the app's own bubble is lost when the hook draws it.
- `index.ts` gives every scene a name that ends in a tag made from its drawing. The app redraws a backdrop only when its name changes.

## Rules for work (git and checks)

1. Make one branch for each change, from an up-to-date `main`. Name it `TYPE/short-description` in lowercase with hyphens. TYPE is `feat`, `fix`, `chore` or `docs`.
2. Make small commits. Format: `TYPE(scope): summary`. Use the imperative form, lowercase, 72 characters or fewer, no final period. `feat` is new behavior, `fix` is a bug fix, `chore` is tooling or config, `docs` is documentation only. Do not mix a `feat` and a `fix` in one commit. Use the body to say why.
3. Run the checks before you push:
   ```bash
   claude plugin validate .
   claude plugin test .
   ```
   Fix the cause of a failure. Do not delete or weaken a test. Do not use `--no-verify`.
4. Do not push to `main` directly. Push the branch and open a PR:
   ```bash
   git push -u origin <branch>
   gh pr create --base main --head <branch> --title "<same format as a commit>" --body "<what changed, why, how I tested it>"
   ```
5. Merge with squash only (the PR title becomes the commit on `main`), after the owner agrees, and delete the branch:
   ```bash
   gh pr merge <number> --squash --delete-branch
   git checkout main && git pull --ff-only origin main && git branch -D <branch>
   ```
6. The repo is public. Never commit secrets (`.env` files, keys, tokens), real personal data, or local paths that name a person. Read `.gitignore` before `git add`. Use the GitHub no-reply address for the commit email.
7. Do not create a tag or a release without asking.

## Recipe: add a look

Do this on a branch `feat/<id>-look`.

1. **Write `hooks/looks/<id>.ts`.** Copy the structure of a close look (`sepang.ts` for a dark one with motion, `terengganu.ts` for a light one). A look file has `makeColors(...)`, a `SKY` made of `Stops`, drawing functions that return SVG strings, `spots(low, high)` for the layout, a `SCENE` string and `export const <name>: LookSpec`.
2. **Register it** in `hooks/looks/index.ts`: add the import and add it to the end of `LOOKS`.
3. **Chat colors:** add an entry to `CHAT_COLORS` in `hooks/chat-colors.ts` (see the next recipe). Add the id to the list test and a render test in `tests/chat-colors.test.tsx`.
4. **Render and look at it** (see below), on a wide, a normal and a phone shape. Fix what you see.
5. **Update `README.md`:** the looks table, a preview picture (`preview-<id>.png`), the chat colors table, and the count in the first paragraph.
6. **Bump the plugin version** in `.claude-plugin/plugin.json` (a new look is a minor bump). See "Gotchas".
7. Run the checks, make small commits (look; chat colors; docs; version), push, open the PR.
8. After the merge, update an installed copy:
   ```bash
   claude plugin marketplace update looks-malaysia
   claude plugin update looks-malaysia@looks-malaysia
   ```
   Then `/reload-plugins` and `/look <id>`.

The tests use the number of looks in `LOOKS`, so adding a look needs no change to the numbers in `switching.test.ts`.

## Recipe: chat colors for a look

In `hooks/chat-colors.ts` add an entry to `CHAT_COLORS`, keyed by the look id, with six colors: `heading`, `quote`, `quoteBorder`, `quoteBackground`, `code`, `codeBackground`.

- Fit the look's accent. Use a different hue for the code than for the headings.
- For a **light** look, use dark colors that read on a pale page.
- The shared test needs 4.5:1 for the quote on its background and the code on its background.
- Update the chat colors table in `README.md`.

## Drawing a scene

- The scene is an SVG of **1600 by 1000** units. The art grid is **320 by 200** art pixels, each `PX = 5` units. All helpers draw in art pixels. Start the SVG with `SVG_OPEN`.
- `Art` collects colored cells (`set`, `rect`, `disc`, `line`, `has`). `art.svg()` packs them into a few rectangles per color. Wrap the result with `px(...)` to scale it by 5.
- Each landmark is drawn around its own origin (its foot) and placed with `placed('<spot>', svg)`. Positions come from `spots(low, high)`. `layout()` writes CSS for 10 window shapes, so the landmarks move with the window. Call `view(low, high)` at the start of `spots` to get `v` (visible width), `left`, `right`, `top`, `phone` and `s` (the scale).
- Plan the scene like this: tall landmarks at the left edge (under the app's sidebar), small things in the gap from about 20% to 32% of the width, and the hero landmark on the right, clear of the veil. Phones have no sidebar, so everything is drawn in and shrunk.
- A **veil** (`SCRIM`, `scrimGradient(color)`) fades the middle of the scene toward `color`, behind the chat text. It is clear to 18% of the visible width, full at 32% to 78%, and gone by 88%. Use a dark color for a dark look and a pale one for a light look. Keep the hero landmark out of it.
- In a very wide window only the middle rows show (about rows 38 to 162). Keep the ground line near row 146 to 152.
- A scene must stay under **131,072 characters**. Do not use blur filters. Use `step-end` or `steps()` for animations, so the scene redraws only when a frame changes. Use `MOTION_CSS`, `FIREWORK_CSS` and `calm(...)` from the kit, and add only the look's own CSS.
- `makeColors` takes `label`, `roles` (`accent`, `danger`, `success`, `warning`, `pro`), gray `anchors` for the mode, and `only: 'dark' | 'light'`. A problem that starts with `Desktop won't paint` stops the look from being applied. The border contrast notes are normal.

## See what you drew

```bash
node tools/render-look.mjs <id> <out-dir>
```

It writes `<out-dir>/<id>.svg` and `<out-dir>/preview-<id>.html`, and exits with 1 if the scene is too long or the theme will not paint. Then take a picture with headless Chrome. On macOS:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --window-size=1600,1000 --screenshot=<out-dir>/desktop.png file://<out-dir>/preview-<id>.html
```

Use `--window-size=500,1000` for a phone and `--window-size=2000,1000` for a very wide window. (On Linux the program is `google-chrome` or `chromium`.) Open the PNG and check the layout, the edges, the veil and the colors.

A still picture shows time zero of every animation. To show a moment, add CSS with `--css`, for example `--css ".run{animation:none!important;transform:translateX(110px)!important}"`. That writes `still-<id>.html`.

You cannot see the real Claude app. Ask the owner for a screenshot when you need to check something there.

## Banner

`assets/banner.gif` is made with [Pixelbolt](https://github.com/skulitom/Pixelbolt) (MIT, Node 20 or later, no dependencies). `art/make_banner_recipe.py` writes the recipe. Render it with `node <pixelbolt>/bin/pixelbolt.js render recipe.json --out out --gif --gif-scale 4`, and copy `out/gifs/main.gif` to `assets/banner.gif`. The size is 768 by 320.

## Gotchas

1. **Plugin updates need a new version.** `claude plugin update` compares `version`. Without a bump it says "already at the latest version" and the cached copy stays old. Bump `.claude-plugin/plugin.json` on every change that reaches the app.
2. **A CSS animation that sets `transform` on a `px()` group breaks its scale.** `px()` wraps art in `<g transform="scale(5)">`, and a CSS `transform` replaces that attribute. Put such a class on an **inner** `<g>` inside `px(...)`. Animations of `opacity` are safe on the `px()` group.
3. **Test host limits.** The host refuses a theme with a backdrop, so scenes are checked by rendering, not in tests. `ui.find` takes only `type`, `key`, `text` and `in`. To read props, use `ui.findAll` and filter. The `theme.set` mock must return `{ value: { isDrawn: true, requestId: 'test' } }`. For timers use `mock.clock(on)` and `clock.advance`, `clock.settle`. There is no `setTimeout` in the test sandbox.
4. **`plugin validate` type-checks the tests too.** Read its output for `TS` errors.
5. **Narrowing for `Svg`.** Check `e.surface !== 'desktop' && e.surface !== 'mobile'` inline in the backdrop hook. A helper function that hides the check loses the type narrowing, and `Svg` is then missing from the types.
6. **The app draws a backdrop only when its scene name changes.** `index.ts` adds a tag for this.
7. **Never edit `hooks/make-colors.js`.**

## Known issues and decisions

- **The backdrop did not animate** in the owner's app (version 5.11492.5), even for other plugins' looks. The cause was not found. It may be in the app. The animations are written and checked in a browser.
- **Chat colors are tested in the test host.** The owner confirmed them in the real app for `petronas-kl` only. The colors of the other looks were not seen in the app.
- **The landmarks are drawn from memory** in a simple style, and are not to scale. The project is unofficial.

## Definition of done for a change

- [ ] `claude plugin validate .` shows no `TS` errors.
- [ ] `claude plugin test .` shows `0 fail`.
- [ ] For a look: rendered at wide, normal and phone shapes, and looked at. The scene is under 131,072 characters. No `Desktop won't paint`.
- [ ] README updated. Plugin version bumped.
- [ ] No code copied from a project whose licence does not allow it.
- [ ] Small commits with the right types, on a branch. PR opened. The owner agreed to the merge.
- [ ] After the merge: branches deleted, `main` synced, installed copy updated.
- [ ] You said plainly what you did **not** check (for example: "not seen in the real app").
