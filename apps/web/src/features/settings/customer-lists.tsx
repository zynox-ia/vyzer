/**
 * Listas editáveis de Settings → Customer requests (Linear ao vivo, `/settings/customer-requests`,
 * 29/09): statuses e tiers (bolinha de cor + nome, com "+" no cabeçalho do cartão) e as listas
 * de domínios e e-mails (Excluded e Generic, com "Open menu" no cabeçalho). Só apresentação: quem
 * chama passa os dados e as ações do service.
 *
 * O Linear reordena statuses arrastando; aqui a ordem muda por "Move up"/"Move down" no menu da
 * linha, que dá o mesmo resultado sem dependência de arrastar (divergência em `.figma/`).
 */
import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Ellipsis, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  Button,
  ColorDot,
  Confirm,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  Field,
  IconButton,
  LABEL_COLORS,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Select,
  TextInput,
  useToast,
  type LabelColor,
  type ListOption,
} from "@zynox/design-system/components";
import { SettingsGroup } from "./settings-row";

export type CustomerLabel = { id: string; name: string; color: string; position: number };

export type CustomerLabelActions = {
  create: (input: { name: string; color: string }) => Promise<unknown>;
  update: (input: { id: string; name?: string; color?: string }) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
  reorder: (ids: string[]) => Promise<unknown>;
};

const NAME_REQUIRED = "Name is required.";
const NAME_MAX = 64;
const DOMAIN_INVALID = "Enter a valid domain or email address.";
const DOMAIN_PATTERN =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COLOR_OPTIONS: ListOption<LabelColor>[] = LABEL_COLORS.map(({ value, label }) => ({
  value,
  label,
  icon: <ColorDot color={value} size="md" />,
}));

