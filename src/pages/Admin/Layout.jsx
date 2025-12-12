import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/Sidebars/AdminSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Menu, User, Bell, Sun, Moon, LogOut, Loader2, CheckCircle, Trash2 } from "lucide-react";
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
import { getAllNotifications, deleteNotification } from "@/services/notificationService";
import { getUserAuth } from "@/services/userService";
import { useSocket } from "@/hooks/useSocket";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const audioRef = useRef(null);

  const storedUser = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("user") || "{}")
    : {};
  const userName = storedUser.prenom
    ? `${storedUser.prenom} ${storedUser.nom ?? ""}`.trim()
    : storedUser.nom ?? "";
  const userEmail = storedUser.email ?? "";
  const avatarSrc = storedUser.image_User
    ? `${API_BASE_URL}/images/${storedUser.image_User}`
    : "/placeholder-avatar.jpg";
  const avatarFallback = (storedUser.prenom?.[0] ?? "U") + (storedUser.nom?.[0] ?? "");

  const socket = useSocket(storedUser._id);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.volume = 0.5;

    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }).catch(() => {});
        document.removeEventListener('click', unlockAudio);
      }
    };
    document.addEventListener('click', unlockAudio);
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      document.removeEventListener('click', unlockAudio);
    };
  }, []);

  // Listen to custom event to trigger fetch everywhere (dropdown and notif page)
  useEffect(() => {
    const handler = () => fetchNotifications();
    window.addEventListener('notificationsUpdated', handler);
    return () => window.removeEventListener('notificationsUpdated', handler);
  }, []);

  useEffect(() => { fetchNotifications(); }, []);

  // Real-time updates (socket): update & update everywhere by firing event
  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (notification) => {
      if (notification.type === "demande" && notification.message?.includes("a demandé")) {
        setNotifications(prev => {
          const newNotification = {
            id: notification._id || Date.now(),
            message: notification.message,
            date: formatDate(new Date()),
            unread: true,
          };
          const isDuplicate = prev.some(n => n.id === newNotification.id);
          if (isDuplicate) return prev;
          return [newNotification, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date));
        });
        playNotificationSound();
        window.dispatchEvent(new Event("notificationsUpdated")); // trigger everywhere
      }
    };
    socket.on('receiveNotification', handleNewNotification);
    return () => { socket.off('receiveNotification', handleNewNotification); };
  }, [socket]);

  const playNotificationSound = () => {
    if (!audioRef.current) return;
    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch {}
  };

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const userResponse = await getUserAuth();
      const userData = userResponse.data || userResponse;
      setCurrentUser(userData);

      const notificationsData = await getAllNotifications();
      const filteredNotifications = notificationsData.filter(notif => {
        const isDemandeType = notif.type === "demande";
        const isCreationMessage = notif.message?.includes("a demandé");
        const isForCurrentUser = notif.utilisateur?._id === userData._id || notif.utilisateur === userData._id;
        return isDemandeType && isCreationMessage && isForCurrentUser;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(notif => ({
        id: notif._id,
        message: notif.message || "New notification",
        date: formatDate(notif.createdAt),
        unread: !notif.estLu,
      }));

      setNotifications(filteredNotifications);
    } catch (err) {
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Delete and update badge in real-time, then tell all listeners
  const handleDeleteNotification = async (notifId) => {
    try {
      await deleteNotification(notifId);
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      window.dispatchEvent(new Event("notificationsUpdated"));
    } catch {}
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch(`${API_BASE_URL}/users/logout`, {
        method: "POST",
        credentials: "include",
      });
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setShowLogoutSuccess(true);
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (error) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setShowLogoutSuccess(true);
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-hidden">
        <AdminSidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0">
          {/* HEADER (fixed) */}
          <header className="fixed top-0 left-0 right-0 z-50 flex h-14 sm:h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-3 sm:px-4 md:px-6 shadow-sm"
            style={{ minWidth: 0 }}>
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <SidebarTrigger className="-ml-1 sm:-ml-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 touch-manipulation">
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </SidebarTrigger>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-xs sm:text-sm font-bold text-white">E</span>
                </div>
                <h1 className="text-sm sm:text-base md:text-lg font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent truncate">
                  {isMobile ? "EduNex" : "EduNex Admin Portal"}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-8 w-8 sm:h-9 sm:w-9 touch-manipulation"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
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
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-[10px] sm:text-xs animate-pulse"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
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
                      <span className="font-bold text-sm sm:text-base">Notifications</span>
                      {loadingNotifications && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div>
                    {!loadingNotifications && notifications.length === 0 && (
                      <div className="p-6 sm:p-8 text-center text-muted-foreground text-xs sm:text-sm">
                        No new requests
                      </div>
                    )}
                    {/* SHOW ONLY LAST 3 */}
                    {notifications.slice(0, 3).map((notif) => (
                      <div
                        key={notif.id}
                        className={`flex items-start gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-b last:border-b-0 hover:bg-accent/20 cursor-pointer transition-all duration-200 active:bg-accent/30 ${
                          notif.unread ? "bg-gradient-to-r from-primary/5 to-secondary/5" : ""
                        }`}
                      >
                        {notif.unread ? (
                          <span className="mt-2 mr-0.5 sm:mr-1 w-2 h-2 rounded-full bg-primary inline-block animate-pulse flex-shrink-0" />
                        ) : (
                          <span className="mt-2 mr-0.5 sm:mr-1 w-2 h-2 rounded-full bg-gray-400 opacity-50 inline-block flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className={`leading-snug text-xs sm:text-sm ${notif.unread ? "font-semibold" : ""}`}>
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
                      to="/admin/notifications" 
                      className="text-primary hover:underline text-xs sm:text-sm font-medium inline-block py-1 touch-manipulation"
                    >
                      View all notifications
                    </Link>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full touch-manipulation">
                    <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                      <AvatarImage src={avatarSrc} alt={userName} />
                      <AvatarFallback className="text-xs sm:text-sm">{avatarFallback}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 sm:w-64" align="end" sideOffset={8}>
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs sm:text-sm font-medium leading-none truncate">
                        {userName || "Unknown User"}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {userEmail || ""}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/admin/profile" className="flex items-center cursor-pointer touch-manipulation py-2.5 sm:py-2">
                      <User className="mr-2 h-4 w-4" />
                      <span className="text-sm">Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 cursor-pointer touch-manipulation py-2.5 sm:py-2"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    {loggingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span className="text-sm">Logging out...</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span className="text-sm">Log out</span>
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          {/* Spacer for fixed header */}
          <div className="h-14 sm:h-16 w-full shrink-0" />
          {/* Logout Success Alert */}
          {showLogoutSuccess && (
            <div className="fixed top-16 sm:top-20 right-3 sm:right-6 left-3 sm:left-auto z-50 animate-in slide-in-from-top-5">
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100 shadow-lg">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="ml-2 text-xs sm:text-sm">
                  Successfully logged out! Redirecting...
                </AlertDescription>
              </Alert>
            </div>
          )}
          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-background">
            <div className="h-full w-full max-w-[1920px] mx-auto p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8">
              <Outlet />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
