/**
 * Icon Picker (Figma 1:1401, "Icon Project"): abas Icons / Emojis. Icons: cores do ícone em
 * amostras de 22 px, divisória e o botão "Set custom color" (1:1425), que abre o seletor de cor
 * personalizada (HEX, área de saturação × brilho e barra de matiz); busca e ~370 ícones lucide por
 * categoria, em botões de 28 px tingidos com a cor escolhida. Emojis: o conjunto Unicode completo
 * pelo Frimousse (dados Emojibase servidos pelo próprio app), com busca, categorias e lista
 * virtualizada. IconPickerPanel é o painel; IconPicker o abre num Popover a partir de um gatilho.
 */
import { EmojiPicker } from "frimousse";
import { Popover, RadioGroup } from "radix-ui";
import { useEffect, useRef, useState, type ReactElement } from "react";
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
import { EMOJIBASE_URL } from "../lib/emoji-data";
import { ICON_CATEGORIES, loadMoreIcons, PROJECT_ICONS, type IconEntry } from "./icon-picker-data";
import { popoverSurface } from "./listbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

/** Os demais ícones do lucide, carregados sob demanda (undefined enquanto carrega). */
function useMoreIcons(enabled = true) {
  const [more, setMore] = useState<IconEntry[]>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    loadMoreIcons().then(
      (list) => {
        if (alive) setMore(list);
      },
      () => {
        if (alive) setFailed(true);
      },
    );
    return () => {
      alive = false;
    };
  }, [enabled]);
  return { more, failed };
}

/** Cor de ícone: uma da paleta ou personalizada (#rrggbb). */
export type IconColor = LabelColor | HexColor;

export type ProjectIconValue =
  | { kind: "icon"; name: string; color: IconColor }
  | { kind: "emoji"; emoji: string };

/** Emoji usado com frequência: o caractere e o nome acessível. */
export type FrequentEmoji = { emoji: string; label: string };

export type IconPickerPanelProps = {
  value?: ProjectIconValue;
  /**
   * Emojis usados com frequência, do mais ao menos usado, mostrados acima da lista quando não há
   * busca. Quem usa o picker guarda o histórico (o design system não persiste nada).
   */
  frequentEmojis?: FrequentEmoji[];
  /** Chamado a cada mudança: ícone, emoji ou cor (a cor muda o ícone atual na hora). */
  onValueChange: (value: ProjectIconValue) => void;
  /** Chamado ao escolher um ícone ou emoji (o IconPicker fecha aqui). */
  onDone?: () => void;
  className?: string;
};

/** Busca do seletor: mesmo padding e altura dos campos (12 px, 32 px), pedido do responsável. */
const search =
  "h-control-lg w-full rounded-control bg-input px-3 text-body-md text-primary outline-none placeholder:text-placeholder focus-ring";

const cell =
  "flex size-7 items-center justify-center rounded-control transition-colors focus-ring hovered:bg-hover aria-pressed:bg-selected";

/** Cabeçalho de categoria das duas abas (12 px/500, secondary). */
const sectionTitle = "px-1 text-label-sm text-secondary";

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

/** Índice ARIA a partir de 1, a partir do índice base 0 que o Frimousse entrega. */
function ariaIndex(index: number | string | undefined) {
  return index === undefined ? undefined : Number(index) + 1;
}

