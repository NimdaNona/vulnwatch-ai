"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldIcon,
  ScanIcon,
  SettingsIcon,
  LogOutIcon,
  HomeIcon,
  CreditCardIcon,
  ChevronDownIcon,
} from "lucide-react";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: HomeIcon },
    { name: "Scans", href: "/dashboard/scans", icon: ScanIcon },
    { name: "Vulnerabilities", href: "/dashboard/vulnerabilities", icon: ShieldIcon },
    { name: "Billing", href: "/dashboard/billing", icon: CreditCardIcon },
    { name: "Settings", href: "/dashboard/settings", icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-black/50 backdrop-blur-lg border-r border-gray-800">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6">
            <Link href="/" className="flex items-center space-x-2">
              <ShieldIcon className="w-8 h-8 text-neon-green" />
              <span className="text-xl font-bold text-white">VulnWatch</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 pb-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-300 hover:bg-gray-900/50 hover:text-white transition-colors group"
                >
                  <Icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-neon-green transition-colors" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-800">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg text-gray-300 hover:bg-gray-900/50 hover:text-white transition-colors"
              >
                <div className="flex-1 text-left">
                  <p className="text-white">{user?.name || user?.email}</p>
                  <p className="text-xs text-gray-400">
                    {user?.subscriptionPlan || "Free"} Plan
                  </p>
                </div>
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </button>

              {showUserMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-900 rounded-lg shadow-lg border border-gray-800 overflow-hidden">
                  <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    <LogOutIcon className="mr-3 h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}