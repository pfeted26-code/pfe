import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Megaphone,
  Eye,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Calendar,
  Settings,
  Clock,
  Sparkles,
} from "lucide-react";

import {
  getAllAnnouncements,
  markAnnouncementAsViewed,
} from "@/services/announcementService";
import { getUserAuth } from "@/services/userService";

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [filter, setFilter] = useState("all");
  const [isMobile, setIsMobile] = useState(false);

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

  const getPriorityStyle = (priorite) => {
    const styles = {
      low: "bg-muted/80 text-muted-foreground border-muted",
      normal:
        "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      high: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      urgent: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    };
    return styles[priorite] || styles.normal;
  };

  // Responsive check
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch announcements from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const userResponse = await getUserAuth();
      const userData = userResponse.data || userResponse;
      setUser(userData);

      const announcementsData = await getAllAnnouncements();

      // Filter relevant announcements
      const relevantAnnouncements = announcementsData.filter((announcement) => {
        if (
          announcement.dateExpiration &&
          new Date(announcement.dateExpiration) < new Date()
        )
          return false;

        if (
          announcement.destinataires === "all" ||
          announcement.destinataires === "students"
        )
          return true;

        if (announcement.destinataires === "specific_classes") {
          const studentClassId = userData.classe?._id || userData.classe;
          return announcement.classesSpecifiques?.some(
            (c) => (c._id || c) === studentClassId
          );
        }

        if (announcement.destinataires === "specific_users") {
          return announcement.utilisateursSpecifiques?.some(
            (u) => (u._id || u) === userData._id
          );
        }

        if (announcement.destinataires === "multiple_roles") {
          return announcement.rolesMultiples?.includes("etudiant");
        }

        return false;
      });

      // Sort by newest first
      const sorted = relevantAnnouncements.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setAnnouncements(sorted);
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
      showToast("error", "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch + refresh on 'announcementUpdated' event
  useEffect(() => {
    fetchData(); // initial fetch

    // Poll every 10 seconds
    const interval = setInterval(fetchData, 10000);

    return () => clearInterval(interval);
  }, []);
  const handleViewAnnouncement = async (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDetailDialog(true);

    const hasViewed = announcement.vues?.some(
      (v) => (v.utilisateur?._id || v.utilisateur) === user._id
    );

    if (!hasViewed) {
      try {
        await markAnnouncementAsViewed(announcement._id);
        setAnnouncements((prev) =>
          prev.map((a) =>
            a._id === announcement._id
              ? {
                  ...a,
                  nombreVues: (a.nombreVues || 0) + 1,
                  vues: [
                    ...(a.vues || []),
                    { utilisateur: user._id, dateVue: new Date() },
                  ],
                }
              : a
          )
        );
      } catch (err) {
        console.error("Failed to mark as viewed:", err);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const isUnread = (announcement) =>
    !announcement.vues?.some(
      (v) => (v.utilisateur?._id || v.utilisateur) === user?._id
    );

  const filteredAnnouncements = announcements.filter((announcement) =>
    filter === "unread" ? isUnread(announcement) : true
  );

  const unreadCount = announcements.filter(isUnread).length;

  return (
    <div className="w-full">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 sm:top-24 right-3 sm:right-6 left-3 sm:left-auto z-50 animate-in slide-in-from-top-5">
          <Alert
            className={`min-w-[280px] sm:min-w-[320px] shadow-2xl border-2 ${
              toast.type === "success"
                ? "bg-green-50 dark:bg-green-950 border-green-500 text-green-900 dark:text-green-100"
                : "bg-red-50 dark:bg-red-950 border-red-500 text-red-900 dark:text-red-100"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
            )}
            <AlertDescription className="font-semibold ml-2 text-xs sm:text-sm">
              {toast.message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 sm:mb-8 md:mb-10">
        <Card className="border-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 shadow-lg">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-xl sm:rounded-2xl blur-lg sm:blur-xl opacity-60" />
                <div className="relative bg-gradient-to-r from-primary to-secondary p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-xl">
                  <Megaphone className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                  Announcements
                </h1>
              </div>
              {unreadCount > 0 && (
                <Badge className="bg-gradient-to-r from-primary to-secondary text-white text-sm sm:text-base md:text-lg px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 shadow-xl border-0">
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg font-medium">
              Stay updated with important information and events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6 sm:mb-8">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          className={`flex-1 rounded-lg sm:rounded-xl font-semibold transition-all touch-manipulation text-sm sm:text-base py-5 sm:py-6 ${
            filter === "all"
              ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl"
              : "hover:bg-accent"
          }`}
        >
          All <span className="ml-2 opacity-70">({announcements.length})</span>
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          onClick={() => setFilter("unread")}
          className={`flex-1 rounded-lg sm:rounded-xl font-semibold transition-all touch-manipulation text-sm sm:text-base py-5 sm:py-6 ${
            filter === "unread"
              ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl"
              : "hover:bg-accent"
          }`}
        >
          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          Unread <span className="ml-2 opacity-70">({unreadCount})</span>
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 sm:py-16 md:py-20">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 sm:mt-6 text-muted-foreground font-semibold text-base sm:text-lg">
            Loading announcements...
          </p>
        </div>
      )}

      {/* No announcements */}
      {!loading && filteredAnnouncements.length === 0 && (
        <Card className="text-center py-12 sm:py-16 md:py-20">
          <CardContent>
            <Megaphone className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground/40 mx-auto mb-4 sm:mb-6" />
            <p className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              {filter === "unread"
                ? "You're all caught up!"
                : "No announcements yet"}
            </p>
            <p className="text-muted-foreground text-sm sm:text-base">
              {filter === "unread"
                ? "All announcements have been read"
                : "Check back later for updates!"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Announcements List */}
      <div className="space-y-3 sm:space-y-4">
        {filteredAnnouncements.map((announcement) => {
          const TypeIcon = getTypeIcon(announcement.type);
          const unread = isUnread(announcement);

          return (
            <Card
              key={announcement._id}
              className={`cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden touch-manipulation active:scale-[0.98] ${
                unread
                  ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
                  : ""
              }`}
              onClick={() => handleViewAnnouncement(announcement)}
            >
              <div
                className={`h-1 sm:h-1.5 bg-gradient-to-r ${getTypeColor(
                  announcement.type
                )}`}
              />
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="flex items-start gap-3 sm:gap-4 md:gap-5">
                  <div
                    className={`h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br ${getTypeColor(
                      announcement.type
                    )} flex items-center justify-center flex-shrink-0 shadow-lg`}
                  >
                    <TypeIcon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-wrap">
                      <h3 className="font-bold text-base sm:text-lg md:text-xl text-foreground break-words">
                        {announcement.titre}
                      </h3>
                      {unread && (
                        <Badge className="bg-gradient-to-r from-primary to-secondary text-white border-0 shadow-md text-xs">
                          NEW
                        </Badge>
                      )}
                      <Badge
                        className={`${getPriorityStyle(
                          announcement.priorite
                        )} border font-semibold uppercase text-[10px] sm:text-xs`}
                      >
                        {announcement.priorite}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3 sm:mb-4 line-clamp-2 leading-relaxed text-sm sm:text-base">
                      {announcement.contenu}
                    </p>
                    <div className="flex items-center gap-3 sm:gap-4 md:gap-5 text-xs sm:text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1 sm:gap-1.5 font-medium">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        {formatDate(announcement.createdAt)}
                      </span>
                      <span className="flex items-center gap-1 sm:gap-1.5 font-medium">
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        {announcement.nombreVues || 0} views
                      </span>
                      {announcement.dateExpiration && (
                        <span className="flex items-center gap-1 sm:gap-1.5 text-orange-500 dark:text-orange-400 font-medium">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          Expires{" "}
                          {new Date(
                            announcement.dateExpiration
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedAnnouncement && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`h-14 w-14 rounded-xl bg-gradient-to-br ${getTypeColor(
                      selectedAnnouncement.type
                    )} flex items-center justify-center flex-shrink-0`}
                  >
                    {React.createElement(
                      getTypeIcon(selectedAnnouncement.type),
                      {
                        className: "h-7 w-7 text-white",
                      }
                    )}
                  </div>

                  <div className="flex-1">
                    <DialogTitle className="text-2xl mb-2 flex items-center gap-2">
                      {selectedAnnouncement.titre}
                    </DialogTitle>

                    <div className="flex gap-2">
                      <Badge
                        className={`${getPriorityStyle(
                          selectedAnnouncement.priorite
                        )} border font-semibold uppercase`}
                      >
                        {selectedAnnouncement.priorite}
                      </Badge>

                      <Badge variant="outline">
                        {selectedAnnouncement.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 text-sm text-muted-foreground">
                    Message:
                  </h4>
                  <p className="text-base leading-relaxed">
                    {selectedAnnouncement.contenu}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Posted</p>
                    <p className="text-sm font-medium">
                      {new Date(
                        selectedAnnouncement.createdAt
                      ).toLocaleString()}
                    </p>
                  </div>

                  {selectedAnnouncement.dateExpiration && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Expires
                      </p>
                      <p className="text-sm font-medium text-orange-600">
                        {new Date(
                          selectedAnnouncement.dateExpiration
                        ).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Viewed by {selectedAnnouncement.nombreVues || 0} student
                    {selectedAnnouncement.nombreVues !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
