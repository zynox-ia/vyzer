# Figma inventory C: section 1:6791 "Teams -> Issues"

File `CNJik9Re3oAtqNma67yjou`, page 0:1. No Figma variables or styles; every value below is raw.

## Method and coverage

- `get_design_context` on 1:6792 came back sparse (metadata only, 65 KB), and `get_metadata` on the section was 614 KB. Drilling node by node through get_design_context was not practical for about 5,800 nodes. To cover 100% of the subtrees, I used **read-only `use_figma` Plugin API traversals**. They walked every descendant of all 8 roots and aggregated fills, strokes, effects, radii, auto-layout gap and padding, text segments, opacity, blend and sizes. Nothing was written to the file.
- `get_design_context` on 1:12566 was used to cross-check how values come out as Tailwind. For example, auto line height becomes `leading-[normal]`, the family is `font-['Inter_Variable:Medium']`, and ring and drop shadows are combined into one `shadow-[...]`.
- Visible nodes walked per root (no hidden nodes found; hiddenCount = 0):

| Root      | Name                           | Size     | Nodes    |
| --------- | ------------------------------ | -------- | -------- |
| 1:6792    | Issues -> List                 | 1138x905 | 685      |
| 1:7477    | Issues -> New Issue            | 1138x905 | 721      |
| 1:8198    | Issues -> Add Filter           | 238x771  | 237      |
| 1:8435    | Show Display Options (List)    | 302x566  | 165      |
| 1:8600    | Show Display Options (Board)   | 302x505  | 149      |
| 1:8749    | Issues -> Board                | 1138x905 | 1908     |
| 1:10657   | Issues -> Board Hidden Columns | 1138x905 | 1909     |
| 1:12566   | Issues -> Open Details         | 436x792  | 44       |
| **Total** |                                |          | **5818** |

Notes on content:

- 1:7477 "New Issue" is **not a modal**. It is the List screen with an inline **"New view" form** card at the top (1:7552/1:7553), with "Cancel" and "Create view" buttons. There is no overlay or scrim anywhere in the section.
- 1:10657 matches 1:8749 node for node, except that its board is wrapped in `Container:scroll-content` (1:10738), i.e. scrolled horizontally so the "Hidden columns" panel (1:12515) is in view. Board 1:8749 has the same panel (1:10606) off-screen to the right.
- The design is an HTML-to-design import (layer names like `Container`, `Text:margin`, `h2d-svg-use-0`, `Link`). The counts below are inflated by this wrapper nesting.

Legend: `n` = occurrences; root counts are shown as `6792:x` etc.; ids are examples.

---

## 1. Colors

### 1a. Backgrounds (frame fills)

