# Figma visual inventory, part A

File `CNJik9Re3oAtqNma67yjou` ("Zynox"). There are no Figma variables, so every value below is raw.

## Coverage

| Node    | Name                                                   | How it was read                                                             | Coverage |
| ------- | ------------------------------------------------------ | --------------------------------------------------------------------------- | -------- |
| 1:12610 | Login (default: Google / email / passkey)              | `get_design_context` in one call                                            | 100%     |
| 1:12645 | Login (email step)                                     | `get_design_context` in one call                                            | 100%     |
| 1:6569  | Navbar (sidebar, 244 px)                               | `get_design_context` in one call                                            | 100%     |
| 1:4813  | Zynox · Projects (full screen: sidebar + main content) | `get_design_context`, full code (109 KB) saved to disk and parsed by script | 100%     |
| 1:5330  | Main Content (Zynox · Projects), with 2 rows selected  | Same as above (59 KB)                                                       | 100%     |
| 1:5635  | Main Content (Zynox · New view)                        | Same as above (57 KB)                                                       | 100%     |

None of the responses were sparse. I parsed every `className` on every element that has a `data-node-id`, including inline `<span>` elements. Every class ended up in a category below. The only effect class outside the shadow list was one `drop-shadow`.

Icon colors are not in the generated classes; they are baked into the SVG assets. I downloaded all 78 SVG assets from the three Projects nodes, plus 11 from the Navbar and Login, and read their `fill`, `stroke` and `opacity` attributes.

**How to read the counts.** "P" is the class count across 1:4813, 1:5330 and 1:5635 together. "N" is 1:6569 and "L" is both Login variants, both counted by hand.

1:4813 already contains a copy of the sidebar (1:4818 "Navigation") that is almost the same as 1:6569, and it also contains the main content that 1:5330 and 1:5635 show. So most values are counted two or three times. Treat the counts as a measure of how often a value is used, not as unique usages.

---

## 1. Colors

### 1.1 Backgrounds / surfaces

| Value                    | Count                                             | Role                                                                                                        | Example nodes                          |
| ------------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `#09090a`                | P4, N2 (root + help container), L2 (gradient end) | App/page background (canvas behind the sidebar); help-button pill background; bottom of the login gradient  | 1:4813, 1:6569, 1:6785, 1:5311         |
| `#121213`                | P9                                                | Main content panel background (card to the right of the sidebar), header and table background               | 1:5042, 1:5330, 1:5635, 1:5044, 1:5097 |
| `#111212`                | L3 (2 gradient starts, 1 input)                   | Top of the login gradient; email input background                                                           | 1:12612, 1:12647, 1:12658              |
| `#1b1c1d`                | P7, N1                                            | Round icon button background (Create new issue, Add filter, Display options, Open sidebar)                  | 1:6778, 1:5074, 1:5079, 1:5085         |
| `#1b1b1c`                | L3                                                | Login secondary button (Continue with email, passkey)                                                       | 1:12631, 1:12634, 1:12660              |
| `#1c1c1d`                | P1                                                | Inactive "All projects" view chip on the New view screen                                                    | 1:5656                                 |
| `#1a1a1b`                | P2                                                | Floating bulk-action bar; New view form card                                                                | 1:5613, 1:5677                         |
| `#232325`                | P5, N1                                            | Active sidebar item; buttons inside the floating bar; Add filter / Display options inside the New view form | 1:6632, 1:4952, 1:5619, 1:5626, 1:5701 |
| `#29292b`                | P2                                                | Active view chip "All projects"                                                                             | 1:5063, 1:5350                         |
| `#1c1e37`                | P2                                                | Selected table row background (indigo tint)                                                                 | 1:5413, 1:5498                         |
| `#5e6ad2`                | P3                                                | Accent: checked checkbox fill; primary button "Create view"                                                 | 1:5417, 1:5502, 1:5692                 |
| `#dd5264`                | P1, N1                                            | Workspace avatar square ("ZY")                                                                              | 1:6766, 1:5014                         |
| `rgba(190,194,200,0.17)` | P1                                                | Icon-picker button background in the New view form (this is `#bec2c8` at 17%)                               | 1:5682                                 |
| `rgba(255,255,255,0)`    | P14, N1, L3                                       | Transparent overlay `div` that carries the ring shadow on buttons (see §6)                                  | 1:5031, 1:6783, 1:12633                |
| `rgba(0,0,0,0)`          | P1, N1                                            | Transparent scroll container                                                                                | 1:4821, 1:6573                         |

