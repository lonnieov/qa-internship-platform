"use client";

import { useId, useState, useTransition } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createGradeAction,
  deleteGradeAction,
  updateGradeAction,
} from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeDialog } from "@/components/ui/native-dialog";

type Grade = {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
};

type GradeManageModalProps =
  | { mode: "create"; trackId: string }
  | { mode: "edit"; grade: Grade; canDelete: boolean };

export function GradeManageModal(props: GradeManageModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const titleId = useId();
  const nameFieldId = `${titleId}-name`;
  const orderFieldId = `${titleId}-order`;
  const isEdit = props.mode === "edit";

  const close = () => setIsOpen(false);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createGradeAction(formData);
      close();
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateGradeAction(formData);
      close();
    });
  };

  const handleDelete = () => {
    if (!isEdit) return;
    const formData = new FormData();
    formData.set("gradeId", props.grade.id);
    startTransition(async () => {
      await deleteGradeAction(formData);
      close();
    });
  };

  return (
    <>
      {isEdit ? (
        <button
          type="button"
          className="track-icon-btn"
          aria-label="Редактировать грейд"
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
          Добавить грейд
        </Button>
      )}

      <NativeDialog
        labelledBy={titleId}
        onOpenChange={setIsOpen}
        open={isOpen}
      >
          <div className="wave-modal surface">
            <div className="wave-modal-header">
              <div>
                <h2 className="head-3 m-0" id={titleId}>
                  {isEdit ? `Грейд · ${props.grade.name}` : "Новый грейд"}
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
                  <input type="hidden" name="gradeId" value={props.grade.id} />
                  <div className="form-field">
                    <label className="body-2 muted" htmlFor={nameFieldId}>
                      Название
                    </label>
                    <Input
                      id={nameFieldId}
                      name="name"
                      defaultValue={props.grade.name}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label className="body-2 muted" htmlFor={orderFieldId}>
                      Порядок сортировки
                    </label>
                    <Input
                      id={orderFieldId}
                      name="order"
                      type="number"
                      min="0"
                      defaultValue={props.grade.order}
                      style={{ width: 120 }}
                    />
                  </div>
                  <label className="wave-active-toggle">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={props.grade.isActive}
                    />
                    <span className="body-1">Грейд активен</span>
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
                    <label className="body-2 muted" htmlFor={nameFieldId}>
                      Название
                    </label>
                    <Input
                      id={nameFieldId}
                      name="name"
                      placeholder="Junior, Middle, Senior…"
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
      </NativeDialog>
    </>
  );
}
