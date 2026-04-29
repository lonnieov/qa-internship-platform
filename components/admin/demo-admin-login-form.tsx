"use client";

import { useActionState } from "react";
import {
  loginDemoAdminAction,
  type DemoAdminLoginState,
} from "@/actions/demo-admin";

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
    <form action={action} className="coin-form">
      <div>
        <label className="input-label" htmlFor="username">
          Логин
        </label>
        <div className="coin-field">
          <span className="coin-field__icon">@</span>
          <input className="coin-input" id="username" name="username" defaultValue="admin" />
        </div>
      </div>
      <div>
        <label className="input-label" htmlFor="password">
          Пароль
        </label>
        <div className="coin-field">
          <span className="coin-field__icon">•</span>
          <input
            className="coin-input"
            id="password"
            name="password"
            type="password"
            defaultValue="admin"
          />
        </div>
        <div className="help-text">Креденшелы выдаёт администратор</div>
      </div>
      <button className="coin-btn coin-btn--primary coin-btn--lg coin-btn--full" type="submit" disabled={isPending}>
        {isPending ? "Входим..." : "Войти"}
      </button>
      {state.message ? <p className="help-text">{state.message}</p> : null}
    </form>
  );
}
