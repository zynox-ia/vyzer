/**
 * Fluxo de envio, aria-live e preenchimento por sugestao da conversa do agente (Fase 7): usa
 * timers reais (window.setTimeout), nao fake timers, pois o roteiro de use-agent-conversation.ts
 * so pode ser observado com tempo de verdade.
 */
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import "@/index.css";
import { AgentConversationView } from "./agent-conversation-view";
import { CANNED_REPLIES, COMPACT_SUGGESTIONS, ERROR_TRIGGER, FULL_SUGGESTIONS } from "./data";

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

/** Regiao oculta que anuncia as mensagens novas (agent-conversation-view.tsx, fim do arquivo). */
function liveRegion() {
  const el = document.querySelector('output[aria-live="polite"]');
  if (!el) throw new Error("Regiao aria-live nao encontrada");
  return el as HTMLElement;
}

/**
 * Grava toda mutacao de texto da regiao aria-live enquanto o observer roda: o estado "You: ..."
 * dura um unico tick (o "thinking" e adicionado logo em seguida) — curto demais para confiar em
 * poll-based `expect.element`, mas o MutationObserver nao perde nenhuma mudanca de texto.
 */
function observeLiveRegion() {
  const seen: string[] = [];
  const el = liveRegion();
  seen.push(el.textContent ?? "");
  const observer = new MutationObserver(() => seen.push(el.textContent ?? ""));
  observer.observe(el, { childList: true, characterData: true, subtree: true });
  return { seen, stop: () => observer.disconnect() };
}

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("AgentConversationView: envio", () => {
  it("Enter envia: a bolha do usuario aparece, 'pensando' some e a resposta chega com tempo real", async () => {
    const screen = await render(
      <AgentConversationView density="full" suggestions={FULL_SUGGESTIONS} />,
    );
    const field = screen.getByRole("textbox", { name: "Ask Vyzer…" });
    await field.fill("What's blocking Fase 7?");
    await userEvent.keyboard("{Enter}");

    // exact: true — sem isso bate tambem na live region assim que ela anunciar "You: ...".
    await expect
      .element(screen.getByText("What's blocking Fase 7?", { exact: true }))
      .toBeVisible();
    // O <output role="status"> do Spinner vive dentro da area "Conversation"; o outro <output>
    // status (o anuncio aria-live, sempre no DOM) fica fora dela, sem ambiguidade. "Thinking"
    // entra num setTimeout(0) separado (ver use-agent-conversation.ts) — timeout explicito, como
    // as outras esperas deste arquivo, para nao depender do timeout padrao do matcher.
    const conversation = screen.getByLabelText("Conversation");
    const thinking = conversation.getByRole("status");
    await expect.element(thinking, { timeout: 3000 }).toBeVisible();

    const reply = CANNED_REPLIES[0]!;
    // exact: true — sem isso bate tambem na live region ("Agent: " + reply.text).
    await expect
      .element(screen.getByText(reply.text, { exact: true }), { timeout: 3000 })
      .toBeVisible();
    await expect.element(thinking, { timeout: 3000 }).not.toBeInTheDocument();

    // O campo volta a aceitar o proximo turno (composer nao fica travado em "sending").
    await expect.element(screen.getByRole("textbox", { name: "Reply…" })).toBeEnabled();
  });

  it("mensagem 'error' aciona o Alert de erro em vez de uma resposta normal", async () => {
    const screen = await render(
      <AgentConversationView density="full" suggestions={FULL_SUGGESTIONS} />,
    );
    const field = screen.getByRole("textbox", { name: "Ask Vyzer…" });
    await field.fill(ERROR_TRIGGER);
    await userEvent.keyboard("{Enter}");

    const conversation = screen.getByLabelText("Conversation");
    const thinking = conversation.getByRole("status");
    await expect.element(thinking, { timeout: 3000 }).toBeVisible();

    const alert = screen.getByRole("alert");
    await expect.element(alert, { timeout: 3000 }).toBeVisible();
    await expect.element(alert).toHaveTextContent("Something went wrong");
    await expect.element(thinking).not.toBeInTheDocument();
  });
});