| Value                                        | n           | Where (root:n)                               | Role                                                                                                                                               | Example ids                                                    |
| -------------------------------------------- | ----------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `#1a1a1b`                                    | 279         | 8749:134, 10657:134, 6792:4, 7477:5, 12566:2 | **Surface/card bg**: board cards, board chips (priority/project), list group headers (base under gradient), Open Details panel, New view form card | 1:8859 card, 1:8881 chip, 1:6877 group header, 1:12566, 1:7553 |
| `#121213`                                    | 57          | 6792:22, 7477:23, 8749:6, 10657:6            | **App/page bg** (Main Content, Header), list-row project chip bg, board column header strip                                                        | 1:6793, 1:6795, 1:6914, 1:10432, 1:10607                       |
| `#ffffff @0`                                 | 56          | all                                          | Transparent overlay layers that carry ring shadows (pill "Text" 26x26 overlay)                                                                     | 1:6834, 1:6854, 1:12574                                        |
| `#323335`                                    | 20          | 8435:11, 8600:9                              | Display options: dropdown button bg, **unselected** segmented tab, **off** property chip                                                           | 1:8464, 1:8448, 1:8567                                         |
| `#454649`                                    | 18          | 8435:9, 8600:9                               | Display options: property chip **on/selected**                                                                                                     | 1:8558, 1:8561                                                 |
| `GRADIENT_LINEAR #09090a/0.4 -> #09090a/0.1` | 14          | 8749:7, 10657:7                              | **Board column bg** (340x796, radius 5/5/0/0)                                                                                                      | 1:8834                                                         |
| `#09090a @0.4`                               | 14          | 8749:7, 10657:7                              | Board column header bg (340x46)                                                                                                                    | 1:10434                                                        |
| `#1c1c1d`                                    | 9           | list, board                                  | View tab pill, **inactive** ("Backlog", "All issues")                                                                                              | 1:6835, 1:6839                                                 |
| `#1b1c1d`                                    | 9           | 6792:3, 8749:3, 10657:3                      | Header icon buttons (Add filter, Display options, Open details)                                                                                    | 1:6850, 1:6855, 1:6861                                         |
| `#29292b`                                    | 4           | list, board, 12566                           | View tab pill **active** ("Active"); Open Details tab 2                                                                                            | 1:6831, 1:12576                                                |
| `#28292b`                                    | 4           | 8435, 8600                                   | **Popover bg** (Display options) + its tab list track                                                                                              | 1:8435, 1:8439                                                 |
| `#747577`                                    | 4           | 8435, 8600                                   | **Toggle off** track                                                                                                                               | 1:8507, 1:8550                                                 |
| `#5e6ad2`                                    | 3 (+2 icon) | 7477, 8435, 8600, board                      | **Accent / primary**: "Create view" button, **toggle on** track, display-options "modified" dot (7x7)                                              | 1:7568, 1:8527, 1:8818                                         |
| `#232325`                                    | 3           | 7477:2, 12566:1                              | Icon buttons in New view form footer; Open Details tab 4                                                                                           | 1:7577, 1:12586                                                |
| `GRADIENT_LINEAR #221b1c -> #1a1a1b`         | 2           | 6792, 7477                                   | List group header tint, **Blocked** (red tint)                                                                                                     | 1:6877, 1:7597                                                 |
| `GRADIENT_LINEAR #201c1b -> #1a1a1b`         | 2           | 6792, 7477                                   | Group header tint, **Verifying** (orange tint)                                                                                                     | 1:6979                                                         |
| `GRADIENT_LINEAR #1e1d1b -> #1a1a1b`         | 2           | 6792, 7477                                   | Group header tint, **In Progress** (yellow tint)                                                                                                   | 1:7035                                                         |
| `GRADIENT_LINEAR #1c1d1f -> #1a1a1b`         | 2           | 6792, 7477                                   | Group header tint, gray/blue status (4th group)                                                                                                    | 1:7389                                                         |
| `#000000 @0`                                 | 2           | 8198                                         | Transparent list containers in Add Filter                                                                                                          | 1:8207                                                         |
| `#404144`                                    | 2           | 8435, 8600                                   | Segmented tab **selected** (List/Board)                                                                                                            | 1:8441, 1:8613                                                 |
| `#212223`                                    | 2           | 12566                                        | Open Details "No assignee" row button + nested "See issues" button                                                                                 | 1:12591, 1:12605                                               |
| `#bec2c8 @0.17`                              | 1           | 7477                                         | "Choose icon" button bg (28x28)                                                                                                                    | 1:7558                                                         |
| `#212122`                                    | 1           | 8198                                         | **Popover bg** (Add Filter)                                                                                                                        | 1:8198                                                         |
| `#313234`                                    | 1           | 8198                                         | Add Filter list item **highlighted** (keyboard/hover)                                                                                              | 1:8210                                                         |
| `#313133`                                    | 1           | 12566                                        | Open Details tab 1, **selected** ("Assignees")                                                                                                     | 1:12571                                                        |
| `#242425`                                    | 1           | 12566                                        | Open Details tab 3                                                                                                                                 | 1:12581                                                        |

The gradient direction on the group headers is left to right (status tint fading into `#1a1a1b`). Get the exact angle with get_design_context on 1:6877 if needed.

### 1b. Text colors

| Value                                         | n      | Where                        | Role                                                                                                          | Example ids                     |
| --------------------------------------------- | ------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `#98999c`                                     | 249    | 8749:123, 10657:123, 12566:3 | **Secondary text (board/details)**: card identifier, project chip label, "Created Sep 13", counts             | 1:8863, 1:8894, 1:8899, 1:12609 |
| `#ffffff`                                     | 132    | all                          | **Primary text**: issue titles, active tab label, popover item labels                                         | 1:6911, 1:8870, 1:6833          |
| `#959597`                                     | 122    | 6792:50, 7477:52, board:20   | **Secondary text (list/header)**: identifier ZYN-xxx, project label, date, inactive view tabs, breadcrumb "›" | 1:6902, 1:6920, 1:6930, 1:6837  |
| `#a0a1a4`                                     | 28     | 8435, 8600                   | Display options row labels ("Grouping", "Ordering"...)                                                        | 1:8455, 1:8473                  |
| `#e3e4e6`                                     | 25     | list, board                  | Breadcrumb team/page ("Zynox", "Issues"), board column titles, "Hidden columns"                               | 1:6811, 1:6816, 1:10614         |
| `#e5e6e8`                                     | 21     | 8198                         | Add Filter menu items ("Status", "Advanced filter")                                                           | 1:8206, 1:8237                  |
| `#626365`                                     | 18     | 8198                         | Submenu chevron "▶" (6px glyph)                                                                               | 1:8240                          |
| `#e6e7ea`                                     | 11     | 8435, 8600                   | Dropdown button values ("Status", "No grouping"), section title "List options"                                | 1:8467, 1:8532                  |
| `#e4e5e7`                                     | 9      | 6792, 7477                   | List group header status name ("Blocked", "Verifying"), "Cancel"                                              | 1:6890, 1:7567                  |
| `#a69597` / `#a69692` / `#a0988d` / `#949aa6` | 2 each | 6792, 7477                   | Group header **count**, tinted per status (red / orange / yellow / blue-gray)                                 | 1:6892, 1:6994, 1:7050, 1:7404  |
| `#5c5d5f`                                     | 2      | 7477                         | Input placeholders ("All issues" title, "Description (optional)")                                             | 1:7564, 1:7572                  |
| `#9c9d9f`                                     | 2      | 8198                         | Search placeholder "Add Filter…", Kbd "F"                                                                     | 1:8202, 1:8204                  |
| `#565759`                                     | 1      | 7477                         | "New view" dashed-pill label                                                                                  | 1:7545                          |
| `#fffeff`                                     | 1      | 7477                         | "Create view" on accent button                                                                                | 1:7569                          |
| `#d0d1d3` / `#9f9fa2`                         | 1 each | 12566                        | Open Details tabs 2 and 3 labels (tab 4 uses `#98999c`, tab 1 `#ffffff`)                                      | 1:12578, 1:12583                |