### 1.2 Gradients

| Value                                                                  | Count | Role                                        | Node             |
| ---------------------------------------------------------------------- | ----- | ------------------------------------------- | ---------------- |
| `bg-gradient-to-b from-[#111212] to-[#09090a]`, stop at 50% (`to-1/2`) | L2    | Login page background                       | 1:12612, 1:12647 |
| `bg-gradient-to-r from-[#fcfcfc] to-[#cbcdd3]`                         | L1    | "Continue with Google" primary light button | 1:12621          |

### 1.3 Text

| Value                             | Count        | Role                                                                                                                                                                                 | Example nodes                     |
| --------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| `#929294`                         | P22, N22     | Sidebar item labels (13 px Medium), section headers (12 px), counter "5", "Agent" footer button                                                                                      | 1:6584, 1:6626, 1:5324            |
| `#959597`                         | P37          | Secondary text in main content: column headers, "New project", "No updates", milestone name                                                                                          | 1:5104, 1:5057, 1:5147, 1:5140    |
| `#949597`                         | L3           | Login secondary copy ("You used Google…", "Don't have an account?", " or ")                                                                                                          | 1:12629, 1:12639, 1:12642         |
| `white` (`#ffffff`)               | P37, N2      | Primary content text: project names, counts, active nav item, active chip, "ZY"                                                                                                      | 1:5134, 1:5158, 1:6637, 1:5065    |
| `#e2e3e5`                         | P1, N1, L8   | Login headings, button labels and links; workspace name "Zynox"                                                                                                                      | 1:12619, 1:12632, 1:12641, 1:6769 |
| `#e3e4e6`                         | P16          | Page heading "Projects"; progress % values                                                                                                                                           | 1:5051, 1:5166                    |
| `#e4e5e7`                         | P1           | "Cancel" ghost button                                                                                                                                                                | 1:5691                            |
| `#e4e4f8`                         | P2           | Progress % inside a selected row (indigo tint)                                                                                                                                       | 1:5461, 1:5540                    |
| `#9b9bad`                         | P3           | Secondary text inside a selected row (indigo tint)                                                                                                                                   | 1:5435, 1:5442, 1:5521            |
| `#fffeff`                         | P1           | Label on the accent button "Create view"                                                                                                                                             | 1:5693                            |
| `#09090a`                         | L1           | Label on the light Google button                                                                                                                                                     | 1:12628                           |
| `#565658` / `#565759` / `#5c5d5f` | L1 / P1 / P2 | Placeholder and disabled text. `#565658` is the login email placeholder; `#565759` is the dashed "New view" draft chip; `#5c5d5f` is the New view title and description placeholders | 1:12659, 1:5668, 1:5688, 1:5696   |
| `#ff6364`                         | P3           | Health "Off track" status text                                                                                                                                                       | 1:5183                            |
| `rgba(255,99,100,0.7)`            | P3           | Health " · 13d" suffix (`#ff6364` at 70%), inline `<span>`                                                                                                                           | inside 1:5183                     |

### 1.4 Borders

| Value                              | Count       | Role                                                                                                      | Example nodes                  |
| ---------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `rgba(0,0,0,0)` (transparent 1 px) | P41, N3, L4 | Reserved 1 px border on almost every button, pill and chip. Nothing is visible, but it keeps the box size | 1:5022, 1:6774, 1:12621        |
| `#1a1b1d`                          | P6          | Main content panel border (1 px, all sides) and header bottom divider (`border-b`)                        | 1:5042, 1:5046, 1:5333, 1:5639 |
| `#27282a`                          | L1          | Email input border                                                                                        | 1:12658                        |
| `#222325`                          | P1          | New view form card border                                                                                 | 1:5677                         |
| `#2b2c2e`                          | P1          | Divider above the form footer (`border-t`)                                                                | 1:5697                         |
| `#363a43`                          | P1          | **Dashed** border on the "New view" draft chip                                                            | 1:5660                         |
| `#5e6ad2`                          | P2          | Checked checkbox border                                                                                   | 1:5417, 1:5502                 |

