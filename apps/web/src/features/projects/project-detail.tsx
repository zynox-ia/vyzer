/**
 * Projeto aberto (Figma 1:5931/25:4689; Linear ao vivo, `/zynox-dev/project/:slug/overview`):
 * cabeçalho só com o nome do projeto (sem "Time › Projects" na frente — confirmado ao vivo, o
 * Linear não encadeia o projeto aberto ao time nem ao workspace), a estrela, o "…" e as ações;
 * abas na URL. A rota não fica debaixo de time nem do workspace: `/projects/:projectId`,
 * independente de onde o clique veio (a lista do workspace ou a do time).
 *
 * Projeto inexistente: `EmptyState` do DS com link de volta para Projects, como o Linear
 * ("Project not found" / "We could not find the page you were looking for", medido ao vivo,
 * 28/09) — sem o TopBar/abas/painel, que não fazem sentido para uma rota que não existe.
 *
 * Filter e Display Options (Grouping, Show sub-issues) do Linear foram tirados daqui: o conteúdo
 * de cada aba é um placeholder desta fase (Fase 10, Patterns) — sem uma lista de issues de
 * verdade para filtrar ou agrupar, os controles ficariam decorativos sem operar nada (revisão de
 * código r3, bloqueante 2). "Add new view" e "Setup project notifications" continuam: são ações
 * simples, sem opções que fingem funcionar.
 *
 * Painel direito (Fase 7, VYZ-37, reaplicada sobre a Fase 8): mostra ou os detalhes do projeto ou
 * o chat do agente, nunca os dois ao mesmo tempo — o gatilho "Agent" do rodapé flutuante é
 * global (AppShell), então o que o painel mostra vem do contexto do shell (`rightPanelContent`).
 */
import {
  Bell,
  Copy,
  Ellipsis,
  FolderX,
  LayoutPanelLeft,
  Plus,
  Trash2,
  UserRoundPen,
} from "lucide-react";
import { useEffect } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import {
  Button,
  EmptyState,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  ProjectIcon,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useToast,
} from "@vyzer/design-system/components";
import { TopBar } from "@/layouts/app-shell/top-bar";
import { RightPanel, RightPanelSection } from "@/layouts/app-shell/right-panel";
import { useAppShell } from "@/layouts/app-shell/use-app-shell";
import { AgentConversationView } from "@/features/agent/agent-conversation-view";
import { useAgentChatStore } from "@/features/agent/agent-chat-store";
import { COMPACT_SUGGESTIONS } from "@/features/agent/data";
import { projectById } from "./project-data";

