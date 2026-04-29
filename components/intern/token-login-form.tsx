"use client";

import { useActionState } from "react";
import {
  loginInternByTokenAction,
  type InternTokenLoginState,
} from "@/actions/intern";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: InternTokenLoginState = {
  ok: false,
  message: "",
};

export function TokenLoginForm() {
  const [state, action, isPending] = useActionState(
    loginInternByTokenAction,
    initialState,
  );

  return (
    <form action={action} className="form-grid">
      <Input id="token" name="token" placeholder="XXXX-XXXX-XXXX" />
      <Button disabled={isPending} type="submit">
        Войти
      </Button>
      {state.message ? (
        <p className="body-2 muted m-0">{state.message}</p>
      ) : null}
    </form>
  );
}
