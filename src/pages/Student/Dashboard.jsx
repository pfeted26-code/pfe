import React from "react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Calendar,
  FileText,
  UserCheck,
  Send,
  MessageSquare,
  Bell,
  TrendingUp,
  Clock,
  Award,
  ChevronRight,
  Sparkles
} from "lucide-react";

const StudentDashboard = () => {
  const dashboardCards = [
    {
      title: "My Courses",
      description: "Access your course materials",
      icon: BookOpen,
      link: "/student/courses",
      color: "from-primary via-primary-light to-secondary",
      count: "6 Active",
      stats: "85% Avg Progress"
    },
    {
      title: "Timetable",
      description: "Check your schedule",
      icon: Calendar,
      link: "/student/timetable",
      color: "from-secondary via-accent to-primary",
      count: "This Week",
      stats: "15 Classes"
    },
    {
      title: "Exams & Notes",
      description: "View grades and exams",
      icon: FileText,
      link: "/student/exams",
      color: "from-accent via-secondary to-primary",
      count: "3 Upcoming",
      stats: "3.85 GPA"
    },
    {
      title: "Attendance",
      description: "Track your presence",
      icon: UserCheck,
      link: "/student/attendance",
      color: "from-primary via-accent to-secondary",
      count: "94% Rate",
      stats: "Excellent"
    },
    {
      title: "Requests",
      description: "Manage your requests",
      icon: Send,
      link: "/student/requests",
      color: "from-secondary via-primary to-accent",
      count: "2 Pending",
      stats: "5 Total"
    },
    {
      title: "Messages",
      description: "Read your messages",
      icon: MessageSquare,
      link: "/student/messages",
      color: "from-accent via-primary to-secondary",
      count: "5 New",
      stats: "12 Total"
    },
  ];

  const stats = [
    {
      label: "Overall GPA",
      value: "3.85",
      icon: TrendingUp,
      color: "from-accent to-secondary",
      change: "+0.2",
      trend: "up"
    },
    {
      label: "Attendance",
      value: "94%",
      icon: UserCheck,
      color: "from-primary to-accent",
      change: "+2%",
      trend: "up"
    },
    {
      label: "Hours Studied",
      value: "124h",
      icon: Clock,
      color: "from-secondary to-primary",
      change: "+12h",
      trend: "up"
    },
    {
      label: "Achievements",
      value: "12",
      icon: Award,
      color: "from-accent to-primary",
      change: "+3",
      trend: "up"
    },
  ];

  const recentActivity = [
    {
      action: "Completed assignment",
      course: "Advanced JavaScript",
      time: "2 hours ago",
      icon: FileText,
      color: "primary"
    },
    {
      action: "New message from",
      course: "Dr. Sarah Johnson",
      time: "4 hours ago",
      icon: MessageSquare,
      color: "secondary"
    },
    {
      action: "Exam scheduled",
      course: "Network Security",
      time: "Yesterday",
      icon: Calendar,
      color: "accent"
    },
  ];

  return (
    <div className="container mx-auto p-6 md:p-8">
      {/* Welcome Section */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center animate-pulse-glow">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Welcome back, Student!
            </h1>
            <p className="text-muted-foreground text-lg mt-1">
              Here's what's happening with your studies today.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in-up">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              style={{ animationDelay: `${index * 0.1}s` }}
              className="group relative p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-none overflow-hidden animate-scale-in"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`} />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-muted">
                    {stat.change}
                  </Badge>
                </div>
                <div className="text-3xl font-bold mb-1 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Dashboard Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {dashboardCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Link
                key={index}
                to={card.link}
                style={{ animationDelay: `${index * 0.1}s` }}
                className="animate-scale-in"
              >
                <Card className="group h-full p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-none overflow-hidden relative cursor-pointer">
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-5 group-hover:opacity-15 transition-opacity`} />

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <Badge className="bg-muted text-foreground">
                        {card.count}
                      </Badge>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {card.description}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{card.stats}</span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Recent Activity Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-6 border-none animate-fade-in h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Recent Activity</h3>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </div>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div
                    key={index}
                    style={{ animationDelay: `${(index + 6) * 0.1}s` }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer animate-fade-in-up"
                  >
                    <div className={`h-10 w-10 rounded-lg bg-${activity.color}/10 flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-5 w-5 text-${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mb-0.5">
                        {activity.action}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {activity.course}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link to="/student/notifications">
              <button className="w-full mt-6 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium flex items-center justify-center gap-2">
                View All Activity
                <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
          </Card>
        </div>
      </div>

      {/* Quick Stats Banner */}
      <Card className="mt-6 p-6 border-none bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 animate-fade-in">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg">
              <Award className="h-7 w-7 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-bold mb-1">You're doing great!</h4>
              <p className="text-sm text-muted-foreground">
                Your performance is above average. Keep up the excellent work!
              </p>
            </div>
          </div>
          <Link to="/student/courses">
            <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-primary via-secondary to-accent text-white font-medium hover:opacity-90 transition-opacity shadow-lg">
              Continue Learning
            </button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default StudentDashboard;
