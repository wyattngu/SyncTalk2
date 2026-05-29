"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

interface NavLinkProps {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}

function NavLink({ href, icon, label, active }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
          : "text-muted-foreground hover:bg-surface-container-low hover:text-foreground"
      }`}
    >
      <span
        className={`material-symbols-outlined text-[20px] ${active ? "icon-fill" : ""}`}
      >
        {icon}
      </span>
      {label}
    </Link>
  );
}

export function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname?.startsWith(path);

  function handleCompose() {
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }
    router.push("/threads/new");
  }

  return (
    <nav className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-card px-4 py-6">
      {/* Workspace header */}
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <span className="material-symbols-outlined text-[20px]">domain</span>
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold leading-tight text-foreground font-display">
            SyncTalk HQ
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            Internal Workspace
          </p>
        </div>
      </div>

      {/* Compose CTA */}
      <button
        onClick={handleCompose}
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        <span className="material-symbols-outlined icon-fill text-[20px]">
          edit
        </span>
        Compose
      </button>

      {/* Main nav */}
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
        <NavLink href="/" icon="grid_view" label="Dashboard" active={isActive("/")} />
        <NavLink
          href="/chat"
          icon="chat_bubble"
          label="Messages"
          active={isActive("/chat")}
        />
        <NavLink
          href="/friends"
          icon="group"
          label="Friends"
          active={isActive("/friends")}
        />
      </div>

      {/* Footer — support only; profile + sign out are in the avatar dropdown */}
      <div className="mt-auto flex flex-col gap-1 border-t border-border pt-4">
        <a
          href="https://github.com/wyattngu/SyncTalk2/issues"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-container-low hover:text-foreground"
        >
          <span className="material-symbols-outlined text-[20px]">help_outline</span>
          Support
        </a>
      </div>
    </nav>
  );
}
