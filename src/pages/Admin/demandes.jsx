import React, { useEffect, useState } from "react";
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
  User,
  Calendar,
  Mail,
  BookOpen,
} from "lucide-react";

import {
  getAllDemandes,
  updateDemandeStatus,
  deleteDemande,
  deleteAllDemandes,
} from "@/services/demandeService";

export default function AdminDemandes() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

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
      inscription: "Registration",
      reussite: "Success Certificate",
      releve: "Transcript",
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type) => {
    const icons = {
      attestation_presence: FileText,
      inscription: BookOpen,
      reussite: CheckCircle2,
      releve: FileText,
    };
    return icons[type] || FileText;
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
  }, []);

  async function fetchDemandes() {
    try {
      setLoading(true);
      const data = await getAllDemandes();
      setDemandes(data);
    } catch (err) {
      console.error("Failed to fetch demandes:", err);
      showToast("error", "Failed to load requests");
    } finally {
      setLoading(false);  
    }
  }

  const handleStatusChange = async (demandeId, newStatus) => {
    try {
      setProcessing(true);
      await updateDemandeStatus(demandeId, newStatus);
      showToast(
        "success",
        `Request ${
          newStatus === "approuvee" ? "approved" : "rejected"
        } successfully!`
      );
      setShowDetailDialog(false);
      fetchDemandes();
    } catch (err) {
      console.error("Failed to update status:", err);
      showToast(
        "error",
        err.response?.data?.message || "Failed to update status"
      );
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
      await deleteAllDemandes();
      showToast("success", "All requests deleted successfully!");
      fetchDemandes();
    } catch (err) {
      console.error("Failed to delete all:", err);
      showToast("error", "Failed to delete all requests");
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
              Student Requests
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and respond to student document requests
            </p>
          </div>
          {demandes.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteAllDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All
            </Button>
          )}
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
            <p className="text-xl text-muted-foreground">
              {filterStatus === "all"
                ? "No requests yet"
                : `No ${filterStatus} requests`}
            </p>
          </div>
        )}

        {/* Demandes List */}
        {!loading && (
          <div className="grid gap-4">
            {filteredDemandes.map((demande) => {
              const StatusIcon = getStatusIcon(demande.statut);
              const TypeIcon = getTypeIcon(demande.type);
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
                          <TypeIcon className="h-6 w-6 text-white" />
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
                              <User className="h-3 w-3" />
                              {demande.etudiant?.prenom} {demande.etudiant?.nom}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {demande.etudiant?.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(demande.createdAt).toLocaleDateString()}
                            </span>
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

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Request Details</DialogTitle>
              <DialogDescription>
                Review and respond to this request
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
                      Student
                    </p>
                    <p className="text-base font-semibold">
                      {selectedDemande.etudiant?.prenom}{" "}
                      {selectedDemande.etudiant?.nom}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Email
                    </p>
                    <p className="text-base font-semibold">
                      {selectedDemande.etudiant?.email}
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

                {selectedDemande.statut === "en_attente" && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This request is pending. Please approve or reject it.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDetailDialog(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              {selectedDemande?.statut === "en_attente" && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      handleStatusChange(selectedDemande._id, "rejete")
                    }
                    disabled={processing}
                  >
                    {processing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    Reject
                  </Button>
                  <Button
                    onClick={() =>
                      handleStatusChange(selectedDemande._id, "approuvee")
                    }
                    disabled={processing}
                  >
                    {processing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Approve
                  </Button>
                </>
              )}
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
                      Student: {selectedDemande.etudiant?.prenom}{" "}
                      {selectedDemande.etudiant?.nom}
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
              This will permanently delete <b>every request</b>. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Alert>
              <Trash2 className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-1">
                  Total: {stats.total} Requests
                </div>
                <div className="text-sm text-muted-foreground">
                  All student requests will be removed permanently.
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
              onClick={async () => {
                setProcessing(true);
                await handleDeleteAll();
                setShowDeleteAllDialog(false);
                setProcessing(false);
              }}
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
                  Delete All
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
