"use server";

import { redirect } from "next/navigation";
import {
  clearDemoAdminSession,
  createDemoAdminSession,
  verifyDemoAdminPassword,
} from "@/lib/demo-admin-auth";

export type DemoAdminLoginState = {
  ok: boolean;
  message: string;
};

export async function loginDemoAdminAction(
  _prevState: DemoAdminLoginState,
  formData: FormData,
): Promise<DemoAdminLoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (username !== (process.env.DEMO_ADMIN_USERNAME || "admin")) {
    return { ok: false, message: "Неверный логин или пароль." };
  }

  if (!verifyDemoAdminPassword(password)) {
    return { ok: false, message: "Неверный логин или пароль." };
  }

  await createDemoAdminSession();
  redirect("/admin");
}

export async function logoutDemoAdminAction() {
  await clearDemoAdminSession();
  redirect("/sign-in/admin");
}
