/**
 * Icon Picker (Figma 1:1401, "Icon Project"): abas Icons / Emojis. Icons: cores do ícone em
 * amostras de 22 px, busca e grade de ícones de 16 px em botões de 28 px, tingidos com a cor
 * escolhida. Emojis: busca e grade por seção. IconPickerPanel é o painel; IconPicker o abre num
 * Popover a partir de um gatilho.
 */
import { Popover, RadioGroup } from "radix-ui";
import { useState, type ReactElement } from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";
import { ColorDot, LABEL_COLORS, labelTextClass, type LabelColor } from "./color-dot";
import { PROJECT_EMOJIS, PROJECT_ICONS } from "./icon-picker-data";
import { popoverSurface } from "./listbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

export type ProjectIconValue =
  | { kind: "icon"; name: string; color: LabelColor }
  | { kind: "emoji"; emoji: string };

export type IconPickerPanelProps = {
  value?: ProjectIconValue;
  onValueChange: (value: ProjectIconValue) => void;
  className?: string;
};

const search =
  "h-control-md w-full rounded-control bg-input px-2 text-body-md text-primary outline-none placeholder:text-placeholder focus-ring";

const cell =
  "flex size-7 items-center justify-center rounded-control transition-colors focus-ring hovered:bg-hover aria-pressed:bg-selected";

export function IconPickerPanel({ value, onValueChange, className }: IconPickerPanelProps) {
  const [color, setColor] = useState<LabelColor>(value?.kind === "icon" ? value.color : "orange");
  const [iconQuery, setIconQuery] = useState("");
  const [emojiQuery, setEmojiQuery] = useState("");
  const q = iconQuery.trim().toLowerCase();
  const icons = PROJECT_ICONS.filter(
    (i) => q === "" || i.name.toLowerCase().includes(q) || i.keywords.some((k) => k.includes(q)),
  );
  const eq = emojiQuery.trim().toLowerCase();

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
        <RadioGroup.Root
          aria-label="Icon color"
          orientation="horizontal"
          value={color}
          onValueChange={(next) => {
            const c = next as LabelColor;
            setColor(c);
            if (value?.kind === "icon") onValueChange({ ...value, color: c });
          }}
          className="flex items-center justify-between px-4 py-4"
        >
          {LABEL_COLORS.map((c) => (
            <RadioGroup.Item
              key={c.value}
              value={c.value}
              aria-label={c.label}
              className="rounded-full focus-ring"
            >
              <ColorDot color={c.value} size="lg" checked={color === c.value} />
            </RadioGroup.Item>
          ))}
        </RadioGroup.Root>
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
              onClick={() => onValueChange({ kind: "icon", name: i.name, color })}
              className={cell}
            >
              <Icon icon={i.icon} className={labelTextClass[color]} />
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
                      onClick={() => onValueChange({ kind: "emoji", emoji: e.char })}
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
  return <Icon icon={found.icon} className={cn(labelTextClass[value.color], className)} />;
}

export type IconPickerProps = IconPickerPanelProps & {
  children: ReactElement;
  portal?: boolean;
};

export function IconPicker({ children, portal = true, onValueChange, ...panel }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const content = (
    <Popover.Content
      align="start"
      sideOffset={4}
      aria-label="Project icon"
      className={cn(popoverSurface, "rounded-control")}
    >
      <IconPickerPanel
        {...panel}
        onValueChange={(v) => {
          onValueChange(v);
          setOpen(false);
        }}
      />
    </Popover.Content>
  );
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      {portal ? <Popover.Portal>{content}</Popover.Portal> : content}
    </Popover.Root>
  );
}
