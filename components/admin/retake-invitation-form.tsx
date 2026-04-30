"use client";

import { useActionState } from "react";
import { RotateCcw } from "lucide-react";
import {
  createRetakeInvitationAction,
  type InvitationState,
} from "@/actions/admin";
import { CopyableToken } from "@/components/admin/copyable-token";
import { Button } from "@/components/ui/button";

const initialState: InvitationState = {
  ok: false,
  message: "",
};

export function RetakeInvitationForm({
  internProfileId,
}: {
  internProfileId: string;
}) {
  const [state, action, isPending] = useActionState(
    createRetakeInvitationAction,
    initialState,
  );

  return (
    <div className="retake-action">
      <form action={action}>
        <input type="hidden" name="internProfileId" value={internProfileId} />
        <input type="hidden" name="expiresInDays" value="14" />
        <Button
          className="intern-action-button intern-action-retake"
          size="sm"
          type="submit"
          variant="outline"
          disabled={isPending}
        >
          <RotateCcw size={15} />
          Перепройти
        </Button>
      </form>
      {state.message ? (
        <div className="retake-token-panel">
          <p className="body-2 m-0">{state.message}</p>
          {state.inviteCode ? <CopyableToken token={state.inviteCode} /> : null}
        </div>
      ) : null}
    </div>
  );
}
