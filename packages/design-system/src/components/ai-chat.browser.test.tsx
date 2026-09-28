/**
 * Interacao e acessibilidade das pecas de chat do agente (Fase 7): teclado do Composer, o
 * Collapsible de tool call, o feedback de mensagem e o Popover de historico.
 */
import axe from "axe-core";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import "../styles/index.css";
import {
  AgentComposer,
  ChatHistoryPopover,
  MessageFeedback,
  ToolCallCollapsible,
  type ChatHistoryEntry,
} from ".";

async function violations(root: Element) {
  await Promise.all(
    root.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})),
  );
  const result = await axe.run(root, { resultTypes: ["violations"] });
  return result.violations.map(
    (violation) =>
      `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`,
  );
}

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

/** Harness controlado, como o BasicMenu de command-menu.browser.test.tsx. */
function ComposerHarness({ onSend }: { onSend: (value: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <AgentComposer
      value={value}
      onValueChange={setValue}
      onSend={() => {
        onSend(value);
        setValue("");
      }}
    />
  );
}

describe("AgentComposer: teclado", () => {
  it("Enter envia e limpa o campo; Enter vazio ou so com espacos nao faz nada", async () => {
    const onSend = vi.fn();
    const screen = await render(<ComposerHarness onSend={onSend} />);
    const field = screen.getByRole("textbox", { name: "Ask Vyzer…" });

    await userEvent.keyboard("{Enter}");
    expect(onSend).not.toHaveBeenCalled();

    await field.fill("   ");
    await field.click();
    await userEvent.keyboard("{Enter}");
    expect(onSend).not.toHaveBeenCalled();
    await expect.element(field).toHaveValue("   ");

    await field.fill("Draft the update");
    await userEvent.keyboard("{Enter}");
    expect(onSend).toHaveBeenCalledExactlyOnceWith("Draft the update");
    await expect.element(field).toHaveValue("");
  });

  it("Shift+Enter quebra linha em vez de enviar", async () => {
    const onSend = vi.fn();
    const screen = await render(<ComposerHarness onSend={onSend} />);
    const field = screen.getByRole("textbox", { name: "Ask Vyzer…" });

    await field.fill("Line one");
    await field.click();
    await userEvent.keyboard("{Shift>}{Enter}{/Shift}");

    expect(onSend).not.toHaveBeenCalled();
    await expect.element(field).toHaveValue("Line one\n");
    await expect.element(field).toHaveFocus();
  });
});

/** Harness com sending controlado, como o real precisaria (revisao de codigo, "Stop"/"Foco"). */
function SendingHarness({ onCancel = vi.fn() }: { onCancel?: () => void }) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  return (
    <AgentComposer
      value={value}
      onValueChange={setValue}
      onSend={() => setSending(true)}
      onCancel={() => {
        onCancel();
        setSending(false);
      }}
      sending={sending}
    />
  );
}

describe("AgentComposer: Stop generating e foco", () => {
  it('sending troca o enviar por "Stop generating"; cancelar volta ao enviar', async () => {
    const onCancel = vi.fn();
    const screen = await render(<SendingHarness onCancel={onCancel} />);
    const field = screen.getByRole("textbox", { name: "Ask Vyzer…" });
    await field.fill("Status update please");
    await userEvent.keyboard("{Enter}");

    await expect
      .element(screen.getByRole("button", { name: "Send message" }))
      .not.toBeInTheDocument();
    const stop = screen.getByRole("button", { name: "Stop generating" });
    await expect.element(stop).toBeVisible();

    await stop.click();
    expect(onCancel).toHaveBeenCalledOnce();
    await expect.element(screen.getByRole("button", { name: "Send message" })).toBeVisible();
  });

  it("o foco volta ao campo quando sending termina (revisao de codigo, item 5, Foco)", async () => {
    const screen = await render(<SendingHarness />);
    const field = screen.getByRole("textbox", { name: "Ask Vyzer…" });
    await field.fill("Status update please");
    await field.click();
    await userEvent.keyboard("{Enter}");

    // sending desabilita o campo; o navegador tira o foco dele sozinho.
    await expect.element(field).toBeDisabled();

    await screen.getByRole("button", { name: "Stop generating" }).click();
    await expect.element(field).toBeEnabled();
    await expect.element(field).toHaveFocus();
  });
});

const toolCallSummary = "Worked for 8 seconds";
const toolCallDetail = "Searched 42 issues · Read 3 documents";

describe("ToolCallCollapsible", () => {
  it("comeca recolhido; Enter e Espaco no gatilho expandem e recolhem", async () => {
    const screen = await render(
      <ToolCallCollapsible summary={toolCallSummary}>{toolCallDetail}</ToolCallCollapsible>,
    );
    const trigger = screen.getByRole("button", { name: toolCallSummary });
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
    await expect.element(screen.getByText(toolCallDetail)).not.toBeInTheDocument();

    trigger.element().focus();
    await userEvent.keyboard("{Enter}");
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
    await expect.element(screen.getByText(toolCallDetail)).toBeVisible();

    await userEvent.keyboard("{Space}");
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
    await expect.element(screen.getByText(toolCallDetail)).not.toBeInTheDocument();
  });

  it("defaultOpen comeca expandido", async () => {
    const screen = await render(
      <ToolCallCollapsible summary={toolCallSummary} defaultOpen>
        {toolCallDetail}
      </ToolCallCollapsible>,
    );
    await expect
      .element(screen.getByRole("button", { name: toolCallSummary }))
      .toHaveAttribute("aria-expanded", "true");
    await expect.element(screen.getByText(toolCallDetail)).toBeVisible();
  });
});

