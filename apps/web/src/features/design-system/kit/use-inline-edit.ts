/**
 * Alternância "texto estático ↔ campo editável" usada em título, descrição e nome de milestone
 * (spec Fase 10, item 2): clique ou Enter no texto (focado) entra em edição; blur salva; Esc
 * cancela e restaura o valor anterior; no título (submitOnEnter), Enter também salva. Ao sair da
 * edição, o foco volta ao texto estático (nota de implementação da spec: hook compartilhado, sem
 * prop nova em componente existente).
 */
import { useEffect, useRef, useState, type KeyboardEvent } from "react";

type FieldElement = HTMLInputElement | HTMLTextAreaElement;

export function useInlineEdit<
  TField extends FieldElement = HTMLInputElement,
  TStatic extends HTMLElement = HTMLElement,
>({
  value,
  onSave,
  submitOnEnter = true,
}: {
  value: string;
  onSave: (value: string) => void;
  /** Título: Enter salva. Descrição: false (Enter quebra linha; só blur ou Esc saem do campo). */
  submitOnEnter?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const fieldRef = useRef<TField>(null);
  const staticRef = useRef<TStatic>(null);
  // Marca que a edição estava aberta: o efeito abaixo só devolve o foco ao texto estático quando
  // ELE sai da edição (nunca no primeiro render, que não deve roubar o foco da página).
  const wasEditing = useRef(false);

  useEffect(() => {
    if (editing) {
      wasEditing.current = true;
      const el = fieldRef.current;
      el?.focus();
      el?.setSelectionRange?.(el.value.length, el.value.length);
    } else if (wasEditing.current) {
      // O texto estático só existe no DOM depois deste re-render (editing já é false aqui), por
      // isso o foco volta num efeito, não dentro de commit()/cancel() (staticRef.current ainda
      // seria null nesse ponto, já que o React não re-renderizou).
      wasEditing.current = false;
      staticRef.current?.focus();
    }
  }, [editing]);

  const start = () => {
    setDraft(value);
    setEditing(true);
  };

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    // Sem `next &&`: apagar tudo e sair do campo é um valor válido (a descrição pode ficar vazia),
    // não um estado preso sem salvar. Só evita chamar onSave quando nada mudou.
    if (next !== value) onSave(next);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  return {
    editing,
    draft,
    staticProps: {
      ref: staticRef,
      tabIndex: 0,
      onClick: start,
      onKeyDown: (e: KeyboardEvent<TStatic>) => {
        if (e.key !== "Enter" || e.defaultPrevented) return;
        e.preventDefault();
        start();
      },
    },
    fieldProps: {
      ref: fieldRef,
      value: draft,
      onChange: (e: { target: { value: string } }) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: KeyboardEvent<TField>) => {
        if (e.key === "Escape") {
          e.preventDefault();
          cancel();
        } else if (
          e.key === "Enter" &&
          submitOnEnter &&
          !e.shiftKey &&
          !e.nativeEvent.isComposing
        ) {
          e.preventDefault();
          fieldRef.current?.blur();
        }
      },
    },
  };
}
