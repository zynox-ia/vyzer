/**
 * Tela de espera para rotas do shell sem conteúdo nesta fase (dados reais fora do escopo): a
 * mesma TopBar das demais telas, com o título da tela, e um `main` com o H1 da página (oculto
 * visualmente — a breadcrumb já mostra o título; sem conteúdo real que precise de um título
 * visível separado, review de código, item 5).
 */
import { TopBar } from "@/layouts/app-shell/top-bar";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar breadcrumbs={[{ label: title }]} />
      <main aria-label={title} className="flex flex-1 items-center justify-center p-8">
        <h1 className="sr-only">{title}</h1>
        <p className="text-body-md text-secondary">{title} — fora do escopo desta fase.</p>
      </main>
    </div>
  );
}
