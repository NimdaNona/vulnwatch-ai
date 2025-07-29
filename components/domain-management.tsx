"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Globe, Clock, Shield, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface MonitoredDomain {
  id: string;
  domain: string;
  createdAt: string;
  lastScanId?: string;
  monitoringPreference?: {
    frequency: "DAILY" | "WEEKLY" | "MONTHLY";
    nextScanAt?: string;
  };
}

export function DomainManagement() {
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [domains, setDomains] = useState<MonitoredDomain[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const response = await fetch("/api/monitoring/domains");
      if (response.ok) {
        const data = await response.json();
        setDomains(data);
      }
    } catch (error) {
      console.error("Failed to fetch domains:", error);
      toast.error("Failed to load monitored domains");
    } finally {
      setLoading(false);
    }
  };

  const addDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    setAdding(true);
    try {
      const response = await fetch("/api/monitoring/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain.trim() }),
      });

      if (response.ok) {
        const addedDomain = await response.json();
        setDomains([...domains, addedDomain]);
        setNewDomain("");
        toast.success("Domain added successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add domain");
      }
    } catch (error) {
      toast.error("Failed to add domain");
      console.error(error);
    } finally {
      setAdding(false);
    }
  };

  const removeDomain = async (domainId: string) => {
    setDeletingId(domainId);
    try {
      const response = await fetch(`/api/monitoring/domains?id=${domainId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDomains(domains.filter(d => d.id !== domainId));
        toast.success("Domain removed successfully");
      } else {
        throw new Error("Failed to remove domain");
      }
    } catch (error) {
      toast.error("Failed to remove domain");
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  const getNextScanTime = (domain: MonitoredDomain) => {
    if (!domain.monitoringPreference?.nextScanAt) {
      return "Not scheduled";
    }
    return formatDistanceToNow(new Date(domain.monitoringPreference.nextScanAt), { addSuffix: true });
  };

  const getFrequencyBadge = (frequency?: string) => {
    const colors = {
      DAILY: "bg-blue-500/10 text-blue-500",
      WEEKLY: "bg-green-500/10 text-green-500",
      MONTHLY: "bg-purple-500/10 text-purple-500",
    };
    return colors[frequency as keyof typeof colors] || "bg-gray-500/10 text-gray-500";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/50 backdrop-blur-lg border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Globe className="h-5 w-5 text-neon-green" />
          Monitored Domains
        </CardTitle>
        <CardDescription className="text-gray-400">
          Add domains to monitor for security vulnerabilities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={addDomain} className="flex gap-2 mb-6">
          <Input
            type="text"
            placeholder="Enter domain (e.g., example.com)"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            disabled={adding}
            className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
          />
          <Button
            type="submit"
            disabled={adding || !newDomain.trim()}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add Domain
          </Button>
        </form>

        {domains.length === 0 ? (
          <div className="text-center py-8">
            <Globe className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No domains being monitored</p>
            <p className="text-sm text-gray-500 mt-1">
              Add a domain above to start monitoring
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {domains.map((domain) => (
              <div
                key={domain.id}
                className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-white">{domain.domain}</span>
                    {domain.monitoringPreference?.frequency && (
                      <span className={`text-xs px-2 py-1 rounded-full ${getFrequencyBadge(domain.monitoringPreference.frequency)}`}>
                        {domain.monitoringPreference.frequency}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Next scan: {getNextScanTime(domain)}
                    </span>
                    {domain.lastScanId && (
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Last scan completed
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDomain(domain.id)}
                  disabled={deletingId === domain.id}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  {deletingId === domain.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        {domains.length > 0 && (
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">Monitoring Active</p>
                <p className="text-blue-300/80">
                  Domains will be scanned according to your monitoring frequency settings.
                  You'll receive email alerts when new vulnerabilities are detected.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}