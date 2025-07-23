"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ScanIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
} from "lucide-react";

interface Scan {
  id: string;
  target: string;
  status: string;
  scanType: string;
  createdAt: string;
  completedAt?: string;
  totalVulnerabilities?: number;
  severityCounts?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export default function ScansPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loadingScans, setLoadingScans] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchScans();
    }
  }, [user]);

  const fetchScans = async () => {
    try {
      const response = await fetch("/api/scans");
      if (response.ok) {
        const data = await response.json();
        setScans(data.scans || []);
      }
    } catch (error) {
      console.error("Failed to fetch scans:", error);
    } finally {
      setLoadingScans(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="w-5 h-5 text-neon-green" />;
      case "running":
        return <RefreshCwIcon className="w-5 h-5 text-neon-blue animate-spin" />;
      case "failed":
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getSeverityBadge = (severity: string, count: number) => {
    if (count === 0) return null;
    
    const colors = {
      critical: "bg-red-500/20 text-red-500 border-red-500/40",
      high: "bg-orange-500/20 text-orange-500 border-orange-500/40",
      medium: "bg-yellow-500/20 text-yellow-500 border-yellow-500/40",
      low: "bg-green-500/20 text-green-500 border-green-500/40",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[severity as keyof typeof colors]}`}>
        {count} {severity}
      </span>
    );
  };

  if (loading || loadingScans) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Security Scans</h1>
        <p className="text-gray-400">View your scan history and results</p>
      </div>

      <div className="space-y-4">
        {scans.length === 0 ? (
          <Card className="bg-black/50 backdrop-blur-lg border-gray-800 p-12 text-center">
            <ScanIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No scans yet</h3>
            <p className="text-gray-400 mb-6">
              Start your first security scan from the dashboard
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="bg-gradient-to-r from-neon-green to-neon-blue text-black font-semibold hover:opacity-90 transition-opacity"
            >
              Go to Dashboard
            </Button>
          </Card>
        ) : (
          scans.map((scan) => (
            <Card
              key={scan.id}
              className="bg-black/50 backdrop-blur-lg border-gray-800 p-6 hover:border-gray-700 transition-colors cursor-pointer"
              onClick={() => router.push(`/dashboard/scans/${scan.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(scan.status)}
                  <div>
                    <h3 className="text-lg font-semibold text-white">{scan.target}</h3>
                    <p className="text-sm text-gray-400">
                      {new Date(scan.createdAt).toLocaleString()} • {scan.scanType} scan
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {scan.status === "completed" && scan.severityCounts && (
                    <>
                      {getSeverityBadge("critical", scan.severityCounts.critical)}
                      {getSeverityBadge("high", scan.severityCounts.high)}
                      {getSeverityBadge("medium", scan.severityCounts.medium)}
                      {getSeverityBadge("low", scan.severityCounts.low)}
                    </>
                  )}
                  {scan.status === "running" && (
                    <span className="text-neon-blue text-sm">Scanning...</span>
                  )}
                  {scan.status === "failed" && (
                    <span className="text-red-500 text-sm">Failed</span>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}