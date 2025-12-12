import React, { useEffect, useState, useContext } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Trash2,
  Calendar,
  Plus,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  getDemandesByUser,
  createDemande,
  deleteDemande,
  deleteAllDemandes,
} from "@/services/demandeService";
import { AuthContext } from "../../contexts/AuthContext";

export default function StudentDemandes() {
  const { user, authLoading } = useContext(AuthContext);
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [newDemande, setNewDemande] = useState({
    nom: "",
    type: "",
    description: "",
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const getStatusBadge = (statut) => {
    const styles = {
      en_attente: "bg-yellow-100 text-yellow-800 border-yellow-300",
      approuvee: "bg-green-100 text-green-800 border-green-300",
      rejete: "bg-red-100 text-red-800 border-red-300",
    };
    const labels = {
      en_attente: "Pending",
      approuvee: "Approved",
      rejete: "Rejected",
    };
    return { style: styles[statut], label: labels[statut] };
  };

  const getTypeLabel = (type) => {
    const labels = {
      attestation_presence: "Attendance Certificate",
      attestation_inscription: "Registration Certificate",
      attestation_reussite: "Success Certificate",
      "releve de notes": "Transcript",
      stage: "Internship",
      autre: "Other",
    };
    return labels[type] || type;
  };

  const getStatusIcon = (statut) => {
    const icons = {
      en_attente: Clock,
      approuvee: CheckCircle2,
      rejete: XCircle,
    };
    return icons[statut] || Clock;
  };

  const getStatusColor = (statut) => {
    const colors = {
      en_attente: "from-yellow-500 to-orange-500",
      approuvee: "from-green-500 to-emerald-600",
      rejete: "from-red-500 to-rose-600",
    };
    return colors[statut] || "from-gray-500 to-gray-600";
  };

  useEffect(() => {
    if (user?._id) {
      fetchDemandes();

      const interval = setInterval(() => {
        fetchDemandes();
      }, 10000);

      const refreshOnFocus = () => fetchDemandes();
      window.addEventListener("focus", refreshOnFocus);

      return () => {
        clearInterval(interval);
        window.removeEventListener("focus", refreshOnFocus);
      };
    }
  }, [user?._id]);

  async function fetchDemandes() {
    if (!user?._id) return;
    
    try {
      setLoading(true);
      const data = await getDemandesByUser(user._id);
      setDemandes(data);
    } catch (err) {
      console.error("Failed to fetch demandes:", err);
      showToast("error", "Failed to load your requests");
    } finally {
      setLoading(false);
    }
  }

  const handleCreateDemande = async () => {
    if (!newDemande.nom || !newDemande.type) {
      showToast("error", "Please fill all required fields");
      return;
    }

    if (!user?._id) {
      showToast("error", "User not authenticated");
      return;
    }

    try {
      setProcessing(true);
      await createDemande(newDemande.nom, newDemande.type, user._id, newDemande.description);
      showToast("success", "Request created successfully!");
      setShowCreateDialog(false);
      setNewDemande({ nom: "", type: "", description: "" });
      fetchDemandes();
    } catch (err) {
      console.error("Failed to create demande:", err);
      showToast("error", err.response?.data?.message || "Failed to create request");
    } finally {
      setProcessing(false);
    }
  };

  const openDetailDialog = (demande) => {
    setSelectedDemande(demande);
    setShowDetailDialog(true);
  };

  const openDeleteDialog = (demande) => {
    setSelectedDemande(demande);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    try {
      setProcessing(true);
      await deleteDemande(selectedDemande._id);
      showToast("success", "Request deleted successfully!");
      setShowDeleteDialog(false);
      setSelectedDemande(null);
      fetchDemandes();
    } catch (err) {
      console.error("Failed to delete:", err);
      showToast("error", "Failed to delete request");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteAll = async () => {
    try {
      setProcessing(true);
      await deleteAllDemandes();
      showToast("success", "All requests deleted successfully!");
      setShowDeleteAllDialog(false);
      fetchDemandes();
    } catch (err) {
      console.error("Failed to delete all:", err);
      showToast("error", "Failed to delete all requests");
    } finally {
      setProcessing(false);
    }
  };

  const filteredDemandes =
    filterStatus === "all"
      ? demandes
      : demandes.filter((d) => d.statut === filterStatus);

  const stats = {
    total: demandes.length,
    pending: demandes.filter((d) => d.statut === "en_attente").length,
    approved: demandes.filter((d) => d.statut === "approuvee").length,
    rejected: demandes.filter((d) => d.statut === "rejete").length,
  };

  // Show loading if user is not yet loaded
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Not Authenticated</h2>
          <p className="text-muted-foreground">Please log in to view your requests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="container mx-auto space-y-6">
        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
            <Alert
              className={`min-w-[300px] shadow-lg border-2 ${
                toast.type === "success"
                  ? "bg-green-50 border-green-500 text-green-900"
                  : "bg-red-50 border-red-500 text-red-900"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <AlertDescription className="font-medium ml-2">
                {toast.message}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              My Requests
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage your document requests
            </p>
          </div>
          <div className="flex gap-2">
            {demandes.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteAllDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All
              </Button>
            )}
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setFilterStatus("all")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Requests
                  </p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-10 w-10 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setFilterStatus("en_attente")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {stats.pending}
                  </p>
                </div>
                <Clock className="h-10 w-10 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setFilterStatus("approuvee")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.approved}
                  </p>
                </div>
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setFilterStatus("rejete")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-3xl font-bold text-red-600">
                    {stats.rejected}
                  </p>
                </div>
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading requests...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredDemandes.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground mb-4">
              {filterStatus === "all"
                ? "No requests yet"
                : `No ${filterStatus} requests`}
            </p>
            {filterStatus === "all" && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Request
              </Button>
            )}
          </div>
        )}

        {/* Demandes List */}
        {!loading && (
          <div className="grid gap-4">
            {filteredDemandes.map((demande) => {
              const StatusIcon = getStatusIcon(demande.statut);
              const statusBadge = getStatusBadge(demande.statut);

              return (
                <Card
                  key={demande._id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div
                    className={`h-2 bg-gradient-to-r ${getStatusColor(
                      demande.statut
                    )}`}
                  />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={`h-12 w-12 rounded-lg bg-gradient-to-br ${getStatusColor(
                            demande.statut
                          )} flex items-center justify-center flex-shrink-0`}
                        >
                          <StatusIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg">{demande.nom}</h3>
                            <Badge className={`${statusBadge.style} border`}>
                              {statusBadge.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Type: {getTypeLabel(demande.type)}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Submitted: {new Date(demande.createdAt).toLocaleDateString()}
                            </span>
                            {demande.updatedAt && demande.updatedAt !== demande.createdAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Updated: {new Date(demande.updatedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailDialog(demande)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(demande)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">Create New Request</DialogTitle>
              <DialogDescription>
                Submit a new document request to the administration
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nom" className="text-sm font-medium">
                  Request Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nom"
                  placeholder="e.g., Attestation de Présence 2024"
                  value={newDemande.nom}
                  onChange={(e) =>
                    setNewDemande({ ...newDemande, nom: e.target.value })
                  }
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Give your request a clear, descriptive name
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">
                  Document Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={newDemande.type}
                  onValueChange={(value) =>
                    setNewDemande({ ...newDemande, type: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attestation_presence">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Attendance Certificate</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="attestation_inscription">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Registration Certificate</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="attestation_reussite">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Success Certificate</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="releve de notes">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Transcript</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="stage">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Internship</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="autre">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Other</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose the type of document you need
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description (Optional)
                </Label>
                <textarea
                  id="description"
                  placeholder="Add any additional details or special requirements..."
                  value={newDemande.description}
                  onChange={(e) =>
                    setNewDemande({ ...newDemande, description: e.target.value })
                  }
                  className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  Provide any additional information that might help process your request
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewDemande({ nom: "", type: "", description: "" });
                }}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateDemande} disabled={processing || !newDemande.nom || !newDemande.type}>
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Request Details</DialogTitle>
              <DialogDescription>
                Information about your request
              </DialogDescription>
            </DialogHeader>

            {selectedDemande && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Request Name
                    </p>
                    <p className="text-base font-semibold">
                      {selectedDemande.nom}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Type
                    </p>
                    <p className="text-base font-semibold">
                      {getTypeLabel(selectedDemande.type)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Status
                    </p>
                    <Badge
                      className={`${
                        getStatusBadge(selectedDemande.statut).style
                      } border`}
                    >
                      {getStatusBadge(selectedDemande.statut).label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Submitted
                    </p>
                    <p className="text-base font-semibold">
                      {new Date(selectedDemande.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {selectedDemande.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Description
                    </p>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm">{selectedDemande.description}</p>
                    </div>
                  </div>
                )}

                {selectedDemande.statut === "en_attente" && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Your request is pending review by the administration.
                    </AlertDescription>
                  </Alert>
                )}

                {selectedDemande.statut === "approuvee" && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Your request has been approved! You can now collect your document from the administration office.
                    </AlertDescription>
                  </Alert>
                )}

                {selectedDemande.statut === "rejete" && (
                  <Alert className="bg-red-50 border-red-200">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      Your request has been rejected. Please contact the administration for more information.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDetailDialog(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Delete Request
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this request? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>

            {selectedDemande && (
              <div className="py-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-1">
                      {selectedDemande.nom}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Type: {getTypeLabel(selectedDemande.type)}
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Delete All Dialog */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Delete ALL Requests
            </DialogTitle>
            <DialogDescription>
              This will permanently delete <b>all your requests</b>. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Alert>
              <Trash2 className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-1">
                  Total: {stats.total} Request{stats.total !== 1 ? 's' : ''}
                </div>
                <div className="text-sm text-muted-foreground">
                  All your document requests will be removed permanently.
                </div>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteAllDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting All...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete All Requests
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}