"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createWaveAction,
  deleteWaveAction,
  updateWaveAction,
} from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Wave = {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
};

type WaveManageModalProps =
  | { mode: "create"; trackId: string }
  | { mode: "edit"; wave: Wave; canDelete: boolean };

export function WaveManageModal(props: WaveManageModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = props.mode === "edit";

  const close = () => setIsOpen(false);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createWaveAction(formData);
      close();
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateWaveAction(formData);
      close();
    });
  };

  const handleDelete = () => {
    if (!isEdit) return;
    const formData = new FormData();
    formData.set("waveId", props.wave.id);
    startTransition(async () => {
      await deleteWaveAction(formData);
      close();
    });
  };

  return (
    <>
      {isEdit ? (
        <button
          type="button"
          className="track-icon-btn"
          aria-label="Редактировать поток"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
        >
          <Pencil size={14} />
        </button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          style={{ height: 32, padding: "0 12px", fontSize: 12 }}
          onClick={() => setIsOpen(true)}
        >
          <Plus size={14} />
          Добавить поток
        </Button>
      )}

      {isOpen && createPortal(
        <div className="modal-backdrop" onClick={close}>
          <div
            className="wave-modal surface"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="wave-modal-header">
              <div>
                <h2 className="head-3 m-0">
                  {isEdit ? `Поток · ${props.wave.name}` : "Новый поток"}
                </h2>
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

            <div className="wave-modal-body">
              {isEdit ? (
                <form
                  onSubmit={handleUpdate}
                  style={{ display: "grid", gap: 14 }}
                >
                  <input type="hidden" name="waveId" value={props.wave.id} />
                  <div className="form-field">
                    <label className="body-2 muted" htmlFor="wave-edit-name">
                      Название
                    </label>
                    <Input
                      id="wave-edit-name"
                      name="name"
                      defaultValue={props.wave.name}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label className="body-2 muted" htmlFor="wave-edit-order">
                      Порядок сортировки
                    </label>
                    <Input
                      id="wave-edit-order"
                      name="order"
                      type="number"
                      min="0"
                      defaultValue={props.wave.order}
                      style={{ width: 120 }}
                    />
                  </div>
                  <label className="wave-active-toggle">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={props.wave.isActive}
                    />
                    <span className="body-1">Поток активен</span>
                  </label>
                  <div className="wave-modal-footer">
                    {props.canDelete && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isPending}
                        onClick={handleDelete}
                      >
                        <Trash2 size={14} />
                        Удалить
                      </Button>
                    )}
                    <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={close}
                      >
                        Отмена
                      </Button>
                      <Button type="submit" size="sm" disabled={isPending}>
                        Сохранить
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                <form
                  onSubmit={handleCreate}
                  style={{ display: "grid", gap: 14 }}
                >
                  <input
                    type="hidden"
                    name="trackId"
                    value={props.trackId}
                  />
                  <div className="form-field">
                    <label className="body-2 muted" htmlFor="wave-new-name">
                      Название
                    </label>
                    <Input
                      id="wave-new-name"
                      name="name"
                      placeholder="Wave 2, Spring 2026…"
                      required
                      autoFocus
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 8,
                      paddingTop: 8,
                      borderTop: "1px solid var(--surface-border)",
                    }}
                  >
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={close}
                    >
                      Отмена
                    </Button>
                    <Button type="submit" size="sm" disabled={isPending}>
                      Создать
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
