"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Suggestion = {
  text: string;
  options: string[];
  correctIndex: number;
};

export function AiQuestionGenerator() {
  const [topic, setTopic] = useState("QA теория для стажёров");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/openai/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Не удалось получить предложения.");
      return;
    }

    setItems(data.questions ?? []);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI-подсказки вопросов</CardTitle>
      </CardHeader>
      <CardContent className="stack">
        <div className="form-grid">
          <Label htmlFor="topic">Тема</Label>
          <Input
            id="topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          />
        </div>
        <Button type="button" variant="secondary" onClick={generate} disabled={loading}>
          <Sparkles size={18} />
          Сгенерировать варианты
        </Button>
        {message ? <p className="body-2 muted m-0">{message}</p> : null}
        <div className="stack">
          {items.map((item, index) => (
            <div className="soft-panel stack" key={`${item.text}-${index}`}>
              <strong>{item.text}</strong>
              <ol className="m-0 pl-5 body-2">
                {item.options.map((option, optionIndex) => (
                  <li key={option}>
                    {option}
                    {optionIndex === item.correctIndex ? " - верный" : ""}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
