"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, RefreshCw, ShieldAlert, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface LoginAuditEntry {
  id: number;
  user_type: "staff" | "client";
  user_id: number | null;
  identifier: string | null;
  ip_address: string;
  user_agent: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

export default function LoginAuditPage() {
  const [entries, setEntries] = useState<LoginAuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [userTypeFilter, setUserTypeFilter] = useState("all");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", "100");

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }

    if (userTypeFilter !== "all") {
      params.set("userType", userTypeFilter);
    }

    return params.toString();
  }, [search, statusFilter, userTypeFilter]);

  const fetchEntries = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/login-audit?${queryString}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch login audit");
      }

      setEntries(data.entries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch login audit");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [queryString]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setUserTypeFilter("all");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Login Audit</h1>
          <p className="text-muted-foreground">
            Track staff and client sign-in attempts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchEntries} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Compact Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-muted/30 p-3 rounded-lg border">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search username, IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="client">Client</SelectItem>
          </SelectContent>
        </Select>

        {(search || statusFilter !== "all" || userTypeFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 px-2 text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Audit Table */}
      <Card>
        <CardHeader className="pb-4 pt-5 px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Audit Log</CardTitle>
              <CardDescription>
                Showing recent {entries.length} login attempts
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <ShieldAlert className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No login attempts recorded matching your criteria.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap font-medium text-sm">
                        <div className="flex flex-col">
                          <span>{format(new Date(entry.created_at), "MMM d, yyyy")}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(entry.created_at), "h:mm:ss a")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {entry.identifier || "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {entry.user_id ? `ID: ${entry.user_id}` : "No user id"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        <Badge variant="outline" className="font-normal capitalize">
                          {entry.user_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={entry.success ? "secondary" : "destructive"}
                          className="flex w-fit items-center gap-1"
                        >
                          {entry.success ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              Success
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3" />
                              Failed
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs bg-muted/50 px-2 py-1 rounded w-fit">
                          {entry.ip_address}
                        </div>
                      </TableCell>
                      <TableCell className="text-right max-w-[240px]">
                        {entry.error_message ? (
                          <span className="text-xs text-destructive truncate block" title={entry.error_message}>
                            {entry.error_message}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
