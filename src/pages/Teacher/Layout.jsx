import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TeacherSidebar } from "@/components/Sidebars/TeacherSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Menu,
  User,
  Bell,
  Sun,
  Moon,
  LogOut,
  Loader2,
  CheckCircle,
  Trash2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useTheme } from "@/contexts/ThemeContext";
import { getUserAuth } from "@/services/userService";

import {
  getNotificationsByUser,
  deleteNotification,
  markNotificationAsRead,
} from "@/services/notificationService";

import { useSocket } from "@/hooks/useSocket";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const TeacherLayout = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [teacher, setTeacher] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);

  const audioRef = useRef(null);

  // Stored user
  const storedUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};

  const socket = useSocket(storedUser._id);

  /* ------------------------ FETCH USER ----------------------- */
  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const res = await getUserAuth();
        setTeacher(res.data || res);
      } catch {
        setTeacher(null);
      }
    };
    fetchTeacher();
  }, []);

  /* -------------------- RESPONSIVE CHECK -------------------- */
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ------------------- NOTIFICATION SOUND ------------------- */
  useEffect(() => {
    audioRef.current = new Audio("/sounds/notification.mp3");
    audioRef.current.volume = 0.5;
    audioRef.current.preload = "auto";

    const unlock = () => {
      if (audioRef.current) {
        audioRef.current
          .play()
          .then(() => {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          })
          .catch(() => {});
        document.removeEventListener("click", unlock);
      }
    };

    document.addEventListener("click", unlock);
    return () => document.removeEventListener("click", unlock);
  }, []);

  /* -------- Listen for notificationsUpdated (debounced) -------- */
  useEffect(() => {
    let timer;
    const handler = () => {
      clearTimeout(timer);
      timer = setTimeout(() => fetchNotifications(), 500);
    };
    window.addEventListener("notificationsUpdated", handler);
    return () => window.removeEventListener("notificationsUpdated", handler);
  }, []);

  /* -------------------- INITIAL FETCH ------------------------ */
 useEffect(() => {
  fetchNotifications(); // do not return the promise
}, []);


  /* -------------------- SOCKET REALTIME ---------------------- */
  useEffect(() => {
    if (!socket) return;
    const receive = (notification) => {
      const userId = notification.utilisateur?._id || notification.utilisateur;
      if (userId !== storedUser._id) return;

      setNotifications((prev) => {
        const id = notification._id;
        if (prev.some((n) => n.id === id)) return prev; // avoid duplicate

        const newNotif = {
          id,
          message: notification.message,
          date: formatDate(notification.createdAt),
          unread: true,
        };

        playSound();
        return [newNotif, ...prev];
      });

      window.dispatchEvent(new Event("notificationsUpdated"));
    };

    socket.on("receiveNotification", receive);
    return () => socket.off("receiveNotification", receive);
  }, [socket]);

  /* ------------------- FUNCTIONS -------------------- */
  const playSound = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  };

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const userRes = await getUserAuth();
      const id = userRes.data?._id || userRes._id;

      const data = await getNotificationsByUser(id);

      setNotifications(
        data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map((n) => ({
            id: n._id,
            message: n.message,
            date: formatDate(n.createdAt),
            unread: !n.estLu,
          }))
      );
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleDelete = async (id) => {
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllAsRead = async () => {
    if (!teacher?._id) return;
    await markNotificationAsRead(teacher._id);
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch(`${API_BASE_URL}/users/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}

    localStorage.removeItem("user");
    localStorage.removeItem("token");

    setShowLogoutSuccess(true);
    setTimeout(() => navigate("/login", { replace: true }), 1200);
  };

  const unread = notifications.filter((n) => n.unread).length;

  const getInitials = () => {
    if (!teacher) return "TC";
    return `${teacher.prenom?.[0] || ""}${
      teacher.nom?.[0] || ""
    }`.toUpperCase();
  };

  const getFullName = () => {
    if (!teacher) return "Teacher User";
    return `${teacher.prenom || ""} ${teacher.nom || ""}`;
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const min = Math.floor((now - d) / 60000);

    if (min < 1) return "Just now";
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;

    return d.toLocaleDateString();
  };

  /* ------------------------- JSX ---------------------------- */
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <TeacherSidebar />

        <SidebarInset>
          {/* HEADER */}
          <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-6">
            {/* LEFT */}
            <div className="flex items-center gap-4">
              <SidebarTrigger>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SidebarTrigger>

              <h1 className="font-semibold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                EduNex Teacher Portal
              </h1>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-2">
              {/* THEME */}
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === "dark" ? <Sun /> : <Moon />}
              </Button>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-10 sm:w-10 relative rounded-full hover:bg-primary/10 transition-all duration-200 hover:scale-105 group touch-manipulation"
                  >
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5 group-hover:text-primary transition-colors" />
                    {unread > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-[10px] sm:text-xs animate-pulse"
                      >
                        {unread > 9 ? "9+" : unread}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[calc(100vw-2rem)] sm:w-80 md:w-96 max-h-[70vh] sm:max-h-96 overflow-y-auto p-0 shadow-lg border-0 bg-background/95 backdrop-blur-sm"
                  sideOffset={8}
                >
                  <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b sticky top-0 z-10 bg-background">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm sm:text-base">
                        Notifications
                      </span>
                      {loadingNotifications && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div>
                    {!loadingNotifications && notifications.length === 0 && (
                      <div className="p-6 sm:p-8 text-center text-muted-foreground text-xs sm:text-sm">
                        No new notifications
                      </div>
                    )}
                    {/* SHOW ONLY LAST 3 */}
                    {notifications.slice(0, 3).map((notif) => (
                      <div
                        key={notif.id}
                        className={`flex items-start gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-b last:border-b-0 hover:bg-accent/20 cursor-pointer transition-all duration-200 active:bg-accent/30 ${
                          notif.unread
                            ? "bg-gradient-to-r from-primary/5 to-secondary/5"
                            : ""
                        }`}
                      >
                        {notif.unread ? (
                          <span className="mt-2 mr-0.5 sm:mr-1 w-2 h-2 rounded-full bg-primary inline-block animate-pulse flex-shrink-0" />
                        ) : (
                          <span className="mt-2 mr-0.5 sm:mr-1 w-2 h-2 rounded-full bg-gray-400 opacity-50 inline-block flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div
                            className={`leading-snug text-xs sm:text-sm ${
                              notif.unread ? "font-semibold" : ""
                            }`}
                          >
                            {notif.message}
                          </div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                            {notif.date}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-2 text-muted-foreground h-5 w-5"
                          onClick={() => handleDeleteNotification(notif.id)}
                          tabIndex={0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 text-center sticky bottom-0 bg-background border-t">
                    <Link
                      to="/teacher/notifications"
                      className="text-primary hover:underline text-xs sm:text-sm font-medium inline-block py-1 touch-manipulation"
                    >
                      View all notifications
                    </Link>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* USER MENU */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="rounded-full p-0">
                    <Avatar>
                      {teacher?.image_User ? (
                        <AvatarImage
                          src={`${API_BASE_URL}/images/${teacher.image_User}`}
                          alt="avatar"
                        />
                      ) : null}
                      <AvatarFallback>{getInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">{getFullName()}</p>
                      <p className="text-xs text-muted-foreground">
                        {teacher?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link to="/teacher/profile">
                      <User className="mr-2 h-4 w-4" /> Profile
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    {loggingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Logging out...
                      </>
                    ) : (
                      <>
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* LOGOUT ALERT */}
          {showLogoutSuccess && (
            <div className="fixed top-20 right-6 z-50">
              <Alert className="bg-green-50 border-green-300">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="ml-2">
                  Logged out successfully! Redirecting...
                </AlertDescription>
              </Alert>
            </div>
          )}

          <main className="flex-1">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default TeacherLayout;
