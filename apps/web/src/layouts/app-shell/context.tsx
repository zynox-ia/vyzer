/**
 * Estado do shell (sidebar, painel direito, Command Menu, criação de issue) e os atalhos globais
 * ("[" , "]", Ctrl/⌘+I, "C"): um contexto só, para o header do app e o conteúdo de cada tela
 * lerem e agirem sobre o mesmo shell. Sidebar: guardado em localStorage sob a chave `zynox:sidebar:collapsed`.
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
export const SIDEBAR_MAX_WIDTH = 400;
export const SIDEBAR_DEFAULT_WIDTH = 276;

const WIDTH_KEY = "zynox:sidebar:width";
const COLLAPSED_KEY = "zynox:sidebar:collapsed";

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
  defaultCollapsed,
  defaultDrawerOpen = false,
  defaultRightPanelOpen = false,
  shortcuts = true,
}: {
  children: ReactNode;
  defaultCollapsed?: boolean;
  defaultDrawerOpen?: boolean;
  defaultRightPanelOpen?: boolean;
  shortcuts?: boolean;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    defaultCollapsed !== undefined ? defaultCollapsed : initialCollapsed(),
  );
  const [sidebarWidth, setSidebarWidthState] = useState(initialWidth);
  const [sidebarDrawerOpen, setSidebarDrawerOpen] = useState(defaultDrawerOpen);
  const [rightPanelOpen, setRightPanelOpen] = useState(defaultRightPanelOpen);
  const [rightPanelContent, setRightPanelContent] = useState<"details" | "chat">("details");
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);
  const [createIssueOpen, setCreateIssueOpen] = useState(false);
  const overlayReturnFocus = useRef<HTMLElement | null>(null);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      writeStored(COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  const setSidebarWidth = useCallback((width: number) => {
    const clamped = clampWidth(width);
    setSidebarWidthState(clamped);
    writeStored(WIDTH_KEY, String(clamped));
  }, []);

  const toggleRightPanel = useCallback(() => {
    setRightPanelOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!shortcuts) return;

    const onKeyDown = (event: KeyboardEvent) => {
      // Ignora atalhos de uma tecla ("c", "[", "]") se o foco estiver num campo de digitação,
      // para não abrir o diálogo nem recolher a sidebar quando a pessoa só estiver escrevendo.
      const typing = isTypingTarget(event.target);

      // Atalho "c": abre o diálogo de criação de issue (Linear: "c" cria em qualquer tela).
      // Sem modificadores (Ctrl/Alt/Meta), para não colidir com Ctrl+C de copiar.
      if (
        !typing &&
        event.key.toLowerCase() === "c" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        overlayReturnFocus.current = (document.activeElement as HTMLElement) ?? null;
        setCreateIssueOpen(true);
        return;
      }

      // Atalho "[": alterna a sidebar (Linear: "[" recolhe/expande).
      if (!typing && event.key === "[" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        toggleSidebar();
        return;
      }

      // Atalhos "]": alterna o painel direito (Linear: "]" abre/fecha).
      if (!typing && event.key === "]" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        toggleRightPanel();
        return;
      }

      // Atalho Ctrl/⌘+I: sinônimo de "]" para o painel direito (Figma 1:6569).
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "i" && !event.altKey) {
        event.preventDefault();
        toggleRightPanel();
        return;
      }

      // Atalho Ctrl/⌘+K: abre o Command Menu.
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k" && !event.altKey) {
        event.preventDefault();
        overlayReturnFocus.current = (document.activeElement as HTMLElement) ?? null;
        setCommandMenuOpen(true);
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcuts, toggleRightPanel, toggleSidebar]);

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
      commandMenuOpen,
      createIssueOpen,
      rightPanelContent,
      rightPanelOpen,
      sidebarCollapsed,
      sidebarDrawerOpen,
      sidebarWidth,
      setSidebarWidth,
      toggleRightPanel,
      toggleSidebar,
    ],
  );

  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>;
}
