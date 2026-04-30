"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { useState } from "react";

type AuthRole = "intern" | "admin";

const roleLinks: Array<{ href: string; label: string; role: AuthRole }> = [
  { href: "/sign-in/intern", label: "Стажёр", role: "intern" },
  { href: "/sign-in/admin", label: "Администратор", role: "admin" },
];

export function AuthRoleTabs({ activeRole }: { activeRole: AuthRole }) {
  const router = useRouter();
  const [pendingRole, setPendingRole] = useState<AuthRole | null>(null);
  const visibleRole = pendingRole ?? activeRole;

  function switchRole(
    event: MouseEvent<HTMLAnchorElement>,
    targetRole: AuthRole,
    href: string,
  ) {
    if (
      targetRole === activeRole ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    setPendingRole(targetRole);

    window.setTimeout(() => {
      router.push(href);
    }, 180);
  }

  return (
    <div
      className={`auth-tabs auth-tabs-${visibleRole} ${pendingRole ? "is-switching" : ""}`}
      data-active-role={visibleRole}
    >
      {roleLinks.map((link) => (
        <Link
          aria-current={activeRole === link.role ? "page" : undefined}
          className={activeRole === link.role ? "active" : undefined}
          href={link.href}
          key={link.role}
          onClick={(event) => switchRole(event, link.role, link.href)}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
