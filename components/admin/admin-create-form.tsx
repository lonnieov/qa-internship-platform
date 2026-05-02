"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createAdminAction, type AdminAuthState } from "@/actions/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AdminAuthState = {
  ok: false,
  message: "",
};

export function AdminCreateForm() {
  const t = useTranslations("AdminSettings");
  const [state, action, isPending] = useActionState(
    createAdminAction,
    initialState,
  );

  return (
    <form action={action} className="form-grid">
      <div className="grid-2">
        <div className="form-field">
          <Label htmlFor="new-admin-first-name">{t("admins.form.firstName")}</Label>
          <Input
            id="new-admin-first-name"
            name="firstName"
            autoComplete="given-name"
          />
        </div>
        <div className="form-field">
          <Label htmlFor="new-admin-last-name">{t("admins.form.lastName")}</Label>
          <Input
            id="new-admin-last-name"
            name="lastName"
            autoComplete="family-name"
          />
        </div>
      </div>
      <div className="form-field">
        <Label htmlFor="new-admin-email">{t("admins.form.email")}</Label>
        <Input
          id="new-admin-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div className="form-field">
        <Label htmlFor="new-admin-password">{t("admins.form.password")}</Label>
        <Input
          id="new-admin-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </div>
      <div className="modal-actions">
        <Button type="submit" disabled={isPending}>
          {t("admins.form.create")}
        </Button>
      </div>
      {state.message ? (
        <p
          className={`body-2 m-0 ${state.ok ? "success-text" : "danger-text"}`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
