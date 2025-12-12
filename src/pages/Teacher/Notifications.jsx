import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  Users,
  BookOpen,
  Calendar,
  Loader2,
  XCircle,
  Settings,
  TrendingUp,
  FileText,
  Megaphone,
} from "lucide-react";

import {
  getNotificationsByUser,
  markNotificationAsRead,
  deleteNotification,
  deleteAllNotificationsOfUser,
} from "@/services/notificationService";
import { getUserAuth } from "@/services/userService";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const getNotificationIcon = (type) => {
    const iconMap = {
      avertissement: Settings,
      systeme: Info,
      rappel: CheckCircle2,
      alerte: AlertCircle,
      demande: FileText,
      note: TrendingUp,
      annonce: Megaphone,
    };
    return iconMap[type] || Bell;
  };

  const getNotificationColor = (type) => {
    const colorMap = {
      avertissement: "from-yellow-500 to-orange-500",
      systeme: "from-blue-500 to-cyan-500",
      rappel: "from-green-500 to-emerald-500",
      alerte: "from-red-500 to-orange-500",
      demande: "from-blue-500 to-cyan-500",
      note: "from-purple-500 to-pink-500",
      annonce: "from-purple-500 to-pink-500",
    };
    return colorMap[type] || "from-primary to-secondary";
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const userResponse = await getUserAuth();
      const userData = userResponse.data || userResponse;
      setCurrentUser(userData);

      console.log("Current user data:", userData);
      console.log("User ID:", userData._id || userData.id);

      const notificationsData = await getNotificationsByUser(userData._id || userData.id);
      console.log("Raw notifications data:", notificationsData);

      const transformedNotifications = notificationsData
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((notif) => ({
          id: notif._id,
          type: notif.type || "info",
          title: notif.message?.split(".")[0] || "New Notification",
          message: notif.message || "",
          date: new Date(notif.createdAt).toLocaleString(),
          unread: !notif.estLu,
          icon: getNotificationIcon(notif.type),
          color: getNotificationColor(notif.type),
          utilisateur: notif.utilisateur,
          sender: notif.sender,
          receiver: notif.receiver,
        }));

      console.log("Transformed notifications:", transformedNotifications);
      setNotifications(transformedNotifications);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to load notifications";
      setError(errorMessage);
      showToast("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Mark single notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, unread: false } : notif
        )
      );
      showToast("success", "Notification marked as read");
    } catch (err) {
      showToast(
        "error",
        err.response?.data?.message || "Failed to mark as read"
      );
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => n.unread);
      await Promise.all(
        unreadNotifications.map((notif) => markNotificationAsRead(notif.id))
      );
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, unread: false }))
      );
      showToast("success", "All notifications marked as read");
    } catch (err) {
      showToast("error", "Failed to mark all as read");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 md:p-8">
        {/* Toast Notification */}
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
            <p className="text-muted-foreground text-lg">
              Stay updated with student activities, course updates, and important announcements
            </p>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={handleMarkAllAsRead}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">
              Loading notifications...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <Alert className="border-red-500 bg-red-50">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="ml-2 text-red-900">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!loading && !error && notifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-xl text-muted-foreground">No notifications</p>
            <p className="text-sm text-muted-foreground mt-2">
              You'll be notified when there are updates or important announcements
            </p>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {!loading &&
            !error &&
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
                            {notif.unread && (
                              <Badge className="bg-accent text-white">New</Badge>
                            )}
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
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notif.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notif.date}
                        </p>
                      </div>
                    </div>
                  </Card>
                </React.Fragment>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
