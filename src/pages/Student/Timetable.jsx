import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { MapPin, Clock, User, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getAllEmplois } from "@/services/emploiDuTempsService";
import { getAllSeances } from "@/services/seanceService";

const Timetable = () => {
  const [schedule, setSchedule] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        
        if (!token) {
          console.error("No authentication token found");
          setError("Authentication required");
          setLoading(false);
          return;
        }

        const [emploisData, seancesData] = await Promise.all([
          getAllEmplois(token),
          getAllSeances(token)
        ]);

        console.log("=== TIMETABLE DEBUG ===");
        console.log("Emplois:", emploisData);
        console.log("Seances:", seancesData);

        if (!seancesData || !Array.isArray(seancesData) || seancesData.length === 0) {
          console.warn("No seances data available");
          setError("No schedule data available");
          setLoading(false);
          return;
        }

        const scheduleData = {};

        const userStr = localStorage.getItem("user");
        const user = userStr ? JSON.parse(userStr) : null;
        const userClassId = user?.classe?._id || user?.classe;

        console.log("User Class ID:", userClassId);

        let filteredSeances = seancesData;

        if (userClassId) {
          filteredSeances = seancesData.filter((seance) => {
            const seanceClassId = typeof seance.classe === 'object' 
              ? (seance.classe?._id || seance.classe?.id) 
              : seance.classe;
            return seanceClassId === userClassId;
          });
        }

        console.log("Filtered seances:", filteredSeances);

        if (filteredSeances.length === 0) {
          console.warn("No seances found for user class");
          setError("No schedule found for your class");
          setLoading(false);
          return;
        }

        // Group seances by day
        filteredSeances.forEach((seance) => {
          const day = seance.jourSemaine;
          
          if (!day) {
            console.warn(`Seance ${seance._id} missing day`);
            return;
          }

          if (!scheduleData[day]) {
            scheduleData[day] = [];
          }

          const courseName = seance.cours?.nom || seance.cours?.name || "Course";
          const instructorName = seance.cours?.enseignant 
            ? `${seance.cours.enseignant.prenom || ""} ${seance.cours.enseignant.nom || ""}`.trim()
            : "Instructor";

          scheduleData[day].push({
            course: courseName,
            room: seance.salle || "Room TBA",
            instructor: instructorName || "Instructor",
            type: seance.typeCours || "Lecture",
            seanceId: seance._id,
            notes: seance.notes || "",
            heureDebut: seance.heureDebut,
            heureFin: seance.heureFin,
          });
        });

        // Sort sessions by start time for each day
        Object.keys(scheduleData).forEach(day => {
          scheduleData[day].sort((a, b) => {
            return a.heureDebut.localeCompare(b.heureDebut);
          });
        });

        console.log("Final schedule:", scheduleData);
        setSchedule(scheduleData);
      } catch (err) {
        console.error("Error fetching schedule:", err);
        setError(err.message || "Error loading schedule");
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const getCellClass = (course) => {
    const colorMap = {
      "Advanced JavaScript": "from-blue-500 to-blue-600 border-blue-400",
      "Web Development Fundamentals": "from-purple-500 to-purple-600 border-purple-400",
      "Network Security Fundamentals": "from-green-500 to-green-600 border-green-400",
      "Cryptography & Encryption": "from-red-500 to-red-600 border-red-400",
      "Machine Learning Basics": "from-orange-500 to-orange-600 border-orange-400",
      "Data Analytics with Python": "from-pink-500 to-pink-600 border-pink-400",
    };
    return colorMap[course] || "from-indigo-500 to-indigo-600 border-indigo-400";
  };

  const getTodayIndex = () => {
    const today = new Date().getDay();
    return today === 0 ? 6 : today - 1;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading timetable...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6">
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Schedule</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const hasSchedule = Object.keys(schedule).length > 0;

  return (
    <div className="p-6 space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Your Weekly Schedule</h2>
            <p className="text-muted-foreground">
              {hasSchedule 
                ? "Your class schedule for this week" 
                : "No schedule available"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(currentWeek - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-4 py-2 bg-muted rounded-md">
              <p className="text-sm font-medium">Current Week</p>
              <p className="text-xs text-muted-foreground">
                Fall 2025 - Week {Math.abs(currentWeek) + 1}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(currentWeek + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!hasSchedule ? (
          <div className="text-center py-12 border rounded-lg">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Schedule Available</h3>
            <p className="text-muted-foreground">
              No seances found. Please check the console for details.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-4">
            {days.map((day, index) => (
              <div key={day} className="space-y-2">
                <div
                  className={`text-center p-3 rounded-lg font-semibold ${
                    index === getTodayIndex()
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {day}
                </div>
                <div className="space-y-2 min-h-[400px]">
                  {schedule[day] && schedule[day].length > 0 ? (
                    schedule[day].map((session, idx) => (
                      <div
                        key={`${session.seanceId}-${idx}`}
                        className={`p-3 rounded-lg bg-gradient-to-br ${getCellClass(
                          session.course
                        )} cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all border-l-4`}
                        onClick={() => setSelectedCourse(session)}
                      >
                        <p className="font-bold text-sm text-white mb-2">
                          {session.course}
                        </p>
                        
                        <div className="flex items-center gap-1 mb-1">
                          <Clock className="h-3 w-3 text-white/90" />
                          <p className="text-xs text-white/90 font-medium">
                            {session.heureDebut} - {session.heureFin}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 mb-2">
                          <MapPin className="h-3 w-3 text-white/90" />
                          <p className="text-xs text-white/90">{session.room}</p>
                        </div>

                        <Badge variant="secondary" className="text-xs">
                          {session.type}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No classes
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedCourse?.course}</DialogTitle>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Instructor</p>
                  <p className="text-base">{selectedCourse.instructor}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Room</p>
                  <p className="text-base">{selectedCourse.room}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p className="text-base">{selectedCourse.type}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Schedule</p>
                  <p className="text-base">
                    {selectedCourse.heureDebut} - {selectedCourse.heureFin}
                  </p>
                </div>
              </div>
              {selectedCourse.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Notes</p>
                  <p className="text-sm text-muted-foreground">{selectedCourse.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Timetable;