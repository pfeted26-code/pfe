import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '@/services/dashboardService';
import { getSeancesByEnseignant } from '@/services/seanceService';
import { getNotificationsByUser } from '@/services/notificationService';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, ClipboardCheck, BarChart3, LogOut, Bell, Search, Calendar, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';


export default function TeacherDashboard() {
  const [selectedClass, setSelectedClass] = useState(null);
  const [stats, setStats] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Quick actions (counts will be dynamic if possible)
  const teacherActions = [
    {
      title: 'Grade Assignments',
      description: 'Review and grade pending submissions',
      icon: ClipboardCheck,
      color: 'from-orange-500 to-red-500',
      // count: dynamic below
    },
    {
      title: 'Take Attendance',
      description: 'Mark attendance for today\'s classes',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      // count: dynamic below
    },
    {
      title: 'View Students',
      description: 'Manage student information and progress',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'My Schedule',
      description: 'View weekly teaching schedule',
      icon: Calendar,
      color: 'from-green-500 to-emerald-500',
    },
  ];

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Dashboard stats and activity
        const dashboard = await getDashboardStats();
        setStats(dashboard.stats?.map((stat) => {
          // Map icon string to Lucide icon if possible
          let icon = BookOpen;
          if (stat.title?.toLowerCase().includes('student')) icon = Users;
          if (stat.title?.toLowerCase().includes('teacher')) icon = Users;
          if (stat.title?.toLowerCase().includes('attendance')) icon = TrendingUp;
          if (stat.title?.toLowerCase().includes('course')) icon = BookOpen;
          return {
            ...stat,
            icon,
            bgColor: stat.color?.includes('blue') ? 'bg-blue-500/10' : stat.color?.includes('purple') ? 'bg-purple-500/10' : stat.color?.includes('orange') ? 'bg-orange-500/10' : 'bg-green-500/10',
            iconColor: stat.color?.includes('blue') ? 'text-blue-500' : stat.color?.includes('purple') ? 'text-purple-500' : stat.color?.includes('orange') ? 'text-orange-500' : 'text-green-500',
          };
        }) || []);
        setRecentActivity(dashboard.recentActivity?.map((a) => ({
          ...a,
          student: a.user || '',
          action: a.action,
          time: a.time,
          icon: a.action?.toLowerCase().includes('grade') ? TrendingUp : a.action?.toLowerCase().includes('assignment') ? ClipboardCheck : a.action?.toLowerCase().includes('question') ? AlertCircle : Bell,
        })) || []);

        // Today’s classes for this teacher
        if (user?._id) {
          const seances = await getSeancesByEnseignant(user._id);
          // Filter for today’s date
          const today = new Date();
          const todayStr = today.toISOString().slice(0, 10);
          const todaySeances = (seances || []).filter(s => s.date && s.date.slice(0, 10) === todayStr);
          setTodayClasses(todaySeances.map((s, idx) => ({
            id: s._id || idx,
            time: s.heureDebut ? s.heureDebut.slice(0,5) : '',
            endTime: s.heureFin ? s.heureFin.slice(0,5) : '',
            course: s.cours?.nom || s.cours || 'Course',
            room: s.salle || 'Room',
            students: s.classe?.etudiants?.length || 0,
            attendanceTaken: s.presenceTaken || false,
            status: s.heureDebut && new Date(todayStr + 'T' + s.heureDebut) < today ? 'completed' : 'upcoming',
          })));
          // Notification count
          const notifications = await getNotificationsByUser(user._id);
          setNotificationCount(Array.isArray(notifications) ? notifications.filter(n => !n.lu).length : 0);
        }
      } catch (err) {
        setError('Failed to load dashboard data.');
      }
      setLoading(false);
    }
    fetchData();
  }, [user]);

  const getStatusBadge = (status) => {
    if (status === 'completed') {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-500/10 text-green-500 dark:text-green-400 rounded-full flex items-center gap-1 border border-green-500/20">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-full flex items-center gap-1 border border-blue-500/20">
        <Clock className="h-3 w-3" />
        Upcoming
      </span>
    );
  };

  // Button handlers
  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };
  const handleViewSchedule = () => navigate(ROUTES.TEACHER_SCHEDULE);
  const handleTakeAttendance = () => navigate(ROUTES.TEACHER_ATTENDANCE);
  const handleViewStudents = () => navigate(ROUTES.TEACHER_STUDENTS);
  const handleGradeAssignments = () => navigate(ROUTES.TEACHER_GRADING);

  if (loading) return <div className="p-8 text-center text-lg">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="container mx-auto space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              Teacher Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-2">
              <span className="text-lg">Welcome back, {user?.prenom || user?.nom ? `${user?.prenom} ${user?.nom}` : 'Professor'}</span>
              <span className="text-sm text-slate-400 dark:text-slate-600">•</span>
              <span className="text-sm text-slate-500 dark:text-slate-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Button>
            <Button variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card 
              key={index} 
              className="relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-border"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`}></div>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Classes - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Today's Classes</CardTitle>
                    <CardDescription className="mt-1">Your teaching schedule for today</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleViewSchedule}>
                    <Calendar className="h-4 w-4" />
                    View Full Schedule
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayClasses.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">No classes scheduled for today.</div>
                  ) : todayClasses.map((cls) => (
                    <div 
                      key={cls.id} 
                      className={`p-4 rounded-xl transition-all duration-300 border-2 ${
                        selectedClass === cls.id 
                          ? 'border-blue-500 bg-blue-500/5 shadow-md' 
                          : 'border-border hover:border-blue-500/50 hover:shadow-md'
                      }`}
                      onClick={() => setSelectedClass(cls.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                            <div className="text-center">
                              <div className="text-white font-bold text-sm">{cls.time}</div>
                              <div className="text-white text-xs opacity-90">{cls.endTime}</div>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="font-semibold text-lg">{cls.course}</p>
                              {getStatusBadge(cls.status)}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {cls.time} - {cls.endTime}
                              </span>
                              <span>•</span>
                              <span>{cls.room}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {cls.students} students
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant={cls.attendanceTaken ? "outline" : "default"} 
                          size="sm"
                          className={cls.attendanceTaken ? "" : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"}
                          onClick={handleTakeAttendance}
                        >
                          {cls.attendanceTaken ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Attendance Taken
                            </>
                          ) : (
                            'Take Attendance'
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity - Takes 1 column */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Recent Activity</CardTitle>
                <CardDescription>Latest updates from your classes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">No recent activity.</div>
                  ) : recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 pb-4 border-b border-border last:border-b-0 last:pb-0">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <activity.icon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.student}</p>
                        <p className="text-sm text-muted-foreground">{activity.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Quick Actions with dynamic counts and handlers */}
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden" onClick={handleGradeAssignments}>
              <div className={`absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 opacity-0 group-hover:opacity-10 transition-opacity`}></div>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg relative`}>
                    <ClipboardCheck className="h-8 w-8 text-white" />
                    {/* Example: Pending grades count (mocked as 0) */}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Grade Assignments</h3>
                    <p className="text-sm text-muted-foreground mt-1">Review and grade pending submissions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden" onClick={handleTakeAttendance}>
              <div className={`absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-10 transition-opacity`}></div>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg relative`}>
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Take Attendance</h3>
                    <p className="text-sm text-muted-foreground mt-1">Mark attendance for today's classes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden" onClick={handleViewStudents}>
              <div className={`absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity`}></div>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg relative`}>
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">View Students</h3>
                    <p className="text-sm text-muted-foreground mt-1">Manage student information and progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden" onClick={handleViewSchedule}>
              <div className={`absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 opacity-0 group-hover:opacity-10 transition-opacity`}></div>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg relative`}>
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">My Schedule</h3>
                    <p className="text-sm text-muted-foreground mt-1">View weekly teaching schedule</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          </div>
        </div>
      </div>
  );
}
  