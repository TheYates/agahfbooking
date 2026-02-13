"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Search,
  Shield,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  XCircle,
  Power,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Client {
  id: number;
  xNumber: string;
  name: string;
  phone: string;
  category: string;
  status: "active" | "inactive";
  hasSupabaseAuth: boolean;
  authUserId: string | null;
  joinDate: string;
}

interface Stats {
  total: number;
  withAuth: number;
  withoutAuth: number;
  active: number;
}

export default function AdminClientsOTPPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [authFilter, setAuthFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    withAuth: 0,
    withoutAuth: 0,
    active: 0,
  });

  // Modal states
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showEnableModal, setShowEnableModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchClients();
  }, [currentPage, searchTerm, authFilter]);

  const fetchClients = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(authFilter !== "all" && { authStatus: authFilter }),
      });

      const response = await fetch(`/api/admin/clients?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch clients");
      }

      setClients(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setStats(data.stats || stats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableAuth = async () => {
    if (!selectedClient) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/admin/clients/${selectedClient.id}/enable-auth`,
        { method: "POST" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to enable auth");
      }

      setShowEnableModal(false);
      fetchClients();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisableAuth = async () => {
    if (!selectedClient) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/admin/clients/${selectedClient.id}/enable-auth`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to disable auth");
      }

      setShowDisableModal(false);
      fetchClients();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Client Management (OTP)</h1>
          <p className="text-muted-foreground">
            Manage clients using X-Number + Phone OTP authentication
          </p>
        </div>
        <Button onClick={fetchClients} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Info Card */}
      <Alert>
        <Smartphone className="h-4 w-4" />
        <AlertDescription>
          Clients login with their X-Number and receive OTP via SMS. 
          Supabase Auth is optional and enables enhanced security features.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-sm text-muted-foreground">With Auth</div>
                <div className="text-2xl font-bold">{stats.withAuth}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-sm text-muted-foreground">OTP Only</div>
                <div className="text-2xl font-bold">{stats.withoutAuth}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Power className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-sm text-muted-foreground">Active</div>
                <div className="text-2xl font-bold">{stats.active}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <CardTitle>Client List</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  className="pl-8 w-full sm:w-64"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <Select value={authFilter} onValueChange={setAuthFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Auth Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  <SelectItem value="with-auth">With Supabase Auth</SelectItem>
                  <SelectItem value="without-auth">OTP Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading clients...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>X-Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Login Method</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center h-24 text-muted-foreground"
                      >
                        No clients found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          {client.xNumber}
                        </TableCell>
                        <TableCell>{client.name}</TableCell>
                        <TableCell>{client.phone}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              client.status === "active" ? "default" : "secondary"
                            }
                          >
                            {client.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {client.hasSupabaseAuth ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Supabase Auth
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-600">
                              <Smartphone className="h-3 w-3 mr-1" />
                              OTP Only
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {client.hasSupabaseAuth ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedClient(client);
                                setShowDisableModal(true);
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Disable Auth
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedClient(client);
                                setShowEnableModal(true);
                              }}
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Enable Auth
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Enable Auth Modal */}
      <Dialog open={showEnableModal} onOpenChange={setShowEnableModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Supabase Auth</DialogTitle>
            <DialogDescription>
              This will create a Supabase Auth account for {selectedClient?.name}.
              They will still login with X-Number + OTP, but with enhanced security.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p><strong>X-Number:</strong> {selectedClient?.xNumber}</p>
            <p><strong>Phone:</strong> {selectedClient?.phone}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnableModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnableAuth} disabled={actionLoading}>
              {actionLoading ? "Enabling..." : "Enable Supabase Auth"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Auth Modal */}
      <Dialog open={showDisableModal} onOpenChange={setShowDisableModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Supabase Auth</DialogTitle>
            <DialogDescription>
              This will remove the Supabase Auth account for {selectedClient?.name}.
              They will revert to basic OTP-only authentication.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertDescription>
              This action cannot be undone. The client will need to be re-enabled if needed.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDisableAuth} 
              disabled={actionLoading}
            >
              {actionLoading ? "Disabling..." : "Disable Supabase Auth"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
