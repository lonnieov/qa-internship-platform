import { updateSettingsAction } from "@/actions/admin";
import { getSettings } from "@/lib/assessment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <main className="page page-narrow stack-lg">
      <div>
        <h1 className="head-1">Настройки тестирования</h1>
        <p className="body-1 muted m-0">
          Лимит применяется к новым попыткам. Проходной балл зафиксирован на 100%.
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
            <div className="soft-panel">
              <strong>Проходной балл: {settings.passingScore}%</strong>
              <p className="body-2 muted m-0">
                Любая ошибка делает попытку непроходной, потому что вопросы
                однозначные и простые.
              </p>
            </div>
            <Button type="submit">Сохранить</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
