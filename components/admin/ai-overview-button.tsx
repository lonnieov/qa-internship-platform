"use client";

import { useEffect, useState } from "react";
import { Bot, Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type AiOverviewResponse = {
  overview?: string;
  model?: string;
  generatedAt?: string;
  error?: string;
};

export function AiOverviewButton({ attemptId }: { attemptId: string }) {
  const t = useTranslations("AdminAttemptReport.aiOverview");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [overview, setOverview] = useState("");
  const [meta, setMeta] = useState<{ model?: string; generatedAt?: string }>(
    {},
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  function handleGenerate() {
    setError("");
    setIsOpen(true);
    setIsLoading(true);

    void (async () => {
      const response = await fetch(
        `/api/admin/attempts/${attemptId}/ai-overview`,
        {
          method: "POST",
        },
      );
      const data = (await response.json()) as AiOverviewResponse;

      if (!response.ok) {
        throw new Error(data.error || t("error"));
      }

      setOverview(data.overview || "");
      setMeta({ model: data.model, generatedAt: data.generatedAt });
    })()
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error ? requestError.message : t("error"),
        );
      })
      .finally(() => setIsLoading(false));
  }

  return (
    <>
      <Button
        className="print-hidden"
        disabled={isLoading}
        onClick={handleGenerate}
        type="button"
        variant="secondary"
      >
        {isLoading ? <Loader2 className="spin" size={18} /> : <Bot size={18} />}
        {t("button")}
      </Button>

      {isOpen ? (
        <div
          aria-labelledby="ai-overview-title"
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
          onClick={() => setIsOpen(false)}
        >
          <section
            className="ai-overview-modal surface"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 className="head-3 m-0" id="ai-overview-title">
                  {t("title")}
                </h2>
                <p className="body-2 muted m-0">
                  {meta.model
                    ? t("meta", { model: meta.model })
                    : t("description")}
                </p>
              </div>
              <Button
                aria-label={t("close")}
                onClick={() => setIsOpen(false)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X size={18} />
              </Button>
            </div>

            <div className="ai-overview-body">
              {isLoading ? (
                <div className="ai-overview-loading">
                  <Loader2 className="spin" size={22} />
                  <span>{t("loading")}</span>
                </div>
              ) : error ? (
                <div className="ai-overview-error">{error}</div>
              ) : overview ? (
                <pre className="ai-overview-text">{overview}</pre>
              ) : (
                <p className="body-1 muted m-0">{t("empty")}</p>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
