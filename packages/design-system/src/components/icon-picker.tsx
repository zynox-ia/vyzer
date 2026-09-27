/**
 * Icon Picker (Figma 1:1401, "Icon Project"): abas Icons / Emojis. Icons: cores do ícone em
 * amostras de 22 px, divisória e o botão "Set custom color" (1:1425), que abre o seletor de cor
 * personalizada (HEX, área de saturação × brilho e barra de matiz); busca e grade de ícones de
 * 16 px em botões de 28 px, tingidos com a cor escolhida. Emojis: busca e grade por seção.
 * IconPickerPanel é o painel; IconPicker o abre num Popover a partir de um gatilho.
 */
import { Popover, RadioGroup } from "radix-ui";
import { useRef, useState, type ReactElement } from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";
import {
  hexToHsv,
  hsvToHex,
  isHexColor,
  parseHex,
  type HexColor,
  type Hsv,
} from "../lib/color-value";
import { ColorDot, LABEL_COLORS, labelTextClass, type LabelColor } from "./color-dot";
import { ColorArea, HueSlider } from "./custom-color";
import { PROJECT_EMOJIS, PROJECT_ICONS } from "./icon-picker-data";
import { popoverSurface } from "./listbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

/** Cor de ícone: uma da paleta ou personalizada (#rrggbb). */
export type IconColor = LabelColor | HexColor;

export type ProjectIconValue =
  | { kind: "icon"; name: string; color: IconColor }
  | { kind: "emoji"; emoji: string };

export type IconPickerPanelProps = {
  value?: ProjectIconValue;
  /** Chamado a cada mudança: ícone, emoji ou cor (a cor muda o ícone atual na hora). */
  onValueChange: (value: ProjectIconValue) => void;
  /** Chamado ao escolher um ícone ou emoji (o IconPicker fecha aqui). */
  onDone?: () => void;
  className?: string;
};

const search =
  "h-control-md w-full rounded-control bg-input px-2 text-body-md text-primary outline-none placeholder:text-placeholder focus-ring";

const cell =
  "flex size-7 items-center justify-center rounded-control transition-colors focus-ring hovered:bg-hover aria-pressed:bg-selected";

/** Classe e estilo de uma cor de ícone: token da paleta, ou a cor personalizada pelo estilo. */
function tint(color: IconColor) {
  return isHexColor(color)
    ? { className: undefined, style: { color } }
    : { className: labelTextClass[color], style: undefined };
}

