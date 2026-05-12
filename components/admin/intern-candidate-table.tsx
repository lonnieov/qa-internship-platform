"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock3, FileText, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  createInvitationAction,
  revokeInvitationAction,
  type InvitationState,
} from "@/actions/admin";
import { CopyableToken } from "@/components/admin/copyable-token";
import { RetakeInvitationForm } from "@/components/admin/retake-invitation-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type BadgeVariant = "default" | "success" | "warning" | "danger";
type SortKey = "created" | "name" | "access" | "attempt" | "result";
type SortDirection = "asc" | "desc";

const pageSize = 10;

export type CandidateInvitation = {
  id: string;
  candidateName: string;
  inviteCodeMask: string;
  inviteCodeCopyValue?: string;
  status: string;
  createdAt: string;
  acceptedAt: string;
  canRevoke: boolean;
};

export type CandidateAttempt = {
  id: string;
  status: string;
  startedAt: string;
  submittedAt: string;
  scorePercent: string;
  hasResult: boolean;
};

export type CandidateRow = {
  id: string;
  name: string;
  kind: "profile" | "invitation";
  internProfileId: string | null;
  accessLabel: string;
  attemptLabel: string;
  resultLabel: string;
  createdAtSort: number;
  attemptAtSort: number;
  resultSort: number | null;
  badgeVariant: BadgeVariant;
  invitations: CandidateInvitation[];
  attempts: CandidateAttempt[];
};

function invitationBadgeVariant(status: string): BadgeVariant {
  if (status === "PENDING" || status === "ACCEPTED") return "success";
  if (status === "REVOKED" || status === "TOKEN_EXPIRED") return "danger";
  return "default";
}

