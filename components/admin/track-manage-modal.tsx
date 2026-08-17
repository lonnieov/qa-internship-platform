"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type TrackManageModalProps = {
  track: TrackSummary & { questionCount: number };
};

export function TrackManageModal({ track }: TrackManageModalProps) {
  const t = useTranslations("AdminQuestions");
  const [isOpen, setIsOpen] = useState(false);
  const meta = getQuestionTrackMeta(track);
  const canDelete = track.questionCount === 0;

  return (
    <>
      <button
        aria-label={t("tracks.manageAria", { name: track.name })}
        className="track-manage-trigger"
        type="button"
        onClick={() => setIsOpen(true)}
      >
        <MoreHorizontal size={18} />
      </button>

      <Dialog onOpenChange={setIsOpen} open={isOpen}>
        <DialogContent variant="bare">
          <div className="track-modal surface">
            <div className="modal-header">
              <div>
                <DialogTitle className="head-3 m-0">
                  {t("tracks.manageTitle")}
                </DialogTitle>
                <DialogDescription className="track-modal-meta body-2 muted m-0">
                  <span className={meta.dotClassName} />{" "}
                  {t("tracks.questionsCount", { count: track.questionCount })}
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

            <div className="track-modal-body">
              <form action={updateTrackAction} className="track-modal-form">
                <input type="hidden" name="trackId" value={track.id ?? ""} />
                <div className="track-modal-fields">
                  <div className="form-field">
                    <label
                      className="body-2 muted"
                      htmlFor={`track-name-${track.id}`}
                    >
                      {t("tracks.name")}
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
                      {t("tracks.order")}
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
                  <Button type="submit">{t("save")}</Button>
                </div>
              </form>

              <div className="track-modal-danger-zone">
                <div>
                  <strong>{t("tracks.statusDeleteTitle")}</strong>
                  <p className="body-2 muted m-0">
                    {t("tracks.statusDeleteDescription")}
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
                      {track.isActive ? t("hide") : t("activate")}
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
                          ? t("tracks.deleteTitle")
                          : t("tracks.deleteBlockedTitle")
                      }
                    >
                      <Trash2 size={16} />
                      {t("delete")}
                    </Button>
                  </form>
                </div>
                {!canDelete ? (
                  <p className="body-2 muted m-0">
                    {t("tracks.deleteBlockedDescription")}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
