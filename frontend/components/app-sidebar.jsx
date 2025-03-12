"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { NavUser } from "@/components/nav-user";
import { Sidebar } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { LayoutDashboard, BarChart3, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: FileText,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function AppSidebar({ className, ...props }) {
  const pathname = usePathname();

  return (
    <Sidebar variant="floating" className={className} {...props}>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="p-6">
          <Logo />
        </div>
        <Separator />
        
        {/* Navigation */}
        <div className="flex-1 overflow-auto py-2">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight">
              Navigation
            </h2>
            <div className="space-y-1">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "transparent hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {item.icon && <item.icon className="h-5 w-5" />}
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* User profile and logout */}
        <NavUser />
      </div>
    </Sidebar>
  );
}
