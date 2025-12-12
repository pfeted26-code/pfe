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

export default function TeacherAnnouncements() {
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

      // Filter relevant announcements for teachers
      const relevantAnnouncements = announcementsData.filter((announcement) => {
        if (
          announcement.dateExpiration &&
          new Date(announcement.dateExpiration) < new Date()
        )
          return false;

        if (
          announcement.destinataires === "all" ||
          announcement.destinataires === "teachers"
        )
          return true;

        if (announcement.destinataires === "specific_users") {
          return announcement.utilisateursSpecifiques?.some(
            (u) => (u._id || u) === userData._id
          );
        }

        if (announcement.destinataires === "multiple_roles") {
          return announcement.rolesMultiples?.includes("enseignant");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Header Section */}
        <div className="mb-12">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/15 to-primary/20 rounded-3xl blur-3xl" />
            <Card className="relative border-0 bg-gradient-to-br from-white/90 via-white/95 to-white/90 dark:from-slate-900/90 dark:via-slate-800/95 dark:to-slate-900/90 shadow-2xl backdrop-blur-xl">
              <CardContent className="p-8 sm:p-10 lg:p-12">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-3xl blur-2xl opacity-70" />
                    <div className="relative bg-gradient-to-br from-primary via-secondary to-primary p-6 rounded-3xl shadow-2xl">
                      <Megaphone className="h-12 w-12 lg:h-16 lg:w-16 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent leading-tight">
                          Announcements
                        </h1>
                        <p className="text-muted-foreground text-lg lg:text-xl font-medium mt-2">
                          Stay updated with important information and events
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <div className="flex-shrink-0">
                          <Badge className="bg-gradient-to-r from-primary to-secondary text-white text-lg px-6 py-3 shadow-xl border-0 animate-pulse">
                            <Sparkles className="h-5 w-5 mr-2" />
                            {unreadCount} new
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className={`flex-1 rounded-2xl font-bold transition-all duration-300 text-base py-6 lg:py-7 shadow-lg hover:shadow-xl border-2 ${
              filter === "all"
                ? "bg-gradient-to-r from-primary to-secondary text-white border-transparent hover:scale-105"
                : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-primary/50"
            }`}
          >
            <span className="flex items-center gap-3">
              <Megaphone className="h-5 w-5" />
              All Announcements
            </span>
            <span className={`ml-3 px-3 py-1 rounded-full text-sm font-semibold ${
              filter === "all"
                ? "bg-white/20 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}>
              {announcements.length}
            </span>
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            onClick={() => setFilter("unread")}
            className={`flex-1 rounded-2xl font-bold transition-all duration-300 text-base py-6 lg:py-7 shadow-lg hover:shadow-xl border-2 ${
              filter === "unread"
                ? "bg-gradient-to-r from-primary to-secondary text-white border-transparent hover:scale-105"
                : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-primary/50"
            }`}
          >
            <span className="flex items-center gap-3">
              <Eye className="h-5 w-5" />
              Unread Only
            </span>
            <span className={`ml-3 px-3 py-1 rounded-full text-sm font-semibold ${
              filter === "unread"
                ? "bg-white/20 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}>
              {unreadCount}
            </span>
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20 lg:py-32">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full blur-xl opacity-30 animate-pulse" />
              <div className="relative bg-white dark:bg-slate-900 p-8 rounded-full shadow-2xl">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
              </div>
            </div>
            <p className="mt-8 text-muted-foreground font-bold text-xl">
              Loading announcements...
            </p>
          </div>
        )}

        {/* No announcements */}
        {!loading && filteredAnnouncements.length === 0 && (
          <Card className="text-center py-20 lg:py-32 shadow-2xl border-0 bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-900/80 dark:to-slate-800/80 backdrop-blur">
            <CardContent className="space-y-6">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full blur-2xl opacity-20" />
                <div className="relative bg-slate-100 dark:bg-slate-800 p-8 rounded-full">
                  <Megaphone className="h-20 w-20 text-slate-400 dark:text-slate-500" />
                </div>
              </div>
              <div>
                <p className="text-3xl lg:text-4xl font-black text-foreground mb-3">
                  {filter === "unread"
                    ? "You're all caught up!"
                    : "No announcements yet"}
                </p>
                <p className="text-muted-foreground text-lg lg:text-xl font-medium">
                  {filter === "unread"
                    ? "All announcements have been read"
                    : "Check back later for updates!"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Announcements Grid */}
        {!loading && filteredAnnouncements.length > 0 && (
          <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {filteredAnnouncements.map((announcement, index) => {
              const TypeIcon = getTypeIcon(announcement.type);
              const unread = isUnread(announcement);

              return (
                <Card
                  key={announcement._id}
                  className={`cursor-pointer group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/50 backdrop-blur-sm ${
                    unread
                      ? "ring-4 ring-primary/30 ring-offset-4 ring-offset-background shadow-primary/20"
                      : "shadow-xl"
                  }`}
                  onClick={() => handleViewAnnouncement(announcement)}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                >
                  <div className={`h-3 bg-gradient-to-r ${getTypeColor(announcement.type)} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                  <CardContent className="p-8">
                    <div className="flex gap-6">
                      <div className="relative flex-shrink-0">
                        <div className={`absolute inset-0 bg-gradient-to-br ${getTypeColor(announcement.type)} rounded-2xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity`} />
                        <div
                          className={`relative h-20 w-20 rounded-2xl bg-gradient-to-br ${getTypeColor(
                            announcement.type
                          )} flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300`}
                        >
                          <TypeIcon className="h-10 w-10 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                              <h3 className="font-black text-xl lg:text-2xl text-foreground group-hover:text-primary transition-colors leading-tight">
                                {announcement.titre}
                              </h3>
                              {unread && (
                                <Badge className="bg-gradient-to-r from-primary to-secondary text-white border-0 shadow-lg animate-bounce text-sm px-3 py-1">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  NEW
                                </Badge>
                              )}
                            </div>
                            <Badge
                              className={`${getPriorityStyle(announcement.priorite)} border-2 font-bold uppercase text-sm px-4 py-2 shadow-md`}
                            >
                              {announcement.priorite} Priority
                            </Badge>
                          </div>
                        </div>
                        <p className="text-muted-foreground leading-relaxed text-base lg:text-lg line-clamp-3 group-hover:text-foreground/80 transition-colors">
                          {announcement.contenu}
                        </p>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                          <span className="flex items-center gap-2 font-semibold">
                            <Clock className="h-5 w-5 text-primary" />
                            {formatDate(announcement.createdAt)}
                          </span>
                          <span className="flex items-center gap-2 font-semibold">
                            <Eye className="h-5 w-5 text-primary" />
                            {announcement.nombreVues || 0} views
                          </span>
                          {announcement.dateExpiration && (
                            <span className="flex items-center gap-2 text-orange-500 dark:text-orange-400 font-semibold">
                              <Calendar className="h-5 w-5" />
                              Expires {new Date(announcement.dateExpiration).toLocaleDateString()}
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
        )}

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 shadow-2xl">
            {selectedAnnouncement && (
              <>
                <DialogHeader className="pb-6">
                  <div className="flex items-start gap-6 mb-6">
                    <div className="relative">
                      <div className={`absolute inset-0 bg-gradient-to-br ${getTypeColor(selectedAnnouncement.type)} rounded-3xl blur-xl opacity-60`} />
                      <div
                        className={`relative h-20 w-20 rounded-3xl bg-gradient-to-br ${getTypeColor(
                          selectedAnnouncement.type
                        )} flex items-center justify-center shadow-2xl`}
                      >
                        {React.createElement(getTypeIcon(selectedAnnouncement.type), {
                          className: "h-10 w-10 text-white",
                        })}
                      </div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <DialogTitle className="text-3xl lg:text-4xl font-black leading-tight">
                        {selectedAnnouncement.titre}
                      </DialogTitle>
                      <div className="flex gap-3 flex-wrap">
                        <Badge
                          className={`${getPriorityStyle(selectedAnnouncement.priorite)} border-2 font-bold uppercase text-base px-4 py-2`}
                        >
                          {selectedAnnouncement.priorite} Priority
                        </Badge>
                        <Badge variant="outline" className="text-base px-4 py-2 border-2 font-semibold">
                          {selectedAnnouncement.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-8">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
                    <h4 className="font-bold mb-4 text-lg text-muted-foreground uppercase tracking-wide">
                      Message
                    </h4>
                    <p className="text-lg leading-relaxed text-foreground">
                      {selectedAnnouncement.contenu}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200/50 dark:border-slate-700/50">
                      <p className="text-sm text-muted-foreground mb-2 font-semibold uppercase tracking-wide">Posted</p>
                      <p className="text-lg font-bold text-foreground">
                        {new Date(selectedAnnouncement.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {selectedAnnouncement.dateExpiration && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-5 border border-orange-200/50 dark:border-orange-700/50">
                        <p className="text-sm text-orange-600 dark:text-orange-400 mb-2 font-semibold uppercase tracking-wide">Expires</p>
                        <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                          {new Date(selectedAnnouncement.dateExpiration).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-5 border border-primary/20">
                    <p className="text-base text-muted-foreground flex items-center gap-3 font-semibold">
                      <Eye className="h-6 w-6 text-primary" />
                      Viewed by {selectedAnnouncement.nombreVues || 0} teacher{selectedAnnouncement.nombreVues !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}