import Link from "next/link";
import { DemoAdminLoginForm } from "@/components/admin/demo-admin-login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSignInPage() {
  return (
    <main className="page page-narrow stack-lg">
      <div className="metric">
        <div className="brand">
          <span className="brand-mark">A</span>
          Admin access
        </div>
        <ThemeToggle />
      </div>
      <div className="stack">
        <h1 className="head-1">Вход администратора</h1>
        <p className="body-1 muted">
          Локальный вход администратора не зависит от Clerk и не пересекается
          со входом стажёра по токену.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Demo credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <DemoAdminLoginForm />
        </CardContent>
      </Card>
      <Link className="body-2 muted" href="/sign-in/intern">
        Перейти ко входу стажёра
      </Link>
    </main>
  );
}
