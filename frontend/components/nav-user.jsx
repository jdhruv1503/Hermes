import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";

export function NavUser() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      // Logout is handled in the auth context
    } catch (error) {
      console.error("Error logging out:", error);
      router.push("/");
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div className="text-sm">
          <div className="font-medium">{user.username}</div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        <span className="sr-only">Log out</span>
      </Button>
    </div>
  );
} 