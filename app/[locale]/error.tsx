"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error to the server logs / monitoring without leaking
    // internals to the user-facing UI below.
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Что-то пошло не так</h1>
      <p style={{ maxWidth: "28rem", opacity: 0.75 }}>
        Произошла непредвиденная ошибка. Попробуйте повторить действие.
      </p>
      <Button onClick={reset}>Повторить</Button>
    </div>
  );
}
