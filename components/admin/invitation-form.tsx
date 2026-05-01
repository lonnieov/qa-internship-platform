"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createInvitationAction, type InvitationState } from "@/actions/admin";
import { CopyableToken } from "@/components/admin/copyable-token";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const initialState: InvitationState = {
  ok: false,
  message: "",
};

type InvitationFormProps = {
  embedded?: boolean;
};

export function InvitationForm({ embedded = false }: InvitationFormProps) {
  const t = useTranslations("AdminInterns");
  const [state, action, isPending] = useActionState(
    createInvitationAction,
    initialState,
  );

  const content = (
    <>
      <form action={action} className="form-grid">
        <div className="form-grid">
          <Label htmlFor="candidateName">{t("candidateName")}</Label>
          <Input
            id="candidateName"
            name="candidateName"
            placeholder={t("candidatePlaceholder")}
          />
        </div>
        <Button disabled={isPending} type="submit">
          {t("createIntern")}
        </Button>
      </form>
      {state.message ? (
        <div className="soft-panel mt-4 stack">
          <p className="body-2 m-0">{state.message}</p>
          {state.inviteCode ? <CopyableToken token={state.inviteCode} /> : null}
        </div>
      ) : null}
    </>
  );

  if (embedded) {
    return <div className="invitation-form-embedded">{content}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("createIntern")}</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
