import { prisma } from "@/lib/prisma";
import { decryptInviteCode } from "@/lib/security";
import { formatPercent } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import { isLocale, routing, type Locale } from "@/i18n/routing";
import {
  InternCandidateTable,
  type CandidateRow,
} from "@/components/admin/intern-candidate-table";
import { InternSearchForm } from "@/components/admin/intern-search-form";
import { InvitationCreateModal } from "@/components/admin/invitation-create-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDateTime(value: Date | null | undefined, locale: Locale) {
  if (!value) return "—";

  return value.toLocaleString(locale === "uz" ? "uz-UZ" : "ru-RU", {
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
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = isLocale(localeParam) ? localeParam : routing.defaultLocale;
  const t = await getTranslations("AdminInterns");
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
        ? "IN_PROGRESS"
        : (latestInvitation?.status ?? "profile"),
      attemptLabel: activeAttempt
        ? t("status.IN_PROGRESS")
        : formatDateTime(latest?.submittedAt, locale),
      resultLabel: latest
        ? formatPercent(latest.scorePercent)
        : t("noAttemptsShort"),
      createdAtSort:
        latestInvitation?.createdAt.getTime() ?? intern.createdAt.getTime(),
      attemptAtSort:
        activeAttempt?.startedAt.getTime() ??
        latest?.submittedAt?.getTime() ??
        0,
      resultSort: latest?.scorePercent ?? null,
      badgeVariant: activeAttempt ? "warning" : "success",
      invitations: internInvitations.map((invitation) => ({
        id: invitation.id,
        candidateName: invitation.candidateName,
        inviteCodeMask: invitation.inviteCodeMask ?? "••••",
        inviteCodeCopyValue: decryptInviteCode(invitation.inviteCodeEncrypted),
        status: invitation.status,
        createdAt: formatDateTime(invitation.createdAt, locale),
        acceptedAt: formatDateTime(invitation.acceptedAt, locale),
        canRevoke: invitation.status === "PENDING",
      })),
      attempts: intern.attempts.map((attempt) => ({
        id: attempt.id,
        status: attempt.status,
        startedAt: formatDateTime(attempt.startedAt, locale),
        submittedAt: formatDateTime(attempt.submittedAt, locale),
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
      attemptLabel: t("noProfile"),
      resultLabel: "—",
      createdAtSort: latestInvitation.createdAt.getTime(),
      attemptAtSort: 0,
      resultSort: null,
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
        createdAt: formatDateTime(invitation.createdAt, locale),
        acceptedAt: formatDateTime(invitation.acceptedAt, locale),
        canRevoke: invitation.status === "PENDING",
      })),
      attempts: [],
    });
  }

  rows.sort((left, right) => right.createdAtSort - left.createdAtSort);

  return (
    <main className="page stack-lg admin-interns-page">
      <div className="page-header">
        <div>
          <h1 className="head-1">{t("pageTitle")}</h1>
          <p className="body-1 muted m-0">
            {t("pageDescription")}
          </p>
        </div>
        <InvitationCreateModal />
      </div>

      <Card className="admin-interns-card">
        <CardHeader className="intern-profiles-header">
          <div>
            <CardTitle>{t("listTitle")}</CardTitle>
            <p className="body-2 muted m-0">
              {internSearch
                ? t("searchActive", { query: internSearch })
                : t("searchIdle")}
            </p>
          </div>
          <InternSearchForm key={internSearch} initialQuery={internSearch} />
        </CardHeader>
        <CardContent className="admin-interns-card-content">
          <InternCandidateTable key={internSearch} rows={rows} />
        </CardContent>
      </Card>
    </main>
  );
}
