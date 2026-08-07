import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LocaleNotFound() {
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
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Страница не найдена</h1>
      <p style={{ maxWidth: "28rem", opacity: 0.75 }}>
        Запрошенная страница не существует или была перемещена.
      </p>
      <Button asChild>
        <Link href="/">На главную</Link>
      </Button>
    </div>
  );
}
