"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import { assignTrackMasterAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MasterAddModalProps = {
  trackId: string;
  trackName: string;
};

export function MasterAddModal({ trackId, trackName }: MasterAddModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const close = () => setIsOpen(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await assignTrackMasterAction(formData);
      close();
    });
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        style={{ height: 32, padding: "0 12px", fontSize: 12 }}
        onClick={() => setIsOpen(true)}
      >
        <Plus size={14} />
        Добавить
      </Button>

      {isOpen && createPortal(
        <div className="modal-backdrop" onClick={close}>
          <div
            className="admin-modal surface"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="wave-modal-header">
              <div>
                <h2 className="head-3 m-0">Добавить мастера</h2>
                <p className="body-2 muted m-0">
                  В трек {trackName}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Закрыть"
                onClick={close}
              >
                <X size={16} />
              </Button>
            </div>

            <form onSubmit={handleSubmit}>
              <input type="hidden" name="trackId" value={trackId} />
              <div className="wave-modal-body" style={{ gap: 14 }}>
                <div className="grid-2">
                  <div className="form-field">
                    <label className="body-2 muted">Имя</label>
                    <Input name="firstName" placeholder="Иван" />
                  </div>
                  <div className="form-field">
                    <label className="body-2 muted">Фамилия</label>
                    <Input name="lastName" placeholder="Петров" />
                  </div>
                </div>
                <div className="form-field">
                  <label className="body-2 muted">Email</label>
                  <Input
                    name="email"
                    type="email"
                    required
                    placeholder="user@company.dev"
                  />
                </div>
                <div className="form-field">
                  <label className="body-2 muted">
                    Пароль (для нового пользователя)
                  </label>
                  <Input
                    name="password"
                    type="password"
                    placeholder="Мин. 6 символов"
                  />
                </div>
                <p className="body-2 muted m-0">
                  Если пользователь с таким email уже существует, он будет
                  привязан к треку без смены пароля.
                </p>
              </div>
              <div className="wave-modal-footer" style={{ borderTop: "1px solid var(--surface-border)", justifyContent: "flex-end" }}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={close}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Сохранение…" : "Привязать"}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
