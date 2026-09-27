import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("mantém tamanho tipográfico e cor de texto juntos", () => {
    expect(cn("text-body-sm", "text-primary")).toBe("text-body-sm text-primary");
    expect(cn("font-display text-heading-2", "text-secondary")).toBe(
      "font-display text-heading-2 text-secondary",
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
    expect(cn("shadow-md", "shadow-overlay")).toBe("shadow-overlay");
    expect(cn("size-icon-sm", "size-icon-lg")).toBe("size-icon-lg");
  });

  it("reconhece z-index, opacidade e duração nomeados", () => {
    expect(cn("z-dropdown", "z-modal")).toBe("z-modal");
    expect(cn("opacity-disabled", "opacity-muted")).toBe("opacity-muted");
    expect(cn("duration-fast", "duration-normal")).toBe("duration-normal");
  });

  it("aceita condicionais do clsx", () => {
    const active = true;
    expect(cn("text-secondary", active && "text-primary", undefined, false)).toBe("text-primary");
  });
});