function asLabelColor(color: string): LabelColor {
  return LABEL_COLORS.some((option) => option.value === color) ? (color as LabelColor) : "grey";
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

/** Cabeçalho do cartão de lista: texto de contagem à esquerda, ação à direita. */
function ListHeader({ text, action }: { text: string; action: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-subtle py-2 last:border-b-0">
      <span className="text-body-md text-secondary">{text}</span>
      {action}
    </div>
  );
}

function LabelDialog({
  noun,
  item,
  open,
  onOpenChange,
  onSubmit,
}: {
  noun: "status" | "tier";
  item: CustomerLabel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { name: string; color: LabelColor }) => Promise<unknown>;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [color, setColor] = useState<LabelColor>(item ? asLabelColor(item.color) : "grey");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed === "") return setError(NAME_REQUIRED);
    setPending(true);
    try {
      await onSubmit({ name: trimmed, color });
      onOpenChange(false);
    } catch (caught) {
      setError(errorMessage(caught, `Could not save customer ${noun}.`));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="sm"
        title={item ? `Edit customer ${noun}` : `New customer ${noun}`}
        description={`Customers are segmented by ${noun}.`}
      >
        <form onSubmit={submit} noValidate>
          <DialogBody>
            <Field label="Name" error={error}>
              <TextInput
                value={name}
                maxLength={NAME_MAX}
                invalid={Boolean(error)}
                onChange={(event) => {
                  setName(event.target.value);
                  setError(undefined);
                }}
              />
            </Field>
            <Field label="Color">
              <Select
                trigger="field"
                value={color}
                options={COLOR_OPTIONS}
                onValueChange={setColor}
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">Cancel</Button>
            </DialogClose>
            <Button type="submit" variant="primary" loading={pending}>
              {item ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Cartão de statuses ou de tiers: cabeçalho com contagem e "+", linhas com bolinha e menu. */
export function CustomerLabelList({
  noun,
  title,
  description,
  items,
  canEdit,
  actions,
}: {
  noun: "status" | "tier";
  title: string;
  description: string;
  items: CustomerLabel[];
  canEdit: boolean;
  actions: CustomerLabelActions;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState<CustomerLabel | "new" | null>(null);
  const [deleting, setDeleting] = useState<CustomerLabel | null>(null);

  const plural = noun === "status" ? "statuses" : "tiers";
  const count =
    items.length === 0
      ? `No customer ${plural}`
      : `${items.length} customer ${items.length === 1 ? noun : plural}`;
  // Todo Workspace mantém ao menos um status (a API recusa excluir o último).
  const lastStatus = noun === "status" && items.length === 1;

  const run = async (work: Promise<unknown>, failure: string) => {
    try {
      await work;
    } catch (error) {
      toast({ title: failure, description: errorMessage(error, "Try again."), variant: "error" });
    }
  };

  const move = (index: number, delta: -1 | 1) => {
    const ids = items.map((item) => item.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(index + delta, 0, moved!);
    void run(actions.reorder(ids), `Could not reorder customer ${plural}`);
  };

  return (
    <SettingsGroup title={title} description={description}>
      <ListHeader
        text={count}
        action={
          <IconButton
            icon={Plus}
            label={`Add customer ${noun}`}
            disabled={!canEdit}
            onClick={() => setEditing("new")}
          />
        }
      />
      {items.map((item, index) => (
        <div
          key={item.id}
          className="flex items-center gap-2 border-b border-subtle py-2 last:border-b-0"
        >
          <ColorDot color={asLabelColor(item.color)} size="md" />
          <span className="min-w-0 flex-1 truncate text-body-md text-primary">{item.name}</span>
          <Menu>
            <MenuTrigger asChild>
              <IconButton
                icon={Ellipsis}
                label={`Open menu for ${item.name}`}
                disabled={!canEdit}
              />
            </MenuTrigger>
            <MenuContent variant="dropdown" align="end">
              <MenuItem icon={Pencil} onSelect={() => setEditing(item)}>
                Edit…
              </MenuItem>
              <MenuItem icon={ArrowUp} disabled={index === 0} onSelect={() => move(index, -1)}>
                Move up
              </MenuItem>
              <MenuItem
                icon={ArrowDown}
                disabled={index === items.length - 1}
                onSelect={() => move(index, 1)}
              >
                Move down
              </MenuItem>
              <MenuItem icon={Trash2} disabled={lastStatus} onSelect={() => setDeleting(item)}>
                Delete…
              </MenuItem>
            </MenuContent>
          </Menu>
        </div>
      ))}

      {editing !== null && (
        <LabelDialog
          // Remonta por item para o rascunho começar do valor salvo.
          key={editing === "new" ? "new" : editing.id}
          noun={noun}
          item={editing === "new" ? null : editing}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          onSubmit={(values) =>
            editing === "new"
              ? actions.create(values)
              : actions.update({ id: editing.id, ...values })
          }
        />
      )}
      <Confirm
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={`Delete customer ${noun}?`}
        description={
          noun === "status"
            ? `“${deleting?.name}” is removed from the workspace. This cannot be undone.`
            : `“${deleting?.name}” is removed from the workspace and from any customer using it. This cannot be undone.`
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleting) {
            void run(actions.remove(deleting.id), `Could not delete customer ${noun}`);
          }
        }}
      />
    </SettingsGroup>
  );
}

export type DomainRule = { id: string; value: string };

function DomainDialog({
  onOpenChange,
  onAdd,
  title,
}: {
  onOpenChange: (open: boolean) => void;
  onAdd: (value: string) => Promise<unknown>;
  title: string;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = value.trim().toLowerCase();
    if (!DOMAIN_PATTERN.test(normalized) && !EMAIL_PATTERN.test(normalized)) {
      return setError(DOMAIN_INVALID);
    }
    setPending(true);
    try {
      await onAdd(normalized);
      onOpenChange(false);
    } catch (caught) {
      setError(errorMessage(caught, "Could not add this entry."));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent size="sm" title={title}>
        <form onSubmit={submit} noValidate>
          <DialogBody>
            <Field label="Domain or email" error={error}>
              <TextInput
                value={value}
                placeholder="customer.com or name@customer.com"
                invalid={Boolean(error)}
                onChange={(event) => {
                  setValue(event.target.value);
                  setError(undefined);
                }}
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button">Cancel</Button>
            </DialogClose>
            <Button type="submit" variant="primary" loading={pending}>
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Cartão de domínios e e-mails (Excluded ou Generic): cabeçalho com "Open menu" e as linhas. */
export function CustomerDomainList({
  title,
  description,
  emptyText,
  countNoun,
  addTitle,
  rules,
  canEdit,
  onAdd,
  onRemove,
}: {
  title: string;
  /** Texto de ajuda do cartão; pode levar um link (o "List of generic domains"). */
  description: ReactNode;
  emptyText: string;
  countNoun: string;
  addTitle: string;
  rules: DomainRule[];
  canEdit: boolean;
  onAdd: (value: string) => Promise<unknown>;
  onRemove: (id: string) => Promise<unknown>;
}) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);

  return (
    <SettingsGroup title={title} description={description}>
      <ListHeader
        text={rules.length === 0 ? emptyText : `${rules.length} ${countNoun}`}
        action={
          <Menu>
            <MenuTrigger asChild>
              <IconButton icon={Ellipsis} label={`Open menu for ${title}`} disabled={!canEdit} />
            </MenuTrigger>
            <MenuContent variant="dropdown" align="end">
              <MenuItem icon={Plus} onSelect={() => setAdding(true)}>
                Add domain or email…
              </MenuItem>
            </MenuContent>
          </Menu>
        }
      />
      {rules.map((rule) => (
        <div
          key={rule.id}
          className="flex items-center gap-2 border-b border-subtle py-2 last:border-b-0"
        >
          <span className="min-w-0 flex-1 truncate text-body-md text-primary">{rule.value}</span>
          <IconButton
            icon={X}
            label={`Remove ${rule.value}`}
            disabled={!canEdit}
            onClick={() =>
              void onRemove(rule.id).catch((error: unknown) =>
                toast({
                  title: "Could not remove entry",
                  description: errorMessage(error, "Try again."),
                  variant: "error",
                }),
              )
            }
          />
        </div>
      ))}
      {adding && <DomainDialog title={addTitle} onOpenChange={setAdding} onAdd={onAdd} />}
    </SettingsGroup>
  );
}
