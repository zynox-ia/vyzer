/**
 * Página de espera de Settings (conteúdo fora do escopo desta fase, além de Preferences): só o
 * H1 e uma frase — `SettingsLayout` já dá o `main` e a nav. Um H1 por tela (review de código,
 * item 5).
 */
export function SettingsPlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="type-heading-1 pb-6 text-primary">{title}</h1>
      <p className="text-body-md text-secondary">
        Conteúdo de {title} — fora do escopo desta fase.
      </p>
    </div>
  );
}
