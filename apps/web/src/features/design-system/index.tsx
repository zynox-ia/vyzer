/**
 * Documentação oficial do Vyzer Design System, em /design-system (VYZ-12, ADR-0013).
 * Só em desenvolvimento por enquanto; em produção a rota não existe (depois: só Admins).
 * As rotas internas ficam aqui para que tudo carregue sob demanda, fora do bundle do produto.
 */
import { Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { DocPage } from "./kit/doc";
import { DesignSystemLayout } from "./layout";
import { sections, type DocSection } from "./registry";

/** Redireciona mantendo os search params (tema de foco, seleção etc.). */
function Redirect({ to }: { to: string }) {
  const { search } = useLocation();
  return <Navigate to={{ pathname: to, search }} replace />;
}

function EmptySection({ section }: { section: DocSection }) {
  return (
    <DocPage
      title={section.title}
      description={`Ainda sem itens. Os primeiros chegam na ${section.plannedIn ?? "próxima fase"}, cada um com a página no template único de componente.`}
    >
      {null}
    </DocPage>
  );
}

function NotFound() {
  return (
    <DocPage title="Página não encontrada" description="Escolha uma seção na barra superior.">
      {null}
    </DocPage>
  );
}

function Loading() {
  return <p className="text-body-md text-secondary">Carregando…</p>;
}

export function DesignSystemApp() {
  const first = sections[0]?.items[0];
  return (
    <Routes>
      <Route element={<DesignSystemLayout />}>
        <Route
          index
          element={<Redirect to={`/design-system/foundations/${first?.slug ?? ""}`} />}
        />
        {sections.map((s) => (
          <Route key={s.slug} path={s.slug}>
            <Route
              index
              element={
                s.items[0] ? (
                  <Redirect to={`/design-system/${s.slug}/${s.items[0].slug}`} />
                ) : (
                  <EmptySection section={s} />
                )
              }
            />
            {s.items.map((i) => (
              <Route
                key={i.slug}
                path={i.slug}
                element={
                  <Suspense fallback={<Loading />}>
                    <i.Page />
                  </Suspense>
                }
              />
            ))}
          </Route>
        ))}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export { DesignSystemApp as Component };
