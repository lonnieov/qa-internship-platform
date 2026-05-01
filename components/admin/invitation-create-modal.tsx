"use client";

import { useState } from "react";
import { KeyRound, X } from "lucide-react";
import { InvitationForm } from "@/components/admin/invitation-form";
import { Button } from "@/components/ui/button";

export function InvitationCreateModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setIsOpen(true)}>
        <KeyRound size={18} />
        Создать токен
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
                  Выдать доступ стажёру
                </h2>
                <p className="body-2 muted m-0">
                  Создайте одноразовый токен для входа кандидата.
                </p>
              </div>
              <Button
                aria-label="Закрыть модальное окно"
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
