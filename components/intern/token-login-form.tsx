"use client";

import { useActionState } from "react";
import {
  loginInternByTokenAction,
  type InternTokenLoginState,
} from "@/actions/intern";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Войти по токену</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="form-grid">
          <div className="form-grid">
            <Label htmlFor="token">Токен стажёра</Label>
            <Input id="token" name="token" placeholder="XXXX-XXXX-XXXX" />
          </div>
          <Button disabled={isPending} type="submit">
            Войти
          </Button>
        </form>
        {state.message ? (
          <p className="body-2 muted mt-4 mb-0">{state.message}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