### 1.5 Icons (from the SVG `fill` / `stroke`)

| Value     | Role                                                                                                                                                                                                   | Example nodes                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ |
| `#929294` | Default sidebar icons (Inbox, Reviews, My issues, Views, More, Home, Issues, Invite, Initiatives, Cycles, Connect Cursor/Codex); section chevrons; search; help; workspace caret; Agent / Chat history | 1:6580, 1:6776, 1:6788, 1:5327 |
| `white`   | Active sidebar icon; "Create new issue" (+) icon                                                                                                                                                       | 1:6634, 1:4953, 1:6780         |
| `#959597` | Main content icons (New project, Add filter, Display options, Open sidebar); priority icons (Medium at 40% opacity, No priority at 90%)                                                                | 1:5054, 1:5076, 1:5150, 1:5186 |
| `#98999c` | Clear-selected (×); Add filter / Display options inside the New view form                                                                                                                              | 1:5633, 1:5703                 |
| `#565759` | "Add new view" icon; "No updates" health icon (stroke); "New view" chip icon                                                                                                                           | 1:5069, 1:5144, 1:5671         |
| `#606071` | "No updates" icon inside a selected row (stroke)                                                                                                                                                       | 1:5439                         |
| `#9b9bad` | Priority icons inside a selected row                                                                                                                                                                   | 1:5445, 1:5524                 |
| `#e4e5e7` | "Actions" and "Ask Linear" icons in the floating bar                                                                                                                                                   | 1:5621, 1:5628                 |
| `#fffeff` | Checkmark inside the checkbox                                                                                                                                                                          | 1:5419                         |
| `#bec2c8` | Icon-picker glyph and "New view" chip glyph in the New view form                                                                                                                                       | 1:5683, 1:5663                 |
| `#525254` | Team-row disclosure chevron (the "Zynox" team)                                                                                                                                                         | 1:6689, 1:4937                 |
| `#09090a` | Google "G" logo. It is monochrome, not the multi-colour brand mark                                                                                                                                     | 1:12623                        |

### 1.6 Status / label / project colors (from the SVGs)

| Value     | Role                                                                     | Example nodes  |
| --------- | ------------------------------------------------------------------------ | -------------- |
| `#4cb782` | Project icon (green): Plugga OS                                          | 1:5170, 1:5465 |
| `#f0bf00` | Project icon (yellow): Mv School; milestone ring (stroke at 40% opacity) | 1:5206, 1:5137 |
| `#0054b6` | Project icon (blue): ZynCloud                                            | 1:5241         |
| `#eb5757` | Project icon (red): Zynox OS                                             | 1:5276         |
| `#95a2b3` | Project icon (slate): Aname CRM                                          | 1:5129         |
| `#f2994a` | Progress ring (stroke) next to the %                                     | 1:5161, 1:5456 |
| `#ff6364` | "Off track" health icon (fill, with a 25% opacity track) and text        | 1:5179         |
| `#00b2bf` | Team icon (teal): "Zynox" team                                           | 1:6677, 1:4926 |
| `#dd5264` | Workspace avatar background                                              | 1:6766         |
| `#5e6ad2` | Accent / selection                                                       | 1:5417, 1:5692 |

### 1.7 Shadow colors

These are covered in §6: `rgba(0,0,0,0.3)`, `rgba(255,255,255,0.09)`, `#222224` and `rgba(0,0,0,0.13)`.

---

## 2. Typography

Fonts:

- `Inter Variable`: `'Inter_Variable:Medium'` (P67) and `'Inter_Variable:Regular'` (P62). It is used almost everywhere.
- Plain `Inter`: `'Inter:Medium' font-medium` (P3, the health "Off track" wrapper `<p>`, where the inner spans switch back to Inter Variable) and `'Inter:Regular'` (L1, "Log in to Zynox" 1:12619).

Weights in use: only Regular (400) and Medium (500). There is no semibold or bold anywhere.

Line height is `normal` in 125+ places. Explicit values appear only where noted in the table.

