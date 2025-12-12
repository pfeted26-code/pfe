import { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Calendar, Clock, CheckCircle, XCircle, Users, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { getAllSeances } from '@/services/seanceService';
import { getEtudiants } from '@/services/userService';
import { createPresence, getPresenceBySeance, getTauxPresenceParSeance } from '@/services/presenceService';
import { AuthContext } from '../../contexts/AuthContext';

export default function TeacherAttendance() {
  const { user: currentUser } = useContext(AuthContext);
  const [selectedSeance, setSelectedSeance] = useState('');
  const [selectedSeanceData, setSelectedSeanceData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDateObj, setSelectedDateObj] = useState(new Date());
  const [seances, setSeances] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [classStudents, setClassStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0
  });
  const [overallStats, setOverallStats] = useState({
    totalSeances: 0,
    totalStudents: 0,
    averageAttendance: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [seanceStats, setSeanceStats] = useState(null);
  const [recentAttendanceRecords, setRecentAttendanceRecords] = useState([]);

  // Toast state
  const [toast, setToast] = useState(null);
  const [toastType, setToastType] = useState("success");

  const showToast = (message, type = "success") => {
    setToast(message);
    setToastType(type);
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch initial data
  useEffect(() => {
    if (currentUser) {
      fetchInitialData();
    }
  }, [currentUser]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!currentUser) {
        setError('Please log in to view attendance');
        setLoading(false);
        return;
      }

      console.log('Fetching initial data for teacher:', currentUser._id);

      // Fetch seances and all students
      const [seancesData, studentsData] = await Promise.all([
        getAllSeances(),
        getEtudiants()
      ]);

      console.log('Seances data:', seancesData);
      console.log('Students data:', studentsData);

      // Seances are already filtered by backend based on user role
      setSeances(seancesData);

      // Filter students - handle different response formats
      let studentUsers = [];
      if (Array.isArray(studentsData)) {
        studentUsers = studentsData.filter(user => user.role === 'etudiant');
      } else if (studentsData && Array.isArray(studentsData.data)) {
        studentUsers = studentsData.data.filter(user => user.role === 'etudiant');
      } else if (studentsData && typeof studentsData === 'object') {
        const studentsArray = Array.isArray(studentsData) ? studentsData : [studentsData];
        studentUsers = studentsArray.filter(user => user.role === 'etudiant');
      }

      console.log('All students:', studentUsers);
      setAllStudents(studentUsers);

      // Calculate overall stats for all teacher's seances
      if (seancesData.length > 0) {
        await calculateOverallStats(seancesData);
      }

      // Set default seance if available
      if (seancesData.length > 0) {
        setSelectedSeance(seancesData[0]._id);
        setSelectedSeanceData(seancesData[0]);
      }

    } catch (error) {
      console.error('Error fetching initial data:', error);
      if (error.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        showToast('Session expired', 'error');
      } else {
        setError('Failed to load data. Please try again.');
        showToast('Failed to load data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter students by seance's class
  useEffect(() => {
    if (selectedSeanceData && allStudents.length > 0) {
      const classeId = selectedSeanceData.classe?._id || selectedSeanceData.classe;
      console.log('Filtering students for classe:', classeId);
      
      const studentsInClass = allStudents.filter(student => {
        const studentClasseId = student.classe?._id || student.classe;
        return studentClasseId === classeId;
      });

      console.log('Students in class:', studentsInClass);
      setClassStudents(studentsInClass);

      // Update total count in stats
      setAttendanceStats(prev => ({
        ...prev,
        total: studentsInClass.length
      }));
    } else {
      setClassStudents([]);
    }
  }, [selectedSeanceData, allStudents]);

  // Calculate overall statistics for all teacher's seances
  const calculateOverallStats = async (teacherSeances) => {
    try {
      let totalPresences = 0;
      let totalRecords = 0;
      const uniqueClasses = new Set();

      for (const seance of teacherSeances) {
        uniqueClasses.add(seance.classe?._id || seance.classe);
        
        try {
          const attendanceData = await getPresenceBySeance(seance._id);
          totalRecords += attendanceData.length;
          totalPresences += attendanceData.filter(r => r.statut === 'présent').length;
        } catch (error) {
          console.warn(`Could not fetch attendance for seance ${seance._id}`);
        }
      }

      const averageAttendance = totalRecords > 0 
        ? Math.round((totalPresences / totalRecords) * 100) 
        : 0;

      setOverallStats({
        totalSeances: teacherSeances.length,
        totalClasses: uniqueClasses.size,
        averageAttendance
      });
    } catch (error) {
      console.error('Error calculating overall stats:', error);
    }
  };

  const loadSeanceData = async (seanceId) => {
    try {
      setLoading(true);
      
      // Fetch existing attendance records for this seance
      const attendanceData = await getPresenceBySeance(seanceId);
      console.log('Attendance data for seance:', attendanceData);

      // Filter records for selected date
      const todaysRecords = attendanceData.filter(record => {
        const recordDate = new Date(record.date).toISOString().split('T')[0];
        return recordDate === selectedDate;
      });

      console.log('Today\'s records:', todaysRecords);

      // Create a map of student attendance for easy lookup
      const attendanceMap = {};
      todaysRecords.forEach(record => {
        const studentId = record.etudiant?._id || record.etudiant;
        attendanceMap[studentId] = {
          _id: record._id,
          statut: record.statut,
          etudiant: studentId
        };
      });

      // Convert map to array for state
      setAttendanceRecords(Object.values(attendanceMap));

      // Calculate stats based on class students
      const stats = {
        total: classStudents.length,
        present: Object.values(attendanceMap).filter(r => r.statut === 'présent').length,
        absent: Object.values(attendanceMap).filter(r => r.statut === 'absent').length,
        late: Object.values(attendanceMap).filter(r => r.statut === 'retard').length
      };
      setAttendanceStats(stats);

      // Fetch seance attendance statistics
      try {
        const statsData = await getTauxPresenceParSeance(seanceId);
        setSeanceStats(statsData);
      } catch (statsError) {
        console.warn('Could not fetch seance stats:', statsError);
        setSeanceStats(null);
      }

      // Load recent attendance records for this seance
      await loadRecentAttendanceRecords(seanceId);

    } catch (error) {
      console.error('Error loading seance data:', error);
      showToast('Failed to load seance attendance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentAttendanceRecords = async (seanceId) => {
    try {
      const allRecords = await getPresenceBySeance(seanceId);

      // Group by date and calculate attendance stats
      const recordsByDate = {};
      allRecords.forEach(record => {
        const dateKey = new Date(record.date).toISOString().split('T')[0];
        if (!recordsByDate[dateKey]) {
          recordsByDate[dateKey] = {
            date: dateKey,
            total: 0,
            present: 0,
            absent: 0,
            late: 0
          };
        }
        recordsByDate[dateKey].total++;
        if (record.statut === 'présent') recordsByDate[dateKey].present++;
        else if (record.statut === 'absent') recordsByDate[dateKey].absent++;
        else if (record.statut === 'retard') recordsByDate[dateKey].late++;
      });

      // Convert to array and sort by date (most recent first)
      const recentRecords = Object.values(recordsByDate)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

      setRecentAttendanceRecords(recentRecords);

    } catch (error) {
      console.error('Error loading recent attendance records:', error);
      setRecentAttendanceRecords([]);
    }
  };

  // Load seance data when seance or date changes
  useEffect(() => {
    if (selectedSeance && classStudents.length > 0) {
      loadSeanceData(selectedSeance);
    }
  }, [selectedSeance, selectedDate, classStudents]);

  // Handle seance selection change
  const handleSeanceChange = (seanceId) => {
    setSelectedSeance(seanceId);
    const seance = seances.find(s => s._id === seanceId);
    setSelectedSeanceData(seance);
    console.log('Selected seance:', seance);
  };

  const handleDateChange = (date) => {
    setSelectedDateObj(date);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prev => {
      const existing = prev.find(r => {
        const recordStudentId = r.etudiant?._id || r.etudiant;
        return recordStudentId === studentId;
      });
      
      if (existing) {
        // Update existing record
        return prev.map(r => {
          const recordStudentId = r.etudiant?._id || r.etudiant;
          return recordStudentId === studentId
            ? { ...r, statut: status }
            : r;
        });
      } else {
        // Add new record
        const newRecord = {
          etudiant: studentId,
          statut: status,
          seance: selectedSeance,
          date: selectedDate,
          enseignant: currentUser._id
        };
        return [...prev, newRecord];
      }
    });

    // Update stats immediately for better UX
    setAttendanceStats(prev => {
      const current = getStudentAttendanceStatus(studentId);
      const newStats = { ...prev };
      
      // Remove from old status
      if (current === 'présent') newStats.present--;
      else if (current === 'absent') newStats.absent--;
      else if (current === 'retard') newStats.late--;
      
      // Add to new status
      if (status === 'présent') newStats.present++;
      else if (status === 'absent') newStats.absent++;
      else if (status === 'retard') newStats.late++;
      
      return newStats;
    });
  };

  const handleSaveAttendance = async () => {
    if (!selectedSeance) {
      showToast('Please select a seance first', 'error');
      return;
    }

    if (attendanceRecords.length === 0) {
      showToast('Please mark attendance for at least one student', 'error');
      return;
    }

    try {
      setSaving(true);

      // Filter only new records (without _id) to create
      const newRecords = attendanceRecords.filter(record => !record._id);

      if (newRecords.length === 0) {
        showToast('All attendance already saved', 'info');
        setSaving(false);
        return;
      }

      console.log('Saving new records:', newRecords);

      // Save each NEW attendance record
      const savePromises = newRecords.map(async (record) => {
        const attendanceData = {
          date: selectedDate,
          statut: record.statut,
          seance: selectedSeance,
          etudiant: record.etudiant,
          enseignant: currentUser._id
        };

        console.log('Creating presence:', attendanceData);
        return await createPresence(attendanceData);
      });

      await Promise.all(savePromises);

      showToast(`Successfully saved attendance for ${newRecords.length} student(s)!`);
      
      // Refresh data
      await loadSeanceData(selectedSeance);

    } catch (error) {
      console.error('Error saving attendance:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      showToast(`Failed to save attendance: ${errorMessage}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const getStudentAttendanceStatus = (studentId) => {
    const record = attendanceRecords.find(r => {
      const recordStudentId = r.etudiant?._id || r.etudiant;
      return recordStudentId === studentId;
    });
    return record?.statut || null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'présent': return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50';
      case 'absent': return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/50';
      case 'retard': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/50';
      default: return 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'présent': return <CheckCircle className="h-4 w-4" />;
      case 'absent': return <XCircle className="h-4 w-4" />;
      case 'retard': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSeanceDisplayName = (seance) => {
    const courseName = seance.cours?.nom || 'Course';
    const seanceName = seance.nom || '';
    const seanceType = seance.typeCours || '';
    const dayTime = `${seance.jourSemaine || ''} ${seance.heureDebut || ''}-${seance.heureFin || ''}`;
    return `${courseName}${seanceName ? ' - ' + seanceName : ''}${seanceType ? ' (' + seanceType + ')' : ''} - ${dayTime}`;
  };

  if (loading && seances.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchInitialData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          toastType === 'success' ? 'bg-green-500' : 
          toastType === 'error' ? 'bg-red-500' : 
          'bg-blue-500'
        } text-white`}>
          {toast}
        </div>
      )}

      <div className="container mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Attendance Management
            </h1>
            <p className="text-muted-foreground mt-1">Take and manage student attendance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {selectedSeance ? 'Students in Class' : 'Total Seances'}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedSeance ? attendanceStats.total : overallStats.totalSeances}
              </div>
              {selectedSeance && selectedSeanceData && (
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedSeanceData.classe?.nom || 'Class'}
                </p>
              )}
              {!selectedSeance && (
                <p className="text-xs text-muted-foreground mt-1">
                  Across {overallStats.totalClasses} classes
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {selectedSeance ? 'Present Today' : 'Avg. Attendance'}
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {selectedSeance ? attendanceStats.present : `${overallStats.averageAttendance}%`}
              </div>
              {selectedSeance && (
                <p className="text-xs text-muted-foreground mt-1">
                  {attendanceStats.total > 0 
                    ? `${Math.round((attendanceStats.present / attendanceStats.total) * 100)}%` 
                    : '0%'}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {selectedSeance ? 'Absent Today' : 'Date'}
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${selectedSeance ? 'text-red-600' : ''}`}>
                {selectedSeance ? attendanceStats.absent : formatDate(selectedDate)}
              </div>
              {selectedSeance && (
                <p className="text-xs text-muted-foreground mt-1">
                  {attendanceStats.total > 0 
                    ? `${Math.round((attendanceStats.absent / attendanceStats.total) * 100)}%` 
                    : '0%'}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {selectedSeance ? 'Late Today' : 'Seance Stats'}
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {selectedSeance ? (
                <>
                  <div className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {attendanceStats.total > 0 
                      ? `${Math.round((attendanceStats.late / attendanceStats.total) * 100)}%` 
                      : '0%'}
                  </p>
                </>
              ) : seanceStats ? (
                <>
                  <div className="text-2xl font-bold">{seanceStats.taux || '0%'}</div>
                  <p className="text-xs text-muted-foreground mt-1">Overall rate</p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">--</div>
                  <p className="text-xs text-muted-foreground mt-1">Select seance</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Take Attendance</CardTitle>
            <CardDescription>Mark attendance for today's class</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Select value={selectedSeance} onValueChange={handleSeanceChange}>
                <SelectTrigger className="w-[400px]">
                  <SelectValue placeholder="Select seance" />
                </SelectTrigger>
                <SelectContent>
                  {seances.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No seances found</div>
                  ) : (
                    seances.map((seance) => (
                      <SelectItem key={seance._id} value={seance._id}>
                        {getSeanceDisplayName(seance)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <DatePicker
                  date={selectedDateObj}
                  setDate={handleDateChange}
                  className="w-[200px]"
                />
              </div>
            </div>

            {!selectedSeance ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Please select a seance to take attendance</p>
              </div>
            ) : classStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No students found in this class</p>
                <p className="text-xs mt-2">Class: {selectedSeanceData?.classe?.nom || 'Unknown'}</p>
              </div>
            ) : (
              <>
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    Class: {selectedSeanceData?.classe?.nom || 'Unknown'} ({classStudents.length} students)
                  </p>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {classStudents.map((student) => {
                    const studentStatus = getStudentAttendanceStatus(student._id);
                    return (
                      <div key={student._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                            {(student.prenom || student.nom || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">
                              {student.prenom && student.nom ? `${student.prenom} ${student.nom}` : student.nom || student.prenom || 'Unknown Student'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {student.email || 'No email'}
                            </p>
                          </div>
                          {studentStatus && (
                            <Badge className={`${getStatusColor(studentStatus)} border`}>
                              {getStatusIcon(studentStatus)}
                              <span className="ml-1 capitalize">{studentStatus}</span>
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={studentStatus === 'présent' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleStatusChange(student._id, 'présent')}
                          >
                            Present
                          </Button>
                          <Button
                            variant={studentStatus === 'absent' ? 'destructive' : 'outline'}
                            size="sm"
                            onClick={() => handleStatusChange(student._id, 'absent')}
                          >
                            Absent
                          </Button>
                          <Button
                            variant={studentStatus === 'retard' ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => handleStatusChange(student._id, 'retard')}
                          >
                            Late
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end mt-6">
                  <Button 
                    onClick={handleSaveAttendance} 
                    className="gap-2"
                    disabled={saving || attendanceRecords.length === 0}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Save Attendance
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {selectedSeance && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance Records</CardTitle>
              <CardDescription>View attendance history for this seance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAttendanceRecords.length > 0 ? (
                  recentAttendanceRecords.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{formatDate(record.date)}</p>
                          <p className="text-sm text-muted-foreground">
                            {record.present} present, {record.absent} absent, {record.late} late
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{record.present}/{record.total}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.total > 0 ? Math.round((record.present / record.total) * 100) : 0}% attendance
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No attendance records found for this seance</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}