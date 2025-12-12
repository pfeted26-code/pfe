import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import {
  FileText,
  Calendar,
  Clock,
  Users,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Eye,
  Edit,
  Trash2,
  BarChart,
  Loader2
} from 'lucide-react';
import {
  getAllExamen,
  deleteExamenById,
  createExamen,
  updateExamen,
  downloadAssignmentFile,
  downloadAllAssignmentFiles,
  exportAssignmentData,
  getAssignmentStats
} from '../../services/examenService';
import { getAllNotes, createNote, updateNoteById } from '../../services/noteService';
import { getEtudiants } from '../../services/userService';
import { getAllCours } from '../../services/coursService';
import { AuthContext } from '../../contexts/AuthContext';

const Toast = ({ message, onClose, type = "success" }) => (
  <div className={`fixed top-5 right-5 ${
    type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-blue-500"
  } text-white px-4 py-2 rounded shadow-lg z-50 animate-in slide-in-from-top`}>
    <div className="flex items-center justify-between gap-2">
      <span>{message}</span>
      <button onClick={onClose} className="font-bold hover:opacity-80">×</button>
    </div>
  </div>
);

export default function TeacherAssignments() {
  const { user } = useContext(AuthContext);
  const [view, setView] = useState('list');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [toastType, setToastType] = useState("success");
  const [gradingStudent, setGradingStudent] = useState(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    date: null,
    noteMax: '',
    type: 'assignment'
  });
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [exporting, setExporting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [stats, setStats] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  const showToast = (message, type = "success") => {
    setToast(message);
    setToastType(type);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [examsRes, usersRes, notesRes, coursRes] = await Promise.all([
        getAllExamen(),
        getEtudiants(),
        getAllNotes(),
        getAllCours()
      ]);

      // Normalize responses: some services return { data: [...] } and some return the array directly
      const examsData = (examsRes && (examsRes.data ?? examsRes)) || [];
      const allUsers = (usersRes && (usersRes.data ?? usersRes)) || [];
      const notesData = (notesRes && (notesRes.data ?? notesRes)) || [];
      // getAllCours may return array or { data: [...] }
      const coursesData = Array.isArray(coursRes) ? coursRes : ((coursRes && (coursRes.data ?? coursRes)) || []);

      // Filter for students only — guard if allUsers isn't an array
      const studentsData = Array.isArray(allUsers) ? allUsers.filter(user => user && user.role === 'etudiant') : [];

      // Filter for assignment type exams
      const assignmentExams = examsData.filter(exam => exam.type === 'assignment' || exam.type === 'Assignment');
      
      setAssignments(assignmentExams);
      setStudents(studentsData);
      setNotes(notesData);
      setCourses(coursesData);
      
      if (assignmentExams.length > 0) {
        showToast(`Loaded ${assignmentExams.length} assignment(s)`);
      } else {
        showToast('No assignments found', 'info');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load data: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getSubmissions = (assignment) => {
    return students.map(student => {
      // Look for submission in the assignment's submissions array
      const submission = assignment.submissions?.find(s =>
        s.studentId?.toString() === student._id?.toString()
      );

      // Look for grading note (from notes collection)
      const note = notes.find(n => {
        const examenId = typeof n.examen === 'object' ? n.examen?._id?.toString() : n.examen?.toString();
        const etudiantId = typeof n.etudiant === 'object' ? n.etudiant?._id?.toString() : n.etudiant?.toString();
        const match = examenId === assignment._id?.toString() && etudiantId === student._id?.toString();
        return match;
      });

      return {
        studentId: student._id,
        studentName: `${student.nom} ${student.prenom}`,
        submittedAt: submission?.dateSubmission || null,
        grade: note?.score || submission?.note || null,
        status: (note?.score !== null && note?.score !== undefined) ? 'graded' :
          submission?.dateSubmission ? 'submitted' : 'pending',
        file: submission?.file || null,
        noteId: note?._id || null,
        submissionId: submission?._id || null
      };
    });
  };

  const handleGradeSubmit = async () => {
    if (!gradingStudent || !gradeInput) {
      showToast('Please enter a grade', 'error');
      return;
    }

    const grade = parseFloat(gradeInput);
    if (isNaN(grade) || grade < 0 || grade > selectedAssignment.noteMax) {
      showToast(`Grade must be between 0 and ${selectedAssignment.noteMax}`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Prepare payload matching backend Note schema
      const noteData = {
        score: grade,
        examen: selectedAssignment._id,
        etudiant: gradingStudent.studentId,
        enseignant: user._id
      };

      let res;
      if (gradingStudent.noteId) {
        res = await updateNoteById(gradingStudent.noteId, noteData);
      } else {
        res = await createNote(noteData);
      }

      // Backend returns { message, note }
      const savedNote = res?.data?.note || res?.data || null;

      showToast(`Grade ${grade} saved for ${gradingStudent.studentName}`);
      setGradingStudent(null);
      setGradeInput('');
      setFeedbackInput('');

      // Update local notes state (upsert)
      if (savedNote) {
        const exists = notes.some(n => n._id === savedNote._id);
        const updatedNotes = exists ? notes.map(n => n._id === savedNote._id ? savedNote : n) : [...notes, savedNote];
        setNotes(updatedNotes);

        // Recalculate assignments' graded counts and status locally
        const updatedAssignments = assignments.map(a => {
          const totalStudents = students.length;
          const gradedCount = updatedNotes.filter(n => {
            const examenId = typeof n.examen === 'object' ? n.examen?._id?.toString() : n.examen?.toString();
            return examenId === a._id?.toString();
          }).length;
          let status = 'not_graded';
          if (gradedCount > 0 && gradedCount < totalStudents) status = 'partially_graded';
          if (gradedCount === totalStudents && totalStudents > 0) status = 'graded';

          return { ...a, gradedCount, totalStudents, status };
        });

        setAssignments(updatedAssignments);

        // Update selectedAssignment if open
        if (selectedAssignment) {
          const refreshed = updatedAssignments.find(a => a._id?.toString() === selectedAssignment._id?.toString());
          if (refreshed) setSelectedAssignment(refreshed);
        }
      }

      // Local updates are sufficient, no need for background sync
    } catch (error) {
      showToast('Failed to save grade: ' + error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      await deleteExamenById(assignmentId);
      showToast('Assignment deleted successfully');
      await fetchData();
    } catch (error) {
      showToast('Failed to delete assignment: ' + error.message, 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      date: null,
      noteMax: '',
      type: 'assignment'
    });
    setSelectedCourse('');
    setEditingAssignment(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleOpenEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      nom: assignment.nom,
      description: assignment.description,
      date: assignment.date ? new Date(assignment.date) : null,
      noteMax: assignment.noteMax,
      type: 'assignment'
    });
    setSelectedCourse(assignment.coursId);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();

    if (!formData.nom || !formData.description || !formData.date || !formData.noteMax || !selectedCourse) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (!user || !user._id) {
      showToast('User not authenticated', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const assignmentData = {
        nom: formData.nom,
        description: formData.description,
        date: new Date(formData.date).toISOString(),
        noteMax: parseFloat(formData.noteMax),
        type: formData.type,
        coursId: selectedCourse,
        enseignantId: user._id
      };

      if (editingAssignment) {
        await updateExamen(editingAssignment._id, assignmentData);
        showToast('Assignment updated successfully');
      } else {
        await createExamen(assignmentData);
        showToast('Assignment created successfully');
      }

      handleCloseModal();
      await fetchData();
    } catch (error) {
      showToast(`Failed to ${editingAssignment ? 'update' : 'create'} assignment: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadAllFiles = async (assignment = null) => {
    const targetAssignment = assignment || selectedAssignment;
    if (!targetAssignment || !targetAssignment._id) {
      showToast('Assignment not found', 'error');
      return;
    }

    setDownloading(true);
    try {
      const examenId = targetAssignment._id ?? targetAssignment.id;
      const response = await downloadAllAssignmentFiles(examenId);

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${targetAssignment.nom}_submissions.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast('All files downloaded successfully');
    } catch (error) {
      showToast('Failed to download files: ' + (error?.message || 'Server error'), 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleExportData = async (format = 'csv') => {
    if (!selectedAssignment) return;

    setExporting(true);
    try {
      const response = await exportAssignmentData(selectedAssignment._id, format);

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedAssignment.nom}_data.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Failed to export data: ' + error.message, 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleViewStats = async () => {
    if (!selectedAssignment) return;

    try {
      const response = await getAssignmentStats(selectedAssignment._id);
      setStats(response.data);
      setShowStatsModal(true);
    } catch (error) {
      console.error('Stats error:', error);
      showToast('Failed to load statistics: ' + error.message, 'error');
    }
  };

  const handleDownloadFile = async (examenId, studentId, fileName) => {
    try {
      const id = examenId ?? (selectedAssignment?._id ?? selectedAssignment?.id);
      const response = await downloadAssignmentFile(id, studentId);

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'assignment_file');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast('File downloaded successfully');
    } catch (error) {
      showToast('Failed to download file: ' + (error?.message || 'Server error'), 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'graded': return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50';
      case 'submitted': return 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/50';
      case 'pending': return 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/50';
      case 'late': return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'graded': return <CheckCircle className="h-4 w-4" />;
      case 'submitted': return <AlertCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  const calculateStats = (submissions) => {
    const total = submissions.length;
    const submitted = submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length;
    const graded = submissions.filter(s => s.status === 'graded').length;
    const pending = submissions.filter(s => s.status === 'pending').length;
    
    return { total, submitted, graded, pending };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCourseName = (coursId) => {
    if (!coursId || !courses.length) return 'N/A';
    const courseId = typeof coursId === 'object' ? coursId._id : coursId;
    const course = courses.find(c => c._id === courseId);
    return course ? course.nom : 'N/A';
  };

  const getClassName = (coursId) => {
    if (!coursId || !courses.length) return 'N/A';
    const courseId = typeof coursId === 'object' ? coursId._id : coursId;
    const course = courses.find(c => c._id === courseId);
    return course?.classe?.nom || 'N/A';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading assignments...</p>
        </div>
      </div>
    );
  }

  if (view === 'details' && selectedAssignment) {
    const submissions = getSubmissions(selectedAssignment);
    const stats = calculateStats(submissions);
    
    return (
      <div className="min-h-screen bg-background p-6">
        {toast && <Toast message={toast} onClose={() => setToast(null)} type={toastType} />}
        
        <div className="max-w-7xl mx-auto space-y-6">
          <Button 
            variant="ghost" 
            onClick={() => {
              setSelectedAssignment(null);
              setView('list');
            }}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignments
          </Button>

          <Card className="border-2">
            <CardHeader className="border-b bg-muted/50">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">
                    <span className="font-semibold text-primary">{getClassName(selectedAssignment.coursId)}</span>
                    <span className="text-muted-foreground mx-2">•</span>
                    <span className="font-medium">{getCourseName(selectedAssignment.coursId)}</span>
                    <span className="text-muted-foreground mx-2">•</span>
                    <span>{selectedAssignment.nom}</span>
                  </CardTitle>
                  <CardDescription className="text-base">
                    {selectedAssignment.description}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(selectedAssignment)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExportData('csv')} disabled={exporting}>
                    {exporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleViewStats}>
                    <BarChart className="h-4 w-4 mr-1" />
                    Stats
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-1 p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    {formatDate(selectedAssignment.date)}
                  </p>
                </div>
                <div className="space-y-1 p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Total Points</p>
                  <p className="font-semibold text-2xl">{selectedAssignment.noteMax}</p>
                </div>
                <div className="space-y-1 p-4 border rounded-lg bg-blue-500/10">
                  <p className="text-sm text-muted-foreground">Submissions</p>
                  <p className="font-semibold text-2xl text-blue-600 dark:text-blue-400">{stats.submitted}/{stats.total}</p>
                </div>
                <div className="space-y-1 p-4 border rounded-lg bg-green-500/10">
                  <p className="text-sm text-muted-foreground">Graded</p>
                  <p className="font-semibold text-2xl text-green-600 dark:text-green-400">{stats.graded}/{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Student Submissions</CardTitle>
                  <CardDescription>Review and grade student work</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDownloadAllFiles()} disabled={downloading}>
                  {downloading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-1" />
                      Download All
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <div 
                    key={submission.studentId}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(submission.status)}
                        <div>
                          <p className="font-semibold text-lg">{submission.studentName}</p>
                          <p className="text-sm text-muted-foreground">
                            {submission.submittedAt 
                              ? `Submitted: ${formatDate(submission.submittedAt)}`
                              : 'Not submitted yet'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {submission.grade !== null ? (
                        <Badge variant="secondary" className="text-lg px-4 py-2 font-bold">
                          {submission.grade}/{selectedAssignment.noteMax}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not graded</span>
                      )}
                      <Badge className={`${getStatusColor(submission.status)} border`}>
                        {submission.status}
                      </Badge>
                      {submission.file && (
                        <Button variant="outline" size="sm" onClick={() => handleDownloadFile(selectedAssignment._id, submission.studentId, submission.file)}>
                          <Download className="h-4 w-4 mr-1" />
                          File
                        </Button>
                      )}
                      {(submission.status === 'submitted' || submission.status === 'graded') && (
                        <Button size="sm" onClick={() => {
                          setGradingStudent(submission);
                          setGradeInput(submission.grade?.toString() || '');
                          setFeedbackInput('');
                        }}>
                          {submission.status === 'graded' ? 'Update Grade' : 'Grade Now'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {gradingStudent && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Grade Submission</CardTitle>
                  <CardDescription>
                    Grading {gradingStudent.studentName}'s work
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Grade (out of {selectedAssignment.noteMax})</label>
                    <input
                      type="number"
                      min="0"
                      max={selectedAssignment.noteMax}
                      value={gradeInput}
                      onChange={(e) => setGradeInput(e.target.value)}
                      className="w-full p-2 border rounded-md bg-background"
                      placeholder="Enter grade"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Feedback (optional)</label>
                    <textarea
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      className="w-full p-2 border rounded-md bg-background"
                      rows="4"
                      placeholder="Enter feedback for student..."
                      disabled={submitting}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setGradingStudent(null);
                        setGradeInput('');
                        setFeedbackInput('');
                      }}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleGradeSubmit} disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Grade'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
        )}

        {/* Stats Modal */}
        {showStatsModal && stats && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Assignment Statistics</CardTitle>
                <CardDescription>
                  Detailed statistics for {selectedAssignment?.nom}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg bg-blue-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium">Total Students</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalStudents || 0}</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-green-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium">Submissions</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalSubmissions || 0}</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-purple-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium">Graded</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.gradedSubmissions || 0}</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-orange-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm font-medium">Pending</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.pendingSubmissions || 0}</p>
                  </div>
                </div>

                {stats.averageGrade !== undefined && (
                  <div className="p-4 border rounded-lg bg-gradient-to-r from-primary/10 to-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">Average Grade</span>
                    </div>
                    <p className="text-3xl font-bold text-primary">
                      {stats.averageGrade.toFixed(1)}/{selectedAssignment?.noteMax || 0}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {((stats.averageGrade / (selectedAssignment?.noteMax || 1)) * 100).toFixed(1)}% average
                    </p>
                  </div>
                )}

                {stats.gradeDistribution && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Grade Distribution</h4>
                    <div className="space-y-2">
                      {Object.entries(stats.gradeDistribution).map(([range, count]) => (
                        <div key={range} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm font-medium">{range}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{
                                  width: `${stats.totalSubmissions > 0 ? (count / stats.totalSubmissions) * 100 : 0}%`
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button onClick={() => setShowStatsModal(false)}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-background p-6">
      {toast && <Toast message={toast} onClose={() => setToast(null)} type={toastType} />}
      
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Assignments
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Manage and grade student assignments
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="lg" onClick={handleOpenCreate}>
              <FileText className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {assignments.map((assignment) => {
            const submissions = getSubmissions(assignment);
            const stats = calculateStats(submissions);
            const isOverdue = new Date(assignment.date) < new Date();
            
            return (
              <Card key={assignment._id} className="hover:shadow-lg transition-all border">
                <CardHeader className="border-b bg-muted/50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-2xl">
                          <span className="font-semibold text-primary">{getClassName(assignment.coursId)}</span>
                          <span className="text-muted-foreground mx-2">•</span>
                          <span className="font-medium">{getCourseName(assignment.coursId)}</span>
                          <span className="text-muted-foreground mx-2">•</span>
                          <span>{assignment.nom}</span>
                        </CardTitle>
                        {isOverdue && (
                          <Badge variant="destructive" className="animate-pulse">Overdue</Badge>
                        )}
                      </div>
                      <CardDescription className="text-base">
                        {assignment.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Due Date</p>
                          <p className="text-sm font-semibold">{new Date(assignment.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Course</p>
                          <p className="text-sm font-semibold">{getCourseName(assignment.coursId)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Points</p>
                          <p className="text-sm font-semibold">{assignment.noteMax}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 border rounded-lg bg-blue-500/10">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Submitted</p>
                          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{stats.submitted}/{stats.total}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 border rounded-lg bg-green-500/10">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="text-xs text-muted-foreground">Graded</p>
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400">{stats.graded}/{stats.total}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Pending</p>
                          <p className="text-sm font-semibold">{stats.pending}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setView('details');
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Submissions
                      </Button>
                      <Button variant="outline" onClick={() => handleOpenEdit(assignment)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" onClick={() => handleDownloadAllFiles(assignment)} disabled={downloading}>
                        {downloading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            Download All
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleDeleteAssignment(assignment._id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {assignments.length === 0 && (
          <Card className="p-12 text-center border-2 border-dashed">
            <FileText className="h-20 w-20 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Assignments Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first assignment to get started with tracking student work
            </p>
            <Button size="lg" onClick={handleOpenCreate}>
              <FileText className="h-4 w-4 mr-2" />
              Create First Assignment
            </Button>
          </Card>
        )}

        {/* Create/Edit Assignment Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>{editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}</CardTitle>
                <CardDescription>
                  {editingAssignment ? 'Update assignment details' : 'Fill in the details to create a new assignment'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitAssignment} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleFormChange}
                      className="w-full p-2 border rounded-md bg-background"
                      placeholder="Enter assignment title"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      className="w-full p-2 border rounded-md bg-background"
                      rows="4"
                      placeholder="Enter assignment description"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Course <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                        required
                        disabled={submitting}
                      >
                        <option value="">Select a course</option>
                        {courses && courses.length > 0 && courses.map(course => (
                          <option key={course._id} value={course._id}>
                            {course.nom}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Due Date <span className="text-red-500">*</span>
                      </label>
                      <DatePicker
                        date={formData.date}
                        setDate={(date) => setFormData(prev => ({ ...prev, date }))}
                        placeholder="Select due date"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Total Points <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="noteMax"
                      value={formData.noteMax}
                      onChange={handleFormChange}
                      className="w-full p-2 border rounded-md bg-background"
                      placeholder="e.g., 100"
                      min="1"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={handleCloseModal}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {editingAssignment ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        editingAssignment ? 'Update Assignment' : 'Create Assignment'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}