| Size / weight / line-height / tracking      | Color                  | Count    | Role                                                                                       | Example nodes          |
| ------------------------------------------- | ---------------------- | -------- | ------------------------------------------------------------------------------------------ | ---------------------- |
| 13 / Medium / normal                        | `#929294`              | P16, N16 | Sidebar nav item label                                                                     | 1:6584, 1:4832         |
| 13 / Medium / normal                        | white                  | P16, N1  | Project name in a row; active sidebar item                                                 | 1:5134, 1:6637         |
| 13 / Medium / normal                        | `#e3e4e6`              | P3       | Page title "Projects" (Heading 2)                                                          | 1:5051, 1:5338, 1:5644 |
| 13 / Medium / normal                        | `#e2e3e5`              | L4       | Login button labels                                                                        | 1:12632, 1:12661       |
| 13 / Medium / normal                        | `#09090a`              | L1       | Label on the light Google button                                                           | 1:12628                |
| 13 / Regular / normal                       | `#949597`              | L3       | Login secondary copy                                                                       | 1:12629                |
| 13 / Regular / normal                       | `#e2e3e5`              | L2       | Login inline links (Sign up, learn more)                                                   | 1:12641, 1:12644       |
| 13 / Regular / 19.5 px                      | `#e2e3e5`              | L1       | "Back to login" link                                                                       | 1:12666                |
| 13 / Regular / normal                       | `#565658`              | L1       | Email input placeholder                                                                    | 1:12659                |
| 13 / Regular / normal                       | `#5c5d5f`              | P1       | Description placeholder (New view)                                                         | 1:5696                 |
| 13 / Regular / 23 px / −0.1 px              | `#e2e3e5`              | P1, N1   | Workspace name "Zynox" (the only tracked text)                                             | 1:6769, 1:5017         |
| 12 / Regular / normal                       | `#959597`              | P23      | Column headers (Name, Health, Priority, Lead, Target date, Issues, Status); milestone name | 1:5104, 1:5113         |
| 12 / Regular / normal                       | white                  | P15      | Issue counts in rows                                                                       | 1:5158                 |
| 12 / Regular / normal                       | `#e3e4e6`              | P13      | Progress %                                                                                 | 1:5166                 |
| 12 / Regular / normal                       | `#e4e4f8` / `#9b9bad`  | P2 / P1  | The same roles inside a selected row                                                       | 1:5461, 1:5435         |
| 12 / Regular / normal                       | `#929294`              | P3, N2   | Nav badge count "5"; "Agent" footer                                                        | 1:6602, 1:5324         |
| 12 / Regular / 18 px                        | white                  | P2       | "2 selected" in the floating bar                                                           | 1:5616, 1:5617         |
| 12 / Medium / normal                        | `#959597`              | P14      | Header button "New project"; health "No updates"; inactive chip                            | 1:5057, 1:5147, 1:5658 |
| 12 / Medium / normal                        | `#929294`              | P3, N3   | Sidebar section headers (Workspace, Your teams, Try)                                       | 1:6626, 1:6659, 1:6721 |
| 12 / Medium / normal                        | white                  | P3       | Active view chip "All projects"; "Actions"                                                 | 1:5065, 1:5624         |
| 12 / Medium / normal                        | `#9b9bad`              | P2       | "No updates" inside a selected row                                                         | 1:5442                 |
| 12 / Medium / normal                        | `#ff6364` (+ 70% span) | P3       | Health "Off track · 13d"                                                                   | 1:5183                 |
| 12 / Medium / normal                        | `#565759`              | P1       | Dashed "New view" draft chip                                                               | 1:5668                 |
| 12 / Medium / normal                        | `#e4e5e7`              | P1       | "Cancel"                                                                                   | 1:5691                 |
| 12 / Medium / normal                        | `#fffeff`              | P1       | "Create view"                                                                              | 1:5693                 |
| 11 / Regular / 0                            | white                  | P1, N1   | Avatar initials "ZY"                                                                       | 1:6767, 1:5015         |
| 15 / Medium / normal                        | `#5c5d5f`              | P1       | New view title input placeholder ("All projects")                                          | 1:5688                 |
| 18 / Regular / normal (Inter, not Variable) | `#e2e3e5`              | L1       | "Log in to Zynox"                                                                          | 1:12619                |
| 18 / Medium / normal                        | `#e2e3e5`              | L1       | "What's your email address?"                                                               | 1:12655                |

Size scale: 11, 12, 13, 15 and 18. 12 and 13 cover about 99% of usage.

---

## 3. Radii

