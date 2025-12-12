import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  BookOpen,
  TrendingUp,
  NotebookPen,
  Settings,
  
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const stats = [
    {
      title: "Total Students",
      value: "1,234",
      icon: Users,
      change: "+12%",
      color: "from-primary to-primaryLight",
    },
    {
      title: "Total Teachers",
      value: "89",
      icon: Users,
      change: "+5%",
      color: "from-secondary to-accent",
    },
    {
      title: "Active Courses",
      value: "45",
      icon: BookOpen,
      change: "+8%",
      color: "from-accent to-primary",
    },
    {
      title: "Attendance Rate",
      value: "94%",
      icon: TrendingUp,
      change: "+3%",
      color: "from-primaryLight to-secondary",
    },
  ];

  const adminActions = [
    {
      title: "Manage users",
      description: "Add, edit, or remove students",
      icon: Users,
      route: ROUTES.ADMIN_USERS,
    },
    {
      title: "Manage Courses",
      description: "Create and manage course offerings",
      icon: NotebookPen,
      route: ROUTES.ADMIN_COURSES,
    },
    {
      title: "Manage Classes",
      description: "Create and manage classes",
      icon: BookOpen,
      route: ROUTES.ADMIN_CLASSES,
    },

    {
      title: "View Reports",
      description: "Analytics and performance reports",
      icon: TrendingUp,
      route: ROUTES.ADMIN_REPORTS,
    },
    {
      title: "System Settings",
      description: "Configure system preferences",
      icon: Settings,
      route: ROUTES.ADMIN_SETTINGS,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, Administrator
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`}
            ></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-accent mt-1">
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminActions.map((action, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-lg transition-all duration-300 group"
              onClick={() => navigate(action.route)}
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {action.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Activity</CardTitle>
          <CardDescription>Latest updates and changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                action: "New teacher registered",
                user: "Dr. Sarah Johnson",
                time: "2 hours ago",
              },
              {
                action: "Course updated",
                user: "Mathematics 101",
                time: "5 hours ago",
              },
              {
                action: "Student enrolled",
                user: "John Smith - Physics",
                time: "1 day ago",
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 border-b last:border-0"
              >
                <div>
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.user}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
