import Link from "next/link";
import { FileText, Search } from "lucide-react";
import { revokeInvitationAction } from "@/actions/admin";
import { prisma } from "@/lib/prisma";
import { formatPercent } from "@/lib/utils";
import { InvitationForm } from "@/components/admin/invitation-form";
import { RetakeInvitationForm } from "@/components/admin/retake-invitation-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";

  return value.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminInternsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const internSearch = String(q ?? "").trim();

  const [invitations, interns] = await Promise.all([
    prisma.invitation.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { acceptedByProfile: true },
    }),
    prisma.internProfile.findMany({
      where: internSearch
        ? {
            fullName: {
              contains: internSearch,
              mode: "insensitive",
            },
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        profile: true,
        attempts: {
          orderBy: { startedAt: "desc" },
          take: 10,
        },
      },
    }),
  ]);

  return (
    <main className="page stack-lg">
      <div className="page-header">
        <div>
          <h1 className="head-1">Стажёры и доступы</h1>
          <p className="body-1 muted m-0">
            Токен хранится в базе только в виде SHA-256 хэша.
          </p>
        </div>
      </div>

      <section className="grid-2 interns-layout">
        <InvitationForm />

        <Card>
          <CardHeader>
            <CardTitle>Последние токены</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Кандидат</th>
                    <th>Статус</th>
                    <th>Действует до</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((invitation) => (
                    <tr key={invitation.id}>
                      <td>{invitation.candidateName}</td>
                      <td>
                        <Badge
                          variant={
                            invitation.status === "ACCEPTED" ||
                            invitation.status === "COMPLETED"
                              ? "success"
                              : invitation.status === "REVOKED"
                                ? "danger"
                                : "default"
                          }
                        >
                          {invitation.status}
                        </Badge>
                      </td>
                      <td>
                        {invitation.expiresAt
                          ? invitation.expiresAt.toLocaleDateString("ru-RU")
                          : "без срока"}
                      </td>
                      <td>
                        {invitation.status === "PENDING" ? (
                          <form action={revokeInvitationAction}>
                            <input
                              type="hidden"
                              name="invitationId"
                              value={invitation.id}
                            />
                            <Button size="sm" variant="outline" type="submit">
                              Отозвать
                            </Button>
                          </form>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="intern-profiles-header">
          <div>
            <CardTitle>Профили стажёров</CardTitle>
            <p className="body-2 muted m-0">
              {internSearch
                ? `Поиск по ФИО: ${internSearch}`
                : "Поиск работает по полному имени стажёра."}
            </p>
          </div>
          <form className="intern-search-form" action="/admin/interns">
            <Input
              aria-label="Поиск по ФИО"
              defaultValue={internSearch}
              name="q"
              placeholder="Поиск по ФИО"
              type="search"
            />
            <Button className="intern-search-button" type="submit">
              <Search size={16} />
              Найти
            </Button>
            {internSearch ? (
              <Button variant="outline" type="button" asChild>
                <Link href="/admin/interns">Сбросить</Link>
              </Button>
            ) : null}
          </form>
        </CardHeader>
        <CardContent>
          {interns.length > 0 ? (
            <div className="table-wrap">
              <table className="table interns-table">
                <thead>
                  <tr>
                    <th>Стажёр</th>
                    <th>Прошёл тест</th>
                    <th>Итоговый результат</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {interns.map((intern) => {
                    const latest = intern.attempts.find(
                      (attempt) => attempt.status !== "IN_PROGRESS",
                    );
                    const activeAttempt = intern.attempts.find(
                      (attempt) => attempt.status === "IN_PROGRESS",
                    );
                    return (
                      <tr key={intern.id}>
                        <td>{intern.fullName}</td>
                        <td>{formatDateTime(latest?.submittedAt)}</td>
                        <td>
                          {latest
                            ? formatPercent(latest.scorePercent)
                            : "нет попыток"}
                        </td>
                        <td className="intern-actions-cell">
                          <div className="intern-actions">
                            <div className="intern-actions-buttons">
                              {latest ? (
                                <Button
                                  className="intern-action-button intern-action-result"
                                  size="sm"
                                  variant="outline"
                                  asChild
                                >
                                  <Link href={`/admin/attempts/${latest.id}`}>
                                    <FileText size={15} />
                                    Результат
                                  </Link>
                                </Button>
                              ) : null}
                              <RetakeInvitationForm
                                internProfileId={intern.id}
                              />
                            </div>
                            {activeAttempt ? (
                              <Badge variant="warning">идёт попытка</Badge>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <strong>Стажёры не найдены</strong>
              <p className="body-2 muted m-0">
                Попробуйте изменить ФИО или сбросить поиск.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
