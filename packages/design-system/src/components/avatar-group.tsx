/**
 * Avatar Group (sem frame no Figma; segue o Linear): avatares sobrepostos (4 px no md, 2 px no sm),
 * com um corte de 2 px em volta do vizinho que funciona sobre qualquer fundo (máscara, sem cor de
 * borda). Acima do limite, o último lugar mostra "+N".
 */
import { cn } from "../lib/cn";
import { Avatar, type AvatarSize } from "./avatar";

export type AvatarGroupPerson = { name: string; src?: string };

export type AvatarGroupProps = {
  /** Nome acessível do grupo (ex.: "Members"). */
  label: string;
  people: AvatarGroupPerson[];
  /** Quantos lugares no máximo, contando o "+N" (padrão: 4). */
  max?: number;
  size?: AvatarSize;
  className?: string;
};

/**
 * Corte do vizinho da direita: círculo centrado nele (tamanho − sobreposição + metade do tamanho)
 * com raio de metade do tamanho + 2 px. Valores na escala de espaçamento (4 px), sem cor. No sm, a
 * sobreposição é menor para o corte não comer o ícone de pessoa.
 */
const overlap: Record<AvatarSize, string> = { sm: "-ml-0.5", md: "-ml-1" };
const cut: Record<AvatarSize, string> = {
  sm: "[mask-image:radial-gradient(circle_at_calc(var(--spacing)*5.5)_50%,transparent_calc(var(--spacing)*2.5),currentColor_calc(var(--spacing)*2.625))]",
  md: "[mask-image:radial-gradient(circle_at_calc(var(--spacing)*6.5)_50%,transparent_calc(var(--spacing)*3),currentColor_calc(var(--spacing)*3.125))]",
};

const moreSize: Record<AvatarSize, string> = { sm: "size-icon-sm", md: "size-icon-md" };

export function AvatarGroup({ label, people, max = 4, size = "md", className }: AvatarGroupProps) {
  const overflow = people.length > max;
  const shown = overflow ? people.slice(0, Math.max(max - 1, 0)) : people;
  const hidden = people.slice(shown.length);
  const count = shown.length + (overflow ? 1 : 0);
  return (
    <ul aria-label={label} className={cn("flex items-center", className)}>
      {shown.map((person, i) => (
        <li
          // Nomes podem se repetir; a posição completa a chave.
          // oxlint-disable-next-line react/no-array-index-key
          key={`${person.name}-${i}`}
          className={cn("flex", i > 0 && overlap[size], i < count - 1 && cut[size])}
        >
          <Avatar name={person.name} src={person.src} size={size} />
        </li>
      ))}
      {overflow && (
        <li className={cn("flex", shown.length > 0 && overlap[size])}>
          <span
            // Contagem com os nomes de quem ficou de fora, lida como uma imagem só.
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
            role="img"
            aria-label={`${hidden.length} more: ${hidden.map((p) => p.name).join(", ")}`}
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full bg-neutral-subtle text-caption text-secondary tabular-nums select-none",
              moreSize[size],
            )}
          >
            +{hidden.length}
          </span>
        </li>
      )}
    </ul>
  );
}
