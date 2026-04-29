"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  canRegisterAdmin,
  clearAdminSession,
  createAdminSession,
  hashPassword,
  verifyPassword,
} from "@/lib/admin-auth";

export type AdminAuthState = {
  ok: boolean;
  message: string;
};

function normalizeEmail(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizePassword(value: FormDataEntryValue | null) {
  return String(value ?? "");
}

function registrationCodeIsValid(value: FormDataEntryValue | null) {
  const requiredCode = process.env.ADMIN_REGISTRATION_CODE;
  if (!requiredCode) return true;

  return String(value ?? "") === requiredCode;
}

export async function loginAdminAction(
  _prevState: AdminAuthState,
  formData: FormData,
): Promise<AdminAuthState> {
  const email = normalizeEmail(formData.get("email"));
  const password = normalizePassword(formData.get("password"));

  if (!email || !password) {
    return { ok: false, message: "Введите email и пароль." };
  }

  const profile = await prisma.profile.findFirst({
    where: { email, role: "ADMIN" },
  });

  if (!profile || !verifyPassword(password, profile.passwordHash)) {
    return { ok: false, message: "Неверный email или пароль." };
  }

  await createAdminSession(profile.id);
  redirect("/admin");
}

export async function registerAdminAction(
  _prevState: AdminAuthState,
  formData: FormData,
): Promise<AdminAuthState> {
  const email = normalizeEmail(formData.get("email"));
  const password = normalizePassword(formData.get("password"));
  const firstName = String(formData.get("firstName") ?? "").trim() || null;
  const lastName = String(formData.get("lastName") ?? "").trim() || null;

  if (!(await canRegisterAdmin())) {
    return { ok: false, message: "Регистрация администраторов закрыта." };
  }

  if (!registrationCodeIsValid(formData.get("registrationCode"))) {
    return { ok: false, message: "Неверный код регистрации." };
  }

  if (!email || !email.includes("@")) {
    return { ok: false, message: "Введите корректный email." };
  }

  if (password.length < 6) {
    return { ok: false, message: "Пароль должен быть не короче 6 символов." };
  }

  try {
    const profile = await prisma.profile.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        firstName,
        lastName,
        role: "ADMIN",
      },
    });

    await createAdminSession(profile.id);
  } catch {
    return { ok: false, message: "Администратор с таким email уже существует." };
  }

  redirect("/admin");
}

export async function logoutAdminAction() {
  await clearAdminSession();
  redirect("/sign-in/admin");
}
