"use client";

import { UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { InvitationForm } from "@/components/admin/invitation-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type InvitationCreateModalProps = {
  tracks?: {
    id: string;
    name: string;
    waves: { id: string; name: string }[];
    grades: { id: string; name: string }[];
  }[];
};

export function InvitationCreateModal({ tracks = [] }: InvitationCreateModalProps) {
  const t = useTranslations("AdminInterns");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button">
          <UserPlus size={18} />
          {t("createIntern")}
        </Button>
      </DialogTrigger>

      <DialogContent variant="bare">
        <div className="invitation-modal surface">
          <div className="modal-header">
            <div>
              <DialogTitle className="head-3 m-0">
                {t("createInternTitle")}
              </DialogTitle>
              <DialogDescription className="body-2 muted m-0">
                {t("createInternDescription")}
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button
                aria-label={t("closeModal")}
                type="button"
                variant="ghost"
              >
                <X size={18} />
              </Button>
            </DialogClose>
          </div>

          <InvitationForm embedded tracks={tracks} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
