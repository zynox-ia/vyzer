/**
 * A rota `/settings/profile`: `ProfileView` ligada à API (`profile.get/update/leaveWorkspace` e o
 * upload da foto). Edição otimista com volta e aviso se falhar; sair do Workspace leva a `/projects`.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Alert, Button, Skeleton, useToast } from "@zynox/design-system/components";
import {
  leaveWorkspaceMutationOptions,
  profileQueryOptions,
  updateProfileMutationOptions,
  uploadMemberAvatarMutationOptions,
  type Profile,
} from "@/services/profile";
import { ProfileView } from "./profile";

const LEAVE_HINT = "You are the only member or the only admin, so you cannot leave this workspace.";

export function ProfilePage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const query = useQuery(profileQueryOptions());
  const queryKey = profileQueryOptions().queryKey;
  const [uploadError, setUploadError] = useState<string>();

  const update = useMutation({
    ...updateProfileMutationOptions(),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Profile>(queryKey);
      if (previous) queryClient.setQueryData(queryKey, { ...previous, ...patch });
      return { previous };
    },
    onError: (error, _patch, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast({
        title: "Could not save profile",
        description: error.message || "Check your connection and try again.",
        variant: "error",
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const upload = useMutation({
    ...uploadMemberAvatarMutationOptions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const leave = useMutation({
    ...leaveWorkspaceMutationOptions(),
    onSuccess: async () => {
      toast({ title: "You left the workspace" });
      await queryClient.invalidateQueries();
      void navigate("/projects");
    },
    onError: (error) =>
      toast({
        title: "Could not leave workspace",
        description: error.message || "Check your connection and try again.",
        variant: "error",
      }),
  });

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-1">
        <h1 className="type-heading-1 pb-6 text-primary">Profile</h1>
        <div aria-busy="true" className="flex flex-col gap-3">
          <span className="sr-only">Loading profile.</span>
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} shape="block" className="h-control-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex flex-col gap-1">
        <h1 className="type-heading-1 pb-6 text-primary">Profile</h1>
        <Alert
          tone="danger"
          role="alert"
          title="Could not load profile"
          action={
            <Button type="button" variant="secondary" onClick={() => void query.refetch()}>
              Retry
            </Button>
          }
        >
          Check your connection and try again.
        </Alert>
      </div>
    );
  }

  const profile = query.data;
  return (
    <ProfileView
      values={profile}
      onEdit={(patch) => update.mutate(patch)}
      onUploadAvatar={(file) => {
        setUploadError(undefined);
        upload.mutate(file, { onError: (error) => setUploadError(error.message) });
      }}
      uploading={upload.isPending}
      uploadError={uploadError}
      onLeave={() => leave.mutate()}
      canLeave={profile.canLeaveWorkspace}
      leaveHint={LEAVE_HINT}
    />
  );
}
