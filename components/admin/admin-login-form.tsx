"use client";

import { useActionState } from "react";
import { loginAdminAction, type AdminAuthState } from "@/actions/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AdminAuthState = {
  ok: false,
  message: "",
};

export function AdminLoginForm() {
  const [state, action, isPending] = useActionState(
    loginAdminAction,
    initialState,
  );

  return (
    <form action={action} className="form-grid">
      <div className="form-grid">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" />
      </div>
      <div className="form-grid">
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
        />
      </div>
      <Button type="submit" disabled={isPending}>
        Войти
      </Button>
      {state.message ? <p className="body-2 muted m-0">{state.message}</p> : null}
    </form>
  );
}
