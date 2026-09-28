import type { SVGProps } from "react";
import { cn } from "../lib/cn";
import { iconSizeClass, type IconSize } from "./Icon";

/**
 * Direção do ícone de saúde (VYZ-36, Figma 1:5177 off-track e 25:5384 on-track): disco a 25% de
 * opacidade + seta em zigue-zague, no lugar dos glifos genéricos (TriangleAlert/CircleCheck) —
 * diferença perceptível conferida contra o Figma (.figma/01-design-tokens.md). "none" continua
 * CircleDashed (já bate com 1:5142) e não passa por aqui.
 */
export type HealthTrend = "up" | "down" | "flat";

/** Traçado exato do Figma (1:5177 e 25:5384), só espelhado no eixo Y entre up e down. */
const ARROW: Record<"up" | "down", string> = {
  up: "M12.6807 5.7029C12.9925 5.97566 13.0241 6.44948 12.7513 6.76121L9.71942 10.2263C9.56569 10.402 9.33892 10.4961 9.10596 10.4808C8.873 10.4656 8.66044 10.3427 8.53094 10.1485L6.76432 7.49855L4.37742 10.2263C4.10466 10.5381 3.63083 10.5696 3.31911 10.2969C3.00739 10.0241 2.97581 9.55028 3.24857 9.23856L6.28056 5.77356C6.43429 5.59788 6.66106 5.50379 6.89401 5.51905C7.12696 5.53432 7.33952 5.65718 7.46902 5.85142L9.23562 8.50133L11.6224 5.77347C11.8952 5.46174 12.369 5.43015 12.6807 5.7029Z",
  down: "M12.6807 10.297C12.9925 10.0242 13.0241 9.5504 12.7513 9.23866L9.71942 5.77356C9.56569 5.59786 9.33892 5.50377 9.10596 5.51903C8.873 5.53429 8.66044 5.65716 8.53094 5.8514L6.76432 8.50133L4.37742 5.77354C4.10466 5.46182 3.63083 5.43024 3.31911 5.703C3.00739 5.97577 2.97581 6.44959 3.24857 6.76132L6.28056 10.2263C6.43429 10.402 6.66106 10.4961 6.89401 10.4808C7.12696 10.4656 7.33952 10.3427 7.46902 10.1485L9.23562 7.49855L11.6224 10.2264C11.8952 10.5381 12.369 10.5697 12.6807 10.297Z",
};

/** Sem frame no Figma para "at risk" (spec: "crie seguindo... os padrões já implementados, sem
 * parar para perguntar"): mesma família visual (traço fino, extremidades arredondadas), sem
 * tendência — oscila e volta à mesma altura. */
const FLAT = "M3.3 8.2L6.6 6.3L9.4 9.7L12.7 7.8";

const CIRCLE =
  "M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z";

export type HealthTrendIconProps = SVGProps<SVGSVGElement> & {
  trend: HealthTrend;
  size?: IconSize;
  label?: string;
};

/** Disco de 25% + seta de tendência, 16 px (Figma 1:5177, 25:5384). */
export function HealthTrendIcon({
  trend,
  size = "sm",
  label,
  className,
  ...rest
}: HealthTrendIconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={cn("shrink-0", iconSizeClass[size], className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      focusable="false"
      {...rest}
    >
      <path d={CIRCLE} fill="currentColor" fillOpacity={0.25} />
      {trend === "flat" ? (
        <path
          d={FLAT}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path fillRule="evenodd" clipRule="evenodd" d={ARROW[trend]} fill="currentColor" />
      )}
    </svg>
  );
}
