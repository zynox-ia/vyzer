import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("mantém tamanho tipográfico e cor de texto juntos", () => {
    expect(cn("text-body-sm", "text-primary")).toBe("text-body-sm text-primary");
    expect(cn("font-sans text-heading-2", "text-secondary")).toBe(
      "font-sans text-heading-2 text-secondary",
    );
  });

  it("resolve conflito dentro do mesmo grupo (o último vence)", () => {
    expect(cn("text-body-md", "text-body-sm")).toBe("text-body-sm");
    expect(cn("text-primary", "text-secondary")).toBe("text-secondary");
    expect(cn("bg-surface", "bg-hover")).toBe("bg-hover");
    expect(cn("border-default", "border-focus")).toBe("border-focus");
  });

  it("não confunde largura de borda com cor de borda", () => {
    expect(cn("border", "border-strong")).toBe("border border-strong");
  });

  it("resolve spacing, radius e shadow com os tokens do Vyzer", () => {
    expect(cn("h-control-md", "h-control-sm")).toBe("h-control-sm");
    expect(cn("h-row", "h-control-lg")).toBe("h-control-lg");
    expect(cn("px-3", "px-2")).toBe("px-2");
    expect(cn("rounded-md", "rounded-full")).toBe("rounded-full");
    expect(cn("rounded-control", "rounded-surface")).toBe("rounded-surface");
    expect(cn("shadow-md", "shadow-lg")).toBe("shadow-lg");
    expect(cn("size-icon-sm", "size-icon-lg")).toBe("size-icon-lg");
  });

  it("trata shadow-focus como sombra e border-focus como cor de borda", () => {
    expect(cn("shadow-lg", "shadow-focus")).toBe("shadow-focus");
    expect(cn("border-control", "border-focus")).toBe("border-focus");
    expect(cn("outline-focus", "text-primary")).toBe("outline-focus text-primary");
  });

  it("mantém placeholder e cor de texto separados por variante", () => {
    expect(cn("text-primary", "placeholder:text-placeholder")).toBe(
      "text-primary placeholder:text-placeholder",
    );
  });

  it("reconhece z-index, opacidade e duração nomeados", () => {
    expect(cn("z-dropdown", "z-modal")).toBe("z-modal");
    expect(cn("opacity-disabled", "opacity-muted")).toBe("opacity-muted");
    expect(cn("duration-fast", "duration-normal")).toBe("duration-normal");
  });

  it("resolve pesos e tamanhos novos", () => {
    expect(cn("font-medium", "font-light")).toBe("font-light");
    expect(cn("text-title", "text-metric")).toBe("text-metric");
    expect(cn("text-metric", "font-light")).toBe("text-metric font-light");
  });

  it("mantém cor de fundo e degradê juntos (botão primário)", () => {
    const gradient = "[background-image:linear-gradient(180deg,var(--a),var(--b))]";
    expect(cn("bg-inverse", gradient, "shadow-raised")).toBe(
      `bg-inverse ${gradient} shadow-raised`,
    );
    expect(cn("shadow-sm", "shadow-raised")).toBe("shadow-raised");
    // Primário chapado: a cor do botão e a do hover são tokens próprios.
    expect(cn("bg-inverse", "bg-primary-button")).toBe("bg-primary-button");
    expect(cn("bg-primary-button", "hovered:bg-primary-button-hover")).toBe(
      "bg-primary-button hovered:bg-primary-button-hover",
    );
  });

  it("aceita condicionais do clsx", () => {
    const active = true;
    expect(cn("text-secondary", active && "text-primary", undefined, false)).toBe("text-primary");
  });
});
