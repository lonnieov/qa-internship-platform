"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { MoreHorizontal, X } from "lucide-react";
import {
  deleteAdminAction,
  updateAdminAction,
  type AdminAuthState,
} from "@/actions/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AdminAuthState = {
  ok: false,
  message: "",
};

type AdminManageModalProps = {
  admin: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    isSeed: boolean;
    isCurrent: boolean;
  };
};

export function AdminManageModal({ admin }: AdminManageModalProps) {
  const t = useTranslations("AdminSettings");
  const [isOpen, setIsOpen] = useState(false);
  const [updateState, updateAction, isUpdatePending] = useActionState(
    updateAdminAction,
    initialState,
  );
  const [deleteState, deleteAction, isDeletePending] = useActionState(
    deleteAdminAction,
    initialState,
  );
  const isProtected = admin.isSeed;

  return (
    <>
      <button
        aria-label={t("admins.manageAria", { admin: admin.email ?? admin.id })}
        className="track-manage-trigger"
        type="button"
        onClick={() => setIsOpen(true)}
      >
        <MoreHorizontal size={18} />
      </button>

      {isOpen ? (
        <div
          aria-labelledby={`admin-modal-title-${admin.id}`}
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="admin-modal surface"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 className="head-3 m-0" id={`admin-modal-title-${admin.id}`}>
                  {t("admins.manageTitle")}
                </h2>
                <p className="body-2 muted m-0">{admin.email}</p>
              </div>
              <Button
                aria-label={t("closeModal")}
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
              >
                <X size={18} />
              </Button>
            </div>

            <div className="track-modal-body">
              {isProtected ? (
                <p className="body-1 muted m-0">
                  {t("admins.seedProtected")}
                </p>
              ) : (
                <>
                  <form action={updateAction} className="track-modal-form">
                    <input type="hidden" name="adminId" value={admin.id} />
                    <div className="grid-2">
                      <div className="form-field">
                        <Label htmlFor={`admin-first-name-${admin.id}`}>
                          {t("admins.form.firstName")}
                        </Label>
                        <Input
                          id={`admin-first-name-${admin.id}`}
                          name="firstName"
                          defaultValue={admin.firstName ?? ""}
                        />
                      </div>
                      <div className="form-field">
                        <Label htmlFor={`admin-last-name-${admin.id}`}>
                          {t("admins.form.lastName")}
                        </Label>
                        <Input
                          id={`admin-last-name-${admin.id}`}
                          name="lastName"
                          defaultValue={admin.lastName ?? ""}
                        />
                      </div>
                    </div>
                    <div className="form-field">
                      <Label htmlFor={`admin-email-${admin.id}`}>
                        {t("admins.form.email")}
                      </Label>
                      <Input
                        id={`admin-email-${admin.id}`}
                        name="email"
                        type="email"
                        defaultValue={admin.email ?? ""}
                        required
                      />
                    </div>
                    <div className="form-field">
                      <Label htmlFor={`admin-password-${admin.id}`}>
                        {t("admins.form.newPassword")}
                      </Label>
                      <Input
                        id={`admin-password-${admin.id}`}
                        name="password"
                        type="password"
                        minLength={6}
                        placeholder={t("admins.form.passwordPlaceholder")}
                      />
                    </div>
                    <div className="modal-actions">
                      <Button type="submit" disabled={isUpdatePending}>
                        {t("save")}
                      </Button>
                    </div>
                    {updateState.message ? (
                      <p
                        className={`body-2 m-0 ${
                          updateState.ok ? "success-text" : "danger-text"
                        }`}
                      >
                        {updateState.message}
                      </p>
                    ) : null}
                  </form>

                  <div className="track-modal-danger-zone">
                    <div>
                      <strong>{t("admins.delete.title")}</strong>
                      <p className="body-2 muted m-0">
                        {t("admins.delete.description")}
                      </p>
                    </div>
                    <form action={deleteAction}>
                      <input type="hidden" name="adminId" value={admin.id} />
                      <Button
                        type="submit"
                        variant="destructive"
                        disabled={isDeletePending || admin.isCurrent}
                        title={
                          admin.isCurrent
                            ? t("admins.delete.currentDisabled")
                            : undefined
                        }
                      >
                        {t("admins.delete.action")}
                      </Button>
                    </form>
                    {deleteState.message ? (
                      <p
                        className={`body-2 m-0 ${
                          deleteState.ok ? "success-text" : "danger-text"
                        }`}
                      >
                        {deleteState.message}
                      </p>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
