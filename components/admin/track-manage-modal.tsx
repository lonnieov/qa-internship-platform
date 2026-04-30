"use client";

import { useState } from "react";
import { Eye, EyeOff, MoreHorizontal, Trash2, X } from "lucide-react";
import {
  deleteTrackAction,
  toggleTrackAction,
  updateTrackAction,
} from "@/actions/admin";
import {
  getQuestionTrackMeta,
  type TrackSummary,
} from "@/lib/question-classification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TrackManageModalProps = {
  track: TrackSummary & { questionCount: number };
};

export function TrackManageModal({ track }: TrackManageModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const meta = getQuestionTrackMeta(track);
  const canDelete = track.questionCount === 0;

  return (
    <>
      <button
        aria-label={`Управлять треком ${track.name}`}
        className="track-manage-trigger"
        type="button"
        onClick={() => setIsOpen(true)}
      >
        <MoreHorizontal size={18} />
      </button>

      {isOpen ? (
        <div
          aria-labelledby={`track-modal-title-${track.id}`}
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="track-modal surface"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 className="head-3 m-0" id={`track-modal-title-${track.id}`}>
                  Редактировать трек
                </h2>
                <p className="track-modal-meta body-2 muted m-0">
                  <span className={meta.dotClassName} /> {track.questionCount}{" "}
                  вопросов
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

            <div className="track-modal-body">
              <form action={updateTrackAction} className="track-modal-form">
                <input type="hidden" name="trackId" value={track.id ?? ""} />
                <div className="track-modal-fields">
                  <div className="form-field">
                    <label
                      className="body-2 muted"
                      htmlFor={`track-name-${track.id}`}
                    >
                      Название
                    </label>
                    <Input
                      id={`track-name-${track.id}`}
                      name="name"
                      defaultValue={track.name}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label
                      className="body-2 muted"
                      htmlFor={`track-order-${track.id}`}
                    >
                      Порядок
                    </label>
                    <Input
                      id={`track-order-${track.id}`}
                      name="order"
                      type="number"
                      min="0"
                      defaultValue={track.order ?? 0}
                      required
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <Button type="submit">Сохранить</Button>
                </div>
              </form>

              <div className="track-modal-danger-zone">
                <div>
                  <strong>Статус и удаление</strong>
                  <p className="body-2 muted m-0">
                    Скрытый трек не предлагается при создании новых вопросов.
                  </p>
                </div>
                <div className="track-modal-actions">
                  <form action={toggleTrackAction}>
                    <input
                      type="hidden"
                      name="trackId"
                      value={track.id ?? ""}
                    />
                    <input
                      type="hidden"
                      name="isActive"
                      value={String(track.isActive)}
                    />
                    <Button type="submit" variant="secondary">
                      {track.isActive ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                      {track.isActive ? "Скрыть" : "Активировать"}
                    </Button>
                  </form>
                  <form action={deleteTrackAction}>
                    <input
                      type="hidden"
                      name="trackId"
                      value={track.id ?? ""}
                    />
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={!canDelete}
                      title={
                        canDelete
                          ? "Удалить трек"
                          : "Сначала переместите или удалите вопросы"
                      }
                    >
                      <Trash2 size={16} />
                      Удалить
                    </Button>
                  </form>
                </div>
                {!canDelete ? (
                  <p className="body-2 muted m-0">
                    Трек можно удалить только после переноса или удаления всех
                    вопросов.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
