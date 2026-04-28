"use client";

import { useActionState } from "react";
import {
  loginDemoAdminAction,
  type DemoAdminLoginState,
} from "@/actions/demo-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: DemoAdminLoginState = {
  ok: false,
  message: "",
};

export function DemoAdminLoginForm() {
  const [state, action, isPending] = useActionState(
    loginDemoAdminAction,
    initialState,
  );

  return (
    <form action={action} className="form-grid">
      <div className="form-grid">
        <Label htmlFor="username">Логин</Label>
        <Input id="username" name="username" defaultValue="admin" />
      </div>
      <div className="form-grid">
        <Label htmlFor="password">Пароль</Label>
        <Input id="password" name="password" type="password" defaultValue="admin" />
      </div>
      <Button type="submit" disabled={isPending}>
        Войти как admin
      </Button>
      {state.message ? <p className="body-2 muted m-0">{state.message}</p> : null}
    </form>
  );
}