/** Cor da paleta em HEX, lida do elemento renderizado (os tokens são OKLCH e mudam por tema). */
function renderedHex(el: Element | null | undefined): HexColor | undefined {
  if (!el) return undefined;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  ctx.fillStyle = getComputedStyle(el).backgroundColor;
  ctx.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

const DEFAULT_HSV: Hsv = { h: 25, s: 0.7, v: 0.9 };

export function IconPickerPanel({ value, onValueChange, onDone, className }: IconPickerPanelProps) {
  const [color, setColor] = useState<IconColor>(value?.kind === "icon" ? value.color : "orange");
  const [custom, setCustom] = useState(isHexColor(color));
  const [hsv, setHsv] = useState<Hsv>(isHexColor(color) ? hexToHsv(color) : DEFAULT_HSV);
  const [hexText, setHexText] = useState<string>();
  const swatches = useRef<HTMLDivElement>(null);
  const [iconQuery, setIconQuery] = useState("");
  const [emojiQuery, setEmojiQuery] = useState("");
  const q = iconQuery.trim().toLowerCase();
  const icons = PROJECT_ICONS.filter(
    (i) => q === "" || i.name.toLowerCase().includes(q) || i.keywords.some((k) => k.includes(q)),
  );
  const eq = emojiQuery.trim().toLowerCase();
  const hex = hsvToHex(hsv);
  const iconTint = tint(color);

  const applyColor = (next: IconColor) => {
    setColor(next);
    if (value?.kind === "icon") onValueChange({ ...value, color: next });
  };

  const applyHsv = (next: Hsv) => {
    setHsv(next);
    setHexText(undefined);
    applyColor(hsvToHex(next));
  };

  const commitHex = () => {
    if (hexText === undefined) return;
    const parsed = parseHex(hexText);
    if (parsed) applyHsv(hexToHsv(parsed));
    else setHexText(undefined);
  };

  const toggleCustom = () => {
    if (!custom && !isHexColor(color)) {
      // Começa da cor atual da paleta, como ela aparece no tema.
      const start = renderedHex(swatches.current?.querySelector(`[data-color="${color}"]`));
      if (start) setHsv(hexToHsv(start));
    }
    setCustom(!custom);
  };

  return (
    <Tabs
      defaultValue={value?.kind === "emoji" ? "emojis" : "icons"}
      className={cn("w-102", className)}
    >
      <TabsList aria-label="Project icon">
        <TabsTrigger value="icons">Icons</TabsTrigger>
        <TabsTrigger value="emojis">Emojis</TabsTrigger>
      </TabsList>

      <TabsContent value="icons">
        <div className={cn("flex items-center", custom ? "pt-3 pb-2" : "py-4")}>
          {custom ? (
            <div className="flex min-w-0 flex-1 items-center gap-3 pl-3">
              <ColorDot color={hex} size="lg" checked />
              <span className="text-label-sm text-secondary">HEX</span>
              <input
                aria-label="Hex color"
                value={hexText ?? hex}
                spellCheck={false}
                aria-invalid={hexText !== undefined && !parseHex(hexText)}
                onChange={(e) => setHexText(e.target.value)}
                onBlur={commitHex}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitHex();
                  }
                }}
                className="-ml-2 w-24 rounded-xs bg-transparent px-1 text-body-md text-primary outline-none focus-ring aria-invalid:text-danger"
              />
            </div>
          ) : (
            <RadioGroup.Root
              ref={swatches}
              aria-label="Icon color"
              orientation="horizontal"
              value={isHexColor(color) ? "" : color}
              onValueChange={(next) => applyColor(next as LabelColor)}
              className="flex flex-1 items-center justify-between px-4"
            >
              {LABEL_COLORS.map((c) => (
                <RadioGroup.Item
                  key={c.value}
                  value={c.value}
                  aria-label={c.label}
                  className="rounded-full focus-ring"
                >
                  <ColorDot
                    data-color={c.value}
                    color={c.value}
                    size="lg"
                    checked={color === c.value}
                  />
                </RadioGroup.Item>
              ))}
            </RadioGroup.Root>
          )}
          <div className={cn("flex items-center px-4", !custom && "border-l border-strong")}>
            <button
              type="button"
              aria-label="Set custom color"
              aria-pressed={custom}
              onClick={toggleCustom}
              className={cn(
                "size-5.5 rounded-full bg-hue-wheel focus-ring focus-ring-outside",
                custom && "outline-1 outline-offset-2 outline-strong",
              )}
            />
          </div>
        </div>
        {custom && (
          <div className="flex items-start gap-3 pr-5 pb-4 pl-3">
            <ColorArea value={hsv} onValueChange={applyHsv} className="flex-1" />
            <HueSlider value={hsv.h} onValueChange={(h) => applyHsv({ ...hsv, h })} />
          </div>
        )}
        <div className="border-y border-subtle px-2 py-1.5">
          <input
            aria-label="Search icons"
            placeholder="Search icons…"
            value={iconQuery}
            onChange={(e) => setIconQuery(e.target.value)}
            className={search}
          />
        </div>
        <div className="grid max-h-72 grid-cols-13 gap-0.5 overflow-y-auto px-2.5 py-2.5">
          {icons.map((i) => (
            <button
              key={i.name}
              type="button"
              aria-label={i.name}
              aria-pressed={value?.kind === "icon" && value.name === i.name}
              onClick={() => {
                onValueChange({ kind: "icon", name: i.name, color });
                onDone?.();
              }}
              className={cell}
            >
              <Icon icon={i.icon} className={iconTint.className} style={iconTint.style} />
            </button>
          ))}
          {icons.length === 0 && (
            <p className="col-span-13 px-1 py-2 text-body-sm text-secondary">No icons found</p>
          )}
        </div>
      </TabsContent>

      <TabsContent value="emojis">
        <div className="border-b border-subtle px-2 py-1.5">
          <input
            aria-label="Search emoji"
            placeholder="Search emoji…"
            value={emojiQuery}
            onChange={(e) => setEmojiQuery(e.target.value)}
            className={search}
          />
        </div>
        <div className="flex max-h-80 flex-col gap-2 overflow-y-auto px-2.5 py-2">
          {PROJECT_EMOJIS.map((section) => {
            const items = section.emojis.filter(
              (e) => eq === "" || e.name.includes(eq) || section.title.toLowerCase().includes(eq),
            );
            if (items.length === 0) return null;
            return (
              <div key={section.title} className="flex flex-col gap-1">
                <h3 className="px-1 text-label-sm text-secondary">{section.title}</h3>
                <div className="grid grid-cols-13 gap-0.5">
                  {items.map((e) => (
                    <button
                      key={`${section.title}-${e.name}`}
                      type="button"
                      aria-label={e.name}
                      aria-pressed={value?.kind === "emoji" && value.emoji === e.char}
                      onClick={() => {
                        onValueChange({ kind: "emoji", emoji: e.char });
                        onDone?.();
                      }}
                      className={cn(cell, "text-body-lg")}
                    >
                      {e.char}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </TabsContent>
    </Tabs>
  );
}

/** Mostra o ícone ou emoji escolhido (para o gatilho e para listas de projetos). */
export function ProjectIcon({ value, className }: { value: ProjectIconValue; className?: string }) {
  if (value.kind === "emoji") {
    return (
      <span aria-hidden className={cn("text-body-md leading-none", className)}>
        {value.emoji}
      </span>
    );
  }
  const found = PROJECT_ICONS.find((i) => i.name === value.name);
  if (!found) return null;
  const t = tint(value.color);
  return <Icon icon={found.icon} className={cn(t.className, className)} style={t.style} />;
}

export type IconPickerProps = Omit<IconPickerPanelProps, "onDone"> & {
  children: ReactElement;
  portal?: boolean;
};

/** Abre o IconPickerPanel num Popover; trocar a cor não fecha, escolher um ícone ou emoji fecha. */
export function IconPicker({ children, portal = true, ...panel }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const content = (
    <Popover.Content
      align="start"
      sideOffset={4}
      aria-label="Project icon"
      className={cn(popoverSurface, "rounded-control")}
    >
      <IconPickerPanel {...panel} onDone={() => setOpen(false)} />
    </Popover.Content>
  );
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      {portal ? <Popover.Portal>{content}</Popover.Portal> : content}
    </Popover.Root>
  );
}
