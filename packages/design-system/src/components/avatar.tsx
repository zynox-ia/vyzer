/**
 * Avatar (Figma 1:931, tamanho conferido no nó): foto de uma pessoa ou, sem foto, um ícone de
 * pessoa sobre fundo neutro, em círculo e com respiro interno (pedido do responsável; sem
 * iniciais). Radix Avatar cuida do carregamento: sem foto, ou se ela falhar, mostra o ícone.
 */
import { UserRound, type LucideIcon } from "lucide-react";
import { Avatar as RadixAvatar } from "radix-ui";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";

export type AvatarSize = "sm" | "md";

export type AvatarProps = {
  /** Nome da pessoa (ou do agente/ferramenta): nome acessível do avatar. */
  name: string;
  /** URL da foto. Sem ela, ou se falhar, aparece o ícone. */
  src?: string;
  /**
   * Ícone do fallback sem foto (padrão UserRound). Agentes externos sem logo (Cursor, Codex) usam
   * Bot (Fase 7, decisão 2: sem os SVGs desses produtos, ícone genérico + nome da ferramenta).
   */
  icon?: LucideIcon;
  /** sm 16 px (Figma 1:931) · md 20 px. */
  size?: AvatarSize;
  className?: string;
};

const sizeClass: Record<AvatarSize, string> = { sm: "size-icon-sm", md: "size-icon-md" };
/**
 * Ícone dentro do quadrado inscrito no círculo (≈ 0,7 × o diâmetro): 10 px no sm (3 px de respiro,
 * o glifo do Checkbox) e 12 px no md (4 px). Um ícone de 12 px no sm encostaria na borda.
 */
const iconClass: Record<AvatarSize, string> = { sm: "size-2.5", md: "size-icon-xs" };

export function Avatar({
  name,
  src,
  icon: FallbackIcon = UserRound,
  size = "md",
  className,
}: AvatarProps) {
  return (
    <RadixAvatar.Root
      // A raiz (span do Radix) contém foto ou ícone e é anunciada como uma imagem só, com o nome.
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="img"
      aria-label={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full select-none",
        sizeClass[size],
        className,
      )}
    >
      {src && <RadixAvatar.Image src={src} alt="" className="size-full object-cover" />}
      <RadixAvatar.Fallback
        aria-hidden
        className="flex size-full items-center justify-center bg-neutral-subtle text-secondary"
      >
        <Icon icon={FallbackIcon} className={iconClass[size]} />
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}
