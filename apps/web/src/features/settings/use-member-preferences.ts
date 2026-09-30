/**
 * As preferências do Member pela API (`memberPreferences.get/update`, TanStack Query): cada mudança
 * atualiza o cache na hora e volta atrás, com aviso, se a gravação falhar (mesmo padrão do
 * Customize sidebar). Quem só precisa aplicar os efeitos (tema, cursor, links) usa o mesmo cache.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@vyzer/design-system/components";
import {
  memberPreferencesQueryOptions,
  updateMemberPreferencesMutationOptions,
  type MemberPreferenceValues,
  type MemberPreferences,
} from "@/services/member-preferences";

export function useMemberPreferences() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const query = useQuery(memberPreferencesQueryOptions());
  const queryKey = memberPreferencesQueryOptions().queryKey;

  const mutation = useMutation({
    ...updateMemberPreferencesMutationOptions(),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<MemberPreferences>(queryKey);
      if (previous) queryClient.setQueryData(queryKey, { ...previous, ...patch });
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast({
        title: "Could not save preference",
        description: "Check your connection and try again.",
        variant: "error",
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    preferences: query.data,
    isPending: query.isPending,
    isError: query.isError,
    refetch: () => void query.refetch(),
    update: (patch: Partial<MemberPreferenceValues>) => mutation.mutate(patch),
  };
}
