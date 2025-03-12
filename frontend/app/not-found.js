"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect based on authentication status
    const timeoutId = setTimeout(() => {
      if (isAuthenticated) {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    }, 3000); // Redirect after 3 seconds

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Logo className="mb-8" />
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg text-muted-foreground mb-8 text-center">
        The page you're looking for doesn't exist or has been moved.
        <br />
        Redirecting you to {isAuthenticated ? "dashboard" : "login"}...
      </p>
      <Button
        onClick={() => router.push(isAuthenticated ? "/dashboard" : "/")}
      >
        Go to {isAuthenticated ? "Dashboard" : "Login"}
      </Button>
    </div>
  );
} 