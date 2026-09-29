/**
 * Seletor de workspace (Figma 1:6765, "Button - Zynox Workspace Menu"): ícone 20 px + nome +
 * chevron, abre o Menu do design system. O Figma usa as iniciais "ZY" num crachá colorido; o
 * Avatar do design system não tem iniciais (decisão já registrada) e não criamos prop nova só
 * para bater esse pixel — o ícone de workspace reaproveita o ProjectIcon (divergência em
 * .figma/01-design-tokens.md).
 */
import { ChevronDown, Settings, UserRoundPlus } from "lucide-react";
import { useNavigate } from "react-router";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
  type ProjectIconValue,
} from "@vyzer/design-system/components";
import { Icon } from "@vyzer/design-system/icons";
import { WorkspaceMark } from "./workspace-mark";

/** Ícone de quem ainda não carregou o Workspace: o mesmo padrão salvo no banco (spec 1.1, D1). */
const DEFAULT_ICON: ProjectIconValue = { kind: "icon", name: "Zap", color: "red" };

export function WorkspaceMenu({
  name,
  icon = DEFAULT_ICON,
  logoUrl,
  onRetry,
}: {
  name: string;
  icon?: ProjectIconValue;
  logoUrl?: string | null;
  onRetry?: () => void;
}) {
  const navigate = useNavigate();
  return (
    <Menu>
      {/* text-sidebar-title (14 px/500): regra do responsável, 28/09 — o nome do workspace fica
          sempre 1 a 2 px acima do texto dos itens da sidebar (hoje 13 px, text-label-md). O
          token nasceu como teste de tamanho para os próprios itens de nav (a 14 px); os itens
          voltaram para 13 e o degrau foi reaproveitado só para este título, aprovado. */}
      <MenuTrigger className="flex h-control-sm min-w-0 items-center gap-1.5 rounded-control px-1.5 text-sidebar-title text-primary select-none focus-ring hovered:bg-hover">
        {/* size-icon-md (20 px): medido ao vivo no Linear (avatar quadrado de 20, raio 8) —
            pedido do responsável, 28/09, o nome do workspace fica visivelmente maior que o
            conteúdo da sidebar. */}
        <WorkspaceMark icon={icon} logoUrl={logoUrl} className="size-icon-md" />
        <span className="min-w-0 truncate">{name}</span>
        <Icon icon={ChevronDown} size="xs" className="shrink-0 text-secondary" />
      </MenuTrigger>
      <MenuContent variant="dropdown" align="start">
        <MenuLabel>{name}</MenuLabel>
        {onRetry && (
          <>
            <MenuItem onSelect={onRetry}>Retry loading workspace</MenuItem>
            <MenuSeparator />
          </>
        )}
        <MenuItem icon={Settings} onSelect={() => navigate("/settings/workspace")}>
          Workspace settings
        </MenuItem>
        <MenuItem icon={UserRoundPlus} onSelect={() => navigate("/settings/members")}>
          Invite people
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
