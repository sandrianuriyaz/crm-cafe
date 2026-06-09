import { CircleUserRound, Menu } from "lucide-react";

export function TopAppBar() {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between bg-background px-5">
      <button
        type="button"
        aria-label="Buka menu"
        className="flex cursor-pointer items-center justify-center text-foreground transition-opacity hover:opacity-80"
      >
        <Menu className="size-6" aria-hidden="true" />
      </button>
      <div className="flex-1 text-center font-heading text-lg font-semibold uppercase tracking-wider text-foreground">
        POLKS Group
      </div>
      <button
        type="button"
        aria-label="Akun saya"
        className="flex cursor-pointer items-center justify-center text-foreground transition-opacity hover:opacity-80"
      >
        <CircleUserRound className="size-6" aria-hidden="true" />
      </button>
    </header>
  );
}
