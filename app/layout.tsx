import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QA Internship Validator",
  description: "Assessment platform for QA internship candidates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('theme');
                const theme = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.dataset.theme = theme;
                document.documentElement.style.colorScheme = theme;
              } catch {}
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
