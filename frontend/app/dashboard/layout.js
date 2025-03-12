"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  SidebarInset, 
  SidebarProvider, 
  SidebarTrigger 
} from "@/components/ui/sidebar";

export default function DashboardLayout({ children }) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Allow a short time for auth to be checked
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // If not authenticated after loading, redirect to login
      if (!isAuthenticated) {
        router.push("/");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  // Show loading skeleton during initial check
  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        {/* Content skeleton */}
        <div className="w-full p-8">
          <div className="h-8 w-full max-w-48 mb-6">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-6">
                <Skeleton className="h-6 w-40 mb-4" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If auth check is done and still no user, don't render until redirect happens
  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          {/* <SidebarTrigger className="-ml-1" /> */}
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-xl font-semibold">Kernel Dashboard</h1>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}