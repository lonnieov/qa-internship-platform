"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
          Произошла ошибка
        </h1>
        <p style={{ maxWidth: "28rem", opacity: 0.75 }}>
          Попробуйте перезагрузить страницу.
        </p>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 8,
            border: "1px solid currentColor",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          Повторить
        </button>
      </body>
    </html>
  );
}
