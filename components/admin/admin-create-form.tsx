"use client";

import { useActionState } from "react";
import { createAdminAction, type AdminAuthState } from "@/actions/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AdminAuthState = {
  ok: false,
  message: "",
};

export function AdminCreateForm() {
  const [state, action, isPending] = useActionState(
    createAdminAction,
    initialState,
  );

  return (
    <form action={action} className="form-grid">
      <div className="grid-2">
        <div className="form-field">
          <Label htmlFor="new-admin-first-name">Имя</Label>
          <Input
            id="new-admin-first-name"
            name="firstName"
            autoComplete="given-name"
          />
        </div>
        <div className="form-field">
          <Label htmlFor="new-admin-last-name">Фамилия</Label>
          <Input
            id="new-admin-last-name"
            name="lastName"
            autoComplete="family-name"
          />
        </div>
      </div>
      <div className="form-field">
        <Label htmlFor="new-admin-email">Email</Label>
        <Input
          id="new-admin-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div className="form-field">
        <Label htmlFor="new-admin-password">Пароль</Label>
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
          Создать администратора
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