const VIEW_TABS = [
  { value: "overview", label: "Overview" },
  { value: "activity", label: "Activity" },
  { value: "issues", label: "Issues" },
];
const VIEW_TAB_VALUES = VIEW_TABS.map((t) => t.value);

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const project = projectById(projectId ?? "");

  const [params, setParams] = useSearchParams();
  // Aba desconhecida na URL cai no padrão, sem quebrar (revisão de código r3, menor 2).
  const tabRaw = params.get("tab");
  const tab = tabRaw && VIEW_TAB_VALUES.includes(tabRaw) ? tabRaw : "overview";
  const favorite = params.get("favorite") === "1";
  const { rightPanelOpen, setRightPanelOpen, rightPanelContent, setRightPanelContent } =
    useAppShell();
  const toast = useToast();
  const navigate = useNavigate();
  const agentStore = useAgentChatStore();

  // O painel direito mostra ou os detalhes do projeto ou o chat do agente (spec fase-7, item 5):
  // nunca os dois ao mesmo tempo. O gatilho "Agent" é global (AppShell); este botão de "…"
  // sempre volta para "details" ao abrir.
  const isChatOpen = rightPanelOpen && rightPanelContent === "chat";
  const isDetailsOpen = rightPanelOpen && rightPanelContent === "details";
  const openDetails = () => {
    setRightPanelContent("details");
    setRightPanelOpen(true);
  };

  // Esc: se a resposta ativa está em andamento, cancela primeiro (revisão de código, item 4) — só
  // depois fecha o painel. Ignorado quando outro overlay já tratou o Esc (Popover do histórico,
  // Menu): esses marcam defaultPrevented, o mesmo padrão do atalho global em app-shell/context.tsx.
  const chatSending = agentStore?.sending;
  useEffect(() => {
    if (!isChatOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (chatSending) {
        event.preventDefault();
        agentStore?.cancel();
        return;
      }
      setRightPanelOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isChatOpen, chatSending, agentStore, setRightPanelOpen]);

  /** Muda um search param preservando os demais (cada aba/filtro/opção não apaga os outros). */
  const updateParams = (patch: Record<string, string | null>) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(patch)) {
        if (value === null) next.delete(key);
        else next.set(key, value);
      }
      return next;
    });

  const setTab = (value: string) => updateParams({ tab: value });
  const setFavorite = (value: boolean) => updateParams({ favorite: value ? "1" : null });

  const copyPageUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Sem acesso à área de transferência (permissão negada, contexto não seguro): sem aviso.
      return;
    }
    toast({ title: "Copied" });
  };

  if (!project) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <EmptyState
          icon={FolderX}
          title="Project not found"
          action={
            <Button variant="secondary" asChild>
              <Link to="/projects">Back to Projects</Link>
            </Button>
          }
        >
          We could not find the page you were looking for.
        </EmptyState>
      </div>
    );
  }

  return (
    <Tabs value={tab} onValueChange={setTab} asChild>
      <div className="flex min-h-0 flex-1 flex-col">
        <TopBar
          breadcrumbs={[
            {
              label: project.name,
              icon: <ProjectIcon value={project.icon} className="size-icon-sm" />,
            },
          ]}
          favorite={favorite}
          onFavoriteChange={setFavorite}
          breadcrumbActions={
            <>
              <IconButton icon={Copy} label="Copy page URL" variant="ghost" onClick={copyPageUrl} />
              <Menu>
                <MenuTrigger asChild>
                  <IconButton icon={Ellipsis} label="Project actions" variant="ghost" />
                </MenuTrigger>
                <MenuContent variant="dropdown" align="end">
                  <MenuItem icon={UserRoundPen}>Rename project</MenuItem>
                  <MenuItem icon={Trash2}>Delete project</MenuItem>
                </MenuContent>
              </Menu>
            </>
          }
          tabs={
            // A mesma aparência do PageTabs (top-bar.tsx), mas com o TabsList do Tabs.Root que
            // envolve a página inteira: o TabsContent de cada aba, mais abaixo, fica no mesmo
            // grupo, com conteúdo de verdade em vez de um painel vazio.
            <TabsList variant="pills" aria-label="Views" className="border-b-0 px-0">
              {VIEW_TABS.map((viewTab) => (
                <TabsTrigger key={viewTab.value} value={viewTab.value}>
                  {viewTab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          }
          actions={
            <>
              <IconButton icon={Plus} label="Add new view" variant="ghost" />
              <IconButton icon={Bell} label="Setup project notifications" variant="ghost" />
              <IconButton
                icon={LayoutPanelLeft}
                label={isDetailsOpen ? "Close project details" : "Open project details"}
                variant={isDetailsOpen ? "secondary" : "ghost"}
                onClick={() => (isDetailsOpen ? setRightPanelOpen(false) : openDetails())}
              />
            </>
          }
        />
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto p-6">
            <h1 className="sr-only">{project.name}</h1>
            {/* Conteúdo de cada view fora do escopo desta fase (Fase 10, Patterns). */}
            {VIEW_TABS.map((viewTab) => (
              <TabsContent key={viewTab.value} value={viewTab.value}>
                <p className="text-body-md text-secondary">
                  {viewTab.label} — fora do escopo desta fase (Fase 10, Patterns).
                </p>
              </TabsContent>
            ))}
          </main>
          {isChatOpen ? (
            <RightPanel
              label="Agent chat"
              closeLabel="Close agent chat"
              bodyClassName="min-h-0 flex-1 gap-0 p-0"
            >
              <AgentConversationView
                density="compact"
                suggestions={COMPACT_SUGGESTIONS}
                useSharedChat
                onOpenFullPage={() => {
                  setRightPanelOpen(false);
                  navigate(`/agent${agentStore ? `?chat=${agentStore.activeChatId}` : ""}`);
                }}
              />
            </RightPanel>
          ) : (
            <RightPanel label="Project details">
              <RightPanelSection title="Properties">
                <p className="text-body-sm text-secondary">
                  Edição de propriedades fora do escopo desta fase.
                </p>
              </RightPanelSection>
              <RightPanelSection title="Milestones">
                <p className="text-body-sm text-secondary">Sem milestones ainda.</p>
              </RightPanelSection>
              <RightPanelSection title="Progress">
                <p className="text-body-sm text-secondary">Sem progresso ainda.</p>
              </RightPanelSection>
              <RightPanelSection title="Activity">
                <p className="text-body-sm text-secondary">André Júnio created the project.</p>
              </RightPanelSection>
            </RightPanel>
          )}
        </div>
      </div>
    </Tabs>
  );
}