### 1c. Borders / strokes (frames)

| Value                         | n   | Where              | Role                                                                                                         | Example ids              |
| ----------------------------- | --- | ------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------ |
| `#000000 @0`, 1px inside      | 190 | all                | Transparent border placeholder on every pill button, tab and icon button (Tailwind `border-[rgba(0,0,0,0)]`) | 1:6817, 1:6831           |
| `#2f3033`, 1px inside         | 190 | 8749:95, 10657:95  | **Board chip border** (priority chip 25x24, project chip, label chips)                                       | 1:8881, 1:8888           |
| `#28282b`, 1px inside         | 38  | 6792:19, 7477:19   | **List row chip border** (project chip, relation chip)                                                       | 1:6914, 1:6948           |
| `#222325`, 1px inside         | 8   | 7477, board, 12566 | Card/panel border: New view form card, hidden-column rows, Open Details panel                                | 1:7553, 1:10616, 1:12566 |
| `#292a2d`, bottom 1px         | 5   | 8198               | Add Filter: search header divider + list section dividers                                                    | 1:8199, 1:8221           |
| `#292a2d`, 1px                | 1   | 8198               | Kbd border                                                                                                   | 1:8203                   |
| `#1a1b1d`, 1px                | 4   | list/board roots   | Main Content outer border                                                                                    | 1:6793                   |
| `#1a1b1d`, bottom 1px         | 4   | list/board         | Header top row divider                                                                                       | 1:6796                   |
| `#313235`, top 1px            | 4   | 8435, 8600         | Display options section dividers                                                                             | 1:8509, 1:8529           |
| `#3a3c3f`, 1px                | 2   | 8435, 8600         | **Popover border** (Display options)                                                                         | 1:8435                   |
| `#323336`, 1px                | 1   | 8198               | **Popover border** (Add Filter)                                                                              | 1:8198                   |
| `#2b2c2e`, top 1px            | 1   | 7477               | New view form footer divider                                                                                 | 1:7573                   |
| `#363a43`, 1px **dashed 2/1** | 1   | 7477               | "New view" dashed pill (placeholder tab)                                                                     | 1:7537                   |

### 1d. Icon colors (vector fills)

| Value                                         | n      | Where                      | Role                                                                      | Example ids                    |
| --------------------------------------------- | ------ | -------------------------- | ------------------------------------------------------------------------- | ------------------------------ |
| `#5c5d5f`                                     | 504    | 8749:252, 10657:252        | **Board card icon default** (assignee placeholder, label/relation glyphs) | 1:8873                         |
| `#565759`                                     | 205    | 6792:100, 7477:101         | **List icon default** (no-assignee 18x18, header icons, "New view")       | 1:6923, 1:6846, 1:7549         |
| `#98999c`                                     | 174    | board:164, 7477:3, 12566:7 | Board/details icon default (No Priority bars, footer icons)               | 1:7580                         |
| `#959597`                                     | 113    | list, board                | Header icon buttons (favorite, notifications, filter, display)            | 1:6820, 1:6853                 |
| `#9c9d9f`                                     | 32     | 8198                       | Add Filter menu item icons (14x14)                                        | 1:8225                         |
| `#a0a1a4`                                     | 11     | 8435, 8600                 | Display options icons (tab icons, dropdown chevrons 10x5)                 | 1:8450, 1:8470                 |
| `#e6e7ea`                                     | 8      | 8435, 8600                 | Ordering/direction icons (arrows)                                         | 1:8461                         |
| `#ffffff`                                     | 5      | 8198, 8435, 8600           | AI filter sparkle icon; toggle knob                                       | 1:8214                         |
| `#fffeff`                                     | 6      | 8435, 8600                 | Toggle knob (0x0 frame, fill only)                                        | 1:8508                         |
| `#bec2c8`                                     | 4      | 7477                       | "Choose icon" glyph, "New view" icon                                      | 1:7561                         |
| `#121213`                                     | 18     | board                      | Check glyph inside the "Done" status circle                               | 1:10186                        |
| `#3b2d2f` / `#3a2d2b` / `#362f26` / `#2c313b` | 2 each | list                       | Group header collapse chevron, tinted per status                          | 1:6883, 1:6985, 1:7041, 1:7395 |
| `#a69597` / `#a69692` / `#a0988d` / `#949aa6` | 2 each | list                       | Group header "+" (create) icon, tinted per status (same as count text)    | 1:6897, 1:6999                 |
| `#98999c @0.4`                                | 4      | board                      | Medium priority, inactive bar                                             | 1:9355                         |

