/**
 * Composer do agente (Figma 27:6954, 27:7181, 27:7324, 1:4622, 27:17872). Fase 7 — spec, item 2.
 * Texto puro (TextArea plain, autoGrow), sem editor rico — decisão 1 da spec, aprovada em 28/09.
 */
import { useState } from "react";
import {
  AgentComposer,
  Button,
  MenuContent,
  MenuTrigger,
  Menu,
} from "@vyzer/design-system/components";
import { ChevronDown } from "lucide-react";
import { Code, Decisions, DocPage, DocSection, Prose } from "../../kit/doc";
import { ThemePair } from "../../kit/theme-frame";

function SkillsMenu() {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="ghost" trailingIcon={ChevronDown}>
          Skills
        </Button>
      </MenuTrigger>
      <MenuContent variant="dropdown" align="start">
        <p className="px-2.5 py-1.5 text-body-sm text-secondary">No skills created</p>
      </MenuContent>
    </Menu>
  );
}

function Demo({ placeholder, sending = false }: { placeholder: string; sending?: boolean }) {
  const [value, setValue] = useState("");
  return (
    <AgentComposer
      value={value}
      onValueChange={setValue}
      onSend={() => setValue("")}
      placeholder={placeholder}
      sending={sending}
      skills={<SkillsMenu />}
      onAttach={() => {}}
    />
  );
}

export function Page() {
  return (
    <DocPage
      title="Composer do agente"
      description="Campo de texto plano que cresce (sem editor rico), com o rodapé Skills, anexar e enviar. O placeholder muda por contexto: New chat, resposta ou uma sessão nomeada."
    >
      <DocSection
        title="Ao vivo"
        description="Digite e veja o enviar habilitar; Enter envia (mensagem vazia não faz nada), Shift+Enter quebra linha."
      >
        <ThemePair>{() => <Demo placeholder="Ask Vyzer…" />}</ThemePair>
      </DocSection>

      <DocSection title="Placeholder por contexto">
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
          <figure className="flex flex-col gap-2">
            <figcaption className="text-caption text-secondary">New chat</figcaption>
            <Demo placeholder="Ask Vyzer…" />
          </figure>
          <figure className="flex flex-col gap-2">
            <figcaption className="text-caption text-secondary">Conversa em andamento</figcaption>
            <Demo placeholder="Reply…" />
          </figure>
          <figure className="flex flex-col gap-2">
            <figcaption className="text-caption text-secondary">
              Sessão de agente externo
            </figcaption>
            <Demo placeholder="Tell Cursor what to do next…" />
          </figure>
          <figure className="flex flex-col gap-2">
            <figcaption className="text-caption text-secondary">Enviando (desabilitado)</figcaption>
            <Demo placeholder="Ask Vyzer…" sending />
          </figure>
        </div>
      </DocSection>

      <DocSection title="Composição">
        <Prose>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>
              Card: <Code>rounded-container border-default bg-surface</Code> com{" "}
              <Code>focus-ring-within</Code> — o mesmo padrão do Composer de comentário
              (forms/composer.tsx).
            </li>
            <li>
              Campo: <Code>TextArea variant=&quot;plain&quot; autoGrow</Code>, sem editor rico.
            </li>
            <li>
              Rodapé: <Code>Skills</Code> (Menu existente, com chevron), anexar (IconButton ghost
              sm) e enviar (IconButton primary sm, seta para cima, desabilitado sem texto).
            </li>
          </ul>
        </Prose>
      </DocSection>

      <Decisions
        items={[
          {
            decision: "Enter envia; Shift+Enter quebra linha",
            rule: "Instrução do coordenador da Fase 7 e confirmado ao vivo no Linear (ProseMirror do composer real) — o texto da spec pedia ⌘/Ctrl+Enter para enviar; vale o Linear.",
          },
          {
            decision: "Sem editor rico (texto puro)",
            rule: "spec, decisão 1 (aprovada 28/09) — editor rico fica para depois, com ADR própria",
          },
          {
            decision: "Botões do rodapé em IconButton size=sm (24 px)",
            rule: "Medido ao vivo: a barra de ações do composer real do Linear usa 24 px, não os 28 px do Button/IconButton padrão do sistema",
          },
        ]}
      />
    </DocPage>
  );
}
