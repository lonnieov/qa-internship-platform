"use client";

import { useActionState, useState } from "react";
import {
  loginInternByTokenAction,
  type InternTokenLoginState,
} from "@/actions/intern";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: InternTokenLoginState = {
  ok: false,
  message: "",
};

export function TokenLoginForm() {
  const [state, action, isPending] = useActionState(
    loginInternByTokenAction,
    initialState,
  );
  const [hasConsent, setHasConsent] = useState(false);

  return (
    <form action={action} className="form-grid">
      <Input id="token" name="token" placeholder="XXXX-XXXX-XXXX" />
      <Label className="consent-field" htmlFor="personalDataConsent">
        <input
          id="personalDataConsent"
          name="personalDataConsent"
          type="checkbox"
          checked={hasConsent}
          required
          onChange={(event) => setHasConsent(event.target.checked)}
        />
        <span>
          Я согласен(а) на обработку персональных данных для прохождения
          ассессмента и проверки результатов.
        </span>
      </Label>
      <Button disabled={isPending || !hasConsent} type="submit">
        Войти
      </Button>
      {state.message ? (
        <p className="body-2 muted m-0">{state.message}</p>
      ) : null}
    </form>
  );
}
