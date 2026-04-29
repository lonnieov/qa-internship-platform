"use client";

import { useActionState } from "react";
import {
  loginInternByTokenAction,
  type InternTokenLoginState,
} from "@/actions/intern";

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
    <form action={action} className="coin-form">
      <div>
        <label className="input-label" htmlFor="token">
          Токен стажёра
        </label>
        <div className="coin-field">
          <span className="coin-field__icon">#</span>
          <input className="coin-input" id="token" name="token" placeholder="XXXX-XXXX-XXXX" />
        </div>
      </div>
      <button className="coin-btn coin-btn--primary coin-btn--lg coin-btn--full" disabled={isPending} type="submit">
        {isPending ? "Проверяем токен..." : "Войти"}
      </button>
      <div className="help-text">Токен выдаётся администратором</div>
      {state.message ? <p className="help-text">{state.message}</p> : null}
    </form>
  );
}
