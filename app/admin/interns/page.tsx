import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { decryptInviteCode } from "@/lib/security";
import { formatPercent } from "@/lib/utils";
import {
  InternCandidateTable,
  type CandidateRow,
} from "@/components/admin/intern-candidate-table";
import { InvitationCreateModal } from "@/components/admin/invitation-create-modal";
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

function normalizeName(value: string) {
  return value.trim().toLowerCase();
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
      take: 200,
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

  const matchedInvitationIds = new Set<string>();
  const rows: CandidateRow[] = interns.map((intern) => {
    const normalizedFullName = normalizeName(intern.fullName);
    const internInvitations = invitations.filter((invitation) => {
      return (
        invitation.id === intern.invitationId ||
        invitation.acceptedByProfileId === intern.profileId ||
        normalizeName(invitation.candidateName) === normalizedFullName
      );
    });

    internInvitations.forEach((invitation) =>
      matchedInvitationIds.add(invitation.id),
    );

    const latest = intern.attempts.find(
      (attempt) => attempt.status !== "IN_PROGRESS",
    );
    const activeAttempt = intern.attempts.find(
      (attempt) => attempt.status === "IN_PROGRESS",
    );
    const latestInvitation = internInvitations[0];

    return {
      id: `profile-${intern.id}`,
      name: intern.fullName,
      kind: "profile",
      internProfileId: intern.id,
      accessLabel: activeAttempt
        ? "идёт попытка"
        : (latestInvitation?.status ?? "профиль"),
      attemptLabel: activeAttempt
        ? "идёт попытка"
        : formatDateTime(latest?.submittedAt),
      resultLabel: latest ? formatPercent(latest.scorePercent) : "нет попыток",
      badgeVariant: activeAttempt ? "warning" : "success",
      invitations: internInvitations.map((invitation) => ({
        id: invitation.id,
        candidateName: invitation.candidateName,
        inviteCodeMask: invitation.inviteCodeMask ?? "••••",
        inviteCodeCopyValue: decryptInviteCode(invitation.inviteCodeEncrypted),
        status: invitation.status,
        createdAt: formatDateTime(invitation.createdAt),
        acceptedAt: formatDateTime(invitation.acceptedAt),
        canRevoke: invitation.status === "PENDING",
      })),
      attempts: intern.attempts.map((attempt) => ({
        id: attempt.id,
        status: attempt.status,
        startedAt: formatDateTime(attempt.startedAt),
        submittedAt: formatDateTime(attempt.submittedAt),
        scorePercent:
          attempt.status === "IN_PROGRESS"
            ? "—"
            : formatPercent(attempt.scorePercent),
        hasResult: attempt.status !== "IN_PROGRESS",
      })),
    };
  });

  const pendingInvitationGroups = new Map<string, typeof invitations>();
  invitations
    .filter((invitation) => !matchedInvitationIds.has(invitation.id))
    .filter((invitation) =>
      internSearch
        ? normalizeName(invitation.candidateName).includes(
            normalizeName(internSearch),
          )
        : true,
    )
    .forEach((invitation) => {
      const key = normalizeName(invitation.candidateName);
      const group = pendingInvitationGroups.get(key) ?? [];
      group.push(invitation);
      pendingInvitationGroups.set(key, group);
    });

  for (const [name, group] of pendingInvitationGroups) {
    const latestInvitation = group[0];
    rows.push({
      id: `invitation-${name}`,
      name: latestInvitation.candidateName,
      kind: "invitation",
      internProfileId: null,
      accessLabel: latestInvitation.status,
      attemptLabel: "профиль не создан",
      resultLabel: "—",
      badgeVariant:
        latestInvitation.status === "REVOKED"
          ? "danger"
          : latestInvitation.status === "PENDING"
            ? "default"
            : "success",
      invitations: group.map((invitation) => ({
        id: invitation.id,
        candidateName: invitation.candidateName,
        inviteCodeMask: invitation.inviteCodeMask ?? "••••",
        inviteCodeCopyValue: decryptInviteCode(invitation.inviteCodeEncrypted),
        status: invitation.status,
        createdAt: formatDateTime(invitation.createdAt),
        acceptedAt: formatDateTime(invitation.acceptedAt),
        canRevoke: invitation.status === "PENDING",
      })),
      attempts: [],
    });
  }

  return (
    <main className="page stack-lg">
      <div className="page-header">
        <div>
          <h1 className="head-1">Стажёры и доступы</h1>
          <p className="body-1 muted m-0">
            Токен хранится в базе только в виде SHA-256 хэша.
          </p>
        </div>
        <InvitationCreateModal />
      </div>

      <Card>
        <CardHeader className="intern-profiles-header">
          <div>
            <CardTitle>Список стажёров</CardTitle>
            <p className="body-2 muted m-0">
              {internSearch
                ? `Поиск по ФИО: ${internSearch}`
                : "Новые стажёры появляются здесь сразу после создания."}
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
          <InternCandidateTable rows={rows} />
        </CardContent>
      </Card>
    </main>
  );
}
