/**
 * Tela de espera para destinos do sitemap sem conteúdo ainda (Missão 02, navegação — dados reais
 * fora do escopo): a mesma TopBar das demais telas, com breadcrumb de um ou dois níveis (`section`
 * é o macro do sitemap, ex. "CRM" → "CRM › Leads"), e um `main` com o H1 da página (oculto
 * visualmente — a breadcrumb já mostra o título) e um estado discreto "Coming soon."
 */
import { TopBar } from "@/layouts/app-shell/top-bar";

export function PlaceholderPage({ title, section }: { title: string; section?: string }) {
  const accessibleTitle = section ? `${section} ${title}` : title;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar breadcrumbs={section ? [{ label: section }, { label: title }] : [{ label: title }]} />
      <main aria-label={accessibleTitle} className="flex flex-1 items-center justify-center p-8">
        <h1 className="sr-only">{accessibleTitle}</h1>
        <p className="text-body-md text-secondary">Coming soon.</p>
      </main>
    </div>
  );
}
