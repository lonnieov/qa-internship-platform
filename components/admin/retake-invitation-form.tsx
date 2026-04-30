"use client";

import { useActionState } from "react";
import { CheckCircle2, Clock3, RotateCcw } from "lucide-react";
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
    <div className="retake-action" aria-live="polite">
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
          {state.inviteCode ? "Выдать новый" : "Перепройти"}
        </Button>
      </form>
      {state.message ? (
        <div
          className={`retake-token-panel ${state.ok ? "success" : "danger"}`}
        >
          <div className="retake-token-header">
            <span className="retake-token-icon">
              {state.ok ? <CheckCircle2 size={16} /> : <RotateCcw size={16} />}
            </span>
            <div>
              <strong>{state.ok ? "Доступ обновлён" : "Не удалось"}</strong>
              <p className="body-2 muted m-0">{state.message}</p>
            </div>
          </div>
          {state.inviteCode ? (
            <>
              <CopyableToken token={state.inviteCode} />
              <div className="retake-token-meta">
                <Clock3 size={14} />
                <span>Действует 14 дней. Старый доступ отвязан.</span>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
