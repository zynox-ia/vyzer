import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemePair } from "../foundations/ThemeFrame";
import { PriorityIcon } from "../icons/PriorityIcon";
import { StatusIcon } from "../icons/StatusIcon";

/**
 * Claro e escuro lado a lado com as peças principais, para achar inconsistência rápido.
 * Cresce a cada fase: os componentes entram aqui assim que existirem.
 */
const meta = {
  title: "QA/Themes side by side",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const surfaces = [
  ["app", "bg-app"],
  ["sidebar", "bg-sidebar"],
  ["panel", "bg-panel"],
  ["surface", "bg-surface"],
  ["hover", "bg-hover"],
  ["selected", "bg-selected"],
  ["inverse", "bg-inverse"],
] as const;

const labels = [
  ["Bug", "bg-red"],
  ["Feature", "bg-blue"],
  ["Melhoria", "bg-green"],
  ["Design", "bg-pink"],
  ["Infra", "bg-cyan"],
  ["Docs", "bg-amber"],
  ["Pesquisa", "bg-purple"],
  ["Segurança", "bg-orange"],
  ["Dados", "bg-indigo"],
  ["Rotina", "bg-lime"],
] as const;

const badges = [
  ["Online", "bg-success-subtle text-success-strong", "completed"],
  ["Em revisão", "bg-info-subtle text-info-strong", "started"],
  ["Em risco", "bg-warning-subtle text-warning-strong", "started"],
  ["Falhou", "bg-danger-subtle text-danger-strong", "canceled"],
] as const;

export const Foundations: Story = {
  render: () => (
    <div className="p-4">
      <ThemePair>
        {() => (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              {surfaces.map(([name, cls]) => (
                <span key={name} className="flex flex-col items-center gap-1">
                  <span aria-hidden className={`${cls} size-control-xl border border-default`} />
                  <span className="text-caption text-secondary">{name}</span>
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-1 bg-panel p-4">
              <h2 className="type-heading-2 text-primary">Executar automação</h2>
              <p className="text-body-md text-secondary">
                O agente lê o CRM, pesquisa na web e envia a mensagem quando a automação rodar.
              </p>
              <p className="text-caption text-secondary">
                Atualizado há 3 minutos · <span className="font-mono text-code">VYZ-18</span>
              </p>
              <a href="#conectar" className="text-body-md">
                Conectar integração
              </a>
            </div>

            <ul className="flex flex-col bg-panel">
              <li className="flex h-row items-center gap-2 px-4 text-body-md">
                <PriorityIcon priority="urgent" />
                <span className="font-mono text-code text-secondary">VYZ-21</span>
                <StatusIcon type="started" progress={1 / 3} />
                <span className="text-primary">Selecionar modelo</span>
              </li>
              <li className="flex h-row items-center gap-2 bg-selected px-4 text-body-md">
                <PriorityIcon priority="high" />
                <span className="font-mono text-code text-secondary">VYZ-20</span>
                <StatusIcon type="started" progress={1 / 2} tone="info" />
                <span className="text-primary">Pesquisar conversas</span>
              </li>
              <li className="flex h-row items-center gap-2 px-4 text-body-md">
                <PriorityIcon priority="low" />
                <span className="font-mono text-code text-secondary">VYZ-19</span>
                <StatusIcon type="completed" />
                <span className="text-primary">Salvar alterações</span>
              </li>
            </ul>

            <div className="flex flex-wrap gap-2">
              {badges.map(([text, cls, type]) => (
                <span
                  key={text}
                  className={`${cls} inline-flex h-control-sm items-center gap-1 px-2 text-label-sm`}
                >
                  <StatusIcon type={type} tone={undefined} className="text-current" size="xs" />
                  {text}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              {labels.map(([name, dot]) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 text-body-sm text-secondary"
                >
                  <span aria-hidden className={`${dot} size-2 rounded-full`} />
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </ThemePair>
    </div>
  ),
};
