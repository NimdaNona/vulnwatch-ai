"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeftIcon,
  ShieldIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from "lucide-react";

interface Vulnerability {
  id: string;
  identifier: string;
  title: string;
  severity: string;
  description: string;
  remediation: string;
  port?: number;
  service?: string;
  cvssScore?: number;
  cveIds?: string[];
}

interface ScanDetail {
  id: string;
  target: string;
  status: string;
  scanType: string;
  createdAt: string;
  completedAt?: string;
  scanResults?: any;
  vulnerabilities: Vulnerability[];
  severityCounts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  totalVulnerabilities: number;
}

export default function ScanDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [loadingScan, setLoadingScan] = useState(true);
  const [scanId, setScanId] = useState<string>("");

  useEffect(() => {
    params.then(p => setScanId(p.id));
  }, [params]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && scanId) {
      fetchScanDetail();
      // Poll for updates if scan is running
      const interval = setInterval(() => {
        if (scan?.status === "running" || scan?.status === "pending") {
          fetchScanDetail();
        } else {
          clearInterval(interval);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user, scanId]);

  const fetchScanDetail = async () => {
    try {
      const response = await fetch(`/api/scans/${scanId}`);
      if (response.ok) {
        const data = await response.json();
        setScan(data.scan);
      }
    } catch (error) {
      console.error("Failed to fetch scan details:", error);
    } finally {
      setLoadingScan(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      case "high":
        return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "medium":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case "low":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      default:
        return "text-gray-500 bg-gray-500/10 border-gray-500/20";
    }
  };

  if (loading || loadingScan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="p-8">
        <div className="text-white">Scan not found</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/scans")}
          className="mb-4 text-gray-400 hover:text-white"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Scans
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{scan.target}</h1>
            <p className="text-gray-400">
              {scan.scanType} scan • {new Date(scan.createdAt).toLocaleString()}
            </p>
          </div>
          
          <div className="text-right">
            {scan.status === "completed" && (
              <div className="flex items-center text-neon-green">
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                <span>Completed</span>
              </div>
            )}
            {scan.status === "running" && (
              <div className="flex items-center text-neon-blue">
                <ClockIcon className="w-5 h-5 mr-2 animate-spin" />
                <span>Scanning...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {scan.status === "completed" && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-black/50 backdrop-blur-lg border-gray-800 p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{scan.totalVulnerabilities}</p>
              <p className="text-sm text-gray-400 mt-1">Total Issues</p>
            </div>
          </Card>
          
          <Card className="bg-black/50 backdrop-blur-lg border-gray-800 p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-red-500">{scan.severityCounts.critical}</p>
              <p className="text-sm text-gray-400 mt-1">Critical</p>
            </div>
          </Card>
          
          <Card className="bg-black/50 backdrop-blur-lg border-gray-800 p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-500">{scan.severityCounts.high}</p>
              <p className="text-sm text-gray-400 mt-1">High</p>
            </div>
          </Card>
          
          <Card className="bg-black/50 backdrop-blur-lg border-gray-800 p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-500">{scan.severityCounts.medium}</p>
              <p className="text-sm text-gray-400 mt-1">Medium</p>
            </div>
          </Card>
          
          <Card className="bg-black/50 backdrop-blur-lg border-gray-800 p-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">{scan.severityCounts.low}</p>
              <p className="text-sm text-gray-400 mt-1">Low</p>
            </div>
          </Card>
        </div>
      )}

      {/* Vulnerabilities List */}
      {scan.status === "completed" && scan.vulnerabilities.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">Vulnerabilities Found</h2>
          
          {scan.vulnerabilities.map((vuln) => (
            <Card key={vuln.id} className="bg-black/50 backdrop-blur-lg border-gray-800 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangleIcon className="w-5 h-5 text-red-500 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">{vuln.title}</h3>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(vuln.severity)}`}>
                        {vuln.severity}
                      </span>
                      {vuln.cvssScore && (
                        <span className="text-sm text-gray-400">
                          CVSS: {vuln.cvssScore}
                        </span>
                      )}
                      {vuln.port && (
                        <span className="text-sm text-gray-400">
                          Port: {vuln.port}
                        </span>
                      )}
                      {vuln.service && (
                        <span className="text-sm text-gray-400">
                          Service: {vuln.service}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Description</p>
                  <p className="text-white">{vuln.description}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Remediation</p>
                  <p className="text-white">{vuln.remediation}</p>
                </div>
                
                {vuln.cveIds && vuln.cveIds.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-1">CVE IDs</p>
                    <div className="flex flex-wrap gap-2">
                      {vuln.cveIds.map((cve) => (
                        <span key={cve} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                          {cve}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No vulnerabilities */}
      {scan.status === "completed" && scan.vulnerabilities.length === 0 && (
        <Card className="bg-black/50 backdrop-blur-lg border-gray-800 p-12 text-center">
          <ShieldIcon className="w-16 h-16 text-neon-green mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Vulnerabilities Found</h3>
          <p className="text-gray-400">
            Great news! Your scan didn't detect any security vulnerabilities.
          </p>
        </Card>
      )}

      {/* Scanning in progress */}
      {(scan.status === "running" || scan.status === "pending") && (
        <Card className="bg-black/50 backdrop-blur-lg border-gray-800 p-12 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-neon-blue"></div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Scan in Progress</h3>
          <p className="text-gray-400">
            We're analyzing your target for vulnerabilities. This may take a few minutes.
          </p>
        </Card>
      )}
    </div>
  );
}