### 1e. Status / priority / label / project colors

**Status icons** (stroked vectors: ring at 1.5px, inner arc/pie at 4px or 6px, `CENTER`, cap NONE; 14x14 "Icon"):

| Color     | n (1.5 / 4 / 6px) | Status (inferred from nearby text)                                     | Example ids      |
| --------- | ----------------- | ---------------------------------------------------------------------- | ---------------- |
| `#f0bf00` | 40 / 40 / –       | In Progress (yellow)                                                   | 1:7044, 1:7045   |
| `#bec2c8` | 34 / 34 / –       | Board status (Todo/Backlog-like, light gray)                           | 1:8867, 1:8868   |
| `#95a2b3` | 22 / 12 / 10      | Backlog/Todo gray; the 6px variant appears near "CANCELADO" (canceled) | 1:7398, 1:10312  |
| `#eb5757` | 12 / 12 / –       | Blocked (red)                                                          | 1:6906, 1:6907   |
| `#f2994a` | 8 / 8 / –         | Verifying (orange)                                                     | 1:6988, 1:6989   |
| `#4cb782` | 8 / – / 8         | Done (green, with a `#121213` check)                                   | 1:10184, 1:10185 |
| `#0060ff` | 2 / 2 / –         | Ready (blue), hidden-columns panel                                     | 1:10622          |
| `#27a644` | 2 / 2 / –         | In Review (green), hidden-columns panel                                | 1:10635          |

**Priority icons:**

| Color                      | n   | Role                                                 | Example ids |
| -------------------------- | --- | ---------------------------------------------------- | ----------- |
| `#ff7235`                  | 24  | Urgent priority (filled 14x14 badge)                 | 1:6901      |
| `#98999c` / `#98999c @0.4` | –   | High/Medium/No priority bars (active / inactive bar) | 1:9355      |
| `#565759` / `#5c5d5f`      | –   | No priority in list / board                          | 1:7149      |

**Other semantic colors:**

| Color            | n   | Role                                                                                                    | Example ids            |
| ---------------- | --- | ------------------------------------------------------------------------------------------------------- | ---------------------- |
| `#ff8683`        | 82  | Red relation chip icon (12x12 + 7x7 glyph) next to a count ("2", "3"), probably "blocked by / blocking" | 1:6950, 1:6957         |
| `#f34e52`        | 24  | Red icon in board card footer chip near "#23" (probably a PR/link)                                      | 1:10333                |
| `#4cb782` (fill) | 48  | Project icon "Plugga OS" (green)                                                                        | 1:6918                 |
| `#95a2b3` (fill) | 42  | Project icon "Aname CRM" (gray-blue)                                                                    | 1:7168                 |
| `#f0bf00` (fill) | 4   | Project icon "Mv School" (yellow)                                                                       | 1:7022                 |
| `#00b2bf`        | 8   | Team icon "Zynox" in breadcrumb (teal)                                                                  | 1:6808                 |
| `#5e6ad2`        | 5   | Accent (button, toggle on, modified dot)                                                                | 1:7568, 1:8527, 1:8818 |

### 1f. Shadow colors

`#000000/0.3`, `#000000/0.13`, `#ffffff/0.05`, `#ffffff/0.09`, `#ffffff/0.10`, `#ffffff/0.11`, `#ffffff/0.12`, `#ffffff/0.13` (see section 6).

---

## 2. Typography

The family is always **"Inter Variable"** (Tailwind `font-['Inter_Variable:Regular|Medium']`). Weights are only **Regular (400)** and **Medium (500)**. `lh auto` means `leading-[normal]`. There are no text-case transforms or decorations.

