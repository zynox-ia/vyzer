/**
 * Estado do shell (sidebar, painel direito, Command Menu, criação de issue) e os atalhos globais
 * ("[", "]", Ctrl/⌘+I, "C"): um contexto só, para o header do app e o conteúdo de cada tela
 * lerem e agirem sobre o mesmo shell. Sidebar: recolhimento e largura (200–360 px, padrão 244),
 * guardados em localStorage (decisão do responsável, 28/09).
 */
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { readStored, writeStored } from "./lib/storage";
import { isTypingTarget } from "./lib/shortcuts";

export const SIDEBAR_MIN_WIDTH = 200;
export const SIDEBAR_MAX_WIDTH = 360;
export const SIDEBAR_DEFAULT_WIDTH = 244;

const WIDTH_KEY = "vyzer:sidebar:width";
const COLLAPSED_KEY = "vyzer:sidebar:collapsed";

function clampWidth(value: number) {
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, value));
}

function initialWidth() {
  const stored = Number(readStored(WIDTH_KEY));
  return Number.isFinite(stored) && stored > 0 ? clampWidth(stored) : SIDEBAR_DEFAULT_WIDTH;
}

function initialCollapsed() {
  return readStored(COLLAPSED_KEY) === "1";
}

export type AppShellContextValue = {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  sidebarDrawerOpen: boolean;
  setSidebarDrawerOpen: (open: boolean) => void;
  rightPanelOpen: boolean;
  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;
  /**
   * Qual conteúdo o painel direito mostra (Fase 7, VYZ-37): "details" (Fase 8, dentro de cada
   * tela) ou "chat" do agente. Precisou subir pro contexto do shell porque o gatilho "Agent" do
   * rodapé flutuante é global (mostra em qualquer tela, medido ao vivo no Linear), mas só
   * `/projects/:projectId` de fato monta um RightPanel — o gatilho só decide O QUE mostrar
   * quando a pessoa clicar nele lá; nas outras telas, "Agent" navega para a página cheia.
   */
  rightPanelContent: "details" | "chat";
  setRightPanelContent: (content: "details" | "chat") => void;
  commandMenuOpen: boolean;
  setCommandMenuOpen: (open: boolean) => void;
  createIssueOpen: boolean;
  setCreateIssueOpen: (open: boolean) => void;
  /**
   * Onde o foco estava antes de QUALQUER overlay do shell abrir (Command Menu, diálogo de criar
   * issue) — não só o de cada um sozinho. Sem isso, "Create issue" pelo Command Menu (⌘K → New
   * issue → Create/Esc) devolveria o foco para o campo de busca do Command Menu (que já fechou),
   * não para onde a pessoa estava antes do ⌘K: o diálogo de criar issue lê este ref ao fechar.
   */
  overlayReturnFocus: RefObject<HTMLElement | null>;
};

export const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShellProvider({
  children,
  shortcuts = true,
  defaultCollapsed,
  defaultRightPanelOpen = false,
  defaultDrawerOpen = false,
}: {
  children: ReactNode;
  /**
   * Liga os atalhos globais ("[", "]", Ctrl/⌘+I, "C") no document. Desligado nas páginas de
   * /design-system que montam mais de um AppShellProvider ao mesmo tempo (ex.: temas lado a
   * lado): cada Provider ouviria o document inteiro e um atalho digitado afetaria todos.
   */
  shortcuts?: boolean;
  /** Estado inicial explícito (documentação): ignora o localStorage compartilhado. */
  defaultCollapsed?: boolean;
  defaultRightPanelOpen?: boolean;
  defaultDrawerOpen?: boolean;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(defaultCollapsed ?? initialCollapsed);
  const [sidebarWidth, setWidthState] = useState(initialWidth);
  const [sidebarDrawerOpen, setSidebarDrawerOpen] = useState(defaultDrawerOpen);
  const [rightPanelOpen, setRightPanelOpen] = useState(defaultRightPanelOpen);
  const [rightPanelContent, setRightPanelContent] = useState<"details" | "chat">("details");
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);
  const [createIssueOpen, setCreateIssueOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      writeStored(COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  const setSidebarWidth = useCallback((width: number) => {
    const clamped = clampWidth(width);
    setWidthState(clamped);
    writeStored(WIDTH_KEY, String(clamped));
  }, []);

  const toggleRightPanel = useCallback(() => setRightPanelOpen((prev) => !prev), []);

  // Acompanha o foco enquanto nenhum overlay do shell está aberto; para de ouvir assim que um
  // abre (Command Menu ou criar issue), então o valor guardado é sempre "onde estava antes do
  // primeiro overlay da sequência" — mesmo que um abra o outro (⌘K → Create issue).
  const overlayReturnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (commandMenuOpen || createIssueOpen) return;
    function onFocusIn(event: FocusEvent) {
      if (event.target instanceof HTMLElement) overlayReturnFocus.current = event.target;
    }
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, [commandMenuOpen, createIssueOpen]);

  useEffect(() => {
    if (!shortcuts) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || isTypingTarget(event.target)) return;
      if (event.altKey) return;
      // Ctrl/⌘+I: sinônimo de "]" (aprovado em 28/09).
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "i") {
        event.preventDefault();
        setRightPanelOpen((prev) => !prev);
        return;
      }
      if (event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (event.key === "[") {
        event.preventDefault();
        toggleSidebar();
      } else if (event.key === "]") {
        event.preventDefault();
        setRightPanelOpen((prev) => !prev);
      } else if (event.key.toLowerCase() === "c") {
        event.preventDefault();
        setCreateIssueOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [toggleSidebar, shortcuts]);

  const value = useMemo<AppShellContextValue>(
    () => ({
      sidebarCollapsed,
      toggleSidebar,
      sidebarWidth,
      setSidebarWidth,
      sidebarDrawerOpen,
      setSidebarDrawerOpen,
      rightPanelOpen,
      toggleRightPanel,
      setRightPanelOpen,
      rightPanelContent,
      setRightPanelContent,
      commandMenuOpen,
      setCommandMenuOpen,
      createIssueOpen,
      setCreateIssueOpen,
      overlayReturnFocus,
    }),
    [
      sidebarCollapsed,
      toggleSidebar,
      sidebarWidth,
      setSidebarWidth,
      sidebarDrawerOpen,
      rightPanelOpen,
      toggleRightPanel,
      rightPanelContent,
      commandMenuOpen,
      createIssueOpen,
    ],
  );

  return <AppShellContext value={value}>{children}</AppShellContext>;
}
