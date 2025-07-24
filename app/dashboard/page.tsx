"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { 
  PlusIcon, 
  ScanIcon, 
  ShieldIcon, 
  ClockIcon,
  AlertTriangleIcon,
  ZapIcon,
  SearchIcon
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [scanType, setScanType] = useState<"quick" | "deep">("quick");
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<any>(null);

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
    setScanError(null);
    
    try {
      const response = await fetch("/api/scans/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain,
          scanType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle rate limit errors specially
        if (response.status === 429) {
          setScanError(data.message || "Rate limit exceeded");
          if (data.used && data.limit) {
            setRateLimitInfo({
              used: data.used,
              limit: data.limit,
              retryAfter: data.retryAfter,
            });
          }
        } else {
          setScanError(data.error || "Failed to start scan");
        }
        return;
      }

      // Store rate limit info from successful response
      if (data.limits) {
        setRateLimitInfo(data.limits);
      }

      // Success - redirect to scan details
      router.push(`/dashboard/scans/${data.scan.id}`);
    } catch (error) {
      console.error("Scan error:", error);
      setScanError(error instanceof Error ? error.message : "Failed to start scan");
    } finally {
      setIsScanning(false);
    }
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
        <form onSubmit={handleAddDomain} className="space-y-4">
          <div className="flex gap-4">
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
            <Select value={scanType} onValueChange={(value: "quick" | "deep") => setScanType(value)}>
              <SelectTrigger className="w-[180px] bg-gray-900/50 border-gray-700 text-white">
                <SelectValue placeholder="Select scan type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="quick" className="text-white hover:bg-gray-800">
                  <div className="flex items-center">
                    <ZapIcon className="mr-2 h-4 w-4 text-yellow-500" />
                    Quick Scan
                  </div>
                </SelectItem>
                <SelectItem value="deep" className="text-white hover:bg-gray-800">
                  <div className="flex items-center">
                    <SearchIcon className="mr-2 h-4 w-4 text-blue-500" />
                    Deep Scan
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
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
          </div>
          
          {/* Scan Type Info */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center text-gray-400">
              <ZapIcon className="mr-1 h-3 w-3 text-yellow-500" />
              <span><strong>Quick Scan:</strong> Fast scan of essential ports (80, 443, 22, 8080)</span>
            </div>
            <div className="flex items-center text-gray-400">
              <SearchIcon className="mr-1 h-3 w-3 text-blue-500" />
              <span><strong>Deep Scan:</strong> Comprehensive scan of all common ports</span>
            </div>
          </div>
        </form>
        
        {/* Error Message */}
        {scanError && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-500">{scanError}</p>
            {rateLimitInfo && rateLimitInfo.retryAfter && (
              <p className="text-sm text-red-400 mt-1">
                Please try again in {rateLimitInfo.retryAfter} seconds
              </p>
            )}
          </div>
        )}

        {/* Rate Limit Info */}
        {rateLimitInfo && (
          <div className="mt-4 space-y-2">
            {rateLimitInfo.hourly && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Hourly Limit:</span>
                <span className="text-white">
                  {rateLimitInfo.hourly.used} / {rateLimitInfo.hourly.limit} scans
                </span>
              </div>
            )}
            {rateLimitInfo.daily && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Daily Limit:</span>
                <span className="text-white">
                  {rateLimitInfo.daily.used} / {rateLimitInfo.daily.limit} scans
                </span>
              </div>
            )}
          </div>
        )}
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