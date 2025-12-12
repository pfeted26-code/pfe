import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  NotebookPen,
  BarChart3,
  Users,
  Settings,
  MessageSquare,
  Bell,
  Megaphone,
  FileText,
  Calendar,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserAuth } from "@/services/userService";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const navItems = [
  { path: "", label: "Dashboard", icon: LayoutDashboard },
  { path: "users", label: "Users", icon: Users },
  { path: "classes", label: "Classes", icon: BookOpen },
  { path: "courses", label: "Courses", icon: NotebookPen },
  { path: "timetable", label: "Timetable", icon: Calendar },
  { path: "requests", label: "Requests", icon: FileText },
  { path: "announcements", label: "Announcements", icon: Megaphone },
  { path: "messages", label: "Messages", icon: MessageSquare },
  { path: "notifications", label: "Notifications", icon: Bell },
];

export function AdminSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const response = await getUserAuth();
        const userData = response.data || response;
        setAdmin(userData);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      }
    };
    fetchAdmin();
  }, []);

  const getInitials = () => {
    if (!admin) return "A";
    const first = admin.prenom?.[0]?.toUpperCase() || "";
    const last = admin.nom?.[0]?.toUpperCase() || "";
    return first + last || "A";
  };

  const getFullName = () => {
    if (!admin) return "Admin";
    return `${admin.prenom || ""} ${admin.nom || ""}`.trim() || "Admin";
  };

  return (
    <Sidebar
      collapsible="icon"
      className={`
        border-r
        transition-[width] duration-200 ease-out
        flex flex-col
        h-screen
        bg-sidebar
        w-[66px] md:w-[260px]
        min-w-0
        z-40
      `}
      style={{
        width: isCollapsed ? 64 : 260,
        minWidth: isCollapsed ? 64 : 220,
        maxWidth: 360,
      }}
    >
      {/* Header */}
      <SidebarHeader className={`
        h-16 min-h-16 max-h-16
        border-b border-border/50
        bg-gradient-to-br from-sidebar to-sidebar/80
        flex items-center flex-shrink-0
        px-0 md:px-0
      `}>
        <Link
          to="/admin/"
          className={`flex items-center w-full transition-all duration-200 ${
            isCollapsed ? "justify-center px-3" : "gap-3 px-4"
          }`}
        >
          <div className="flex items-center justify-center rounded-xl shadow-lg bg-gradient-to-br from-primary to-secondary w-9 h-9 flex-shrink-0">
            <span className="text-base font-bold text-white select-none">E</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col transition-opacity duration-200">
              <span className="text-base font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                EduNex
              </span>
              <span className="text-[10px] text-muted-foreground">Admin Portal</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      {/* Main Menu (NO SCROLL) */}
      <div className="flex-1 min-h-0 flex flex-col">
        <SidebarContent
          className={`flex-1 min-h-0 py-4 transition-all duration-200 ${isCollapsed ? 'px-0' : 'px-2'} relative`}
        >
          <SidebarMenu className="space-y-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === `/admin${item.path ? `/${item.path}` : ""}`;
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.label}
                    className={`hover:bg-accent/50 transition-all duration-200 ${
                      isCollapsed ? "h-11 w-11 p-0 justify-center mx-auto rounded-lg" : "h-11 px-3"
                    } ${
                      isActive
                        ? "bg-gradient-to-r from-primary/15 to-secondary/15 border-l-4 border-primary"
                        : ""
                    }`}
                  >
                    <Link
                      to={item.path}
                      className={`flex items-center w-full ${
                        isCollapsed ? "justify-center" : "gap-3"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 flex-shrink-0 transition-colors ${
                          isActive ? "text-primary" : ""
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="font-medium whitespace-nowrap">{item.label}</span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
      </div>

      {/* Footer/User */}
      <SidebarFooter 
        className={`border-t border-border/50 transition-all duration-200 flex-shrink-0 ${
          isCollapsed ? 'p-2' : 'p-3'
        } bg-sidebar`}
        style={{
          minHeight: "56px",
          maxHeight: "100vh"
        }}
      >
        <Link
          to="/admin/profile"
          className={`flex items-center rounded-lg cursor-pointer
            transition-all hover:bg-accent/40 overflow-hidden
            ${isCollapsed ? 'justify-center p-1.5' : 'gap-2.5 px-2 py-1.5'}
          `}
        >
          <Avatar className="h-8 w-8 border-2 border-primary/20 flex-shrink-0">
            {admin?.image_User ? (
              <AvatarImage 
                src={`${API_BASE_URL}/images/${admin.image_User}`} 
                alt={getFullName()}
              />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold text-xs">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xs font-semibold truncate whitespace-nowrap leading-tight">
                {getFullName()}
              </span>
              <span className="text-[10px] text-muted-foreground truncate whitespace-nowrap leading-tight">
                {admin?.email || "admin@edunex.com"}
              </span>
            </div>
          )}
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
