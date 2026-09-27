# Figma inventory B: New Project section + Project Detail

File `CNJik9Re3oAtqNma67yjou` (page 0:1). No Figma variables; every value below is raw.

## Coverage and method

- **Roots (16):** 1:3, 1:904, 1:935, 1:1013, 1:1105, 1:1255, 1:1401, 1:3176, 1:3241, 1:3409, 1:4653, 1:5929, 1:6338, 1:6363, 1:6421, 1:6442.
- **Pass A (`get_design_context`, Tailwind codegen):**
  - Returned full code for 1:904, 1:935, 1:1013, 1:1105, 1:1255, 1:3176, 1:3241, 1:4653, 1:5929, 1:6338, 1:6363, 1:6421 and 1:6442.
  - Three roots came back sparse and were drilled into:
    - **1:3:** children 1:4, 1:196, 1:528, 1:700 and 1:832, all returned in full.
    - **1:1401:** 1:1404, 1:1412, 1:1426, 1:1427, 1:1433, 1:2358, 1:2439, 1:2447, 1:2453, 1:2454 and 1:2548 were returned in full.
    - **1:3409:** 1:3411, 1:3566, 1:4608, 1:4610, 1:4612, 1:4622, 1:3586 and 1:4598 were returned in full.
  - Some grids are highly repetitive and were **sampled** in pass A: the icon grid 1:1432 (14 rows; 2 read in full), the emoji grid 1:2452 (~70 rows; 1 read in full) and the decorative icon field 1:3585 (~250 tiles; 2 read in full). The metadata shows every cell has the same structure: 28×28 buttons and 24×24 tiles.
- **Pass B (plugin read via `use_figma`, read-only):**
  - Traversed **every node of all 16 subtrees (5,449 nodes, 0 missing)**.
  - Aggregated fills, strokes, radii, effects, opacity, text styles, auto-layout gaps and paddings.
  - Pass B covers the wrappers and grid cells that pass A only sampled.
  - Counts below come from pass B unless noted. Pass B reports the raw Figma values.
- **Codegen vs Figma for shadows:** the codegen expresses popover shadows as `drop-shadow(...)` with blur halved. For example, Figma `0 3 8` becomes codegen `0px_3px_4px`. Both forms are listed below.
- **Alpha rounding:** Figma alpha `0.125` shows as `0.13` in codegen, and `0.175` shows as `0.17`.
- **Font family:** it is `Inter Variable` everywhere. The weights used are Regular, Medium and Semi Bold. Nodes 1:6250 and 1:6331 codegen to `font-['Inter:Medium'] font-[450]`, which is the variable weight 450 on mixed-style text.

---

## 1. Colors

### 1.1 Backgrounds (surfaces)

