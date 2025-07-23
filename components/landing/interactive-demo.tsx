"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Vulnerability {
  id: number;
  type: "critical" | "high" | "medium" | "low";
  name: string;
  description: string;
  component: string;
  status: "scanning" | "found" | "fixed";
}

const vulnerabilities: Vulnerability[] = [
  {
    id: 1,
    type: "critical",
    name: "SQL Injection",
    description: "Unsanitized user input in database query",
    component: "auth.login_handler",
    status: "scanning",
  },
  {
    id: 2,
    type: "high",
    name: "XSS Vulnerability",
    description: "Cross-site scripting in user comments",
    component: "comments.render_html",
    status: "scanning",
  },
  {
    id: 3,
    type: "medium",
    name: "Weak Encryption",
    description: "MD5 hash used for password storage",
    component: "users.hash_password",
    status: "scanning",
  },
  {
    id: 4,
    type: "low",
    name: "Missing Headers",
    description: "Security headers not configured",
    component: "middleware.security",
    status: "scanning",
  },
];

export function InteractiveDemo() {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [vulnList, setVulnList] = useState<Vulnerability[]>([]);
  const [currentScan, setCurrentScan] = useState(0);

  const startScan = () => {
    setScanning(true);
    setProgress(0);
    setVulnList([]);
    setCurrentScan(0);
  };

  useEffect(() => {
    if (!scanning) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setScanning(false);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(progressInterval);
  }, [scanning]);

  useEffect(() => {
    if (!scanning || progress < 20) return;

    const scanInterval = setInterval(() => {
      setCurrentScan((prev) => {
        if (prev >= vulnerabilities.length - 1) {
          return prev;
        }
        
        const nextIndex = prev + 1;
        setVulnList((list) => [
          ...list,
          { ...vulnerabilities[nextIndex - 1], status: "found" },
        ]);
        return nextIndex;
      });
    }, 1500);

    return () => clearInterval(scanInterval);
  }, [scanning, progress]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      default:
        return "";
    }
  };

  return (
    <Card className="glass border-white/10 p-6 w-full max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-white">Live Security Scan Demo</h3>
          <Button
            onClick={startScan}
            disabled={scanning}
            className="bg-neon-green/20 hover:bg-neon-green/30 border border-neon-green/50 text-neon-green"
          >
            {scanning ? "Scanning..." : "Start Scan"}
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Scan Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neon-blue to-neon-green transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Scanning Animation */}
        {scanning && (
          <div className="flex items-center space-x-3 text-sm text-gray-400">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse delay-100" />
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse delay-200" />
            </div>
            <span>Analyzing {vulnerabilities[currentScan]?.component || "system"}...</span>
          </div>
        )}

        {/* Vulnerabilities List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {vulnList.map((vuln, index) => (
            <div
              key={vuln.id}
              className="p-4 rounded-lg bg-white/5 border border-white/10 animate-in slide-in-from-bottom duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <Badge className={getTypeColor(vuln.type)} variant="outline">
                      {vuln.type.toUpperCase()}
                    </Badge>
                    <h4 className="font-medium text-white">{vuln.name}</h4>
                  </div>
                  <p className="text-sm text-gray-400">{vuln.description}</p>
                  <p className="text-xs text-gray-500 font-mono">{vuln.component}</p>
                </div>
                <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/50">
                  Found
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {!scanning && vulnList.length > 0 && (
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">
                Found {vulnList.length} vulnerabilities
              </span>
              <Button
                variant="outline"
                className="text-neon-green border-neon-green/50 hover:bg-neon-green/10"
              >
                View Full Report
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}