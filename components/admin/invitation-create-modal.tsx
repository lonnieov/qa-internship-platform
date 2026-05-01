"use client";

import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { InvitationForm } from "@/components/admin/invitation-form";
import { Button } from "@/components/ui/button";

export function InvitationCreateModal() {
  const t = useTranslations("AdminInterns");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setIsOpen(true)}>
        <UserPlus size={18} />
        {t("createIntern")}
      </Button>

      {isOpen ? (
        <div
          aria-labelledby="create-invitation-title"
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="invitation-modal surface"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 className="head-3 m-0" id="create-invitation-title">
                  {t("createInternTitle")}
                </h2>
                <p className="body-2 muted m-0">
                  {t("createInternDescription")}
                </p>
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

            <InvitationForm embedded />
          </div>
        </div>
      ) : null}
    </>
  );
}
