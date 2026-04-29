"use client";

import { useActionState } from "react";
import { CalendarClock, UserRound } from "lucide-react";
import { createInvitationAction, type InvitationState } from "@/actions/admin";
import { CopyableToken } from "@/components/admin/copyable-token";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: InvitationState = {
  ok: false,
  message: "",
};

export function InvitationForm() {
  const [state, action, isPending] = useActionState(
    createInvitationAction,
    initialState,
  );

  return (
    <Card className="v2-card">
      <CardHeader className="v2-card__header">
        <div>
          <CardTitle>Выдать доступ стажёру</CardTitle>
          <p className="v2-card__description">
            В текущем flow создаётся token-only доступ без email и без отдельного пароля.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <form action={action} className="v2-form">
          <div className="v2-form__group">
            <Label htmlFor="candidateName">Имя и фамилия кандидата</Label>
            <div className="v2-input-wrap">
              <UserRound className="v2-input-wrap__icon" size={18} />
              <Input
                className="v2-input v2-input--with-icon"
                id="candidateName"
                name="candidateName"
                placeholder="Алина Каримова"
              />
            </div>
          </div>
          <div className="v2-form__group">
            <Label htmlFor="expiresInDays">Срок действия, дней</Label>
            <div className="v2-input-wrap">
              <CalendarClock className="v2-input-wrap__icon" size={18} />
              <Input
                className="v2-input v2-input--with-icon"
                id="expiresInDays"
                name="expiresInDays"
                type="number"
                min="1"
                max="90"
                defaultValue="14"
              />
            </div>
          </div>
          <Button disabled={isPending} type="submit">
            {isPending ? "Создаём токен..." : "Создать токен"}
          </Button>
        </form>
        {state.message ? (
          <div className="soft-panel mt-4 stack">
            <p className="body-2 m-0">{state.message}</p>
            {state.inviteCode ? (
              <CopyableToken token={state.inviteCode} />
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
