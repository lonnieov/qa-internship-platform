"use client";

import { useActionState, useEffect, useRef } from "react";
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
  buttonLabel = "Перепройти",
  issuedButtonLabel = "Выдать новый",
  onCreated,
}: {
  internProfileId: string;
  buttonLabel?: string;
  issuedButtonLabel?: string;
  onCreated?: (invitation: NonNullable<InvitationState["invitation"]>) => void;
}) {
  const [state, action, isPending] = useActionState(
    createRetakeInvitationAction,
    initialState,
  );
  const lastInvitationId = useRef<string | null>(null);

  useEffect(() => {
    if (!state.invitation || state.invitation.id === lastInvitationId.current) {
      return;
    }

    lastInvitationId.current = state.invitation.id;
    onCreated?.(state.invitation);
  }, [onCreated, state.invitation]);

  return (
    <div className="retake-action" aria-live="polite">
      <form action={action}>
        <input type="hidden" name="internProfileId" value={internProfileId} />
        <Button
          className="intern-action-button intern-action-retake"
          size="sm"
          type="submit"
          variant="outline"
          disabled={isPending}
        >
          <RotateCcw size={15} />
          {state.inviteCode ? issuedButtonLabel : buttonLabel}
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
                <span>Новый токен показан один раз. Старый доступ отвязан.</span>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
