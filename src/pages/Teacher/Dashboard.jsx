import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, ClipboardCheck, BarChart3, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

export default function TeacherDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const stats = [
    { title: 'My Courses', value: '5', icon: BookOpen, color: 'from-primary to-primaryLight' },
    { title: 'Total Students', value: '124', icon: Users, color: 'from-secondary to-accent' },
    { title: 'Pending Grades', value: '23', icon: ClipboardCheck, color: 'from-accent to-primary' },
    { title: 'Avg Attendance', value: '92%', icon: BarChart3, color: 'from-primaryLight to-secondary' },
  ];

  const todayClasses = [
    { time: '09:00 AM', course: 'Mathematics 101', room: 'Room 301', students: 30 },
    { time: '11:00 AM', course: 'Algebra II', room: 'Room 205', students: 25 },
    { time: '02:00 PM', course: 'Calculus I', room: 'Room 402', students: 28 },
  ];

  const teacherActions = [
    { title: 'Grade Assignments', description: 'Review and grade pending submissions', icon: ClipboardCheck, route: ROUTES.TEACHER_GRADING },
    { title: 'Take Attendance', description: 'Mark attendance for today\'s classes', icon: Users, route: ROUTES.TEACHER_ATTENDANCE },
    { title: 'View Students', description: 'Manage student information', icon: Users, route: ROUTES.TEACHER_STUDENTS },
    { title: 'My Schedule', description: 'View weekly teaching schedule', icon: BookOpen, route: ROUTES.TEACHER_SCHEDULE },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Teacher Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Welcome back, Professor</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Classes */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Classes</CardTitle>
          <CardDescription>Your teaching schedule for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todayClasses.map((cls, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-neutralLight transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">{cls.time.split(' ')[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium">{cls.course}</p>
                    <p className="text-sm text-muted-foreground">{cls.room} • {cls.students} students</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Take Attendance</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teacherActions.map((action, index) => (
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
                    <CardDescription className="mt-1">{action.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
