import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  Trash2,
  Loader2,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  getNotificationsByUser,
  markNotificationAsRead,
  deleteNotification,
  deleteAllNotificationsOfUser,
} from "@/services/notificationService";
import { getUserAuth } from "@/services/userService";
import { useSocket } from "@/hooks/useSocket";

const ICONS = {
  success: CheckCircle2,
  warning: AlertCircle,
  info: Info,
  demande: Bell,
  annonce: Info,
  default: Bell,
};

const COLORS = {
  success: "from-accent to-secondary",
  warning: "from-secondary to-primary",
  info: "from-primary to-secondary",
  demande: "from-blue-500 to-cyan-500",
  annonce: "from-purple-500 to-pink-500",
  default: "from-primary to-accent",
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);

  // Modal/dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingNotif, setDeletingNotif] = useState(null);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);

  // Button loaders and error states
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteAllError, setDeleteAllError] = useState(null);

  // Get stored user for socket
  const storedUser = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("user") || "{}")
    : {};
  const socket = useSocket(storedUser._id);

  // Fetch user & notifications
  const fetchNotifications = async () => {
    setLoading(true);
    setDeleteError(null);
    setDeleteAllError(null);
    try {
      const userResponse = await getUserAuth();
      const userData = userResponse.data || userResponse;
      setUser(userData);
      const noteData = await getNotificationsByUser(userData._id || userData.id);
      const transformed = noteData
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((notif) => ({
          id: notif._id,
          type: notif.type || "default",
          title: notif.title || notif.message?.slice(0, 50) || "Notification",
          message: notif.message || "",
          date: new Date(notif.createdAt).toLocaleString(),
          unread: !notif.estLu,
          icon: ICONS[notif.type] || ICONS.default,
          color: COLORS[notif.type] || COLORS.default,
        }));
      setNotifications(transformed);
    } catch (err) {
      setToast({ type: "error", message: "Failed to load notifications" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Listen for real-time notifications via socket
  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (notification) => {
      console.log("🔔 Nouvelle notification reçue:", notification);
      // Refetch to get the latest
      fetchNotifications();
    };
    socket.on("receiveNotification", handleNewNotification);
    return () => {
      socket.off("receiveNotification", handleNewNotification);
    };
  }, [socket]);

  // Listen for cross-component updates (e.g., from layout dropdown)
  useEffect(() => {
    const handleUpdate = () => fetchNotifications();
    window.addEventListener("notificationsUpdated", handleUpdate);
    return () => window.removeEventListener("notificationsUpdated", handleUpdate);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    setMarkAllLoading(true);
    try {
      await Promise.all(
        notifications.filter((n) => n.unread).map((n) => markNotificationAsRead(n.id))
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
      window.dispatchEvent(new Event("notificationsUpdated"));
      setToast({ type: "success", message: "All notifications marked as read" });
    } catch {
      setToast({ type: "error", message: "Failed to mark all as read" });
    }
    setMarkAllLoading(false);
    setTimeout(() => setToast(null), 2000);
  };

  // Mark single as read
  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
      );
      window.dispatchEvent(new Event("notificationsUpdated"));
      setToast({ type: "success", message: "Notification marked as read" });
      setTimeout(() => setToast(null), 1800);
    } catch {
      setToast({ type: "error", message: "Failed to mark as read" });
      setTimeout(() => setToast(null), 1800);
    }
  };

  // Delete one
  const handleDeleteNotif = async () => {
    if (!deletingNotif) return;
    setDeleteError(null);
    try {
      await deleteNotification(deletingNotif.id);
      setNotifications((prev) => prev.filter((n) => n.id !== deletingNotif.id));
      window.dispatchEvent(new Event("notificationsUpdated"));
      setToast({ type: "success", message: "Notification deleted" });
      setTimeout(() => setToast(null), 1800);
      setIsDeleteDialogOpen(false);
      setDeletingNotif(null);
    } catch (err) {
      setDeleteError(err?.response?.data?.message || "Failed to delete notification");
    }
  };

  // Delete all
  const handleDeleteAll = async () => {
    setDeleteAllLoading(true);
    setDeleteAllError(null);
    try {
      await deleteAllNotificationsOfUser(user._id || user.id);
      setNotifications([]);
      window.dispatchEvent(new Event("notificationsUpdated"));
      setToast({ type: "success", message: "All notifications deleted" });
      setTimeout(() => setToast(null), 2000);
      setIsDeleteAllDialogOpen(false);
    } catch (err) {
      setDeleteAllError(err?.response?.data?.message || "Failed to delete all notifications");
    }
    setDeleteAllLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 md:p-8">
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
        <div className="mb-8 animate-fade-in flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <Badge className="bg-accent text-white">{unreadCount} new</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-lg">Your academic updates</p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={handleMarkAllAsRead} disabled={markAllLoading}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {markAllLoading ? "Marking..." : "Mark All Read"}
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="destructive" onClick={() => setIsDeleteAllDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All
              </Button>
            )}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading notifications...</p>
          </div>
        )}

        {/* No notifications */}
        {!loading && notifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">No new notifications</p>
            <p className="text-sm text-muted-foreground mt-2">You're all caught up!</p>
          </div>
        )}

        {/* List */}
        <div className="space-y-4">
          {!loading &&
            notifications.map((notif, index) => {
              const Icon = notif.icon;
              return (
                <React.Fragment key={notif.id}>
                  <Card
                    style={{ animationDelay: `${index * 0.1}s` }}
                    className="group p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-scale-in border-none overflow-hidden relative"
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${notif.color} opacity-5 group-hover:opacity-10 transition-opacity`}
                    />
                    <div className="relative z-10 flex items-start gap-4">
                      <div
                        className={`h-12 w-12 rounded-xl bg-gradient-to-br ${notif.color} flex items-center justify-center flex-shrink-0 shadow-lg`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2 gap-4">
                          <h3 className="font-bold text-lg">{notif.title}</h3>
                          <div className="flex items-center gap-2">
                            {notif.unread && <Badge className="bg-accent text-white">New</Badge>}
                            {notif.unread && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notif.id)}
                                title="Mark as read"
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeletingNotif(notif);
                                setIsDeleteDialogOpen(true);
                                setDeleteError(null);
                              }}
                              title="Delete notification"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notif.message}</p>
                        <p className="text-xs text-muted-foreground">{notif.date}</p>
                      </div>
                    </div>
                  </Card>
                </React.Fragment>
              );
            })}
        </div>

        {/* Confirm Delete One */}
        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            setIsDeleteDialogOpen(open);
            if (!open) setDeletingNotif(null);
            setDeleteError(null);
          }}
        >
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Delete Notification</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this notification? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {deleteError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{deleteError}</AlertDescription>
              </Alert>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteNotif} className="w-full sm:w-auto">
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm Delete All */}
        <Dialog open={isDeleteAllDialogOpen} onOpenChange={(open) => setIsDeleteAllDialogOpen(open)}>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Delete ALL Notifications</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <b>ALL</b> your notifications? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            {deleteAllError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{deleteAllError}</AlertDescription>
              </Alert>
            )}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteAllDialogOpen(false)}
                disabled={deleteAllLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAll}
                disabled={deleteAllLoading}
                className="w-full sm:w-auto"
              >
                {deleteAllLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete All
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Notifications;
