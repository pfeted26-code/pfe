import React, { useEffect, useState, useContext } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Clock, TrendingUp, Calendar, Loader2, AlertCircle } from "lucide-react";
import { getPresenceByEtudiant } from "../../services/presenceService";
import { AuthContext } from "../../contexts/AuthContext";

const StudentAttendance = () => {
  const { user } = useContext(AuthContext);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?._id) {
      fetchAttendanceData();
    }
  }, [user]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all attendance records for the student
      const presences = await getPresenceByEtudiant(user._id);

      // Group attendance by course
      const courseStats = {};
      const recentRecords = [];

      presences.forEach(presence => {
        const courseId = presence.seance?.cours?._id;
        const courseName = presence.seance?.cours?.nom || "Unknown Course";
        const courseCode = presence.seance?.cours?.code || "N/A";

        if (!courseStats[courseId]) {
          courseStats[courseId] = {
            id: courseId,
            name: courseName,
            code: courseCode,
            present: 0,
            absent: 0,
            total: 0,
            records: []
          };
        }

        courseStats[courseId].total += 1;
        if (presence.statut === "présent") {
          courseStats[courseId].present += 1;
        } else {
          courseStats[courseId].absent += 1;
        }

        // Add to recent records
        recentRecords.push({
          date: presence.date,
          course: courseName,
          status: presence.statut === "présent" ? "Present" : "Absent",
          code: courseCode,
          courseId: courseId
        });
      });

      // Calculate percentages and prepare course data
      const courses = Object.values(courseStats).map(course => ({
        ...course,
        percentage: course.total > 0 ? Math.round((course.present / course.total) * 100) : 0,
        color: getCourseColor(course.id)
      }));

      // Sort recent records by date (most recent first)
      recentRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
      const recentAttendance = recentRecords.slice(0, 5);

      // Calculate overall stats
      const totalPresent = courses.reduce((acc, c) => acc + c.present, 0);
      const totalAbsent = courses.reduce((acc, c) => acc + c.absent, 0);
      const totalClasses = courses.reduce((acc, c) => acc + c.total, 0);
      const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

      setAttendanceData({
        courses,
        recentAttendance,
        overallPercentage,
        totalPresent,
        totalAbsent,
        totalClasses
      });

    } catch (err) {
      console.error("Error fetching attendance data:", err);
      setError(err.message || "Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const getCourseColor = (courseId) => {
    const colors = [
      "from-primary to-primary-light",
      "from-primary to-secondary",
      "from-secondary to-accent",
      "from-accent to-secondary",
      "from-secondary to-primary"
    ];
    // Use courseId to consistently assign colors
    const index = courseId ? courseId.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  const getAcademicYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11, September is 8

    if (currentMonth >= 8) { // September or later
      return `${currentYear}-${currentYear + 1}`;
    } else { // Before September
      return `${currentYear - 1}-${currentYear}`;
    }
  };

  const getAttendanceMessage = (percentage) => {
    if (percentage >= 90) {
      return "You're maintaining excellent attendance! Keep up the great work.";
    } else if (percentage >= 80) {
      return "You're doing well with your attendance. Keep it up!";
    } else if (percentage >= 70) {
      return "Your attendance is acceptable, but there's room for improvement.";
    } else {
      return "Your attendance needs improvement. Please try to attend more classes.";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center m-8">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <p className="text-destructive">{error}</p>
        <button
          onClick={fetchAttendanceData}
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Try Again
        </button>
      </Card>
    );
  }

  if (!attendanceData) {
    return (
      <Card className="p-8 text-center m-8">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No attendance data available.</p>
      </Card>
    );
  }

  const { courses, recentAttendance, overallPercentage, totalPresent, totalAbsent, totalClasses } = attendanceData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 md:p-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            My Attendance
          </h1>
          <p className="text-muted-foreground text-lg">
            Track your class attendance and presence record
          </p>
        </div>

        {/* Overall Stats Card */}
        <Card className="p-8 mb-8 animate-fade-in border-none overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" />
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Overall Attendance</h2>
                  <p className="text-sm text-muted-foreground">Academic Year {getAcademicYear()}</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                {getAttendanceMessage(overallPercentage)}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 text-center border-none bg-gradient-to-br from-primary/10 to-primary/5">
                <div className="text-4xl font-bold text-primary mb-1">{overallPercentage}%</div>
                <div className="text-xs text-muted-foreground font-medium">Total</div>
              </Card>
              <Card className="p-4 text-center border-none bg-gradient-to-br from-accent/10 to-accent/5">
                <div className="text-4xl font-bold text-accent mb-1">{totalPresent}</div>
                <div className="text-xs text-muted-foreground font-medium">Present</div>
              </Card>
              <Card className="p-4 text-center border-none bg-gradient-to-br from-secondary/10 to-secondary/5">
                <div className="text-4xl font-bold text-secondary mb-1">{totalAbsent}</div>
                <div className="text-xs text-muted-foreground font-medium">Absent</div>
              </Card>
            </div>
          </div>
        </Card>

        {/* Courses Attendance */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {courses.map((course, index) => (
            <Card 
              key={course.id}
              style={{ animationDelay: `${index * 0.1}s` }}
              className="group p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-scale-in border-none overflow-hidden relative"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${course.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                      {course.name}
                    </h3>
                    <Badge variant="outline" className="font-mono text-xs">{course.code}</Badge>
                  </div>
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${course.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                    <span className="text-lg font-bold text-white">{course.percentage}%</span>
                  </div>
                </div>

                {/* Enhanced Progress Bar */}
                <div className="mb-4 space-y-2">
                  <div className="relative h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`absolute inset-y-0 left-0 bg-gradient-to-r ${course.color} rounded-full transition-all duration-1000 ease-out shadow-lg`}
                      style={{ 
                        width: `${course.percentage}%`,
                        boxShadow: `0 0 20px ${course.percentage > 75 ? 'rgba(34, 197, 94, 0.4)' : course.percentage > 50 ? 'rgba(234, 179, 8, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-end pr-2">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 drop-shadow-sm">
                        {course.percentage}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-accent">{course.present}</div>
                    <div className="text-xs text-muted-foreground">Present</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-destructive">{course.absent}</div>
                    <div className="text-xs text-muted-foreground">Absent</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-foreground">{course.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Recent Attendance */}
        <Card className="p-6 border-none animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Recent Attendance</h3>
              <p className="text-xs text-muted-foreground">Last 5 classes</p>
            </div>
          </div>

          <div className="space-y-3">
            {recentAttendance.map((record, index) => (
              <div 
                key={index}
                style={{ animationDelay: `${(index + 5) * 0.1}s` }}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors animate-fade-in-up"
              >
                <div className="flex items-center gap-3">
                  {record.status === "Present" ? (
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-destructive" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{record.course}</p>
                    <p className="text-xs text-muted-foreground">{record.code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={record.status === "Present" ? "bg-accent text-white" : "bg-destructive text-white"}>
                    {record.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StudentAttendance;
