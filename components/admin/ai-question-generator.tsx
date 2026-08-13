"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AiQuestionSuggestion = {
  type?: "closed" | "open";
  text: string;
  options?: string[];
  correctIndex?: number;
  answer?: string;
};

export function AiQuestionGenerator({
  onPick,
}: {
  onPick?: (suggestion: AiQuestionSuggestion) => void;
}) {
  const t = useTranslations("AdminQuestions");
  const [topic, setTopic] = useState(t("ai.defaultTopic"));
  const [items, setItems] = useState<AiQuestionSuggestion[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/ai/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? t("ai.error"));
      return;
    }

    setItems(data.questions ?? []);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("ai.title")}</CardTitle>
      </CardHeader>
      <CardContent className="stack">
        <div className="form-grid">
          <Label htmlFor="topic">{t("ai.topic")}</Label>
          <Input
            id="topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          />
        </div>
        <Button type="button" variant="secondary" onClick={generate} disabled={loading}>
          {loading ? (
            <Loader2 size={18} className="ai-thinking-icon" />
          ) : (
            <Sparkles size={18} />
          )}
          {t("ai.generate")}
        </Button>
        {loading ? (
          <div className="ai-thinking body-2">
            <Loader2 size={16} className="ai-thinking-icon" />
            <span>{t("ai.generating")}</span>
            <span className="ai-thinking-dots">
              <span className="ai-thinking-dot" />
              <span className="ai-thinking-dot" />
              <span className="ai-thinking-dot" />
            </span>
          </div>
        ) : null}
        {message ? <p className="body-2 muted m-0">{message}</p> : null}
        <div className="stack">
          {items.map((item, index) => {
            const isOpen = item.type === "open" || !item.options?.length;

            return (
              <div className="soft-panel stack" key={`${item.text}-${index}`}>
                <strong>{item.text}</strong>
                {isOpen ? (
                  item.answer ? (
                    <p className="body-2 muted m-0">
                      {t("ai.openAnswerLabel")}: {item.answer}
                    </p>
                  ) : null
                ) : (
                  <ol className="m-0 pl-5 body-2">
                    {item.options!.map((option, optionIndex) => (
                      <li key={option}>
                        {option}
                        {optionIndex === item.correctIndex
                          ? ` ${t("ai.correctSuffix")}`
                          : ""}
                      </li>
                    ))}
                  </ol>
                )}
                {onPick ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onPick(item)}
                  >
                    {t("ai.useSuggestion")}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
