import type { SVGProps } from "react";
import { cn } from "../lib/cn";
import { iconSizeClass, type IconSize } from "./Icon";

export type Priority = "none" | "urgent" | "high" | "medium" | "low";

export type PriorityIconProps = SVGProps<SVGSVGElement> & {
  priority: Priority;
  size?: IconSize;
  /** Rótulo acessível (ex.: "High priority"). Sem ele, o ícone é decorativo. */
  label?: string;
};

const BARS = [
  "M3.5 8H2.5C1.94772 8 1.5 8.44772 1.5 9V13C1.5 13.5523 1.94772 14 2.5 14H3.5C4.05228 14 4.5 13.5523 4.5 13V9C4.5 8.44772 4.05228 8 3.5 8Z",
  "M8.5 5H7.5C6.94772 5 6.5 5.44772 6.5 6V13C6.5 13.5523 6.94772 14 7.5 14H8.5C9.05228 14 9.5 13.5523 9.5 13V6C9.5 5.44772 9.05228 5 8.5 5Z",
  "M13.5 2H12.5C11.9477 2 11.5 2.44772 11.5 3V13C11.5 13.5523 11.9477 14 12.5 14H13.5C14.0523 14 14.5 13.5523 14.5 13V3C14.5 2.44772 14.0523 2 13.5 2Z",
];

const DASHES = [
  "M4 7.25H2C1.72386 7.25 1.5 7.47386 1.5 7.75V8.25C1.5 8.52614 1.72386 8.75 2 8.75H4C4.27614 8.75 4.5 8.52614 4.5 8.25V7.75C4.5 7.47386 4.27614 7.25 4 7.25Z",
  "M9 7.25H7C6.72386 7.25 6.5 7.47386 6.5 7.75V8.25C6.5 8.52614 6.72386 8.75 7 8.75H9C9.27614 8.75 9.5 8.52614 9.5 8.25V7.75C9.5 7.47386 9.27614 7.25 9 7.25Z",
  "M14 7.25H12C11.7239 7.25 11.5 7.47386 11.5 7.75V8.25C11.5 8.52614 11.7239 8.75 12 8.75H14C14.2761 8.75 14.5 8.52614 14.5 8.25V7.75C14.5 7.47386 14.2761 7.25 14 7.25Z",
];

const URGENT =
  "M3 1C1.91067 1 1 1.91067 1 3V13C1 14.0893 1.91067 15 3 15H13C14.0893 15 15 14.0893 15 13V3C15 1.91067 14.0893 1 13 1H3ZM7 4H9L8.75391 8.99836H7.25L7 4ZM9 11C9 11.5523 8.55228 12 8 12C7.44772 12 7 11.5523 7 11C7 10.4477 7.44772 10 8 10C8.55228 10 9 10.4477 9 11Z";

/** Barras ativas por prioridade; as inativas ficam com 40% de opacidade (como no Figma). */
const activeBars: Record<"high" | "medium" | "low", number> = { high: 3, medium: 2, low: 1 };

/**
 * Ícone de prioridade com os desenhos exatos do Figma (nó 1:935).
 * Urgent usa o tom danger; as demais prioridades são neutras (barras).
 */
export function PriorityIcon({
  priority,
  size = "sm",
  label,
  className,
  ...rest
}: PriorityIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={cn(
        "shrink-0",
        iconSizeClass[size],
        priority === "urgent" ? "text-danger" : "text-secondary",
        className,
      )}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      focusable="false"
      {...rest}
    >
      {priority === "none" &&
        DASHES.map((d) => <path key={d} d={d} fill="currentColor" opacity={0.9} />)}
      {priority === "urgent" && <path d={URGENT} fill="currentColor" />}
      {(priority === "high" || priority === "medium" || priority === "low") &&
        BARS.map((d, i) => (
          <path
            key={d}
            d={d}
            fill="currentColor"
            fillOpacity={i < activeBars[priority] ? 1 : 0.4}
          />
        ))}
    </svg>
  );
}
