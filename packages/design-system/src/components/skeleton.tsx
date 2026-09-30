/**
 * Skeleton (sem desenho no Figma): a forma do conteúdo que ainda está carregando, pulsando devagar
 * (1,6 s). Linha de texto, bloco (card, imagem) e avatar. É decorativo (aria-hidden): o contêiner
 * que carrega diz isso com aria-busy e um texto para leitor de tela.
 */
import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";
import type { AvatarSize } from "./avatar";

export type SkeletonShape = "line" | "block" | "avatar";

/**
 * line: 12 px de altura (cabe na linha de 20 do texto de 13 px), largura do contêiner.
 * block: raio de contêiner; a altura vem do conteúdo que ele substitui (className).
 * avatar: círculo nos tamanhos do Avatar.
 */
const shapeClass: Record<SkeletonShape, string> = {
  line: "h-3 w-full rounded-full",
  block: "h-20 w-full rounded-container",
  avatar: "rounded-full",
};

const avatarSize: Record<AvatarSize, string> = {
  sm: "size-icon-sm",
  md: "size-icon-md",
  lg: "size-icon-xl",
};

export type SkeletonProps = HTMLAttributes<HTMLSpanElement> & {
  shape?: SkeletonShape;
  /** Só no avatar: sm 16 · md 20 px (padrão) · lg 32 px, como o Avatar. */
  size?: AvatarSize;
};

/** Camada neutra a 15% (bg-neutral-subtle), a mesma do fundo do Avatar sem foto. */
export function Skeleton({ shape = "line", size = "md", className, ...rest }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "block shrink-0 animate-pulse bg-neutral-subtle motion-reduce:animate-none",
        shapeClass[shape],
        shape === "avatar" && avatarSize[size],
        className,
      )}
      {...rest}
    />
  );
}
