import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  CheckCircle2,
  BookOpen,
  User,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom"; // ✅ make sure this is imported

const StudentCourses = () => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // ✅ declare navigate here
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  // Fetch all courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/cours/getAllCours`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Transform API data to match the component's expected format
        const transformedCourses = data.map((course) => {
          // Handle instructor name from your API structure
          let instructorName = "TBA";
          if (course.enseignant) {
            if (course.enseignant.prenom && course.enseignant.nom) {
              instructorName = `${course.enseignant.prenom} ${course.enseignant.nom}`;
            } else if (course.enseignant.name) {
              instructorName = course.enseignant.name;
            }
          }

          // Handle class name from your API structure
          let className = "General";
          if (course.classe) {
            if (course.classe.nom) {
              className = `${course.classe.nom}`;
              if (course.classe.annee) className += ` - ${course.classe.annee}`;
              if (course.classe.specialisation)
                className += ` ${course.classe.specialisation}`;
            }
          }

          return {
            id: course._id || course.id,
            title: course.nom || course.title || "Untitled Course",
            code: course.code || "N/A",
            className: className,
            progress: calculateProgress(course),
            status: determineStatus(course),
            modules: course.modules?.length || course.totalModules || 0,
            completed:
              course.completedModules || calculateCompletedModules(course),
            color: getColorByClass(className),
            instructor: instructorName,
            credits: course.credits || 3,
            description: course.description || "No description available.",
            semester: course.semestre || "Fall 2025",
            topics: course.topics || course.modules?.map((m) => m.name) || [],
            instructorEmail: course.enseignant?.email || null,
            instructorSpecialty: course.enseignant?.specialite || null,
          };
        });

        setCourses(transformedCourses);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError(err.message || "Failed to fetch courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [API_BASE_URL]);

  // Helper function to calculate progress
  const calculateProgress = (course) => {
    if (course.progress !== undefined) return course.progress;
    if (course.completedModules && course.totalModules) {
      return Math.round((course.completedModules / course.totalModules) * 100);
    }
    if (course.modules?.length) {
      const completed = course.modules.filter((m) => m.completed).length;
      return Math.round((completed / course.modules.length) * 100);
    }
    return 0;
  };

  // Helper function to determine status
  const determineStatus = (course) => {
    if (course.status) return course.status;
    const progress = calculateProgress(course);
    if (progress === 100) return "Completed";
    if (progress > 0) return "In Progress";
    return "Not Started";
  };

  // Helper function to calculate completed modules
  const calculateCompletedModules = (course) => {
    if (course.completedModules !== undefined) return course.completedModules;
    if (course.modules?.length) {
      return course.modules.filter((m) => m.completed).length;
    }
    return 0;
  };

  // Helper function to assign colors based on class
  const getColorByClass = (className) => {
    if (!className) return "from-blue-500 to-purple-600";
    const lowerClass = className.toLowerCase();
    if (lowerClass.includes("first") || lowerClass.includes("glsi")) {
      return "from-blue-500 to-purple-600";
    }
    if (lowerClass.includes("second") || lowerClass.includes("security")) {
      return "from-emerald-500 to-teal-600";
    }
    if (lowerClass.includes("third") || lowerClass.includes("data")) {
      return "from-orange-500 to-pink-600";
    }
    return "from-indigo-500 to-purple-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading your courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <h2 className="text-xl font-bold">Failed to Load Courses</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              My Courses
            </h1>
            <p className="text-muted-foreground text-lg">
              Track your learning progress and access course materials
            </p>
          </div>
          <Card className="p-12 text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Courses Found</h2>
            <p className="text-muted-foreground">
              You are not enrolled in any courses yet.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            My Courses
          </h1>
          <p className="text-muted-foreground text-lg">
            Track your learning progress and access course materials
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course, index) => (
            <Card
              key={course.id}
              style={{ animationDelay: `${index * 0.1}s` }}
              className="group p-0 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-scale-in border overflow-hidden relative cursor-pointer bg-gradient-to-br from-background to-muted/20"
              onClick={() => setSelectedCourse(course)}
            >
              {/* Gradient Header */}
              <div
                className={`h-32 bg-gradient-to-br ${course.color} relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute top-4 right-4 z-10">
                  <Badge
                    variant={
                      course.status === "Completed" ? "default" : "secondary"
                    }
                    className={`${
                      course.status === "Completed"
                        ? "bg-white/90 text-emerald-700 border-white"
                        : "bg-white/90 text-gray-700 border-white"
                    } backdrop-blur-sm shadow-lg`}
                  >
                    {course.status === "Completed" && (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    )}
                    {course.status}
                  </Badge>
                </div>

                {/* Floating Icon */}
                <div className="absolute -bottom-6 left-6">
                  <div
                    className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${course.color} flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform border-4 border-background`}
                  >
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                </div>

                {/* Decorative circles */}
                <div className="absolute top-4 left-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute bottom-0 right-0 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
              </div>

              {/* Content */}
              <div className="p-6 pt-10">
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {course.title}
                </h3>

                <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
                  <span className="font-mono font-semibold">{course.code}</span>
                  <span>•</span>
                  <span className="line-clamp-1">{course.className}</span>
                </div>

                {/* Instructor */}
                <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                  <div
                    className={`h-8 w-8 rounded-full bg-gradient-to-br ${course.color} flex items-center justify-center text-white text-xs font-bold`}
                  >
                    {course.instructor
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {course.instructor}
                    </p>
                    <p className="text-xs text-muted-foreground">Instructor</p>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Course Progress
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          course.progress === 100
                            ? "text-emerald-600"
                            : "text-primary"
                        }`}
                      >
                        {course.progress}%
                      </span>
                    </div>
                    <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${course.color} rounded-full transition-all duration-500 shadow-sm`}
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <FileText className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Modules</p>
                        <p className="text-sm font-bold">
                          {course.completed}/{course.modules}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Credits</p>
                        <p className="text-sm font-bold">{course.credits}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hover indicator */}
                <div className="mt-4 pt-4 border-t opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-center text-muted-foreground">
                    Click to view details →
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Course Details Dialog */}
        <Dialog
          open={!!selectedCourse}
          onOpenChange={() => setSelectedCourse(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {selectedCourse?.title}
              </DialogTitle>
            </DialogHeader>

            {selectedCourse && (
              <div className="space-y-6">
                {/* Course Status */}
                <div className="flex flex-wrap gap-3">
                  <Badge
                    variant={
                      selectedCourse.status === "Completed"
                        ? "default"
                        : "secondary"
                    }
                    className={`flex items-center gap-2 px-3 py-1.5 ${
                      selectedCourse.status === "Completed"
                        ? "bg-success text-success-foreground"
                        : ""
                    }`}
                  >
                    {selectedCourse.status === "Completed" && (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {selectedCourse.status}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-1.5"
                  >
                    <BookOpen className="h-4 w-4" />
                    {selectedCourse.code}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-1.5"
                  >
                    <FileText className="h-4 w-4" />
                    {selectedCourse.completed}/{selectedCourse.modules} modules
                  </Badge>
                </div>

                {/* Course Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <User className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Instructor
                      </p>
                      <p className="font-semibold">
                        {selectedCourse.instructor}
                      </p>
                      {selectedCourse.instructorSpecialty && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {selectedCourse.instructorSpecialty}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Credits</p>
                      <p className="font-semibold">
                        {selectedCourse.credits} Credits
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">Course Description</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedCourse.description}
                    </p>
                  </div>

                  {selectedCourse.topics.length > 0 && (
                    <div className="p-4 rounded-lg bg-muted/50">
                      <h4 className="font-semibold mb-3">Topics Covered</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCourse.topics.map((topic, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-background"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
                    <p className="text-sm">
                      <span className="font-semibold">Semester:</span>{" "}
                      {selectedCourse.semester}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1"
                    variant="default"
                    onClick={() => {
                      if (selectedCourse) {
                        navigate(`/student/courses/${selectedCourse.id}`);
                      }
                    }}
                  >
                    View Course Materials
                  </Button>

                  <Button className="flex-1" variant="outline">
                    Contact Instructor
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StudentCourses;
