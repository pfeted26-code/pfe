import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Mail, Phone, Calendar, BookOpen, TrendingUp, Loader2 } from 'lucide-react';
import { getEtudiants } from '../../services/userService';
import { getAllCours } from '../../services/coursService';

export default function TeacherStudents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');

  const [courses, setCourses] = useState([{ id: 'all', name: 'All Courses' }]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [profileStudent, setProfileStudent] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [usersRes, coursRes] = await Promise.all([getEtudiants(), getAllCours()]);
        if (!mounted) return;
        const studs = Array.isArray(usersRes.data) ? usersRes.data : (usersRes || []);
        setStudents(studs.map(s => ({
          ...s,
          id: s._id,
          displayName: `${s.prenom || ''} ${s.nom || ''}`.trim(),
          phone: s.NumTel || s.NumTelEnseignant || s.phone || '',
          address: s.Adresse || s.address || '',
          dob: s.datedeNaissance || s.datedeNaissance || null,
          classes: s.classes || (s.classe ? [s.classe] : []),
          email: s.email || s.mail || ''
        })));

        const coursData = Array.isArray(coursRes) ? coursRes : (coursRes.data || []);
        const mapped = [{ id: 'all', name: 'All Courses' }, ...coursData.map(c => ({ id: c._id, name: c.nom }))];
        setCourses(mapped);
      } catch (err) {
        console.error('Failed to load students/courses', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const getGradeColor = (grade) => {
    if (!grade || typeof grade !== 'string') return 'bg-gray-100 text-gray-800';
    switch (grade.charAt(0)) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-orange-100 text-orange-800';
      case 'F': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="container mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              My Students
            </h1>
            <p className="text-muted-foreground mt-1">View and manage your students</p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id || course._id} value={course.id || course._id || 'all'}>
                  {course.name || course.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading && (
          <div className="py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Student Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {students.filter(s => {
              const q = searchTerm.trim().toLowerCase();
              const matchSearch = q === '' || `${s.nom || s.name} ${s.prenom || ''}`.toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q) || (s.rollNo || '').toLowerCase().includes(q);
              const matchCourse = selectedCourse === 'all' || (s.courses || []).some(c => (c._id && c._id.toString() === selectedCourse) || c === selectedCourse || (c.nom && c.nom === (courses.find(cs => (cs.id === selectedCourse || cs._id === selectedCourse)?.name) || {}).nom));
              return matchSearch && matchCourse;
            }).map((student) => (
              <Card key={student.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{student.nom ? `${student.nom} ${student.prenom}` : student.name}</CardTitle>
                      <CardDescription>Roll No: {student.rollNo || student._id}</CardDescription>
                    </div>
                    <Badge className={getGradeColor(student.grade || (student.note || 'N/A'))}>
                      Grade: {student.grade || student.note || 'N/A'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{student.email || student.mail || ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{student.attendance || student.presence || 0}% attendance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Last active: {student.lastActive || student.updatedAt || ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Courses: {(student.courses || []).map(c => c.nom || c).join(', ')}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setProfileStudent(student); setShowProfile(true); }}>View Profile</Button>
                    <Button variant="outline" size="sm" onClick={() => window.location.href = `mailto:${student.email || student.mail || ''}`}>Send Message</Button>
                    <Button variant="outline" size="sm" onClick={() => {/* TODO: navigate to grades page */}}>View Grades</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {students.filter(s => {
              const q = searchTerm.trim().toLowerCase();
              const matchSearch = q === '' || `${s.nom || s.name} ${s.prenom || ''}`.toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q);
              const matchCourse = selectedCourse === 'all' || (s.courses || []).some(c => (c._id && c._id.toString() === selectedCourse) || c === selectedCourse || (c.nom && c.nom === (courses.find(cs => cs.id === selectedCourse || cs._id === selectedCourse)?.name)));
              return matchSearch && matchCourse;
            }).map((student) => (
              <Card key={student.id}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                      {(student.nom || student.name || '').charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{student.nom ? `${student.nom} ${student.prenom}` : student.name}</CardTitle>
                      <CardDescription>{student.rollNo || student._id}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Contact Information</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{student.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{student.phone}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Academic Information</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Current Grade: {student.grade}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Attendance: {student.attendance}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Enrolled Courses</h4>
                        <div className="space-y-2">
                          {(student.courses || []).map((course, index) => (
                            <Badge key={index} variant="secondary">{course.nom || course}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Recent Activity</h4>
                        <p className="text-sm text-muted-foreground">
                          Last active: {student.lastActive}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <Button variant="outline" onClick={() => { setProfileStudent(student); setShowProfile(true); }}>Edit Student</Button>
                    <Button variant="outline" onClick={() => {/* TODO: open assignments */}}>View Assignments</Button>
                    <Button variant="outline" onClick={() => {/* TODO: contact parent */}}>Contact Parent</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Profile Modal */}
        {showProfile && profileStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <CardTitle>{profileStudent.nom ? `${profileStudent.nom} ${profileStudent.prenom}` : profileStudent.name}</CardTitle>
                <CardDescription>Profile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> <span>{profileStudent.email || profileStudent.mail}</span></div>
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> <span>{profileStudent.phone || ''}</span></div>
                  <div className="mt-4">Courses: {(profileStudent.courses || []).map(c => c.nom || c).join(', ')}</div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button variant="outline" onClick={() => setShowProfile(false)}>Close</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 