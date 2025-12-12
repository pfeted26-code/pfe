import React, { useEffect, useState, useRef } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/Sidebars/StudentSidebar";
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
import { getUserAuth } from "@/services/userService";
import {
  getNotificationsByUser,
  deleteNotification
} from "@/services/notificationService";
import { useSocket } from "@/hooks/useSocket";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const StudentLayout = ({ children }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [student, setStudent] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const audioRef = useRef(null);

  const storedUser = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("user") || "{}")
    : {};

  const socket = useSocket(storedUser._id);

  // Get student for avatar
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const response = await getUserAuth();
        setStudent(response.data || response);
      } catch (err) {
        setStudent(null);
      }
    };
    fetchStudent();
  }, []);

  // Responsive check
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Notification sound setup
  useEffect(() => {
    // Try to load the audio file
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.volume = 0.5;
    audioRef.current.preload = 'auto';
    
    // Handle loading errors
    audioRef.current.onerror = (e) => {
      console.error('Audio loading error:', e);
      // Fallback: try different path or use a data URL for a beep sound
      audioRef.current = null;
    };
    
    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          console.log('Audio unlocked successfully');
        }).catch((err) => {
          console.error('Audio unlock failed:', err);
        });
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
      }
    };
    
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Listen to custom event to trigger fetch everywhere (dropdown and notif page)
  // But debounce to avoid fetching immediately after socket update
  useEffect(() => {
    let timeoutId;
    const handler = () => {
      // Debounce fetch to avoid immediate refetch after socket update
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fetchNotifications();
      }, 500);
    };
    window.addEventListener('notificationsUpdated', handler);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('notificationsUpdated', handler);
    };
  }, []);

  // Initial fetch
  useEffect(() => { 
    fetchNotifications(); 
  }, []);

  // Real-time updates (socket): update & update everywhere by firing event
  useEffect(() => {
    if (!socket) {
      console.log('Socket not connected');
      return;
    }
    
    console.log('Socket connected, setting up listener');
    
    const handleNewNotification = (notification) => {
      console.log('🔔 Received notification via socket:', notification);
      console.log('Notification user ID:', notification.utilisateur?._id || notification.utilisateur);
      console.log('Current user ID:', storedUser._id);
      
      // Check if notification is for current user
      const notifUserId = notification.utilisateur?._id || notification.utilisateur;
      if (notifUserId && storedUser._id && notifUserId !== storedUser._id) {
        console.log('Notification not for current user, ignoring');
        return;
      }
      
      console.log('Processing notification for current user');
      
      setNotifications(prev => {
        const newNotification = {
          id: notification._id || `temp-${Date.now()}`,
          message: notification.message || "New notification",
          date: formatDate(notification.createdAt || new Date()),
          unread: true, // Always mark new notifications as unread
        };
        
        const isDuplicate = prev.some(n => n.id === newNotification.id);
        if (isDuplicate) {
          console.log('Duplicate notification detected, skipping');
          return prev;
        }
        
        console.log('Adding new notification to state:', newNotification);
        
        // Play sound
        playNotificationSound();
        
        // Add to beginning of array
        return [newNotification, ...prev];
      });
      
      // Fire event to update other components (like notifications page)
      console.log('Firing notificationsUpdated event');
      window.dispatchEvent(new Event("notificationsUpdated"));
    };
    
    socket.on('receiveNotification', handleNewNotification);
    
    return () => { 
      console.log('Cleaning up socket listener');
      socket.off('receiveNotification', handleNewNotification); 
    };
  }, [socket, storedUser._id]);

  const playNotificationSound = () => {
    console.log('Attempting to play notification sound');
    if (!audioRef.current) {
      console.warn('Audio not initialized');
      return;
    }
    try {
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Sound played successfully');
          })
          .catch((err) => {
            console.error('Sound play failed:', err);
          });
      }
    } catch (err) {
      console.error('Sound play exception:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const userResponse = await getUserAuth();
      const userData = userResponse.data || userResponse;

      // Use getNotificationsByUser instead of getAllNotifications
      const notificationsData = await getNotificationsByUser(userData._id || userData.id);
      console.log('Fetched notifications:', notificationsData);
      
      // Transform and sort notifications
      const transformed = notificationsData
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(notif => ({
          id: notif._id,
          message: notif.message || "New notification",
          date: formatDate(notif.createdAt),
          unread: !notif.estLu,
        }));
      
      console.log('Transformed notifications:', transformed);
      setNotifications(transformed);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
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

  const unreadCount = notifications.filter(n => n.unread).length;

  // Delete and update badge in real-time, then tell all listeners
  const handleDeleteNotification = async (notifId) => {
    try {
      await deleteNotification(notifId);
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      window.dispatchEvent(new Event("notificationsUpdated"));
    } catch {}
  };

  const getInitials = () => {
    if (!student) return "ST";
    const first = student?.prenom?.[0]?.toUpperCase() || "";
    const last = student?.nom?.[0]?.toUpperCase() || "";
    return first + last || "ST";
  };

  const getFullName = () => {
    if (!student) return "Student User";
    return `${student.prenom || ""} ${student.nom || ""}`.trim() || "Student User";
  };

  const avatarSrc = student?.image_User
    ? `${API_BASE_URL}/images/${student.image_User}`
    : "/placeholder-avatar.jpg";

  const avatarFallback = getInitials();

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch(`${API_BASE_URL}/users/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setShowLogoutSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setShowLogoutSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-hidden">
        <StudentSidebar />
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
                  {isMobile ? "EduNex" : "EduNex Student Portal"}
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
                {theme === 'dark'
                  ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
                  : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
                }
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
                        No new notifications
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
                      to="/student/notifications" 
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
                      <AvatarImage src={avatarSrc} alt={getFullName()} />
                      <AvatarFallback className="text-xs sm:text-sm">{avatarFallback}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 sm:w-64" align="end" sideOffset={8}>
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs sm:text-sm font-medium leading-none truncate">
                        {getFullName()}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {student?.email || "student@edunex.com"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/student/profile" className="flex items-center cursor-pointer touch-manipulation py-2.5 sm:py-2">
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

export default StudentLayout;