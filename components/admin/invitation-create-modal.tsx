"use client";

import { useId, useState } from "react";
import { UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { InvitationForm } from "@/components/admin/invitation-form";
import { Button } from "@/components/ui/button";
import { NativeDialog } from "@/components/ui/native-dialog";

type InvitationCreateModalProps = {
  tracks?: {
    id: string;
    name: string;
    waves: { id: string; name: string }[];
  }[];
};

export function InvitationCreateModal({ tracks = [] }: InvitationCreateModalProps) {
  const t = useTranslations("AdminInterns");
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <Button type="button" onClick={() => setIsOpen(true)}>
        <UserPlus size={18} />
        {t("createIntern")}
      </Button>

      <NativeDialog
        labelledBy={titleId}
        onOpenChange={setIsOpen}
        open={isOpen}
      >
          <div className="invitation-modal surface">
            <div className="modal-header">
              <div>
                <h2 className="head-3 m-0" id={titleId}>
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

            <InvitationForm embedded tracks={tracks} />
          </div>
      </NativeDialog>
    </>
  );
}
