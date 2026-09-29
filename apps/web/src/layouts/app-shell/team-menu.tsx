/**
 * Menu "···" da linha de um Team na sidebar (spec `settings-administration.md`, sub-etapa 2.3;
 * Linear ao vivo, `zynox-dev`, 28/09): botão de 24 px, raio total, irmão do botão que recolhe o
 * grupo (botão dentro de botão é HTML inválido e quebra o foco), com `aria-label="Team menu"`.
 * Só os itens que têm função hoje (D11): Team settings e Copy URL. Favorite, Open archive,
 * Subscribe, Slack e Leave team voltam com os seus domínios.
 *
 * Aparece no hover da linha, no foco de qualquer coisa nela e enquanto o menu está aberto — as
 * classes `group/row` ficam no wrapper da linha em `TeamNavGroup`.
 */
import { Ellipsis, Link2, Settings } from "lucide-react";
import { useNavigate } from "react-router";
import {
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  useToast,
} from "@vyzer/design-system/components";

export function TeamMenu({
  slug,
  onOpenChange,
}: {
  slug: string;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const toast = useToast();

  const copyUrl = () => {
    navigator.clipboard
      .writeText(`${window.location.origin}/teams/${slug}`)
      .then(() => toast({ title: "Link copied", variant: "success" }))
      .catch(() => toast({ title: "Could not copy link", variant: "error" }));
  };

  return (
    <Menu onOpenChange={onOpenChange}>
      <MenuTrigger asChild>
        <IconButton
          icon={Ellipsis}
          label="Team menu"
          variant="ghost"
          size="sm"
          iconSize="14"
          className="absolute top-1/2 right-0.5 -translate-y-1/2 rounded-full opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 data-[state=open]:opacity-100"
        />
      </MenuTrigger>
      <MenuContent variant="dropdown" align="start">
        <MenuItem icon={Settings} onSelect={() => navigate(`/settings/teams/${slug}`)}>
          Team settings
        </MenuItem>
        <MenuItem icon={Link2} onSelect={copyUrl}>
          Copy URL
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
