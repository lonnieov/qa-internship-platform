"use client";

import { useActionState } from "react";
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
    <Card>
      <CardHeader>
        <CardTitle>Выдать доступ стажёру</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="form-grid">
          <div className="form-grid">
            <Label htmlFor="candidateName">Имя и фамилия кандидата</Label>
            <Input id="candidateName" name="candidateName" placeholder="Алина Каримова" />
          </div>
          <div className="form-grid">
            <Label htmlFor="expiresInDays">Срок действия, дней</Label>
            <Input
              id="expiresInDays"
              name="expiresInDays"
              type="number"
              min="1"
              max="90"
              defaultValue="14"
            />
          </div>
          <Button disabled={isPending} type="submit">
            Создать токен
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