export function IconPickerPanel({
  value,
  frequentEmojis = [],
  onValueChange,
  onDone,
  className,
}: IconPickerPanelProps) {
  const [color, setColor] = useState<IconColor>(value?.kind === "icon" ? value.color : "orange");
  const [custom, setCustom] = useState(isHexColor(color));
  const [hsv, setHsv] = useState<Hsv>(isHexColor(color) ? hexToHsv(color) : DEFAULT_HSV);
  const [hexText, setHexText] = useState<string>();
  const swatches = useRef<HTMLDivElement>(null);
  const [iconQuery, setIconQuery] = useState("");
  const [emojiQuery, setEmojiQuery] = useState("");
  const chooseEmoji = (emoji: string) => {
    onValueChange({ kind: "emoji", emoji });
    onDone?.();
  };
  const q = iconQuery.trim().toLowerCase();
  // Busca por nome, palavra-chave ou categoria ("finance" mostra a categoria inteira).
  const { more, failed: moreFailed } = useMoreIcons();
  const matches = (i: IconEntry) =>
    i.name.toLowerCase().includes(q) ||
    (i.label?.toLowerCase().includes(q) ?? false) ||
    i.keywords.some((k) => k.includes(q));
  // Curadoria por categoria e, no fim, todos os demais ícones do lucide (pedido do responsável).
  const sections = [...ICON_CATEGORIES, { title: "More icons", icons: more ?? [] }]
    .map((c) => ({
      title: c.title,
      icons: q === "" || c.title.toLowerCase().includes(q) ? c.icons : c.icons.filter(matches),
    }))
    .filter((c) => c.icons.length > 0);
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
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto px-2.5 py-2.5">
          {sections.map((section) => (
            // fieldset, não section: section com rótulo vira landmark e repete entre pickers na página.
            <fieldset key={section.title} className="m-0 flex min-w-0 flex-col gap-1 border-0 p-0">
              <legend className={cn(sectionTitle, "mb-1")}>{section.title}</legend>
              <div className="grid grid-cols-13 gap-0.5">
                {section.icons.map((i) => (
                  <button
                    key={i.name}
                    type="button"
                    aria-label={i.label ?? i.name}
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
              </div>
            </fieldset>
          ))}
          {more === undefined && !moreFailed && (
            <p className="px-1 py-2 text-body-sm text-secondary">Loading more icons…</p>
          )}
          {moreFailed && (
            <p className="px-1 py-2 text-body-sm text-secondary">
              Couldn’t load more icons. Close and reopen to try again.
            </p>
          )}
          {sections.length === 0 && more !== undefined && (
            <p className="px-1 py-2 text-body-sm text-secondary">No icons found</p>
          )}
        </div>
      </TabsContent>

      <TabsContent value="emojis">
        <EmojiPicker.Root
          emojibaseUrl={EMOJIBASE_URL}
          columns={13}
          onEmojiSelect={({ emoji }) => chooseEmoji(emoji)}
          className="flex h-88 flex-col"
        >
          <div className="flex items-center gap-1.5 border-b border-subtle px-2 py-1.5">
            <EmojiPicker.Search
              aria-label="Search emoji"
              placeholder="Search emoji…"
              onChange={(e) => setEmojiQuery(e.target.value)}
              className={cn(search, "min-w-0 flex-1")}
            />
            {/* Tom de pele: alterna o tom de toda a lista (Frimousse); mesmo tamanho do campo */}
            <EmojiPicker.SkinToneSelector
              aria-label="Skin tone"
              className="flex size-8 shrink-0 items-center justify-center rounded-control text-body-lg transition-colors focus-ring hovered:bg-hover"
            />
          </div>
          {frequentEmojis.length > 0 && emojiQuery.trim() === "" && (
            <fieldset className="m-0 flex min-w-0 flex-col gap-1 border-0 px-2.5 pt-2 pb-1">
              <legend className={cn(sectionTitle, "mb-1 px-1")}>Frequently used</legend>
              <div className="grid grid-cols-13 gap-0.5">
                {frequentEmojis.map((f) => (
                  <button
                    key={f.emoji}
                    type="button"
                    aria-label={f.label}
                    aria-pressed={value?.kind === "emoji" && value.emoji === f.emoji}
                    onClick={() => chooseEmoji(f.emoji)}
                    className={cn(cell, "text-body-lg")}
                  >
                    {f.emoji}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          {/* Focável: a área rola e precisa ser alcançável pelo teclado (axe scrollable-region-focusable) */}
          <EmojiPicker.Viewport tabIndex={0} className="relative flex-1">
            <EmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-body-sm text-secondary">
              Loading…
            </EmojiPicker.Loading>
            <EmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-body-sm text-secondary">
              No emoji found
            </EmojiPicker.Empty>
            <EmojiPicker.List
              className="pb-2 select-none"
              components={{
                CategoryHeader: ({ category, className: _c, ...props }) => (
                  <div {...props} className={cn(sectionTitle, "bg-popover px-3.5 pt-2 pb-1")}>
                    {category.label}
                  </div>
                ),
                // O Frimousse numera linhas e colunas a partir de 0; o ARIA exige começar em 1.
                Row: ({ className: _c, ...props }) => (
                  <div
                    {...props}
                    aria-rowindex={ariaIndex(props["aria-rowindex"])}
                    className="flex gap-0.5 px-2.5 pb-0.5"
                  />
                ),
                Emoji: ({ emoji, className: _c, ...props }) => (
                  <button
                    // role="gridcell" vem do Frimousse nas props
                    {...{ ...props, "aria-colindex": ariaIndex(props["aria-colindex"]) }}
                    className={cn(
                      cell,
                      "text-body-lg data-active:bg-hover",
                      value?.kind === "emoji" && value.emoji === emoji.emoji && "bg-selected",
                    )}
                  >
                    {emoji.emoji}
                  </button>
                ),
              }}
            />
          </EmojiPicker.Viewport>
        </EmojiPicker.Root>
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
  return <ProjectLineIcon name={value.name} color={value.color} className={className} />;
}

/** Ícone salvo: curado na hora; fora da curadoria, depois de carregar os demais ícones. */
function ProjectLineIcon({
  name,
  color,
  className,
}: {
  name: string;
  color: IconColor;
  className?: string;
}) {
  const curated = PROJECT_ICONS.find((i) => i.name === name);
  const { more } = useMoreIcons(curated === undefined);
  const found = curated ?? more?.find((i) => i.name === name);
  if (!found) return null;
  const t = tint(color);
  return <Icon icon={found.icon} className={cn(t.className, className)} style={t.style} />;
}

export type IconPickerProps = Omit<IconPickerPanelProps, "onDone"> & {
  /** Gatilho. Sem ele, o botão de ícone padrão mostra o valor atual. */
  children?: ReactElement;
  /** Nome acessível do botão de ícone padrão (sem children). */
  triggerLabel?: string;
  portal?: boolean;
};

/**
 * Botão de ícone padrão (Figma 26:6865, "Choose icon"): quadrado de 28 px, raio 4, fundo
 * translúcido (bg-pressed) e o ícone ou emoji atual; o hover só soma a camada bg-hover.
 */
const iconTrigger =
  "inline-flex size-control-md shrink-0 items-center justify-center rounded-xs bg-pressed transition-[background-image] duration-fast ease-standard select-none focus-line hovered:[background-image:linear-gradient(var(--bg-hover),var(--bg-hover))]";

/** Abre o IconPickerPanel num Popover; trocar a cor não fecha, escolher um ícone ou emoji fecha. */
export function IconPicker({
  children,
  triggerLabel = "Choose icon",
  portal = true,
  ...panel
}: IconPickerProps) {
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
      <Popover.Trigger asChild>
        {children ?? (
          <button type="button" aria-label={triggerLabel} className={iconTrigger}>
            {panel.value && <ProjectIcon value={panel.value} />}
          </button>
        )}
      </Popover.Trigger>
      {portal ? <Popover.Portal>{content}</Popover.Portal> : content}
    </Popover.Root>
  );
}