function MaskedTokenCell({ invitation }: { invitation: CandidateInvitation }) {
  const t = useTranslations("AdminInterns");
  const [copied, setCopied] = useState(false);

  async function copyToken(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (!invitation.inviteCodeCopyValue || !navigator.clipboard) return;

    await navigator.clipboard.writeText(invitation.inviteCodeCopyValue);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (!invitation.inviteCodeCopyValue) {
    return (
      <code
        className="masked-token masked-token-unavailable"
        title={t("oldTokenTitle")}
      >
        {t("oldToken")}
      </code>
    );
  }

  return (
    <button
      aria-label={t("revealCopyToken")}
      className="masked-token masked-token-reveal"
      title={t("revealCopyTitle")}
      type="button"
      onClick={copyToken}
    >
      <span className="masked-token-mask">{invitation.inviteCodeMask}</span>
      <span className="masked-token-full">{invitation.inviteCodeCopyValue}</span>
      <span className="masked-token-status">
        {copied ? t("copied") : t("copy")}
      </span>
    </button>
  );
}

const initialInvitationState: InvitationState = {
  ok: false,
  message: "",
};

function CandidateTokenForm({
  candidateName,
  onCreated,
}: {
  candidateName: string;
  onCreated?: (invitation: NonNullable<InvitationState["invitation"]>) => void;
}) {
  const t = useTranslations("AdminInterns");
  const [state, action, isPending] = useActionState(
    createInvitationAction,
    initialInvitationState,
  );
  const lastInvitationId = useRef<string | null>(null);

  useEffect(() => {
    if (!state.invitation || state.invitation.id === lastInvitationId.current) {
      return;
    }

    lastInvitationId.current = state.invitation.id;
    onCreated?.(state.invitation);
  }, [onCreated, state.invitation]);

  return (
    <div className="retake-action" aria-live="polite">
      <form action={action}>
        <input type="hidden" name="candidateName" value={candidateName} />
        <Button
          className="intern-action-button intern-action-retake"
          size="sm"
          type="submit"
          variant="outline"
          disabled={isPending}
        >
          <Clock3 size={15} />
          {state.inviteCode ? t("createMore") : t("createToken")}
        </Button>
      </form>
      {state.message ? (
        <div
          className={`retake-token-panel ${state.ok ? "success" : "danger"}`}
        >
          <div className="retake-token-header">
            <span className="retake-token-icon">
              {state.ok ? <CheckCircle2 size={16} /> : <Clock3 size={16} />}
            </span>
            <div>
              <strong>{state.ok ? t("tokenCreated") : t("failed")}</strong>
              <p className="body-2 muted m-0">{state.message}</p>
            </div>
          </div>
          {state.inviteCode ? (
            <>
              <CopyableToken token={state.inviteCode} />
              <div className="retake-token-meta">
                <Clock3 size={14} />
                <span>{t("newTokenShownOnce")}</span>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function InternCandidateTable({ rows }: { rows: CandidateRow[] }) {
  const locale = useLocale();
  const t = useTranslations("AdminInterns");
  const [localInvitations, setLocalInvitations] = useState<
    Record<string, CandidateInvitation[]>
  >({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);

  const tableRows = rows.map((row) => {
    const additions = localInvitations[row.id] ?? [];
    const existingIds = new Set(row.invitations.map((item) => item.id));
    const mergedAdditions = additions.filter((item) => !existingIds.has(item.id));

    return {
      ...row,
      invitations: [...mergedAdditions, ...row.invitations],
    };
  });
  const sortedRows = [...tableRows].sort((left, right) => {
    const direction = sortDirection === "asc" ? 1 : -1;

    if (sortKey === "created") {
      return (left.createdAtSort - right.createdAtSort) * direction;
    }

    if (sortKey === "name") {
      return left.name.localeCompare(right.name, "ru") * direction;
    }

    if (sortKey === "access") {
      return (
        t(`status.${left.accessLabel}`).localeCompare(
          t(`status.${right.accessLabel}`),
          "ru",
        ) * direction
      );
    }

    if (sortKey === "attempt") {
      return (left.attemptAtSort - right.attemptAtSort) * direction;
    }

    const leftResult = left.resultSort ?? -1;
    const rightResult = right.resultSort ?? -1;
    return (leftResult - rightResult) * direction;
  });
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = sortedRows.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );
  const selected = tableRows.find((row) => row.id === selectedId) ?? null;

  function toggleSort(nextKey: SortKey) {
    setPage(1);
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(
      nextKey === "name" || nextKey === "access" ? "asc" : "desc",
    );
  }

  function sortLabel(key: SortKey) {
    if (sortKey !== key) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  }

  function addInvitationToSelected(
    invitation: NonNullable<InvitationState["invitation"]>,
  ) {
    if (!selectedId) return;

    setLocalInvitations((current) => {
      const existing = current[selectedId] ?? [];
      if (existing.some((item) => item.id === invitation.id)) return current;

      return {
        ...current,
        [selectedId]: [invitation, ...existing],
      };
    });
  }

  if (rows.length === 0) {
    return (
      <div className="empty-state candidate-empty-state">
        <div>
          <strong>{t("emptyTitle")}</strong>
          <p className="body-2 muted m-0">
            {t("emptyDescription")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="table-wrap">
        <table className="table interns-table candidate-table">
          <thead>
            <tr>
              <th>
                <button
                  className="table-sort-button"
                  type="button"
                  onClick={() => toggleSort("name")}
                >
                  {t("table.intern")} <span>{sortLabel("name")}</span>
                </button>
              </th>
              <th>
                <button
                  className="table-sort-button"
                  type="button"
                  onClick={() => toggleSort("access")}
                >
                  {t("table.testStatus")} <span>{sortLabel("access")}</span>
                </button>
              </th>
              <th>
                <button
                  className="table-sort-button"
                  type="button"
                  onClick={() => toggleSort("attempt")}
                >
                  {t("table.latestAttempt")} <span>{sortLabel("attempt")}</span>
                </button>
              </th>
              <th>
                <button
                  className="table-sort-button"
                  type="button"
                  onClick={() => toggleSort("result")}
                >
                  {t("table.result")} <span>{sortLabel("result")}</span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr
                key={row.id}
                className="candidate-table-row"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(row.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedId(row.id);
                  }
                }}
              >
                <td>
                  <strong>{row.name}</strong>
                </td>
                <td>
                  <Badge variant={row.badgeVariant}>
                    {t(`status.${row.accessLabel}`)}
                  </Badge>
                </td>
                <td>{row.attemptLabel}</td>
                <td>{row.resultLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="candidate-pagination">
        <span>
          {sortedRows.length > 0
            ? t("pagination", {
                from: (safePage - 1) * pageSize + 1,
                to: Math.min(safePage * pageSize, sortedRows.length),
                total: sortedRows.length,
              })
            : t("paginationEmpty")}
        </span>
        <div>
          <Button
            size="sm"
            variant="outline"
            type="button"
            disabled={safePage === 1}
            onClick={() => setPage(Math.max(1, safePage - 1))}
          >
            {t("previous")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            type="button"
            disabled={safePage === pageCount}
            onClick={() => setPage(Math.min(pageCount, safePage + 1))}
          >
            {t("next")}
          </Button>
        </div>
      </div>

      {selected ? (
        <div
          aria-labelledby="candidate-details-title"
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="candidate-modal surface"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 className="head-3 m-0" id="candidate-details-title">
                  {selected.name}
                </h2>
                <p className="body-2 muted m-0">
                  {t("tokensAttemptsActions")}
                </p>
              </div>
              <Button
                aria-label={t("closeModal")}
                type="button"
                variant="ghost"
                onClick={() => setSelectedId(null)}
              >
                <X size={18} />
              </Button>
            </div>

            <div className="candidate-modal-body">
              <section className="candidate-modal-section">
                <div className="candidate-modal-section-header">
                  <div className="candidate-modal-section-title">
                    <h3 className="section-title">{t("accessTokens")}</h3>
                    <p className="body-2 muted m-0">
                      {t("tokenHoverHint")}
                    </p>
                  </div>
                  {selected.internProfileId ? (
                    <RetakeInvitationForm
                      buttonLabel={t("createToken")}
                      issuedButtonLabel={t("createMore")}
                      internProfileId={selected.internProfileId}
                      onCreated={addInvitationToSelected}
                    />
                  ) : (
                    <CandidateTokenForm
                      candidateName={selected.name}
                      onCreated={addInvitationToSelected}
                    />
                  )}
                </div>
                <div className="table-wrap">
                  <table className="table candidate-details-table">
                    <thead>
                      <tr>
                        <th>{t("table.candidate")}</th>
                        <th>{t("table.token")}</th>
                        <th>{t("table.status")}</th>
                        <th>{t("table.created")}</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {selected.invitations.map((invitation) => (
                        <tr key={invitation.id}>
                          <td>{invitation.candidateName}</td>
                          <td>
                            <MaskedTokenCell invitation={invitation} />
                          </td>
                          <td>
                            <Badge
                              variant={invitationBadgeVariant(
                                invitation.status,
                              )}
                            >
                              {t(`status.${invitation.status}`)}
                            </Badge>
                          </td>
                          <td>{invitation.createdAt}</td>
                          <td>
                            {invitation.canRevoke ? (
                              <form action={revokeInvitationAction}>
                                <input
                                  type="hidden"
                                  name="invitationId"
                                  value={invitation.id}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  type="submit"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  {t("revoke")}
                                </Button>
                              </form>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {selected.internProfileId ? (
                <section className="candidate-modal-section">
                  <div className="candidate-modal-section-header">
                    <div className="candidate-modal-section-title">
                      <h3 className="section-title">{t("attemptsResults")}</h3>
                      <p className="body-2 muted m-0">
                        {t("attemptHistory")}
                      </p>
                    </div>
                  </div>
                  {selected.attempts.length > 0 ? (
                    <div className="table-wrap">
                      <table className="table candidate-details-table">
                        <thead>
                          <tr>
                            <th>{t("table.status")}</th>
                            <th>{t("table.started")}</th>
                            <th>{t("table.submitted")}</th>
                            <th>{t("table.result")}</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {selected.attempts.map((attempt) => (
                            <tr key={attempt.id}>
                              <td>{t(`status.${attempt.status}`)}</td>
                              <td>{attempt.startedAt}</td>
                              <td>{attempt.submittedAt}</td>
                              <td>{attempt.scorePercent}</td>
                              <td>
                                {attempt.hasResult ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    asChild
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <Link
                                      href={`/${locale}/admin/attempts/${attempt.id}`}
                                    >
                                      <FileText size={15} />
                                      {t("openResult")}
                                    </Link>
                                  </Button>
                                ) : null}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <strong>{t("noAttempts")}</strong>
                      <p className="body-2 muted m-0">
                        {t("notStarted")}
                      </p>
                    </div>
                  )}
                </section>
              ) : (
                <section className="candidate-modal-section">
                  <div className="empty-state">
                    <strong>{t("profileNotCreated")}</strong>
                    <p className="body-2 muted m-0">
                      {t("profileCreatedAfterLogin")}
                    </p>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
