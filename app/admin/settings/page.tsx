import { updateSettingsAction } from "@/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/assessment";
import { seedAdminEmail } from "@/lib/admin-constants";
import { prisma } from "@/lib/prisma";
import { AdminCreateForm } from "@/components/admin/admin-create-form";
import { AdminManageModal } from "@/components/admin/admin-manage-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function AdminSettingsPage() {
  const currentAdmin = await requireAdmin();
  const [settings, admins] = await Promise.all([
    getSettings(),
    prisma.profile.findMany({
      where: {
        role: "ADMIN",
        passwordHash: { not: null },
        email: { not: seedAdminEmail },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <main className="page page-narrow stack-lg">
      <div>
        <h1 className="head-1">Настройки</h1>
        <p className="body-1 muted m-0">
          Лимит применяется к новым попыткам. Результат считается как процент
          верных ответов.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Общее время</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateSettingsAction} className="form-grid">
            <div className="form-grid">
              <Label htmlFor="totalTimeMinutes">Минут на весь тест</Label>
              <Input
                id="totalTimeMinutes"
                name="totalTimeMinutes"
                type="number"
                min="1"
                max="240"
                defaultValue={settings.totalTimeMinutes}
              />
            </div>
            <Button type="submit">Сохранить</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Администраторы</CardTitle>
        </CardHeader>
        <CardContent className="stack">
          <AdminCreateForm />
          <div className="table-wrap">
            <table className="table admins-table">
              <thead>
                <tr>
                  <th>Администратор</th>
                  <th>Email</th>
                  <th>Создан</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => {
                  const isCurrent = admin.id === currentAdmin.id;

                  return (
                    <tr key={admin.id}>
                      <td>
                        <div className="stack-xs">
                          <span>
                            {[admin.firstName, admin.lastName]
                              .filter(Boolean)
                              .join(" ") || "Без имени"}
                          </span>
                          {isCurrent ? (
                            <span className="type-chip">текущий</span>
                          ) : null}
                        </div>
                      </td>
                      <td>{admin.email}</td>
                      <td>
                        {admin.createdAt.toLocaleDateString("ru-RU", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <AdminManageModal
                          admin={{
                            ...admin,
                            isSeed: false,
                            isCurrent,
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