describe("AgentConversationView: anuncio aria-live", () => {
  it("anuncia 'You: ...' apos o envio e 'Agent: ...' quando a resposta termina", async () => {
    const screen = await render(
      <AgentConversationView density="full" suggestions={FULL_SUGGESTIONS} />,
    );
    const { seen, stop } = observeLiveRegion();
    const field = screen.getByRole("textbox", { name: "Ask Vyzer…" });
    await field.fill("Status update please");
    await userEvent.keyboard("{Enter}");

    const reply = CANNED_REPLIES[0]!;
    await expect.element(liveRegion(), { timeout: 3000 }).toHaveTextContent(`Agent: ${reply.text}`);
    stop();

    expect(seen).toContain("You: Status update please");
  });

  it("erro: só o Alert anuncia, a live region fica quieta (revisao de codigo, menor)", async () => {
    // Um Alert role="alert" já é anunciado pelo navegador sozinho; se a live region também
    // dissesse "Agent: something went wrong.", a mesma falha seria lida duas vezes.
    const screen = await render(
      <AgentConversationView density="full" suggestions={FULL_SUGGESTIONS} />,
    );
    const field = screen.getByRole("textbox", { name: "Ask Vyzer…" });
    await field.fill(ERROR_TRIGGER);
    await userEvent.keyboard("{Enter}");

    await expect.element(screen.getByRole("alert")).toBeVisible();
    // A live region só reflete o "You: ..." do envio (thinking/erro não a atualizam) — nunca o
    // texto do erro.
    await expect
      .element(liveRegion(), { timeout: 3000 })
      .toHaveTextContent(`You: ${ERROR_TRIGGER}`);
    await expect.element(liveRegion()).not.toHaveTextContent("something went wrong");
  });
});

describe("AgentConversationView: sugestoes preenchem sem enviar", () => {
  it("densidade cheia: clicar num SuggestionCard preenche o composer sem enviar", async () => {
    const screen = await render(
      <AgentConversationView density="full" suggestions={FULL_SUGGESTIONS} />,
    );
    const suggestion = FULL_SUGGESTIONS[0]!;
    await screen.getByRole("button", { name: new RegExp(suggestion.title) }).click();

    const field = screen.getByRole("textbox", { name: "Ask Vyzer…" });
    await expect.element(field).toHaveValue(suggestion.title);
    await expect.element(screen.getByLabelText("Conversation")).not.toBeInTheDocument();
    await expect.element(screen.getByText("Get started with some examples")).toBeVisible();
  });

  it("densidade compacta: clicar num chip de sugestao preenche o composer sem enviar", async () => {
    const screen = await render(
      <AgentConversationView density="compact" suggestions={COMPACT_SUGGESTIONS} />,
    );
    const suggestion = COMPACT_SUGGESTIONS[0]!;
    await screen.getByRole("button", { name: suggestion.title, exact: true }).click();

    const field = screen.getByRole("textbox", { name: "Ask Vyzer…" });
    await expect.element(field).toHaveValue(suggestion.title);
    await expect.element(screen.getByLabelText("Conversation")).not.toBeInTheDocument();
  });
});

describe.each(["dark", "light"] as const)(
  "AgentConversationView: acessibilidade no tema %s",
  (theme) => {
    it("conversa enviada (com tool call e feedback) nao tem violacoes axe", async () => {
      document.documentElement.dataset.theme = theme;
      const screen = await render(
        <AgentConversationView density="full" suggestions={FULL_SUGGESTIONS} />,
      );
      const field = screen.getByRole("textbox", { name: "Ask Vyzer…" });
      await field.fill("What's blocking Fase 7?");
      await userEvent.keyboard("{Enter}");

      const reply = CANNED_REPLIES[0]!;
      // exact: true — sem isso bate tambem na live region ("Agent: " + reply.text).
      await expect
        .element(screen.getByText(reply.text, { exact: true }), { timeout: 3000 })
        .toBeVisible();
      await expect
        .element(screen.getByRole("button", { name: "Helpful", exact: true }))
        .toBeVisible();
      await expect
        .element(screen.getByRole("button", { name: reply.toolCall!.summary }))
        .toBeVisible();

      expect(await violations(screen.container)).toEqual([]);
    });
  },
);
