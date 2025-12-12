import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from '@/components/ui/date-picker'; // ✅ Import DatePicker
import { 
  Plus, 
  Edit, 
  Trash2, 
  Pin, 
  PinOff, 
  Eye,
  CheckCircle2, 
  XCircle, 
  Megaphone,
  Loader2,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Settings,
  X
} from "lucide-react";

import {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  togglePinAnnouncement,
  getAnnouncementStats
} from "@/services/announcementService";
import { getEnseignants, getEtudiants } from "@/services/userService";
import { getAllClasses } from "@/services/classeService";

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [stats, setStats] = useState(null);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    titre: "",
    contenu: "",
    type: "info",
    priorite: "normal",
    destinataires: "all",
    utilisateursSpecifiques: [],
    classesSpecifiques: [],
    rolesMultiples: [],
    dateExpiration: null, // ✅ Changed to null for DatePicker
    estEpingle: false,
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const getTypeIcon = (type) => {
    const icons = {
      info: Info,
      warning: AlertTriangle,
      urgent: AlertCircle,
      success: CheckCircle,
      event: Calendar,
      maintenance: Settings,
    };
    return icons[type] || Info;
  };

  const getTypeColor = (type) => {
    const colors = {
      info: "from-blue-500 to-blue-600",
      warning: "from-yellow-500 to-orange-500",
      urgent: "from-red-500 to-red-600",
      success: "from-green-500 to-green-600",
      event: "from-purple-500 to-purple-600",
      maintenance: "from-gray-500 to-gray-600",
    };
    return colors[type] || "from-blue-500 to-blue-600";
  };

  const getPriorityBadge = (priorite) => {
    const styles = {
      low: "bg-gray-100 text-gray-800",
      normal: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    };
    return styles[priorite] || styles.normal;
  };

  const getTargetDisplay = (announcement) => {
    if (announcement.destinataires === "specific_classes" && announcement.classesSpecifiques?.length > 0) {
      return announcement.classesSpecifiques.map(c => c.nom).join(", ");
    }
    return announcement.destinataires;
  };

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      
      const [announcementsData, teachersData, studentsData, classesData] = await Promise.all([
        getAllAnnouncements(),
        getEnseignants(),
        getEtudiants(),
        getAllClasses(),
      ]);

      setAnnouncements(announcementsData);
      setTeachers(teachersData.data || teachersData);
      setStudents(studentsData.data || studentsData);
      setClasses(classesData.data || classesData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      showToast("error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  // ✅ Handler for DatePicker
  const handleDateExpirationChange = (date) => {
    setFormData({ ...formData, dateExpiration: date });
  };

  const openCreateDialog = () => {
    setFormData({
      titre: "",
      contenu: "",
      type: "info",
      priorite: "normal",
      destinataires: "all",
      utilisateursSpecifiques: [],
      classesSpecifiques: [],
      rolesMultiples: [],
      dateExpiration: null, // ✅ Reset to null
      estEpingle: false,
    });
    setDialogError(null);
    setShowCreateDialog(true);
  };

  const openEditDialog = (announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      titre: announcement.titre,
      contenu: announcement.contenu,
      type: announcement.type,
      priorite: announcement.priorite,
      destinataires: announcement.destinataires,
      utilisateursSpecifiques: announcement.utilisateursSpecifiques?.map(u => u._id || u) || [],
      classesSpecifiques: announcement.classesSpecifiques?.map(c => c._id || c) || [],
      rolesMultiples: announcement.rolesMultiples || [],
      dateExpiration: announcement.dateExpiration ? new Date(announcement.dateExpiration) : null, // ✅ Convert to Date object
      estEpingle: announcement.estEpingle,
    });
    setDialogError(null);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDeleteDialog(true);
  };

  const handleCreate = async () => {
    try {
      setSubmitting(true);
      setDialogError(null);

      if (!formData.titre || !formData.contenu) {
        setDialogError("Title and content are required");
        return;
      }

      const announcementData = {
        ...formData,
        dateExpiration: formData.dateExpiration || null,
      };

      await createAnnouncement(announcementData);
      showToast("success", "Announcement created successfully!");
      setShowCreateDialog(false);
      fetchData();
    } catch (err) {
      console.error("Failed to create announcement:", err);
      const errorMessage = err.response?.data?.message || "Failed to create announcement";
      setDialogError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSubmitting(true);
      setDialogError(null);

      const announcementData = {
        ...formData,
        dateExpiration: formData.dateExpiration || null,
      };

      await updateAnnouncement(selectedAnnouncement._id, announcementData);
      showToast("success", "Announcement updated successfully!");
      setShowEditDialog(false);
      fetchData();
    } catch (err) {
      console.error("Failed to update announcement:", err);
      const errorMessage = err.response?.data?.message || "Failed to update announcement";
      setDialogError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteAnnouncement(selectedAnnouncement._id);
      showToast("success", "Announcement and related notifications deleted successfully!");
      setShowDeleteDialog(false);
      setSelectedAnnouncement(null);
      fetchData();
    } catch (err) {
      console.error("Failed to delete announcement:", err);
      showToast("error", "Failed to delete announcement");
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePin = async (id) => {
    try {
      await togglePinAnnouncement(id);
      showToast("success", "Pin status updated!");
      fetchData();
    } catch (err) {
      console.error("Failed to toggle pin:", err);
      showToast("error", "Failed to update pin status");
    }
  };

  const handleShowStats = async (announcement) => {
    try {
      setSelectedAnnouncement(announcement);
      const statsData = await getAnnouncementStats(announcement._id);
      setStats(statsData);
      setShowStatsDialog(true);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      showToast("error", "Failed to load statistics");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="container mx-auto space-y-6">
        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
            <Alert className={`min-w-[300px] shadow-lg border-2 ${
              toast.type === "success"
                ? "bg-green-50 border-green-500 text-green-900"
                : "bg-red-50 border-red-500 text-red-900"
            }`}>
              {toast.type === "success" ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
              <AlertDescription className="font-medium ml-2">{toast.message}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Announcements Management
            </h1>
            <p className="text-muted-foreground mt-1">Create and manage system announcements</p>
          </div>
          <Button className="gap-2" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading announcements...</p>
          </div>
        )}

        {/* Announcements List */}
        {!loading && (
          <div className="grid gap-4">
            {announcements.map((announcement) => {
              const TypeIcon = getTypeIcon(announcement.type);
              return (
                <Card key={announcement._id} className="overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${getTypeColor(announcement.type)}`} />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${getTypeColor(announcement.type)} flex items-center justify-center`}>
                          <TypeIcon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg">{announcement.titre}</h3>
                            {announcement.estEpingle && <Pin className="h-4 w-4 text-primary" />}
                            <Badge className={getPriorityBadge(announcement.priorite)}>{announcement.priorite}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{announcement.contenu}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="font-medium">
                              Target: <span className="text-primary">{getTargetDisplay(announcement)}</span>
                            </span>
                            <span>Views: {announcement.nombreVues || 0}</span>
                            <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                            {announcement.dateExpiration && (
                              <span>Expires: {new Date(announcement.dateExpiration).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleShowStats(announcement)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleTogglePin(announcement._id)}>
                          {announcement.estEpingle ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(announcement)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(announcement)}>
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Announcement</DialogTitle>
              <DialogDescription>Send announcement to specific users or groups</DialogDescription>
            </DialogHeader>

            {dialogError && (
              <Alert className="border-red-500 bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="ml-2 text-red-900">
                  {dialogError}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="titre">Title *</Label>
                <Input id="titre" name="titre" value={formData.titre} onChange={handleChange} placeholder="Announcement title" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contenu">Content *</Label>
                <Textarea id="contenu" name="contenu" value={formData.contenu} onChange={handleChange} placeholder="Announcement content" rows={4} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={formData.priorite} onValueChange={(value) => handleSelectChange("priorite", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target</Label>
                  <Select value={formData.destinataires} onValueChange={(value) => handleSelectChange("destinataires", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="students">Students Only</SelectItem>
                      <SelectItem value="teachers">Teachers Only</SelectItem>
                      <SelectItem value="admins">Admins Only</SelectItem>
                      <SelectItem value="specific_classes">Specific Classes</SelectItem>
                      <SelectItem value="multiple_roles">Multiple Roles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.destinataires === "specific_classes" && (
                <div className="space-y-2">
                  <Label>Select Classes</Label>
                  <Select value={formData.classesSpecifiques[0] || ""} onValueChange={(value) => handleSelectChange("classesSpecifiques", [value])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((classe) => (
                        <SelectItem key={classe._id} value={classe._id}>{classe.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* ✅ Replace Input with DatePicker */}
              <div className="space-y-2">
                <Label htmlFor="dateExpiration">Expiration Date (Optional)</Label>
                <DatePicker
                  date={formData.dateExpiration}
                  setDate={handleDateExpirationChange}
                  placeholder="Select expiration date"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Announcement"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Announcement</DialogTitle>
              <DialogDescription>Update announcement details</DialogDescription>
            </DialogHeader>

            {dialogError && (
              <Alert className="border-red-500 bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="ml-2 text-red-900">
                  {dialogError}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-titre">Title *</Label>
                <Input id="edit-titre" name="titre" value={formData.titre} onChange={handleChange} placeholder="Announcement title" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-contenu">Content *</Label>
                <Textarea id="edit-contenu" name="contenu" value={formData.contenu} onChange={handleChange} placeholder="Announcement content" rows={4} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={formData.priorite} onValueChange={(value) => handleSelectChange("priorite", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target</Label>
                  <Select value={formData.destinataires} onValueChange={(value) => handleSelectChange("destinataires", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="students">Students Only</SelectItem>
                      <SelectItem value="teachers">Teachers Only</SelectItem>
                      <SelectItem value="admins">Admins Only</SelectItem>
                      <SelectItem value="specific_classes">Specific Classes</SelectItem>
                      <SelectItem value="multiple_roles">Multiple Roles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.destinataires === "specific_classes" && (
                <div className="space-y-2">
                  <Label>Select Classes</Label>
                  <Select value={formData.classesSpecifiques[0] || ""} onValueChange={(value) => handleSelectChange("classesSpecifiques", [value])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((classe) => (
                        <SelectItem key={classe._id} value={classe._id}>{classe.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* ✅ Replace Input with DatePicker */}
              <div className="space-y-2">
                <Label htmlFor="edit-dateExpiration">Expiration Date (Optional)</Label>
                <DatePicker
                  date={formData.dateExpiration}
                  setDate={handleDateExpirationChange}
                  placeholder="Select expiration date"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleUpdate} disabled={submitting}>
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : "Update Announcement"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Delete Announcement
              </DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the announcement and all related notifications.
              </DialogDescription>
            </DialogHeader>

            {selectedAnnouncement && (
              <div className="py-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold mb-1">{selectedAnnouncement.titre}</div>
                    <div className="text-sm text-muted-foreground">{selectedAnnouncement.contenu}</div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Announcement
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stats Dialog */}
        <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Announcement Statistics</DialogTitle>
            </DialogHeader>
            {stats && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{stats.totalTarget}</div>
                      <div className="text-xs text-muted-foreground">Target Users</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{stats.totalViews}</div>
                      <div className="text-xs text-muted-foreground">Views</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{stats.viewRate}</div>
                      <div className="text-xs text-muted-foreground">View Rate</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
