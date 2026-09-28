import { useId, type SVGProps } from "react";
import { cn } from "../lib/cn";
import { iconSizeClass, type IconSize } from "./Icon";

/**
 * Tipo do status de um projeto (Figma 22:1218: Backlog, Planned, Ready, In Progress, Completed,
 * Canceled). Ready e In Progress são do tipo started.
 */
export type ProjectStatusType = "backlog" | "planned" | "started" | "completed" | "canceled";

/**
 * Cor por tipo, na paleta do Vyzer (ADR-0013), seguindo as matizes do Figma: laranja, claro,
 * amarelo, índigo e cinza.
 */
const typeClass: Record<ProjectStatusType, string> = {
  backlog: "text-orange",
  planned: "text-primary",
  started: "text-warning",
  completed: "text-indigo",
  canceled: "text-secondary",
};

/** Preenchimento padrão por tipo: vazio antes de começar, parcial em andamento, cheio no fim. */
const defaultProgress: Record<ProjectStatusType, number> = {
  backlog: 0,
  planned: 0,
  started: 0.5,
  completed: 1,
  canceled: 1,
};

export type ProjectStatusIconProps = Omit<SVGProps<SVGSVGElement>, "type"> & {
  type: ProjectStatusType;
  /** Fração do hexágono interno preenchida (0 a 1); o padrão vem do tipo (started = 1/2). */
  progress?: number;
  size?: IconSize;
  /** Rótulo acessível (ex.: "In Progress"). Sem ele, o ícone é decorativo. */
  label?: string;
};

/** Hexágono arredondado do Figma (22:1239): contorno de 1,5 px, tracejado no backlog. */
const HEXAGON =
  "M3.95778 4.02069L6.70777 2.36023C7.50244 1.88041 8.49756 1.88041 9.29223 2.36024L12.0422 4.02074C12.7918 4.47336 13.25 5.2852 13.25 6.16086V9.84803C13.25 10.7251 12.7904 11.5381 12.0388 11.9902L9.29114 13.6433C8.49693 14.1211 7.50355 14.1203 6.71011 13.6412L3.95775 11.9792C3.20815 11.5266 2.75 10.7148 2.75 9.83911V6.16082C2.75 5.28516 3.20816 4.47332 3.95778 4.02069Z";

/** Hexágono interno de 6 px que recebe o preenchimento (o mesmo recorte do ícone do Linear). */
const INNER =
  "M8.3779 4.74233C8.14438 4.60607 7.85562 4.60607 7.6221 4.74233L5.37209 6.05513C5.14168 6.18957 5 6.4363 5 6.70311V9.34216C5 9.60897 5.14168 9.85573 5.37209 9.99016L7.6221 11.303C7.85562 11.4392 8.14438 11.4392 8.3779 11.303L10.6279 9.99016C10.8583 9.85573 11 9.60897 11 9.34216V6.70311C11 6.4363 10.8583 6.18957 10.6279 6.05513L8.3779 4.74233Z";

/** Circunferência do círculo de raio 4 (o disco de traço 8 do Figma), para o setor. */
const CIRCUMFERENCE = 2 * Math.PI * 4;

/**
 * Ícone de status de projeto: o hexágono do Figma (22:1239 a 22:1313) com um hexágono interno
 * preenchido em setor a partir das 12 h. É a "leve diferença" para o StatusIcon de issue, que é
 * um círculo: projeto é hexágono. O Figma mostra um disco cheio porque a captura perdeu o recorte
 * do preenchimento; o disco de traço 8 continua aqui, recortado pelo hexágono interno.
 */
export function ProjectStatusIcon({
  type,
  progress,
  size = "sm",
  label,
  className,
  ...rest
}: ProjectStatusIconProps) {
  const clipId = `project-status-${useId().replaceAll(/[^a-zA-Z0-9_-]/g, "")}`;
  const p = Math.min(Math.max(progress ?? defaultProgress[type], 0), 1);
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={cn("shrink-0", iconSizeClass[size], typeClass[type], className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      focusable="false"
      {...rest}
    >
      <path
        d={HEXAGON}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="bevel"
        strokeDasharray={type === "backlog" ? "1.65 1.35" : undefined}
      />
      {p >= 1 && <path d={INNER} fill="currentColor" />}
      {p > 0 && p < 1 && (
        <>
          <clipPath id={clipId}>
            <path d={INNER} />
          </clipPath>
          <circle
            cx="8"
            cy="8"
            r="4"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${p * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            transform="rotate(-90 8 8)"
            clipPath={`url(#${clipId})`}
          />
        </>
      )}
    </svg>
  );
}