| Size / weight | Line height       | Tracking    | Align  | n   | Role                                                                                  | Example ids (color)                               |
| ------------- | ----------------- | ----------- | ------ | --- | ------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 12 Regular    | auto              | 0           | left   | 207 | Secondary metadata: board card project/date, list project chip label, relation counts | 1:6920 (#959597), 1:8899 (#98999c)                |
| 12 Regular    | auto              | **-0.24px** | left   | 72  | **Board card identifier** ZYN-xxx                                                     | 1:8863 (#98999c)                                  |
| 13 Medium     | **16px**          | 0           | left   | 72  | **Board card title** (2-line wrap, 260x32)                                            | 1:8870 (#fff)                                     |
| 13 Medium     | auto              | 0           | left   | 64  | **List row title**, breadcrumb, group header status name, board column title          | 1:6911 (#fff), 1:6811 (#e3e4e6), 1:6890 (#e4e5e7) |
| 12 Medium     | auto              | 0           | left   | 40  | Pill/tab labels (view tabs, popover labels, Open Details tabs)                        | 1:6833 (#fff), 1:8455 (#a0a1a4), 1:12573          |
| 12 Medium     | auto              | 0           | center | 31  | Button labels (Cancel, Create view, display property chips)                           | 1:7567, 1:7569, 1:8559                            |
| 13 Regular    | auto              | 0           | right  | 29  | Counts (group header counts, column counts, "128")                                    | 1:6892, 1:10628, 1:12609                          |
| 13 Regular    | auto              | **-0.26px** | left   | 28  | **List row identifier** ZYN-xxx                                                       | 1:6902 (#959597)                                  |
| 12 Regular    | auto              | 0           | right  | 28  | List row date ("Sep 13")                                                              | 1:6930 (#959597)                                  |
| 13 Regular    | auto              | 0           | left   | 24  | Add Filter menu items, description input, "No assignee"                               | 1:8237 (#e5e6e8), 1:7572, 1:12603                 |
| 6 Regular     | auto              | 0           | right  | 18  | Submenu "▶" glyph (text used as an icon)                                              | 1:8240 (#626365)                                  |
| 12 Regular    | auto              | 0           | center | 9   | Dropdown button value text                                                            | 1:8467 (#e6e7ea)                                  |
| 13 Medium     | **18.2px** (140%) | 0           | left   | 6   | Hidden-columns row titles                                                             | 1:10626 (#fff)                                    |
| 15 Medium     | auto              | 0           | left   | 1   | New view title input placeholder                                                      | 1:7564 (#5c5d5f)                                  |
| 12 Regular    | **13.2px** (110%) | 0           | center | 1   | Kbd "F"                                                                               | 1:8204                                            |
| 13 Regular    | **19.5px** (150%) | 0           | left   | 1   | Add Filter search text                                                                | 1:8206                                            |

The effective scale is 12 / 13, plus 15 used once and 6 for a glyph. Letter spacing is -0.02em on identifiers only (-0.24px @12, -0.26px @13).

---

## 3. Radii

| Value           | n   | Where                             | Role                                                                                                                        | Example ids                            |
| --------------- | --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `48`            | 300 | list 38, board 262                | Chips (priority, project, date chip), i.e. effectively a pill at 24px height                                                | 1:6914, 1:8881, 1:8896                 |
| `9999`          | 180 | all                               | Pill buttons: icon buttons 28/24/20, view tabs, popover tabs, property chips, ring overlays                                 | 1:6817, 1:6831, 1:8441, 1:12571        |
| `8`             | 146 | all                               | **Cards** (board card 334x133), list group header, inputs, dropdown buttons, list item, 16px icon wrappers, count "buttons" | 1:8859, 1:6877, 1:7563, 1:8464, 1:8210 |
| `50`            | 28  | 6792, 7477                        | List row chip wrapper (387x24)                                                                                              | 1:6912                                 |
| `5 / 5 / 0 / 0` | 28  | board                             | **Board column bg** top corners                                                                                             | 1:8834                                 |
| `12`            | 7   | list/board Main Content, popovers | **Main content panel** (1130x889), **popovers** (Add Filter, Display options)                                               | 1:6793, 1:8198, 1:8435                 |
| `72`            | 6   | 8435, 8600                        | Toggle track (22x14)                                                                                                        | 1:8507                                 |
| `5`             | 3   | popovers, 12566                   | Segmented tab list track                                                                                                    | 1:8439, 1:12569                        |
| `10`            | 2   | 7477, 12566                       | New view form card, Open Details panel                                                                                      | 1:7553, 1:12566                        |
| `4`             | 2   | 7477, 8198                        | Choose-icon button, Kbd                                                                                                     | 1:7558, 1:8203                         |
| `3.5`           | 2   | board                             | 7x7 dot (circle)                                                                                                            | 1:8818                                 |
| `2`             | 1   | 12566                             | "See issues" nested button                                                                                                  | 1:12605                                |

The pill radius appears as 48, 50, 72 and 9999. All of them mean "full"; normalize to one value.

---

## 4. Spacing

### 4a. Gaps (auto-layout itemSpacing)

| Gap              | n   | Where                   | Role                                                                                       |
| ---------------- | --- | ----------------------- | ------------------------------------------------------------------------------------------ |
| **4**            | 150 | board 148, list 2       | Board card chip row, header view-tab row (1:6830), footer rows (1:8880)                    |
| **6**            | 124 | all                     | Header rows (1:6797, 1:6826), Add Filter item content, tab label+icon (1:12571), form rows |
| **6** (vertical) | 73  | board, 7477             | Card title stack (1:8861), form fields (1:7555)                                            |
| **8**            | 66  | list 44, 8198 21, 12566 | **List row** (1:6909), group header (1:6877), Open Details row (1:12592)                   |
| **12**           | 34  | board                   | Column header (1:10435/1:10436), hidden-col row (1:10619)                                  |
| **3**            | 24  | list                    | Row chip wrapper (1:6912), which is off-scale                                              |
| **2**            | 17  | popovers, board, 12566  | Tab list tracks (1:8439, 1:12569), column header action buttons (1:10448)                  |
| 10 (vertical)    | 2   | board                   | Hidden-columns list (1:10615)                                                              |
| 8 (vertical)     | 1   | 7477                    | Form footer (1:7573)                                                                       |

### 4b. Paddings (T R B L)

| Padding                            | n       | Role                                                        | Example ids      |
| ---------------------------------- | ------- | ----------------------------------------------------------- | ---------------- |
| `0 8 0 8`                          | 164     | Chips 24px high (project, relation)                         | 1:6914, 1:6948   |
| `0 1 0 6`                          | 134     | Chip text margin (icon to label = 6)                        | 1:6919           |
| `0 4.5 0 4.5`                      | 94      | Board priority chip 25x24 (fractional)                      | 1:8881           |
| `0 1 8 1`                          | 72      | Board card outer (8px gap between cards via bottom padding) | 1:8858           |
| `8 8 8 8`                          | 72      | **Board card inner padding**                                | 1:8859           |
| `0 34 0 4`                         | 72      | Card title block (reserves 34 on the right for the avatar)  | 1:8861           |
| `10 0 0 0` / `6 0 0 0`             | 72 / 72 | Card chip row top spacing / date row top spacing            | 1:8880, 1:8895   |
| `1 0 0 0`                          | 72      | Status icon nudge                                           | 1:8865           |
| `0 3 0 1`                          | 72      | Date chip text                                              | 1:8897           |
| `0 2 0 2`                          | 62      | Icon buttons 28x28 and 24x24                                | 1:6817, 1:10449  |
| `0 1 0 1` / `0 3 0 0`              | 28 / 28 | List row status cell 16x36 / avatar cell 21x36              | 1:6903, 1:6921   |
| `0 10 0 10`                        | 14      | View tab pill 28px; Open Details row                        | 1:6831, 1:12591  |
| `4 12 4 12`                        | 10      | Hidden-column row (38px); Open Details tabs 28px            | 1:10616, 1:12571 |
| `2 2 2 2`                          | 9       | Tab track slots, Kbd                                        | 1:8440, 1:8203   |
| `1 18 1 8`                         | 9       | Display options dropdown button 117x24                      | 1:8464           |
| `8 16 8 16`                        | 6       | Display options sections                                    | 1:8437           |
| `6 8 6 8`                          | 4       | Segmented tab (List/Board) 28px                             | 1:8441           |
| `0 10 0 8`                         | 8       | Header rows (1128x44, 1128x43)                              | 1:6796, 1:6826   |
| `0 8 0 0`                          | 8       | List group header 36px (plus 26 for the collapse cell)      | 1:6877           |
| `4 4 4 4`                          | 8       | Collapse button margin 28 to 20                             | 1:6880           |
| `12 12 12 12`                      | 2       | New view form body; Open Details panel                      | 1:7555, 1:12566  |
| `6 6 6 6`                          | 2       | Text inputs                                                 | 1:7563, 1:7571   |
| `8 12 8 12`                        | 1       | New view form footer                                        | 1:7573           |
| `0 12 0 14` / `10 0 9 0`           | 1 each  | Add Filter search header / search input                     | 1:8199, 1:8201   |
| `6 0 6 0`                          | 4       | Add Filter section wrappers                                 | 1:8220           |
| `8 8 8 0`                          | 4       | **Screen outer padding** (list/board roots)                 | 1:6792           |
| `1 0 0 12` / `8 0 0 4` / `0 0 0 4` | –       | Board column list inset, board canvas                       | 1:9576, 1:8853   |

---

## 5. Systematic sizes

| Element                     | Size                                                                                                                                                               | Example ids                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| Screen frame / Main Content | 1138x905 / 1130x889 (r12, 1px border)                                                                                                                              | 1:6792, 1:6793                  |
| Header                      | 1128x87 = 44 (breadcrumb row, bottom border) + 43 (view tabs row)                                                                                                  | 1:6795, 1:6796, 1:6826          |
| **List row**                | **1128x44**; content 880x36                                                                                                                                        | 1:6898, 1:6909                  |
| **List group header**       | **1112x36**, r8, 8px inset                                                                                                                                         | 1:6877                          |
| List row cells              | priority 16x36, status 16x36 (14 icon), assignee 21x36 (18 icon)                                                                                                   | 1:6899, 1:6903, 1:6921          |
| **Board column**            | **348 wide** (340 bg + 4/4 margins), 7 columns in a 2444px track; header 348x50 (bg 340x46)                                                                        | 1:8832, 1:10433                 |
| **Board card**              | outer 336x141, inner **334x133**, r8, p8                                                                                                                           | 1:8858, 1:8859                  |
| Board chips                 | 25x24 (priority), 99-110x24 (project), 92x24 (date)                                                                                                                | 1:8881, 1:8888, 1:8896          |
| Hidden columns panel        | 350 wide (338 content), rows 338x38                                                                                                                                | 1:10606, 1:10616                |
| Icon sizes                  | **14x14** (majority: 226 "Image" + 128 "Icon" + 95 svg), **16x16** (32 + 6), **18x18** (102, no-assignee/avatar slot), 20x20 (1, details), 10x5 (chevron), 7x7 dot | 1:6819, 1:6885, 1:6922, 1:12594 |
| Avatar                      | No raster avatars. The assignee slot is an 18x18 vector "no assignee" glyph (list/board) or 20x20 (details)                                                        | 1:6922, 1:8871                  |
| Icon buttons                | **28x28** (header), **24x24** (row/column actions), 20x20 (collapse)                                                                                               | 1:6850, 1:10449, 1:6881         |
| Pill / tab heights          | **28** (view tabs, segmented tabs, form buttons), **24** (chips, dropdowns, property chips, form buttons Cancel/Create), 32 (tab track)                            | 1:6831, 1:8441, 1:8464, 1:7568  |
| Toggle                      | 22x14                                                                                                                                                              | 1:8507                          |
| Kbd                         | 18x20                                                                                                                                                              | 1:8203                          |
| Inputs                      | 899x24 (title), 1049x32 (description)                                                                                                                              | 1:7563, 1:7571                  |
| Popovers                    | Add Filter **238x771** (item rows 224x32 / 204x16, search header 37h); Display options **302x566** (List) / **302x505** (Board), content 268 wide                  | 1:8198, 1:8210, 1:8435          |
| Open Details panel          | **436x792** (410 content), tab track 410x32, row button 410x42                                                                                                     | 1:12566, 1:12591                |
| New view form card          | 1110x137 (form 1108x135, footer 45h)                                                                                                                               | 1:7553                          |

---

## 6. Shadows, effects, borders, opacity, overlays

**Shadows** (all `DROP_SHADOW`; no inner shadows, no layer or background blur, no backdrop-blur):

| Shadow                                                                                                      | n      | Role                                                                      | Example ids             |
| ----------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------- | ----------------------- |
| `0 0.5px 1px 1px rgba(0,0,0,0.3)`                                                                           | 128    | **Base elevation**: Main Content, pill buttons, cards, Open Details panel | 1:6793, 1:6838, 1:12566 |
| `0 0 0 1px rgba(255,255,255,0.05)`                                                                          | 72     | **Board card ring**                                                       | 1:8859                  |
| `0 0 0 1px rgba(255,255,255,0.10)`                                                                          | 39     | Popover pill ring (display option chips/tabs)                             | 1:8453, 1:8471          |
| `0 0 0 1px rgba(255,255,255,0.09)`                                                                          | 24     | Header pill ring (view tabs, icon buttons)                                | 1:6834, 1:6854          |
| `0 0 0 1px rgba(255,255,255,0.13)`                                                                          | 2      | Selected segmented tab ring                                               | 1:8446                  |
| `0 0 0 1px rgba(255,255,255,0.12)` / `0.11`                                                                 | 1 / 1  | Open Details tabs 1 / 2 (tabs 3 and 4 use 0.10 / 0.09)                    | 1:12574, 1:12579        |
| **Popover stack**: `0 1px 1px rgba(0,0,0,0.13)`, `0 2px 5px rgba(0,0,0,0.13)`, `0 3px 8px rgba(0,0,0,0.13)` | 3 each | Add Filter + Display options popovers                                     | 1:8198, 1:8435, 1:8600  |

The ring shadows are drawn on a separate transparent overlay child (`bg-[rgba(255,255,255,0)]`, r9999, 2px smaller than the pill). The white ring alpha forms a **ramp of 0.05 / 0.09 / 0.10 / 0.11 / 0.12 / 0.13**.

**Opacity:** `0.9` on 148 icon frames/vectors (breadcrumb icons 1:6806, "No Priority" vectors 1:7149). `0` on 1 node (Add Filter trailing text 1:8205, hidden hint).

**Blend modes:** none. **Overlays/scrims:** none.

**Borders:** see 1c. All are 1px `INSIDE`. Per-side borders are used for dividers (bottom: header/search; top: popover sections, form footer). The only dashed border is 1:7537 (dash 2/1).

---

## 7. States shown

| State                                          | Values                                                                                                                                                                         | Nodes                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| View tab **active** vs inactive                | bg `#29292b` + text `#fff` vs bg `#1c1c1d` + text `#959597`                                                                                                                    | 1:6831 vs 1:6835/1:6839                                   |
| Segmented tab **selected** vs not (List/Board) | `#404144` + ring 0.13 vs `#323335` + ring 0.10; text `#fff` vs `#a0a1a4`/`#fff`                                                                                                | 1:8441 vs 1:8448 (List popover); inverse in 1:8606/1:8613 |
| Open Details tabs, 4 visual levels             | bg `#313133`/`#29292b`/`#242425`/`#232325`, text `#fff`/`#d0d1d3`/`#9f9fa2`/`#98999c`, ring 0.12/0.11/0.10/0.09 (selected + three variants that fade, probably hover/inactive) | 1:12571, 1:12576, 1:12581, 1:12586                        |
| **Toggle on / off**                            | track `#5e6ad2` vs `#747577`, knob `#fffeff`, 22x14 r72                                                                                                                        | on: 1:8527, 1:8692; off: 1:8507, 1:8550                   |
| Display property chip **on / off**             | `#454649` vs `#323335` (r9999, 24h)                                                                                                                                            | on: 1:8558; off: 1:8567                                   |
| Menu item **highlighted** (hover/keyboard)     | `#313234`, r8, 224x32                                                                                                                                                          | 1:8210 (Add Filter, first item "AI filter")               |
| **Disabled**                                   | "Ordering is disabled for Focus group" button: same `#323335` bg, only the name signals it (no opacity change)                                                                 | 1:8495, 1:8660                                            |
| Modified indicator                             | 7x7 `#5e6ad2` dot on the "Display options" button                                                                                                                              | 1:8818                                                    |
| Placeholder / empty                            | Input placeholders `#5c5d5f`; "New view" dashed pill `#363a43` border + `#565759` label; "No assignee"                                                                         | 1:7564, 1:7537, 1:12603                                   |
| Collapsed/expanded groups                      | Collapse button 20x20 with per-status tinted chevron                                                                                                                           | 1:6881                                                    |
| Focus rings                                    | **None drawn** anywhere                                                                                                                                                        | –                                                         |
| Hover on list rows / cards                     | **Not shown** (all rows share the same transparent bg)                                                                                                                         | –                                                         |
| Loading / error                                | Not present                                                                                                                                                                    | –                                                         |

---

## 8. Icons and image assets

- **No raster images** (no IMAGE fills). All icons are vectors, exported by get_design_context as SVG assets (e.g. 1:12594, a 20x20 "Image" rendered as one SVG).
- Icon frame naming: `Image` (14/16/18/20), `Icon` (14, status), `h2d-svg-use-N` (14/16, project/team icons), `Image - Urgent|High|Medium|No Priority` (14 on board, 16 in list).
- Icons seen, by role:
  - Breadcrumb team icon (Zynox, teal), favorite star switch, notifications bell, add view "+", filter, display options (with dot), open details (panel).
  - Collapse chevron, create "+", status icons (ring+pie family), priority icons (urgent badge; high/medium/no bars), project icons (per-project color), no-assignee glyph, relation/blocked glyph (red `#ff8683`), link/PR glyph (`#f34e52`).
  - Add Filter menu icons (14x14, `#9c9d9f`) plus an AI sparkle (white), and a "▶" text glyph for submenus.
  - Display options: list/board tab icons, dropdown chevrons (10x5), ordering and direction arrows.
  - Column header "…" menu and "+" (24x24).

---

## 9. Inconsistencies and near-duplicates (for token derivation)

- **Two parallel gray ramps, list vs board.** List uses `#959597` (secondary text/icons) and `#565759` (muted icons). Board/details use `#98999c` and `#5c5d5f`. Each pair differs by about 1 to 2%, so they are near-duplicates.
- **Chip borders:** `#28282b` (list) vs `#2f3033` (board). Chip bg: `#121213` (list) vs `#1a1a1b` (board).
- **Near-white text:** `#e3e4e6`, `#e4e5e7`, `#e5e6e8`, `#e6e7ea` (4 near-duplicates); `#ffffff` vs `#fffeff`.
- **Mid-gray labels:** `#9c9d9f`, `#9f9fa2`, `#a0a1a4`, `#98999c` are near-duplicates.
- **Dark surfaces at 1-step intervals:** `#1a1a1b`, `#1b1c1d`, `#1c1c1d`, `#1a1b1d` (border); `#212122`, `#212223`; `#232325`, `#242425`; `#28292b`, `#29292b`, `#28282b`; `#313133`, `#313234`, `#313235`; `#323335`, `#323336`. They collapse to about 6 surface steps.
- **Divider borders:** `#222325`, `#292a2d`, `#2b2c2e`, `#313235`, `#3a3c3f`, `#323336`, `#1a1b1d`.
- **Pill radius** is expressed as 48, 50, 72 and 9999. Other radii: 8 is the workhorse, plus 4, 5, 10, 12, 2 and 3.5.
- **Off-scale spacing:** gap 3; paddings 4.5 (fractional), 1, 34, 35, 18, 9 (`10 0 9 0`), 14 (`0 12 0 14`).
- **Off-scale line heights:** 16px, 18.2px, 13.2px, 19.5px. Everything else is `normal`.
- Group header tints and count colors are one-off per status (4 gradient starts, 4 count colors, 4 chevron colors).
- **Status color duplicates:** `#4cb782` is both the "Done" status and the Plugga OS project icon; `#f0bf00` is both "In Progress" and the Mv School project icon; `#95a2b3` is both backlog/canceled status and the Aname CRM project icon.
- **Two greens** (`#4cb782`, `#27a644`) and **two reds** (`#eb5757`, `#f34e52`, plus `#ff8683` light red) for statuses and relations.
