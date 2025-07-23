"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { 
  PlusIcon, 
  ScanIcon, 
  ShieldIcon, 
  ClockIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScanning(true);
    // TODO: Implement domain scanning
    setTimeout(() => {
      setIsScanning(false);
      setDomain("");
    }, 2000);
  };

  // Mock data for demonstration
  const stats = {
    totalScans: 0,
    vulnerabilities: 0,
    lastScan: "Never",
    securityScore: 100,
  };

  const recentScans = [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">
          Welcome back, {user.name || user.email}
        </p>
        <div className="mt-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-neon-green/10 text-neon-green border border-neon-green/20">
            {user.subscriptionPlan || "Free"} Plan
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-black/50 backdrop-blur-lg border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Scans</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalScans}</p>
            </div>
            <ScanIcon className="w-8 h-8 text-neon-green opacity-50" />
          </div>
        </Card>

        <Card className="bg-black/50 backdrop-blur-lg border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Vulnerabilities Found</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.vulnerabilities}</p>
            </div>
            <AlertTriangleIcon className="w-8 h-8 text-yellow-500 opacity-50" />
          </div>
        </Card>

        <Card className="bg-black/50 backdrop-blur-lg border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Security Score</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.securityScore}%</p>
            </div>
            <ShieldIcon className="w-8 h-8 text-neon-blue opacity-50" />
          </div>
        </Card>

        <Card className="bg-black/50 backdrop-blur-lg border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Last Scan</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.lastScan}</p>
            </div>
            <ClockIcon className="w-8 h-8 text-gray-400 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Add Domain Form */}
      <Card className="bg-black/50 backdrop-blur-lg border-gray-800 p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Add Domain to Scan</h2>
        <form onSubmit={handleAddDomain} className="flex gap-4">
          <div className="flex-1">
            <Input
              type="url"
              placeholder="https://example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-green focus:ring-neon-green/20"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isScanning}
            className="bg-gradient-to-r from-neon-green to-neon-blue text-black font-semibold hover:opacity-90 transition-opacity"
          >
            {isScanning ? (
              <>
                <ScanIcon className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <PlusIcon className="mr-2 h-4 w-4" />
                Start Scan
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Recent Scans */}
      <Card className="bg-black/50 backdrop-blur-lg border-gray-800 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Recent Scans</h2>
        {recentScans.length === 0 ? (
          <div className="text-center py-12">
            <ScanIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No scans yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Add a domain above to start your first security scan
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Scan items would go here */}
          </div>
        )}
      </Card>
    </div>
  );
}