"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "../actions";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/jobs", label: "Job listings" },
  { href: "/admin/leads", label: "Contact leads" },
  { href: "/admin/settings", label: "Website settings" },
];

function isCurrent(pathname, href) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

export default function AdminFrame({ children, title }) {
  const pathname = usePathname();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <p className="admin-brand">AeroCareer Hub<span>Admin</span></p>
        <nav aria-label="Admin">
          {LINKS.map((link) => (
            <Link aria-current={isCurrent(pathname, link.href) ? "page" : undefined} href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-end">
          <a href="/" rel="noreferrer" target="_blank">View website</a>
          <a href="/contact" rel="noreferrer" target="_blank">View contact form</a>
          <form action={logoutAction}>
            <button type="submit">Sign out</button>
          </form>
        </div>
      </aside>
      <div className="admin-content">
        <h1>{title}</h1>
        {children}
      </div>
    </div>
  );
}
