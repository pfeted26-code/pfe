import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCours } from '../../services/coursService';
import { AuthContext } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Clock, Star, Loader2, AlertCircle, FileText } from 'lucide-react';

// Toast Component
const Toast = ({ message, onClose, type = "error" }) => (
  <div className={`fixed top-5 right-5 ${
    type === "success" ? "bg-green-500" : "bg-destructive"
  } text-white px-4 py-2 rounded shadow-lg z-50`}>
    <div className="flex items-center justify-between gap-2">
      <span>{message}</span>
      <button onClick={onClose} className="font-bold">×</button>
    </div>
  </div>
);

export default function TeacherCourses() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [toastType, setToastType] = useState("error");

  const showToastMessage = (message, type = "error") => {
    setToast(message);
    setToastType(type);
    setTimeout(() => setToast(null), 5000);
  };

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const data = await getAllCours();
        
        console.log("📚 Fetched courses:", data);
        
        setCourses(data || []);
      } catch (error) {
        console.error("❌ Error fetching courses:", error);
        showToastMessage(error.message || "Failed to load courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Calculate course statistics
  const getCourseStats = (course) => {
    // ✅ Get the actual number of students from the populated classe
    let studentsCount = 0;
    
    if (course.classe) {
      // If classe.etudiants is an array (populated)
      if (Array.isArray(course.classe.etudiants)) {
        studentsCount = course.classe.etudiants.length;
      } 
      // If classe has a count property
      else if (course.classe.nombreEtudiants) {
        studentsCount = course.classe.nombreEtudiants;
      }
    }

    console.log(`📊 Course: ${course.nom}, Students: ${studentsCount}`, course.classe);

    // ✅ Count exams and assignments correctly
    const allExams = course.examens || [];
    const examsOnly = allExams.filter(e => 
      (e.type || "").toLowerCase() !== "assignment"
    );
    const assignments = allExams.filter(e => 
      (e.type || "").toLowerCase() === "assignment"
    );
    
    const examsCount = examsOnly.length;
    const assignmentsCount = assignments.length;
    
    // Calculate progress based on materials and exams completion
    const totalItems = allExams.length + (course.materials?.length || 0);
    const progress = totalItems > 0 ? Math.min(Math.round((course.materials?.length || 0) / totalItems * 100), 100) : 0;
    
    return { studentsCount, examsCount, assignmentsCount, progress };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} type={toastType} />
      )}

      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              My Courses
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your teaching courses and assignments
            </p>
          </div>
        </div>

        {/* Courses List */}
        <div className="space-y-4">
          {courses.length > 0 ? (
            courses.map((course) => {
              const stats = getCourseStats(course);
              const schedule = course.emplois?.[0] 
                ? `${course.emplois[0].jour} ${course.emplois[0].heureDebut}`
                : "Schedule TBA";
              const room = course.emplois?.[0]?.salle || "Room TBA";

              return (
                <Card key={course._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">
                          {course.nom || "Untitled Course"}
                        </CardTitle>
                        <CardDescription>
                          {course.code || "N/A"} • {room}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {stats.studentsCount} student{stats.studentsCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{schedule}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{stats.progress}% complete</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">
                          {stats.examsCount} exam{stats.examsCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/teacher/courses/${course._id}`)}
                      >
                        View Details
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // ✅ Navigate to a dedicated assignments page with course data
                          navigate(`/teacher/courses/${course._id}/assignments`);
                        }}
                        disabled={stats.assignmentsCount === 0}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Assignments ({stats.assignmentsCount})
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // ✅ Navigate to a dedicated exams page with course data
                          navigate(`/teacher/courses/${course._id}/exams`);
                        }}
                        disabled={stats.examsCount === 0}
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Exams ({stats.examsCount})
                      </Button>
                      
                      <Button 
                        size="sm"
                        onClick={() => {
                          navigate(`/teacher/courses/${course._id}/attendance`);
                        }}
                      >
                        Take Attendance
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="p-12 text-center">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Courses Found</h3>
              <p className="text-muted-foreground">
                You don't have any courses assigned at the moment.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
