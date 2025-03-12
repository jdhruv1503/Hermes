"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [formState, setFormState] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { success, error } = await login(formState.username, formState.password);
      
      if (success) {
        router.push("/dashboard");
      } else {
        toast.error(error, {
          description: "Please check your credentials and try again.",
          duration: 4000,
          icon: <AlertCircle className="h-5 w-5" />,
        });
      }
    } catch (err) {
      toast.error("Login Failed", {
        description: "An unexpected error occurred. Please try again.",
        duration: 4000,
        icon: <AlertCircle className="h-5 w-5" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <Dialog defaultOpen={true} open={true}>
        <DialogContent className="[&>button]:hidden w-full max-w-sm">
          <div className="flex justify-center">
            <Logo className="mx-auto" />
          </div>
          
          <DialogHeader className="pt-8 pb-4">
            <DialogTitle >Login</DialogTitle>
            <DialogDescription>
              Please login to continue using the application.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-6" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                required
                id="username"
                name="username"
                value={formState.username}
                onChange={handleInputChange}
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                required
                id="password"
                name="password"
                value={formState.password}
                onChange={handleInputChange}
                type="password"
                placeholder="••••••••••"
                autoComplete="current-password"
              />
            </div>
            <DialogFooter className="mt-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
