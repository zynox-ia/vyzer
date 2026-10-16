/**
 * Marca do Workspace: o logo enviado (`logoUrl`) quando existe, senão o ícone escolhido no
 * IconPicker. Usada no seletor da sidebar e na tela de Settings → Workspace, para os dois
 * lugares mostrarem sempre a mesma coisa. O logo é quadrado com o raio de controle (medido no
 * Linear: avatar quadrado de 20 px, raio 8), sem nome próprio — o texto ao lado já nomeia.
 */
import { ProjectIcon, type ProjectIconValue } from "@zynox/design-system/components";
import { cn } from "@zynox/design-system/cn";

export function WorkspaceMark({
  icon,
  logoUrl,
  className,
}: {
  icon: ProjectIconValue;
  logoUrl?: string | null;
  className?: string;
}) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        className={cn("shrink-0 rounded-control object-cover", className)}
      />
    );
  }
  return <ProjectIcon value={icon} className={className} />;
}