/** Reflete use-agent-conversation.ts: alternar o mesmo botao desmarca (helpful vira undefined). */
function FeedbackHarness() {
  const [helpful, setHelpfulState] = useState<boolean | undefined>(undefined);
  const setHelpful = (value: boolean) =>
    setHelpfulState((prev) => (prev === value ? undefined : value));
  return (
    <MessageFeedback
      helpful={helpful}
      onHelpful={() => setHelpful(true)}
      onUnhelpful={() => setHelpful(false)}
    />
  );
}

describe("MessageFeedback", () => {
  it("Helpful e Not helpful marcam aria-pressed, alternam e sao mutuamente exclusivos", async () => {
    const screen = await render(<FeedbackHarness />);
    const helpful = screen.getByRole("button", { name: "Helpful", exact: true });
    const notHelpful = screen.getByRole("button", { name: "Not helpful" });

    await expect.element(helpful).toHaveAttribute("aria-pressed", "false");
    await expect.element(notHelpful).toHaveAttribute("aria-pressed", "false");

    await helpful.click();
    await expect.element(helpful).toHaveAttribute("aria-pressed", "true");
    await expect.element(notHelpful).toHaveAttribute("aria-pressed", "false");

    await helpful.click();
    await expect.element(helpful).toHaveAttribute("aria-pressed", "false");

    await notHelpful.click();
    await expect.element(notHelpful).toHaveAttribute("aria-pressed", "true");
    await expect.element(helpful).toHaveAttribute("aria-pressed", "false");

    await helpful.click();
    await expect.element(helpful).toHaveAttribute("aria-pressed", "true");
    await expect.element(notHelpful).toHaveAttribute("aria-pressed", "false");
  });
});

const historyEntries: ChatHistoryEntry[] = [
  {
    id: "h1",
    title: "Draft update for Mv School",
    updatedAt: new Date(Date.now() - 1000 * 60 * 42),
  },
  {
    id: "h2",
    title: "Research onboarding backlog",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
];

function HistoryHarness({
  onSelect = vi.fn(),
  entries = historyEntries,
}: {
  onSelect?: (id: string) => void;
  entries?: ChatHistoryEntry[];
}) {
  return (
    <ChatHistoryPopover entries={entries} onSelect={onSelect}>
      <button type="button">Chat history</button>
    </ChatHistoryPopover>
  );
}

describe("ChatHistoryPopover", () => {
  it("abre no clique, seta cima/baixo movem o foco entre as conversas e Enter seleciona", async () => {
    const onSelect = vi.fn();
    const screen = await render(<HistoryHarness onSelect={onSelect} />);
    const trigger = screen.getByRole("button", { name: "Chat history" });

    await trigger.click();
    const popover = screen.getByRole("dialog", { name: "Chat history" });
    await expect.element(popover).toBeVisible();

    const first = screen.getByRole("button", { name: /Draft update for Mv School/ });
    const second = screen.getByRole("button", { name: /Research onboarding backlog/ });
    await expect.element(first).toHaveFocus();

    await userEvent.keyboard("{ArrowDown}");
    await expect.element(second).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}");
    await expect.element(first).toHaveFocus();

    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledExactlyOnceWith("h2");

    await userEvent.keyboard("{Escape}");
    await expect.element(popover).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  it("abre tambem pelo Enter no gatilho", async () => {
    const screen = await render(<HistoryHarness />);
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    await expect.element(screen.getByRole("dialog", { name: "Chat history" })).toBeVisible();
  });

  it("vazio mostra 'No agent chats'", async () => {
    const screen = await render(<HistoryHarness entries={[]} />);
    await screen.getByRole("button", { name: "Chat history" }).click();
    await expect.element(screen.getByText("No agent chats")).toBeVisible();
  });
});

describe.each(["dark", "light"] as const)("Agent chat: acessibilidade no tema %s", (theme) => {
  it("ChatHistoryPopover aberto nao tem violacoes axe", async () => {
    document.documentElement.dataset.theme = theme;
    const screen = await render(<HistoryHarness />);
    await screen.getByRole("button", { name: "Chat history" }).click();
    const popover = screen.getByRole("dialog", { name: "Chat history" });
    await expect.element(popover).toBeVisible();
    expect(await violations(popover.element())).toEqual([]);
  });

  it("ToolCallCollapsible expandido nao tem violacoes axe", async () => {
    document.documentElement.dataset.theme = theme;
    const screen = await render(
      <ToolCallCollapsible summary={toolCallSummary} defaultOpen>
        {toolCallDetail}
      </ToolCallCollapsible>,
    );
    const trigger = screen.getByRole("button", { name: toolCallSummary });
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
    expect(await violations(screen.container)).toEqual([]);
  });
});
