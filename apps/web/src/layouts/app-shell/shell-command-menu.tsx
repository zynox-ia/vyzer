/**
 * Command Menu do shell (spec, item 5): abre pelo botão de busca da sidebar ou por Ctrl/⌘+K, de
 * qualquer tela. Navegação básica ("Go to…", já no catálogo da Fase 6) — sem dados reais
 * (fora do escopo desta fase).
 */
import { Bot, Inbox, Layers, Settings, SquarePen } from "lucide-react";
import { useNavigate } from "react-router";
import { CommandGroup, CommandItem, CommandMenu } from "@zynox/design-system/components";
import { useAppShell } from "./use-app-shell";

export function ShellCommandMenu() {
  const { commandMenuOpen, setCommandMenuOpen, setCreateIssueOpen } = useAppShell();
  const navigate = useNavigate();

  const go = (to: string) => {
    navigate(to);
    setCommandMenuOpen(false);
  };

  return (
    <CommandMenu
      open={commandMenuOpen}
      onOpenChange={setCommandMenuOpen}
      placeholder="Type a command or search…"
    >
      <CommandGroup heading="Issues">
        <CommandItem
          icon={SquarePen}
          shortcut={["C"]}
          onSelect={() => {
            setCommandMenuOpen(false);
            setCreateIssueOpen(true);
          }}
        >
          Create new issue…
        </CommandItem>
      </CommandGroup>
      <CommandGroup heading="Navigation">
        <CommandItem icon={Inbox} shortcut={["G", "I"]} onSelect={() => go("/inbox")}>
          Go to inbox
        </CommandItem>
        <CommandItem icon={Bot} shortcut={["G", "J"]} onSelect={() => go("/agent")}>
          Go to Agent
        </CommandItem>
        <CommandItem icon={Layers} shortcut={["G", "P"]} onSelect={() => go("/projects")}>
          Go to projects
        </CommandItem>
        <CommandItem
          icon={Settings}
          shortcut={["G", "S"]}
          onSelect={() => go("/settings/preferences")}
        >
          Go to settings
        </CommandItem>
      </CommandGroup>
    </CommandMenu>
  );
}