| Value                                       | Count   | Role                                                                                                                                                  | Examples                                       |
| ------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `#1a1a1b`                                   | 14      | Modal body (New Project), project detail cards, Add Update / Add Comment composer, Overview canvas, sidebar tab list                                  | 1:3241, 1:3244, 1:6115, 1:6364, 1:6442         |
| `#121213`                                   | 2       | Project detail page background and header (darkest)                                                                                                   | 1:5929, 1:5931                                 |
| `#212122`                                   | 11      | **Dropdown / menu popover background** (Lead, Priority, Status, Labels, Dependency, Add doc)                                                          | 1:904, 1:935, 1:1106, 1:1256, 1:6338           |
| `#212223`                                   | 1       | Modal form surface in the "with agent sidebar" variant (near-duplicate of #212122)                                                                    | 1:3412                                         |
| `#28292b`                                   | 20      | Date picker popover, date tab list, text inputs, **"/" command menu**, icon/emoji search inputs                                                       | 1:4, 1:9, 1:12, 1:4653, 1:1428                 |
| `#232325`                                   | 29      | **Chip / pill button** (project property buttons, Post update, Comment, Write with Agent), segmented tab-list track, suggestion chips, agent composer | 1:3289, 1:3299, 1:6373, 1:6366, 1:4613, 1:4623 |
| `#232324`                                   | 2       | Header nav pill (Activity, Issues), not selected                                                                                                      | 1:5992, 1:5996                                 |
| `#29292b`                                   | 1       | Header nav pill, selected (Overview)                                                                                                                  | 1:5988                                         |
| `#2c2d2f`                                   | 2       | Secondary button (Create with Agent, Hide)                                                                                                            | 1:3262, 1:3569                                 |
| `#2c2c2e`                                   | 1       | Cancel button in Create milestone                                                                                                                     | 1:3200                                         |
| `#2d2d2f`                                   | 1       | Close project details icon button                                                                                                                     | 1:6005                                         |
| `#2a2b2d`                                   | 1       | Send message round button (agent composer)                                                                                                            | 1:4648                                         |
| `#313234`                                   | 11      | **Menu item highlight (hover/active row)**, 32px tall, radius 8                                                                                       | 1:929, 1:1000, 1:1029, 1:1294, 1:6342          |
| `#393a3d`                                   | 1       | Command menu highlighted row (radius 6)                                                                                                               | 1:4654                                         |
| `#313235`                                   | 13      | Calendar weekend-column shading (Su/Sa), extended with shadows                                                                                        | 1:55, 1:69, 1:87                               |
| `#323335`                                   | 20      | Date granularity tab, not selected (Day/Month/Quarter/Half-year/Year)                                                                                 | 1:19, 1:24, 1:29                               |
| `#404144`                                   | 5       | Date granularity tab, **selected**                                                                                                                    | 1:14, 1:548, 1:725, 1:862                      |
| `#313133`                                   | 3       | Segmented tab, **active** (Comment/Update, Assignees)                                                                                                 | 1:6369, 1:6424, 1:6284                         |
| `#2f3033`                                   | 2       | Today calendar cell; 2px progress-quote bar                                                                                                           | 1:151, 1:6387                                  |
| `#3a3c3f`                                   | 1       | 1px divider drawn as a filled rect under calendar header                                                                                              | 1:195                                          |
| `#5c5d5f`                                   | 1       | "Scope" legend square (6×6)                                                                                                                           | 1:6264                                         |
| `#5e6ad2`                                   | 8       | **Primary button** (Add milestone, Create project), checked checkbox, purple label dot                                                                | 1:3203, 1:3407, 1:1241                         |
| `rgba(242,153,74,0.175)`                    | 2       | Project icon tile background (orange tint, 28px)                                                                                                      | 1:3277, 1:3433                                 |
| `rgba(242,201,76,0.175)`                    | 2       | Project icon tile background (yellow tint, 36px)                                                                                                      | 1:6019, 1:6447                                 |
| `rgba(18,18,19,0.7)`                        | 1       | Overlay with backdrop blur (sidebar scrim)                                                                                                            | 1:6112                                         |
| `rgba(255,255,255,0)` / `rgba(0,0,0,0.004)` | 61 / 25 | Transparent wrappers (ring holders, list containers); not a real color                                                                                | 1:17, 1:905                                    |

### 1.2 Text

| Value                 | Count                      | Role                                                                                                                                               | Examples                            |
| --------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `#ffffff`             | 220 (177 are emoji glyphs) | Emoji, highlighted/hovered menu item label, selected tab label, project title "Mv School", today date, headings in agent sidebar                   | 1:934, 1:1009, 1:16, 1:6452, 1:4609 |
| `#e6e7ea`             | 215                        | Primary text in **date picker / icon picker** family (dates, Q1–Q4, H1–H2, months, years, "Icons" active tab)                                      | 1:44, 1:77, 1:576, 1:1407           |
| `#e5e6e8`             | 37                         | Primary text in **dropdown menus** (non-highlighted item labels)                                                                                   | 1:920, 1:959, 1:1053                |
| `#e4e5e7`             | 31                         | Primary text in **modal / composer** (button labels, chip values, "New project" breadcrumb)                                                        | 1:3201, 1:3260, 1:3297, 1:6370      |
| `#e3e4e6`             | 13                         | Property values on project detail (Backlog, No priority, Lead), breadcrumb                                                                         | 1:6042, 1:6470, 1:5947              |
| `#e0e1e4` / `#dcdddf` | 1 / 1                      | Header nav labels Issues / Activity                                                                                                                | 1:5998, 1:5994                      |
| `#fffeff`             | 3                          | Text on primary (#5e6ad2) button                                                                                                                   | 1:3204, 1:3408, 1:3564              |
| `#a0a1a4`             | 110                        | Secondary text in date picker / cmd menu / icon picker (labels, weekday headers, weekend dates, year headings, shortcut hints, search placeholder) | 1:8, 1:56, 1:573, 1:4666, 1:1429    |
| `#9c9d9f`             | 38                         | Secondary text in **dropdown menus** (search placeholder, shortcut numbers, section label, Kbd)                                                    | 1:939, 1:926, 1:928, 1:942          |
| `#9c9da0`             | 1                          | "Skills" button label                                                                                                                              | 1:4640                              |
| `#98999c`             | 46                         | Secondary text in **modal / detail sidebar** (inactive chip values Lead/Members/Start/Target, inactive tab, "Create milestone", counts)            | 1:3321, 1:3182, 1:6368, 1:6126      |
| `#959597`             | 14                         | Section headings on project detail (Properties, Resources, Description, Milestones), breadcrumb "›"                                                | 1:6032, 1:6460, 1:6524              |
| `#68696b`             | 12                         | Dates outside current month (disabled-looking)                                                                                                     | 1:71, 1:167                         |
| `#626365`             | 4                          | Search placeholder in Dependency menu, secondary chevron "▶", `"teste"` echo                                                                       | 1:1289, 1:1283, 1:1222              |
| `#626366`             | 1                          | Agent composer placeholder                                                                                                                         | 1:4635                              |
| `#5c5d5f`             | 11                         | **Placeholder** in New Project modal (Project name, summary, description, Milestone name)                                                          | 1:3283, 1:3287, 1:3370, 1:3191      |
| `#565759`             | 11                         | **Placeholder** on project detail page (summary, description, Add document…, Milestone)                                                            | 1:6456, 1:6532, 1:6516              |
| `#41ba56`             | 1                          | Status "On track" (green)                                                                                                                          | 1:6379                              |

### 1.3 Borders / dividers

| Value                         | Count                | Role                                                                                                  | Examples                          |
| ----------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------- |
| `#3f4044` 1px                 | 195 (+1 left-only)   | Outline buttons in date picker (Q1–Q4, H1/H2, months, years), date text input, custom-color separator | 1:575, 1:9, 1:875, 1:1424         |
| `#323336` 1px                 | 11                   | **Dropdown popover border**                                                                           | 1:904, 1:935, 1:1106              |
| `#292a2d` 1px                 | 10 + 8 bottom        | Kbd chip border; dropdown search header bottom divider                                                | 1:941, 1:936, 1:1285              |
| `#3a3c3f` 1px                 | 8 + 5 top + 5 bottom | Date-picker popover border, cmd menu border, section dividers, icon-picker tab list bottom            | 1:4, 1:4653, 1:39, 1:4697, 1:1404 |
| `#2b2c2e` 1px                 | 8                    | **Modal outer border**, milestone card border, segmented tab-list border                              | 1:3241, 1:3179, 1:6366            |
| `#222325` 1px                 | 6 + 3 bottom         | Detail sidebar cards, composer border, milestone row divider                                          | 1:6115, 1:6364, 1:3220            |
| `#2f3033` 1px                 | 4 top (+ inset ring) | Modal header/footer dividers; inset 1px ring on form 1:3412                                           | 1:3368, 1:3405, 1:3412            |
| `#232426` 1px                 | 2                    | "Write first project update" empty card                                                               | 1:6090, 1:6518                    |
| `#313235` 1px                 | 2 bottom + 1 top     | Icon/emoji picker section dividers                                                                    | 1:1426, 1:1427, 1:2447            |
| `#1a1b1d` 1px                 | 1 + 1 bottom         | Project detail page border, header bottom                                                             | 1:5929, 1:5932                    |
| `#68696b` 1px                 | 1                    | **Today** ring in calendar                                                                            | 1:151                             |
| `#858689` 1px                 | 1                    | Unchecked checkbox                                                                                    | 1:1296                            |
| `#5e6ad2` 1px                 | 2                    | Checked checkbox                                                                                      | 1:1241, 1:1353                    |
| `rgba(255,255,255,0.095)` 1px | 3                    | Agent suggestion chips                                                                                | 1:4613                            |
| `rgba(0,0,0,0)` 1px           | many                 | Transparent border slot on buttons (keeps box size)                                                   | 1:3200, 1:3248                    |

### 1.4 Icons (vector fills/strokes)

| Value                               | Count                | Role                                                                                                     | Examples               |
| ----------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------- |
| `#f2994a`                           | 264 fill + 12 stroke | Icon-picker glyph color (the selected project color is orange); Backlog status icon stroke 1.5 / 8 (pie) | 1:1438, 1:1033, 1:3292 |
| `#5c5d5f`                           | 252                  | Decorative icon field in agent sidebar (tiles at opacity 0.22)                                           | 1:3589                 |
| `#98999c`                           | 84 (+1 stroke w2)    | Modal/detail icons (calendar, chevrons, add, etc.)                                                       | 1:3194, 1:3187         |
| `#959597`                           | 30                   | Detail page icons                                                                                        | 1:5969                 |
| `#9c9d9f`                           | 22                   | Dropdown menu icons (no-lead, priority bars at 0.9 opacity)                                              | 1:911, 1:954           |
| `#a0a1a4`                           | 21                   | Date picker / cmd menu icons                                                                             | 1:49                   |
| `#e4e5e7`                           | 11                   | Icons on light-label buttons                                                                             | 1:3218                 |
| `#565759`                           | 9                    | Detail placeholder icons                                                                                 | 1:6003                 |
| `#ffffff` / `rgba(255,255,255,0.4)` | 8 / 2                | Icon on highlighted menu row (Low priority active/inactive bars)                                         | 1:1004, 1:1005         |
| `rgba(156,157,159,0.4)`             | 1                    | Inactive priority bar (Medium)                                                                           | 1:993                  |
| `#fffeff`                           | 2                    | Checkbox check mark                                                                                      | 1:1244                 |
| `#00b2bf`                           | 12                   | Team "Zynox" icon (cyan)                                                                                 | 1:3253                 |
| `#9c9da0`                           | 4                    | Skills icon                                                                                              | 1:4639                 |
| Gradient `#ffffff→#98999c`          | 3                    | Decorative glowing icon with layer blurs                                                                 | 1:4602                 |

### 1.5 Status, priority and label colors

- **Status icons** in 1:1013, stroke 1.5 on the ring plus stroke 8 as a pie fill:
  - Backlog `#f2994a` (1:1033)
  - Planned `#d7d8db` (1:1048)
  - Ready and In Progress `#f0bf00` (1:1060, 1:1072)
  - Completed `#5e6ad2` (1:1084)
  - Canceled `#8a8f98` (1:1096)
  - Milestone icon stroke `#f0bf00` w2 (1:3223)
- **Project update health:** On track `#41ba56` (text and icon), with a halo `rgba(65,186,86,0.25)` (1:6377, 1:6376).
- **Priority icons:**
  - The icons are monochrome and follow the row's text color: `#9c9d9f` at 0.9 opacity, or `#ffffff` on the highlighted row.
  - Inactive bars use the same color at alpha 0.4.
  - The urgent/high/medium/low shapes live in SVG assets (1:953, 1:968, 1:978, 1:990, 1:1003).
- **Label palette** (dot 9px radius 4.5 in 1:1132; swatch 22px radius 11 in 1:1412):

| Name      | Label menu    | Icon color picker                    |
| --------- | ------------- | ------------------------------------ |
| Grey      | `#bec2c8`     | `#bec2c8`                            |
| Dark Grey | `#95a2b3`     | `#95a2b3`                            |
| Purple    | `#5e6ad2`     | `#5e6ad2`                            |
| Teal      | `#26b5ce`     | `#26b5ce`                            |
| Green     | `#4cb782`     | `#4cb782`                            |
| Yellow    | **`#f2c94c`** | **`#f0bf00`** (mismatch)             |
| Orange    | `#f2994a`     | `#f2994a` (selected; check-mark PNG) |
| Pink      | `#f7c8c1`     | `#f7c8c1`                            |
| Red       | `#eb5757`     | `#eb5757`                            |

- **Project icon colors** (Dependency menu): `#95a2b3`, `#4cb782`, `#f2c94c`, `#0054b6`, `#eb5757` (1:1301 to 1:1337).

### 1.6 Gradients

| Gradient                                      | Role                                           | Node           |
| --------------------------------------------- | ---------------------------------------------- | -------------- |
| `linear(to bottom, #292a2e → #222325)`        | Agent composer overlay/bezel (radius 8/8/14/8) | 1:4632         |
| `linear(to left, #121213 → rgba(18,18,19,0))` | Project detail right sidebar fade (w400)       | 1:6113         |
| `linear #ffffff → #98999c`                    | Decorative glow icon                           | 1:4602, 1:4605 |

---

## 2. Typography

All combos use `Inter Variable`, except the emoji glyphs.

| Family / weight                 | Size | Line height | Tracking | Count | Role                                                                               | Examples                       |
| ------------------------------- | ---- | ----------- | -------- | ----- | ---------------------------------------------------------------------------------- | ------------------------------ |
| Medium                          | 12   | normal      | 0        | 277   | Button/chip labels, date buttons, section labels, tab labels, footer buttons       | 1:8, 1:576, 1:3201, 1:3408     |
| Segoe UI Emoji Regular          | 17   | 20          | 0        | 177   | Emoji grid glyphs                                                                  | 1:2458                         |
| Regular                         | 13   | normal      | 0        | 80    | **Menu item label**, search placeholder, breadcrumb, suggestion chips              | 1:920, 1:939, 1:4664           |
| Regular                         | 12   | normal      | 0        | 46    | Chip values in modal (Backlog, Lead…), date input placeholder, detail sidebar rows | 1:3297, 1:10, 1:6126           |
| Medium                          | 12   | 13.2        | 0        | 45    | Shortcut numbers / key hints (0, 1, Ctrl Alt 1)                                    | 1:926, 1:4666                  |
| Regular                         | 13   | 20          | 0        | 42    | Calendar day numbers                                                               | 1:71                           |
| Medium                          | 13   | normal      | 0        | 38    | Detail property values, section headings, "Milestones" header, icon-picker tabs    | 1:6042, 1:6460, 1:3213, 1:1407 |
| Regular                         | 13   | 19.5        | 0        | 15    | Weekday header; hidden (opacity 0) mirror of search text                           | 1:56, 1:947                    |
| Regular                         | 12   | 13.2        | 0        | 10    | Kbd key letter                                                                     | 1:942                          |
| Regular                         | 15   | 24          | -0.1     | 7     | Long-form placeholder (description, update, comment)                               | 1:3370, 1:6384                 |
| Regular                         | 10   | 23          | 0        | 5     | "then" between Kbd chips                                                           | 1:943                          |
| Semi Bold                       | 24   | 32          | -0.16    | 4     | **Project title**                                                                  | 1:3283, 1:6452                 |
| Regular                         | 15   | 23          | -0.1     | 4     | Project summary placeholder                                                        | 1:3287, 1:6456                 |
| Medium                          | 12   | 18          | 0        | 4     | Segmented tab labels (Comment / Update)                                            | 1:6368                         |
| Regular                         | 6    | normal      | 0        | 2     | "▶" submenu chevron (text glyph)                                                   | 1:1272                         |
| Medium                          | 12   | 22          | 0        | 2     | Emoji section headings                                                             | 1:2453                         |
| Regular                         | 12   | 18          | 0        | 1     | Month title "September 2026"                                                       | 1:44                           |
| Medium                          | 13   | 20          | 0        | 1     | Today date number                                                                  | 1:152                          |
| Semi Bold                       | 13   | 17.33       | -0.0867  | 1     | Milestone name placeholder (modal)                                                 | 1:3191                         |
| Regular                         | 13   | 19.5        | -0.0867  | 1     | Milestone description placeholder                                                  | 1:3198                         |
| Medium                          | 12   | 12          | 0        | 1     | "Create with Agent"                                                                | 1:3266                         |
| Semi Bold                       | 13   | 20          | 0        | 1     | "Draft a new project"                                                              | 1:4609                         |
| Regular                         | 13   | 20.8        | -0.0867  | 1     | Agent composer placeholder                                                         | 1:4635                         |
| Semi Bold                       | 15   | 23          | 0 / -0.1 | 1 / 1 | Milestone name on detail                                                           | 1:6111, 1:6544                 |
| Medium / Regular (450 variable) | 12   | 16.8        | 0        | 2     | Activity feed (author / "created the project")                                     | 1:6330, 1:6331                 |

**Scale actually used:** 6, 10, 12, 13, 15, 17 (emoji) and 24. **Line heights:** normal, 12, 13.2, 16.8, 17.33, 18, 19.5, 20, 20.8, 22, 23, 24 and 32.

---

## 3. Radii

| Value           | Count    | Role                                                                                                                                                   | Examples                     |
| --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| 9999 (pill)     | 556      | All buttons/chips/tabs, icon buttons, ring overlays                                                                                                    | 1:14, 1:3200, 1:3289         |
| 8               | 218      | Date popover, inputs, **menu item highlight**, icon-picker cells, avatar                                                                               | 1:4, 1:9, 1:929, 1:931       |
| 13              | 42       | Calendar day button (26px circle)                                                                                                                      | 1:70                         |
| 14.866 / 15.969 | 25 / 5   | Calendar table cells (artifact, off-scale)                                                                                                             | 1:72, 1:177                  |
| 12              | 20       | **Dropdown popovers**, milestone cards, modal form (12/12/7/12)                                                                                        | 1:904, 1:3179, 1:3244        |
| 4               | 15       | Kbd chip, count badge, 28px project icon tile                                                                                                          | 1:941, 1:3214, 1:3277        |
| 10              | 10       | Command menu, detail sidebar cards, composer (Add Update/Comment)                                                                                      | 1:4653, 1:6115, 1:6364       |
| 11              | 10       | Color swatch 22px (circle)                                                                                                                             | 1:1415                       |
| 4.5             | 10       | Label dot 9px (circle)                                                                                                                                 | 1:1145                       |
| 6               | 6        | Cmd menu highlight row, 36px icon tile, icon-picker container                                                                                          | 1:4654, 1:6447, 1:1402       |
| 5               | 6        | Date tab list, detail tab list                                                                                                                         | 1:12, 1:6282                 |
| 3               | 3        | Checkbox 14px                                                                                                                                          | 1:1241, 1:1296               |
| 1 / 2           | 2 / 1    | Legend square, quote bar                                                                                                                               | 1:6264, 1:6387               |
| 21              | 2        | **Modal outer container**                                                                                                                              | 1:3241, 1:3409               |
| Mixed           | 1–2 each | 8/8/0/0 & 0/0/8/8 (weekend column), 12/12/7/12 (form), 7/7/13/7 & 8/8/14/8 (composer), 0/20/20/0 (agent sidebar), 8/0/8/8, 0/0/10/10 (composer footer) | 1:55, 1:3244, 1:4623, 1:3565 |

---

## 4. Spacing

### Gaps (auto-layout itemSpacing)

The count of 0 is 2,272 (wrappers).

| Value                         | Count | Role                                                                                             | Examples               |
| ----------------------------- | ----- | ------------------------------------------------------------------------------------------------ | ---------------------- |
| 8                             | 110   | Menu item icon→label, chip row, calendar grid, label→input                                       | 1:908, 1:6, 1:54       |
| 6                             | 60    | Tab inner, breadcrumb, modal header actions, milestone header                                    | 1:14, 1:3247, 1:3211   |
| 4                             | 27    | Icon button groups                                                                               | 1:45, 1:3226           |
| 16                            | 14    | Create-milestone body, detail property grid (x)                                                  | 1:3183, 1:6458         |
| 2                             | 10    | Tab list (between tabs), progress row                                                            | 1:12, 1:6393           |
| 12                            | 7     | Modal footer buttons, title stack, detail grid (y)                                               | 1:3199, 1:3276, 1:6413 |
| 3, 1, 7.5, 10, 17, 22, 26, 30 | 1–4   | Off-scale / showcase-layout gaps (10–30 are gaps between the demo frames in the section, not UI) | 1:6231, 1:6564, 1:1255 |

### Paddings (T/R/B/L)

| Value       | Count | Role                                            |
| ----------- | ----- | ----------------------------------------------- |
| 0/8/0/8     | 210   | Pill buttons (24px)                             |
| 6/6/6/6     | 185   | Icon-grid buttons 28px                          |
| 8/4/0/4     | 40    | Year rows in picker                             |
| 2/2/2/2     | 39    | Tab margins                                     |
| 4 all       | 25    | Date tabs                                       |
| 3/6/3/6     | 24    | "Set target date" / property buttons (min-h 28) |
| 0/8/0/6     | 22    | Pill with leading icon                          |
| 6/0/6/0     | 20    | Cmd rows                                        |
| 0/2/0/2     | 19    | Icon-only buttons                               |
| 0/14/0/14   | 13    | Cmd row inset                                   |
| 10/0/9/0    | 8     | Menu search input                               |
| 8/18/8/30   | 8     | Dependency multi-select rows                    |
| 6/12/6/12   | 6     | Date text input                                 |
| 0/12/0/14   | 6     | Menu search header                              |
| 0/10/0/10   | 6     | 28px primary button                             |
| 12 all      | 6     | Modal header/footer (agent variant)             |
| 16/16/0/16  | 5     | Date popover                                    |
| 12/20/12/20 | 2     | Modal header/footer                             |
| 12/14/12/12 | 3     | Composer footer / milestone header              |
| 16 all      | 2     | Empty update card                               |
| 24/16/32/16 | 1     | Agent sidebar body                              |
| 7/8/7/8     | 4     | Icon-picker tabs                                |
| 6/10/6/10   | 3     | Suggestion chips                                |

- Menu rows are **absolutely positioned**:
  - The row content is 16px tall, `left 14px`.
  - Rows sit at a 32px pitch.
  - The highlight bar sits at `left 6px`, w = popover − 12, h 32.
  - The list has 6px top padding.
- Section label row in menus: `px 14 / py 8` (h 30).

---

## 5. Systematic sizes

| Element                  | Size                                                                                                                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Menu row (dropdown)      | **32** tall highlight; 16 content; icon slot 16; trailing shortcut number 12px Medium                                                                                                                    |
| Menu search header       | 36 (+1 border = 37)                                                                                                                                                                                      |
| Command menu row         | **34** (28 inner, py 6), icon slot 20 w, width 226 inner                                                                                                                                                 |
| Pill / chip button       | **24** (ring overlay 22), min-w 24                                                                                                                                                                       |
| Primary button           | 24 (milestone) and **28** (Create project)                                                                                                                                                               |
| Icon-only button         | **28** (px2, 14 icon) and 24                                                                                                                                                                             |
| Date granularity tab     | 28 in a 32 track                                                                                                                                                                                         |
| Calendar day             | 26 circle, 34 col width, 8 gap                                                                                                                                                                           |
| Icon / emoji picker cell | 28                                                                                                                                                                                                       |
| Color swatch             | 22; label dot 9; legend square 6                                                                                                                                                                         |
| Checkbox                 | 14 (check icon 10×9)                                                                                                                                                                                     |
| Avatar                   | 16 (radius 8)                                                                                                                                                                                            |
| Icons                    | **16** (282×) and **14** (300×); 24 in 36 tile; 16 in 28 tile; emoji 17px                                                                                                                                |
| Text inputs              | 32 (date input), 28 (icon/emoji search)                                                                                                                                                                  |
| Property button (detail) | min-h 28                                                                                                                                                                                                 |
| Milestone row            | 42 (min-h 42); detail milestone row 54                                                                                                                                                                   |
| Modal header             | min-h 52; footer 52 (12 px padding + 28 button)                                                                                                                                                          |
| **Popover widths**       | Lead 175 (min 173); Priority/Status 283 (281 inner); Labels 286 (min 281, max 500); Dependency 175 / 206 (min 173/204, max 500); Add doc 206; Date picker 305; Icon picker 412; Cmd menu 228 (max-h 599) |
| **Modal**                | 920×821 (form 803 tall); with agent sidebar 1320 (920 + 400)                                                                                                                                             |
| Content widths           | Milestone card 888; composer 696; overview column 632 (max 805); detail page 1130; detail sidebar 400                                                                                                    |

---

## 6. Shadows, effects, borders, opacity

### Shadows

| Figma value                                                      | Tailwind codegen                                                                                                                    | Count       | Role                                                      | Examples               |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------- | ---------------------- |
| `0 1 1 / 0 2 5 / 0 3 8` @ `rgba(0,0,0,0.125)`                    | `drop-shadow-[0px_3px_4px_rgba(0,0,0,0.13),0px_2px_2.5px_…,0px_1px_0.5px_…]`                                                        | 17          | **Dropdown / popover** (small)                            | 1:904, 1:4, 1:6338     |
| `0 1 1 / 0 2 8 / 0 3 12 / 0 3 20` @0.125 + `0 4 40` @0.1         | `shadow-[0px_4px_40px_0px_rgba(0,0,0,0.1),0px_3px_20px…,0px_3px_12px…,0px_2px_8px…,0px_1px_1px…]` (drop-shadow variant on submenus) | 4           | **Modal and submenu** (large)                             | 1:3241, 1:1284, 1:1341 |
| `0 3 8 / 0 2 5 / 0 1 1` @0.13 (box-shadow)                       | `shadow-[0px_3px_8px_0px_…]`                                                                                                        | 1 (codegen) | Command menu list                                         | 1:4655                 |
| `0 0.5 1 1 rgba(0,0,0,0.3)` + ring `0 0 0 1 rgba(255,255,255,α)` | `shadow-[0px_0px_0px_1px_rgba(255,255,255,0.09),0px_0.5px_1px_1px_rgba(0,0,0,0.3)]`                                                 | ~50         | **Secondary button ring** (on a transparent overlay 22px) | 1:3202, 1:22, 1:6380   |
| Ring only `0 0 0 1 rgba(255,255,255,α)`                          | `shadow-[0px_0px_0px_1px_rgba(255,255,255,0.13)]`                                                                                   | ~10         | Selected tab / Hide button / close button                 | 1:17, 1:3574, 1:6011   |
| `0 0.5 1 1 rgba(0,0,0,0.3)`                                      | `shadow-[0px_0.5px_1px_1px_rgba(0,0,0,0.3)]`                                                                                        | 13          | Primary button, detail cards, composer, modal form        | 1:3203, 1:6115, 1:6421 |
| Ring `#333437` + `0 0.5 1 1 rgba(0,0,0,0.3)`                     | `shadow-[0px_0px_0px_1px_#333437,…]`                                                                                                | 2           | Active segmented tab                                      | 1:6369, 1:6424         |
| `0 1 0 #6975e2` + inset `0 -1 0 #6975e2`                         |                                                                                                                                     | 2           | **Active underline tab** (Icons/Emojis)                   | 1:1406, 1:2444         |
| `0 8 0 #313235`, `0 16 0 #313235`                                |                                                                                                                                     | 12          | Hack to extend weekend-column shading                     | 1:69, 1:55             |
| `0 0 3 3 rgba(0,0,0,0)`                                          |                                                                                                                                     | 9           | Invisible swatch shadow (focus placeholder)               | 1:1415                 |
| inset `0 0 0 1 #2f3033`                                          |                                                                                                                                     | 1           | Modal form inner ring                                     | 1:3412                 |

- **Ring alpha variants** (these should collapse to one value): 0.091, 0.095, 0.099, 0.103, 0.112, 0.113, 0.114, 0.119, 0.129. The codegen rounds them to 0.09, 0.1, 0.11, 0.12 and 0.13.

### Blur / backdrop

| Effect                                                                                 | Role                 | Node                   |
| -------------------------------------------------------------------------------------- | -------------------- | ---------------------- |
| Background blur 24 in Figma (`backdrop-blur-[12px]` in codegen) + `rgba(18,18,19,0.7)` | Detail sidebar scrim | 1:6112                 |
| Layer blur 0                                                                           | No-op                | 1:3568, 1:3575, 1:3580 |
| Layer blur 7 / 3.5                                                                     | Decorative glow      | 1:4600, 1:4603         |

### Opacity

| Value      | Count | Role                                                           |
| ---------- | ----- | -------------------------------------------------------------- |
| 0.22       | 252   | Decorative icon tiles                                          |
| 0.9        | 24    | Priority bars, team icon                                       |
| 0          | 10    | Hidden mirror text in search inputs                            |
| 0.4        | 5     | Inactive icon parts                                            |
| 0.8        | 3     | Team property button                                           |
| 0.6        | 2     | "Change project teams" pill (disabled-looking)                 |
| 0.5        | 1     | **Disabled** "Start typing to create a new label" row (1:1122) |
| 0.15 / 0.3 | 1 / 1 | Glow groups                                                    |

### Other

- **Overlay / backdrop:** the only overlay is the detail sidebar scrim above. No modal backdrop is drawn in these nodes.
- **Hidden nodes:** 2, both in the decorative field (1:4552, 1:4553).

---

## 7. States

| State                                          | How it's drawn                                                                                                                                  | Nodes                                                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Menu item hover / keyboard-active**          | Row bg `#313234` radius 8, h32, inset 6. Label turns `#ffffff` (vs `#e5e6e8`), icon turns white                                                 | 1:929 (Lead), 1:1000 (Priority "Low"), 1:1029 (Status "Backlog"), 1:1142, 1:1213, 1:1239, 1:1262, 1:1294, 1:1351, 1:6342 |
| Command menu active row                        | `#393a3d` radius 6, h34, inset 4                                                                                                                | 1:4654                                                                                                                   |
| **Disabled / hint row**                        | Whole row opacity 0.5 (still has `#313234` bg)                                                                                                  | 1:1122                                                                                                                   |
| Search typed vs placeholder                    | Placeholder `#9c9d9f`; typed "teste" `#e5e6e8`; echo `#626365`                                                                                  | 1:1110 vs 1:1201, 1:1222                                                                                                 |
| **Checkbox**                                   | Unchecked: border `#858689`. Checked: bg + border `#5e6ad2`, check `#fffeff`, 14px r3                                                           | 1:1296, 1:1241, 1:1353                                                                                                   |
| **Selected tab (segmented, date granularity)** | bg `#404144` + ring `rgba(255,255,255,0.13)` + white text. Unselected: `#323335` + ring 0.1 + shadow, text `#a0a1a4`                            | 1:14 (Day), 1:548 (Quarter), 1:725 (Half-year), 1:862 (Year)                                                             |
| Selected segmented tab (composer)              | bg `#313133` + ring `#333437`, text `#e4e5e7`. Inactive text `#98999c`, no bg                                                                   | 1:6369 / 1:6424                                                                                                          |
| Header nav pill                                | Active Overview bg `#29292b` + ring 0.09, white text. Others `#232324` + ring 0.11 + shadow                                                     | 1:5988, 1:5992                                                                                                           |
| **Underline tab**                              | Active: text `#e6e7ea` + `#6975e2` 1px underline. Inactive: `#a0a1a4`                                                                           | 1:1406/1:1409, 1:2441/1:2444                                                                                             |
| **Calendar**                                   | Today: bg `#2f3033` + border `#68696b` + Medium white. Weekend: column `#313235`, text `#a0a1a4`. Other month: `#68696b`. Weekday: `#e6e7ea`    | 1:151, 1:69, 1:71, 1:77                                                                                                  |
| Color swatch selected                          | Orange swatch with check PNG overlay                                                                                                            | 1:1421                                                                                                                   |
| Chip with value vs empty                       | Value set `#e4e5e7` (Backlog, No priority, teste, Aname CRM). Empty `#98999c` (Lead, Members, Start, Target)                                    | 1:3297 vs 1:3321                                                                                                         |
| Placeholder (editable fields)                  | `#5c5d5f` (modal) / `#565759` (detail)                                                                                                          | 1:3283, 1:6456                                                                                                           |
| Focus                                          | **No explicit focus ring drawn anywhere.** Swatch has a `0 0 3 3 transparent` shadow slot only                                                  | —                                                                                                                        |
| Loading / error / empty                        | No loading or error visuals. Empty states: "Write first project update" card (1:6518), "Add document or link…" (1:6512), "No assignee" (1:6306) | —                                                                                                                        |

---

## 8. Icons and image assets

- **All icons are SVG exports** from `get_design_context`; there is no icon library or component. Named layers:
  - **Priority:** No Priority, Urgent Priority, High Priority, Medium Priority, Low Priority (1:953–1:1003, 1:3301, 1:6472).
  - **Status:** Backlog, Planned, Ready, In Progress, Completed, Canceled (1:1032–1:1095).
  - **Menus and buttons:** checkmark (1:922), chevrons (1:48, 1:52, rotated 90° in 1:3217), calendar / target date (1:3193), close / X (1:3270, 1:3578), add + (1:3238), attach paperclip (1:6416), agent / sparkle (1:3264, 1:6406), send (1:4650), skills (1:4638) with caret (1:4642), dependency blocked-by / blocking (1:1265, 1:1275), document / link (1:6345, 1:6353), members / lead (1:3311, 1:3325), labels, open menu dots (1:6556).
  - **Project icons:** project icons in the Dependency menu (1:1299–1:1335). The team icon "Zynox" is cyan `#00b2bf` (1:3251).
  - **Command menu:** Heading 1/2/3, Bulleted list, Numbered list, Checklist, Insert media, Attach files, Code block, Diagram, Collapsible section, Blockquote, Callout (1:4660–1:4807).
  - **Icon picker set** (1:1432, ~196 icons): Project, Face…, Users, Mask, Heart, …, Calendar, Page. The full list is in node names 1:1434–1:2432.
  - **Emoji picker** (1:2452): Segoe UI Emoji text glyphs, not images.
  - **Decorative field** (1:3585): ~250 14px icons at 0.22 opacity, `#5c5d5f`.
- **Raster images (PNG):**
  - Avatar of André Júnio, 16×16, `object-cover`, radius 8 (1:931).
  - Check mark on the selected Orange swatch (1:1421).

---

## 9. Inconsistencies worth resolving before tokenizing

1. **Primary text:** there are 8 near-whites: `#ffffff`, `#fffeff`, `#e6e7ea`, `#e5e6e8`, `#e4e5e7`, `#e3e4e6`, `#e0e1e4` and `#dcdddf`. Each surface family uses its own (date picker `#e6e7ea`, menus `#e5e6e8`, modal `#e4e5e7`, detail `#e3e4e6`).
2. **Secondary text:** 5 near-duplicates: `#a0a1a4`, `#9c9d9f`, `#9c9da0`, `#98999c` and `#959597`.
3. **Placeholder / tertiary:** 5 near-duplicates: `#68696b`, `#626365`, `#626366`, `#5c5d5f` and `#565759`.
4. **Surfaces:** these are 1–2 RGB steps apart and likely collapse to about 5 levels:
   - `#212122` vs `#212223`
   - `#232324` vs `#232325`
   - `#28292b` vs `#29292b` vs `#2a2b2d`
   - `#2c2c2e` / `#2c2d2f` / `#2d2d2f`
   - `#313133` / `#313234` / `#313235` / `#323335`
   - `#393a3d` / `#3a3c3f`
   - `#3f4044` vs `#404144`
5. **Borders:** `#292a2d`, `#2b2c2e`, `#2f3033`, `#222325`, `#232426`, `#323336`, `#313235`, `#3a3c3f` and `#3f4044` are all 1px separators.
6. **Accent:** `#5e6ad2` (buttons, checkbox) vs `#6975e2` (tab underline).
7. **Yellow:** `#f2c94c` (label menu, project icon) vs `#f0bf00` (swatch picker, status/milestone icons).
8. **Ring alphas:** 0.091–0.129 (9 values) for the same 1px white ring.
9. **Off-scale values:**
   - radius 14.866 / 15.969 (calendar cells), 4.5, 21, 7/13 composer corners
   - gap 7.5, 3, 17
   - padding 2.5
   - line heights 13.2, 16.8, 17.33, 20.8
   - tracking -0.0867 / -0.1 / -0.16
   - font size 6 (▶ glyph) and 10 ("then")
10. **Two popover families have different visual languages.** Dropdown menus use bg `#212122`, border `#323336` and radius 12. The date picker and command menu use bg `#28292b`, border `#3a3c3f` and radius 8/10.
11. **Shadows:** popover shadows are authored as CSS `drop-shadow` (filter) on some nodes and `box-shadow` on others (1:4655). The effective values are the same.
