"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { seedAdminEmail } from "@/lib/admin-constants";
import { requireAdmin } from "@/lib/auth";
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
  return String(value ?? "")
    .trim()
    .toLowerCase();
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
    return {
      ok: false,
      message: "Администратор с таким email уже существует.",
    };
  }

  redirect("/admin");
}

export async function createAdminAction(
  _prevState: AdminAuthState,
  formData: FormData,
): Promise<AdminAuthState> {
  await requireAdmin();

  const email = normalizeEmail(formData.get("email"));
  const password = normalizePassword(formData.get("password"));
  const firstName = String(formData.get("firstName") ?? "").trim() || null;
  const lastName = String(formData.get("lastName") ?? "").trim() || null;

  if (!email || !email.includes("@")) {
    return { ok: false, message: "Введите корректный email." };
  }

  if (password.length < 6) {
    return { ok: false, message: "Пароль должен быть не короче 6 символов." };
  }

  try {
    await prisma.profile.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        firstName,
        lastName,
        role: "ADMIN",
      },
    });
  } catch {
    return {
      ok: false,
      message: "Администратор с таким email уже существует.",
    };
  }

  revalidatePath("/admin/settings");

  return { ok: true, message: "Администратор создан." };
}

export async function updateAdminAction(
  _prevState: AdminAuthState,
  formData: FormData,
): Promise<AdminAuthState> {
  await requireAdmin();

  const adminId = String(formData.get("adminId") ?? "");
  const email = normalizeEmail(formData.get("email"));
  const password = normalizePassword(formData.get("password"));
  const firstName = String(formData.get("firstName") ?? "").trim() || null;
  const lastName = String(formData.get("lastName") ?? "").trim() || null;

  if (!adminId) {
    return { ok: false, message: "Администратор не найден." };
  }

  const target = await prisma.profile.findUnique({ where: { id: adminId } });

  if (!target || target.role !== "ADMIN" || !target.passwordHash) {
    return { ok: false, message: "Администратор не найден." };
  }

  if (target.email?.toLowerCase() === seedAdminEmail) {
    return { ok: false, message: "Сидового администратора нельзя изменять." };
  }

  if (!email || !email.includes("@")) {
    return { ok: false, message: "Введите корректный email." };
  }

  if (password && password.length < 6) {
    return { ok: false, message: "Пароль должен быть не короче 6 символов." };
  }

  try {
    await prisma.profile.update({
      where: { id: adminId },
      data: {
        email,
        firstName,
        lastName,
        ...(password ? { passwordHash: hashPassword(password) } : {}),
      },
    });
  } catch {
    return {
      ok: false,
      message: "Администратор с таким email уже существует.",
    };
  }

  revalidatePath("/admin/settings");

  return { ok: true, message: "Администратор обновлён." };
}

export async function deleteAdminAction(
  _prevState: AdminAuthState,
  formData: FormData,
): Promise<AdminAuthState> {
  const currentAdmin = await requireAdmin();
  const adminId = String(formData.get("adminId") ?? "");

  if (!adminId) {
    return { ok: false, message: "Администратор не найден." };
  }

  if (adminId === currentAdmin.id) {
    return { ok: false, message: "Нельзя удалить текущую учётную запись." };
  }

  const target = await prisma.profile.findUnique({ where: { id: adminId } });

  if (!target || target.role !== "ADMIN" || !target.passwordHash) {
    return { ok: false, message: "Администратор не найден." };
  }

  if (target.email?.toLowerCase() === seedAdminEmail) {
    return { ok: false, message: "Сидового администратора нельзя удалить." };
  }

  await prisma.$transaction([
    prisma.adminSession.deleteMany({ where: { profileId: adminId } }),
    prisma.profile.update({
      where: { id: adminId },
      data: {
        email: `deleted-admin-${adminId}@deleted.local`,
        passwordHash: null,
        firstName: "Deleted",
        lastName: "Admin",
      },
    }),
  ]);

  revalidatePath("/admin/settings");

  return { ok: true, message: "Администратор удалён." };
}

export async function logoutAdminAction() {
  await clearAdminSession();
  redirect("/sign-in/admin");
}
