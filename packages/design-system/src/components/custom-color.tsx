/**
 * Seletor de cor personalizada (Icon Picker, Figma 1:1425 "Set custom color"): área de
 * saturação × brilho com alça e barra vertical de matiz. O teclado chega à área por dois
 * controles deslizantes (Saturation, Brightness); a barra de matiz é o Slider do Radix.
 */
import { Slider } from "radix-ui";
import { useRef, type CSSProperties, type PointerEvent } from "react";
import { cn } from "../lib/cn";
import type { Hsv } from "../lib/color-value";

const hueVar = (h: number) => ({ "--picker-hue": Math.round(h) }) as CSSProperties;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export type ColorAreaProps = {
  value: Hsv;
  onValueChange: (value: Hsv) => void;
  className?: string;
};

/** Área de saturação (→) e brilho (↑) na matiz atual. */
export function ColorArea({ value, onValueChange, className }: ColorAreaProps) {
  const ref = useRef<HTMLFieldSetElement>(null);

  const fromPointer = (e: PointerEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    onValueChange({
      ...value,
      s: clamp01((e.clientX - rect.left) / rect.width),
      v: clamp01(1 - (e.clientY - rect.top) / rect.height),
    });
  };

  return (
    // O ponteiro arrasta a alça; o teclado usa os dois controles de dentro.
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
    <fieldset
      ref={ref}
      aria-label="Saturation and brightness"
      style={hueVar(value.h)}
      className={cn(
        "relative h-25 min-w-0 touch-none rounded-control bg-saturation-brightness focus-ring-within",
        className,
      )}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        fromPointer(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(e);
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full picker-handle"
        style={{ left: `${value.s * 100}%`, top: `${(1 - value.v) * 100}%` }}
      />
      <input
        type="range"
        aria-label="Saturation"
        min={0}
        max={100}
        value={Math.round(value.s * 100)}
        onChange={(e) => onValueChange({ ...value, s: Number(e.target.value) / 100 })}
        className="sr-only"
      />
      <input
        type="range"
        aria-label="Brightness"
        min={0}
        max={100}
        value={Math.round(value.v * 100)}
        onChange={(e) => onValueChange({ ...value, v: Number(e.target.value) / 100 })}
        className="sr-only"
      />
    </fieldset>
  );
}

export type HueSliderProps = {
  value: number;
  onValueChange: (hue: number) => void;
  className?: string;
};

/** Barra vertical de matiz: 0° no topo, 360° na base (como no Figma). */
export function HueSlider({ value, onValueChange, className }: HueSliderProps) {
  return (
    <Slider.Root
      orientation="vertical"
      inverted
      min={0}
      max={360}
      step={1}
      value={[value]}
      onValueChange={([h]) => onValueChange(h ?? 0)}
      className={cn("relative flex h-25 w-3.5 touch-none justify-center select-none", className)}
    >
      <Slider.Track className="relative w-1 grow rounded-full bg-hue-spectrum" />
      <Slider.Thumb
        aria-label="Hue"
        style={hueVar(value)}
        className="block size-3.5 rounded-full bg-picker-hue picker-handle focus-ring focus-ring-outside"
      />
    </Slider.Root>
  );
}