| Value    | Count         | Role                                                                                                                                             | Example nodes                   |
| -------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| `9999px` | P114, N~5, L6 | Pill / circle: every button, chip, round icon button, header sort buttons, and their ring overlays                                               | 1:5022, 1:5063, 1:12621         |
| `8px`    | P63, N~45     | Sidebar items, the nav scroll container, table row hover/selection, icon-picker button, text inputs, Agent / Chat history buttons, avatar square | 1:6577, 1:5413, 1:5687, 1:6766  |
| `100px`  | P15           | Health pill inner container (effectively a pill, same result as 9999)                                                                            | 1:5143                          |
| `48px`   | P3            | Milestone chip in a row (effectively a pill)                                                                                                     | 1:5136                          |
| `12px`   | P5, N2        | Main content panel; help-button container and button                                                                                             | 1:5042, 1:5330, 1:6785          |
| `10px`   | P4, N3, L1    | Workspace menu button; Try-section items ("Invite people", "Cycles"); New view form card; login email input                                      | 1:6765, 1:6727, 1:5677, 1:12658 |
| `4px`    | P2, N1        | Nav counter container; icon-picker button in the New view form                                                                                   | 1:6598, 1:5682                  |
| `3px`    | P2            | Checkbox                                                                                                                                         | 1:5417                          |

---

## 4. Spacing

### Gaps

| Value                                              | Count    | Where                                                                           |
| -------------------------------------------------- | -------- | ------------------------------------------------------------------------------- |
| 6px (plus `gap-x-[6px]` P6 for table grid columns) | P19, N~5 | Team sub-items (icon to label), header action groups, workspace menu, form rows |
| 8px                                                | P17      | Health pill (icon to text), floating bar, bar buttons                           |
| 4px                                                | P7, N1   | Header chips group, milestone chip, search + new-issue buttons                  |
| 12px                                               | P3, L1   | Row name to milestone chip; login button stack                                  |
| 2px                                                | P2, N1   | Team-row button; bottom-right footer group                                      |
| 16px                                               | L2       | Login button stack, email form                                                  |

### Padding and margins

Most frequent values:

- `px-6` (P60): header sort buttons and row cell buttons.
- `py-3` (P45): row cell buttons.
- `pl-8` (P43, N~16): sidebar items.
- `pr-6` (P33): icon-slot margin (the 14 px icon sits in a 20 px slot with 6 px right padding).
- `px-8` (P18).
- `pr-9` (P17, N~14): sidebar item right padding.
- `p-6` (P17): icon-picker button and text inputs.
- `px-2` (P14): 28 px round icon buttons.
- `pr-10` / `pl-10` / `px-10` (13 / 7 / 5): header, chips, Agent button.
- `pt-px` / `py-px` (12 / 7): 1 px gaps between sidebar rows, giving a 29 px pitch.
- `px-4` (6): section-header buttons.
- `pl-5` (5): section header and workspace menu.
- `pl-6` (5): team sub-items.
- `pl-2` / `pr-2` / `pt-2` / `p-2` (various).
- `pb-8`, `pr-8`, `py-8`, `p-8`: panel margin (main content sits at `pr-8 py-8` inside the page, 1:5041) and the floating bar.
- `p-12` / `pl-12` / `px-12`: form body, sidebar left padding (1:6573 `pl-12 pr-2 pt-26`), and the floating bar text.
- `pt-26`, `pb-9`, `pl-9`, `pl-35` (description indent), `p-10` (help container), `pr-12` (Agent button).
- Fractional values: `pt-[1.05px]` (P3, N3), `px-3 py-4` (checkbox hit area).

Login:

- `px-18`: buttons.
- `pt-24`: heading to buttons.
- `pt-32`: footer.
- `pt-16`: back link.
- `pb-15`: logo.
- `pt-48 pb-88`: page.
- `pt-226.5`: vertical centering offset.
- `pr-12`: Google icon margin.
- `pl-12 pr-44 py-12`: input.

---

## 5. Systematic sizes

**Sidebar**

- Width 244 (1:6569 / 1:4818). The inner list is 230 wide; the collapsible section wrappers are 238.
- The top bar area is 52 tall; the workspace row is 44 tall (1:6764, 220 wide).

**Sidebar item**

