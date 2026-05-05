import { LogOut, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const initial = (user?.name || user?.email || "U").slice(0, 1).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="h-9 w-9 rounded-full grid place-items-center text-sm font-medium border border-border bg-[hsl(var(--bg-secondary))] hover:bg-[hsl(var(--bg-hover))] transition text-[hsl(var(--ink-primary))]"
            aria-label="Account menu"
          >
            {initial}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[220px]">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">
              {user?.name || "Signed in"}
            </span>
            <span className="text-xs text-[hsl(var(--ink-secondary))] truncate">{user?.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <UserIcon className="w-4 h-4 mr-2" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOut()} className="text-[hsl(var(--destructive))]">
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
