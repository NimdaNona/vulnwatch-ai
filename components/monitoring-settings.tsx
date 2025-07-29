"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Bell, Shield, Clock } from "lucide-react";
import { toast } from "sonner";

interface MonitoringPreferences {
  enabled: boolean;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  notifyEmail: boolean;
  notifyOnNewVulns: boolean;
  notifyOnChanges: boolean;
}

export function MonitoringSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<MonitoringPreferences>({
    enabled: false,
    frequency: "WEEKLY",
    notifyEmail: true,
    notifyOnNewVulns: true,
    notifyOnChanges: true,
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/monitoring/preferences");
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setPreferences(data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch monitoring preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/monitoring/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        toast.success("Monitoring preferences saved successfully");
      } else {
        throw new Error("Failed to save preferences");
      }
    } catch (error) {
      toast.error("Failed to save monitoring preferences");
      console.error(error);
    } finally {
      setSaving(false);
    }
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
          <Shield className="h-5 w-5 text-neon-green" />
          Automated Monitoring
        </CardTitle>
        <CardDescription className="text-gray-400">
          Schedule automatic security scans and get notified about new vulnerabilities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="monitoring-enabled" className="text-base">
              Enable Monitoring
            </Label>
            <p className="text-sm text-gray-400">
              Automatically scan your domains on a regular schedule
            </p>
          </div>
          <Switch
            id="monitoring-enabled"
            checked={preferences.enabled}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, enabled: checked })
            }
          />
        </div>

        {preferences.enabled && (
          <>
            <div className="space-y-2">
              <Label htmlFor="scan-frequency" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Scan Frequency
              </Label>
              <Select
                value={preferences.frequency}
                onValueChange={(value: "DAILY" | "WEEKLY" | "MONTHLY") =>
                  setPreferences({ ...preferences, frequency: value })
                }
              >
                <SelectTrigger id="scan-frequency" className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notification Preferences
              </Label>
              
              <div className="space-y-3 pl-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications" className="text-sm font-normal">
                    Email notifications
                  </Label>
                  <Switch
                    id="email-notifications"
                    checked={preferences.notifyEmail}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, notifyEmail: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="new-vulns" className="text-sm font-normal">
                    Alert on new vulnerabilities
                  </Label>
                  <Switch
                    id="new-vulns"
                    checked={preferences.notifyOnNewVulns}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, notifyOnNewVulns: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="changes" className="text-sm font-normal">
                    Alert on security changes
                  </Label>
                  <Switch
                    id="changes"
                    checked={preferences.notifyOnChanges}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, notifyOnChanges: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <Button
          onClick={savePreferences}
          disabled={saving}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
}