- Height 28, radius 8, `pl-8 pr-9`.
- The icon slot is 20×14 with a 14 px icon and `pr-6`.
- Items are spaced by `pt-px`, giving a 29 px pitch.
- Team sub-items are 211 wide at `left-19`, with `pl-6` and gap 6.

**Section header** ("Workspace", "Your teams", "Try")

- Height 28, `px-4`, 12 px Medium label.
- 16 px chevron rotated 90°.

**Icon sizes**

| Size | Count | Use                                                           |
| ---- | ----- | ------------------------------------------------------------- |
| 14   | P60   | Nav and toolbar icons                                         |
| 16   | P73   | Row icons: project icon, priority, health, progress; chevrons |
| 8    | 1     | Workspace caret                                               |
| 10×9 | –     | Checkmark                                                     |
| 20   | –     | Avatar square                                                 |

**Button heights**

| Height        | Use                                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 28            | Standard: round icon buttons `size-28` (P17), chips, sidebar items, floating-bar buttons, Agent. Also `min-w-28` / `min-h-28` |
| 24            | Small: header sort buttons, health pill, Cancel / Create view (`min-w-24`, P35)                                               |
| 44            | Login buttons and input, all 288 wide                                                                                         |
| 26 / 42 / 286 | Ring overlay: always the button size minus 2 (inside the 1 px transparent border)                                             |

**Table**

- Header row 32. Header bar rows are 43–44 (`min-h-43`, `min-h-44`).
- Data rows use a **48 px pitch** (`top` 10 / 58 / 106 / 154 / 202). Row content is 28 tall at top+10. The selection rectangle is 48 tall, 1112 wide, at `left-8`.
- Grid columns: `8 / 18 / 534 / 130 / 68 / 48 / 91 / 49 / 120 / 8` with `gap-x-6`. These are the gutter, checkbox, Name, Health, Priority, Lead, Target date, Issues, Status and gutter columns.
- Milestone chip: height 27, radius 48.

**Main content panel:** 1128 wide on a 1382-wide body (plus the 244 sidebar), height 889. It sits at `pr-8 py-8`, has radius 12 and a 1 px `#1a1b1d` border.

**Floating bulk bar:** 44 tall, `p-8`, gap 8, pill, positioned 44 px from the bottom.

**Other controls**

- Checkbox: 14, radius 3.
- Avatar: 20, radius 8.
- Logo: 91.5 × 91.5.
- View chips: `max-w-200`.

---

## 6. Shadows, effects, borders, opacity

| Value                                                                                                 | Count       | Role                                                                                                                                                                             | Example nodes                   |
| ----------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `0 0 0 1px rgba(255,255,255,0.09), 0 0.5px 1px 1px rgba(0,0,0,0.3)`                                   | P12, N1, L3 | **Raised dark button**: a 1 px white-9% ring plus a soft drop. It is applied on an absolute overlay `div` (named "Text") inside the button, sized to the button minus the border | 1:5078, 1:6783, 1:12633         |
| `0 0.5px 1px 1px rgba(0,0,0,0.3)`                                                                     | P5, L1      | Drop only: main content panel, form card, "Create view", Google button                                                                                                           | 1:5042, 1:5677, 1:5692, 1:12621 |
| `0 0 0 1px rgba(255,255,255,0.09)`                                                                    | P2          | Ring only: the active view chip "All projects"                                                                                                                                   | 1:5066                          |
| `0 0 0 1px #222224, 0 0.5px 1px 1px rgba(0,0,0,0.3)`                                                  | P1, N1      | Help-button container (solid ring color instead of white 9%)                                                                                                                     | 1:6785, 1:5033                  |
| `drop-shadow: 0 3px 4px rgba(0,0,0,0.13), 0 2px 2.5px rgba(0,0,0,0.13), 0 1px 0.5px rgba(0,0,0,0.13)` | P1          | Floating bulk-action bar (the only elevated overlay)                                                                                                                             | 1:5613                          |

- **Blur / backdrop-blur:** none anywhere.
- **Blend modes:** none.
- **Borders:** always 1 px.
  - Solid on all sides: P48 plus nav and login. Most of these are transparent.
  - `border-b` (P3): the header divider.
  - `border-t` (P1): the form footer.
  - Dashed (P1): the draft chip.
