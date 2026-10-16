/**
 * A rota `/settings/code-reviews`: `CodeReviewsView` ligada à API (`codeReviews.get/update`).
 * É configuração da Workspace: qualquer Member lê, só Admin edita (mesma regra de Workspace
 * settings), então para os outros os controles ficam desabilitados. Edição otimista, com volta e
 * aviso se a gravação falhar.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Skeleton, useToast } from "@zynox/design-system/components";
import { codeReviewsQueryOptions, updateCodeReviewsMutationOptions } from "@/services/code-reviews";
import type { CodeReviewSettings } from "@/services/code-reviews";
import { currentWorkspaceQueryOptions } from "@/services/workspace";
import { CodeReviewsView } from "./code-reviews";

export function CodeReviewsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const query = useQuery(codeReviewsQueryOptions());
  const current = useQuery(currentWorkspaceQueryOptions());
  const queryKey = codeReviewsQueryOptions().queryKey;

  const update = useMutation({
    ...updateCodeReviewsMutationOptions(),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CodeReviewSettings>(queryKey);
      if (previous) queryClient.setQueryData(queryKey, { ...previous, ...patch });
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast({
        title: "Could not save code review settings",
        description: "Check your connection and try again.",
        variant: "error",
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  if (query.isPending || current.isPending) {
    return (
      <div className="flex flex-col gap-1">
        <h1 className="type-heading-1 pb-6 text-primary">Code & reviews</h1>
        <div aria-busy="true" className="flex flex-col gap-3">
          <span className="sr-only">Loading code review settings.</span>
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} shape="block" className="h-control-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (query.isError || current.isError) {
    return (
      <div className="flex flex-col gap-1">
        <h1 className="type-heading-1 pb-6 text-primary">Code & reviews</h1>
        <Alert
          tone="danger"
          role="alert"
          title="Could not load code review settings"
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void query.refetch();
                void current.refetch();
              }}
            >
              Retry
            </Button>
          }
        >
          Check your connection and try again.
        </Alert>
      </div>
    );
  }

  return (
    <CodeReviewsView
      values={query.data}
      onChange={(patch) => update.mutate(patch)}
      canEdit={current.data.member.role === "admin"}
    />
  );
}
