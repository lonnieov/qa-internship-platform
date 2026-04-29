"use client";

import { useActionState } from "react";
import { registerAdminAction, type AdminAuthState } from "@/actions/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AdminAuthState = {
  ok: false,
  message: "",
};

type AdminRegisterFormProps = {
  requireRegistrationCode: boolean;
};

export function AdminRegisterForm({
  requireRegistrationCode,
}: AdminRegisterFormProps) {
  const [state, action, isPending] = useActionState(
    registerAdminAction,
    initialState,
  );

  return (
    <form action={action} className="form-grid">
      <div className="form-grid">
        <Label htmlFor="firstName">Имя</Label>
        <Input id="firstName" name="firstName" autoComplete="given-name" />
      </div>
      <div className="form-grid">
        <Label htmlFor="lastName">Фамилия</Label>
        <Input id="lastName" name="lastName" autoComplete="family-name" />
      </div>
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
          autoComplete="new-password"
        />
      </div>
      {requireRegistrationCode ? (
        <div className="form-grid">
          <Label htmlFor="registrationCode">Код регистрации</Label>
          <Input
            id="registrationCode"
            name="registrationCode"
            type="password"
            autoComplete="off"
          />
        </div>
      ) : null}
      <Button type="submit" disabled={isPending}>
        Зарегистрироваться
      </Button>
      {state.message ? <p className="body-2 muted m-0">{state.message}</p> : null}
    </form>
  );
}
