"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { loginAdminAction, type AdminAuthState } from "@/actions/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

const initialState: AdminAuthState = {
  ok: false,
  message: "",
};

export function AdminLoginForm() {
  const t = useTranslations("AdminAuth");
  const [state, action, isPending] = useActionState(
    loginAdminAction,
    initialState,
  );

  return (
    <form action={action} className="form-grid">
      <div className="form-grid">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" />
      </div>
      <div className="form-grid">
        <Label htmlFor="password">{t("password")}</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {t("signIn")}
      </Button>
      {state.message ? <p className="body-2 muted m-0">{state.message}</p> : null}
    </form>
  );
}