- **Opacity (classes):** `opacity-90` on the team icon (1:6677, 1:4926) and `opacity-0` on a hidden duplicate of the counter "5" (1:6600, 1:4848; this looks like a count-animation artifact).
- **Opacity inside SVGs:**
  - Medium-priority bars at 0.4.
  - No-priority at 0.9.
  - Milestone ring at 0.4.
  - Off-track track at 0.25.
- **Other translucency:** colors with alpha are `rgba(190,194,200,0.17)` and `rgba(255,99,100,0.7)`.

---

## 7. States represented

| State                                   | Node(s)                                                                           | Visual delta                                                                                                                                                                                                   |
| --------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sidebar item **active**                 | 1:6632 "Projects" (Workspace section) in 1:6569; 1:4952 team "Projects" in 1:4813 | bg `#232325`, text white, icon white (default is transparent / `#929294` / `#929294`). Each frame marks a different item active                                                                                |
| View chip **active** vs **inactive**    | Active: 1:5063 / 1:5350. Inactive: 1:5656 in 1:5635                               | Active: bg `#29292b`, text white, ring-only shadow. Inactive: bg `#1c1c1d`, text `#959597`, ring plus drop                                                                                                     |
| **Draft** chip (new view being created) | 1:5660                                                                            | Transparent bg, 1 px dashed `#363a43` border, text and icon `#565759` / `#bec2c8`                                                                                                                              |
| Table row **selected** (×2)             | 1:5413, 1:5498 (in 1:5330)                                                        | Row bg `#1c1e37`, radius 8. Checkbox shown and checked (`#5e6ad2`, radius 3, white check). Secondary text `#959597` becomes `#9b9bad`, % text `#e3e4e6` becomes `#e4e4f8`, icons tint to `#9b9bad` / `#606071` |
| **Bulk selection bar**                  | 1:5612 / 1:5613                                                                   | Appears when rows are selected: "2 selected", Actions, Ask Linear, Clear                                                                                                                                       |
| **Create-view form** (inline creation)  | 1:5676–1:5711                                                                     | Card `#1a1a1b` with a `#222325` border and radius 10. Placeholders `#5c5d5f`. Accent button `#5e6ad2` + `#fffeff`; ghost Cancel `#e4e5e7`; footer divider `#2b2c2e`                                            |
| Login **step 1** vs **step 2**          | 1:12610 (providers) vs 1:12645 (email entry)                                      | Step 2 adds the input (`#111212` / `#27282a`, radius 10, placeholder `#565658`) and a Back link                                                                                                                |
| Health status variants                  | "No updates" (1:5142) vs "Off track · 13d" (1:5177)                               | Neutral `#959597` vs red `#ff6364` (+ 70% suffix)                                                                                                                                                              |
| Priority variants                       | "Medium Priority" (1:5150) vs "No Priority" (1:5186)                              | SVG only                                                                                                                                                                                                       |

No hover, focus or disabled states are drawn in these nodes. The transparent 1 px borders suggest that a border color appears on hover or focus in the original design (Linear).

---

## 8. Icon set and image assets

- **Icons:** all exported as individual SVGs, none from a named library. The layers are named "Image" or "Icon". They look like Linear's own icon set.
  - Sidebar, top: Inbox, Reviews (with count badge), My issues, Agent.
  - Workspace section: Projects, Views, More.
  - Your teams: team icon (teal), chevron, Home, Issues, Projects, Views.
  - Try section: Invite people, Initiatives, Cycles, Connect Cursor, Connect Codex.
  - Workspace row and footer: workspace caret (8 px), Search, Create new issue (+), Help.
  - Main content header: New project, Add new view, Add filter, Display options, Open sidebar (Group).
  - Rows: project icons (5 colored variants), milestone ring, health (No updates, Off track), priority (Medium, No priority), progress ring.
  - Floating bar: Actions, Ask Linear, Clear (×). Checkbox check.
  - Footer: Agent, Chat history.
  - Login: Google "G" (monochrome `#09090a`, 14×16).
- **Raster:** the login logo "image 1" (1:12615 / 1:12650) is a PNG of 1254×1254 px, shown at 91.5×91.5.

---

## 9. Layout per screen

**Login, 1:12610.** A full-height (933) container with a vertical gradient `#111212` → `#09090a` at 50%. A centred column is 288 wide:

1. Logo, 91.5.
2. H1 at 18 px.
3. A 44 px light gradient Google button, gap 12, then a hint line.
4. Two 44 px dark pill buttons, gap 16.
5. Footer text line with inline links.

**Login, 1:12645.** Same shell, with a Medium 18 px heading "What's your email address?". Below it is a form with gap 16: a 44 px input (radius 10) and a 44 px dark pill button, then a "Back to login" link.

**Navbar, 1:6569.** A 244 px column on `#09090a`, in this order:

1. Top bar (44 tall at top 8): a workspace menu button (20 px avatar + name + caret), then search and new-issue round buttons of 28 px.
2. Scroll list (`pl-12 pr-2 pt-26`): 4 primary items, then the collapsible sections Workspace, Your teams (team row with sub-items at a 19 px indent) and Try.
3. Bottom-left help pill (24 px button in a radius-12 container with a ring shadow) at y 889.

**Zynox · Projects, 1:4813.** Page `#09090a`. The sidebar (the same Navigation as 1:6569) sits next to the main content card (1:5042). The card has `pr-8 py-8`, bg `#121213`, a `#1a1b1d` border, radius 12 and a drop shadow. Inside the card:

1. Header row (43): title "Projects" and a ghost "New project" button.
2. Toolbar row (43): view chips, Add view, Add filter, Display, Open sidebar.
3. Table: a grid with a 32 px header of sort buttons and 48 px-pitch rows.
4. Bottom-right footer: Agent and Chat history buttons, 28 tall with radius 8.

**Main Content (Projects), 1:5330.** The same card as in 1:4813, with rows 1 and 2 selected (indigo row bg plus checkboxes). A floating pill bar with bulk actions sits centred at the bottom.

**Main Content (New view), 1:5635.** The same card. The toolbar shows the inactive "All projects" chip plus the dashed "New view" draft chip. An inline 145 px form card is inserted above the table:

1. Icon picker, title input (15 px) and Cancel / Create view buttons.
2. Description input.
3. Footer divider with filter and display buttons.

---

## 10. Inconsistencies and near-duplicates to decide on

1. **Secondary grays.** `#929294` (sidebar), `#959597` (main content), `#949597` (login) and `#98999c` (icons) are one role spread across four values.
2. **Primary light text.** `#e2e3e5`, `#e3e4e6` and `#e4e5e7` are within 1–2 steps of each other. There is also `white`, and `#fffeff` on the accent button.
3. **Dark surfaces between `#1a…` and `#1c…`.**
   - `#1a1a1b` (bar / card) and `#1a1b1d` (panel border).
   - `#1b1b1c` (login button), `#1b1c1d` (icon button) and `#1c1c1d` (inactive chip).
   - These are 5 values within ±2.
4. **Raised surfaces.** `#222224` (ring), `#222325` (card border) and `#232325` (active / button) are near-identical. `#27282a`, `#29292b` and `#2b2c2e` are a second cluster.
5. **Deep backgrounds.** `#111212` (login and input) is close to `#121213` (main panel).
6. **Dim text.** `#565658` / `#565759` / `#5c5d5f`, plus `#525254` for the chevron.
7. **Reds.** `#ff6364` (status), `#eb5757` (project icon) and `#dd5264` (avatar) are three different reds.
8. **Pill radius.** It is expressed three ways: `9999px`, `100px` and `48px`. `10px` and `12px` both appear for cards and containers.
9. **Font family.** Plain `Inter` and `Inter Variable` are mixed ("Log in to Zynox"; the "Off track" wrapper). Only weights 400 and 500 are used.
10. **Off-scale values.** `pt-[1.05px]`, fractional heights (126.047, 98.05, 192.047), `pt-[226.5px]`, a 91.5 px logo, `pb-15`, `leading-19.5`, `pr-9` / `pl-9`, `pl-5`, `pl-35`, `px-18`, and the 0.5 px shadow y-offset. Most of these are browser-capture artifacts, because the file looks captured from a live web app (auto names such as "Container:margin" and "Text").
11. **Selected-row tints.** `#9b9bad`, `#e4e4f8` and `#606071` exist only in the selected state. They behave like a "text on accent-tinted surface" palette.
12. **Branding.** The copy still says "Ask Linear" (1:5626) and the node is named "Container (Linear)" (1:12652). The source is a Linear capture.
