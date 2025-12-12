import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCoursById } from "../../services/coursService";
import { getMaterialsByCourse } from "../../services/courseMaterialService";
import { submitAssignment, updateSubmission, deleteSubmission } from "../../services/examenService";
import { getNoteByExamenAndEtudiant } from "../../services/noteService";
import { AuthContext } from "../../contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Calendar,
  ArrowLeft,
  BookOpen,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle,
  Download,
} from "lucide-react";

// Toast Component
const Toast = ({ message, onClose, type = "error" }) => (
  <div className={`fixed top-5 right-5 ${
    type === "success" ? "bg-green-500" : "bg-destructive"
  } text-white px-4 py-2 rounded shadow-lg animate-slide-in z-50`}>
    <div className="flex items-center justify-between gap-2">
      <span>{message}</span>
      <button onClick={onClose} className="font-bold">×</button>
    </div>
  </div>
);

const StudentCourseDetails = ({ token }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const userId = user?._id || user?.id || (JSON.parse(localStorage.getItem('user') || '{}')._id) || (JSON.parse(localStorage.getItem('user') || '{}').id);
  
  const [course, setCourse] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [tabLoading, setTabLoading] = useState({
    chapters: true,
    assignments: true,
    exams: true,
  });
  const [notesMap, setNotesMap] = useState({});
  const [localSubmissionMap, setLocalSubmissionMap] = useState({});
  const [debugNotesVisible, setDebugNotesVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("chapters");
  const [toast, setToast] = useState(null);
  const [toastType, setToastType] = useState("error");
  const [submittingAssignment, setSubmittingAssignment] = useState(null);
  const [processingReplaceAssignment, setProcessingReplaceAssignment] = useState(null);
  const [deletingAssignment, setDeletingAssignment] = useState(null);
  const [actionModeMap, setActionModeMap] = useState({});
  const [selectedFileMap, setSelectedFileMap] = useState({});

  const fileInputRefs = useRef({});

  const showToastMessage = (message, type = "error") => {
    setToast(message);
    setToastType(type);
    setTimeout(() => setToast(null), 5000);
  };

  // ✅ Fetch course and materials
  const fetchCourseAndMaterials = async () => {
    if (!id) {
      showToastMessage("Invalid course ID");
      setLoadingCourse(false);
      return;
    }

    try {
      setLoadingCourse(true);

      const [data, materials] = await Promise.all([
        getCoursById(id),
        getMaterialsByCourse(id, token)
      ]);

      console.log("📦 Raw course data from backend:", data);
      console.log("📦 Examens field:", data.examens);
      console.log("🆔 Current userId:", userId);

      const instructorName =
        data.enseignant?.prenom && data.enseignant?.nom
          ? `${data.enseignant.prenom} ${data.enseignant.nom}`
          : data.enseignant?.name || "TBA";

      const courseName = data.title || data.nom || "Untitled Course";

      const allExams = data.examens || data.exams || [];
      
      console.log("📝 All exams from backend:", allExams);

      // Separate by type field
      const assignments = allExams.filter(item => {
        const itemType = (item.type || "").toLowerCase();
        return itemType === "assignment";
      });
      
      const exams = allExams.filter(item => {
        const itemType = (item.type || "").toLowerCase();
        return itemType !== "assignment";
      });

      console.log("✅ Filtered assignments:", assignments);
      console.log("✅ Filtered exams:", exams);

      // Log submissions for each assignment
      assignments.forEach(a => {
        console.log(`📋 Assignment "${a.nom || a.title}" submissions:`, a.submissions);
        if (a.submissions) {
          a.submissions.forEach(sub => {
            const subUserId = sub.studentId;
            console.log(`   - Submission by: ${subUserId}, isCurrentUser: ${subUserId === userId || String(subUserId) === String(userId)}`);
          });
        }
      });

      // Build a remote-submission map for current student's submissions
      const remoteSubmissionMap = {};
      assignments.forEach(a => {
        if (a.submissions && a.submissions.length > 0) {
          const userSubmission = a.submissions.find(sub => {
            const subUserId = sub.studentId;
            return String(subUserId) === String(userId);
          });
          if (userSubmission) {
            remoteSubmissionMap[a._id] = {
              submitted: true,
              data: {
                note: userSubmission.note ?? userSubmission.mark ?? null,
                commentaire: userSubmission.commentaire || userSubmission.feedback || null,
                dateSubmission: userSubmission.dateSubmission || userSubmission.date || new Date().toISOString(),
                fileName: userSubmission.fichier || userSubmission.file || null,
              }
            };
          }
        }
      });

      setCourse({
        ...data,
        title: courseName,
        instructorName,
        chapters: data.chapters || [],
        materials: materials || [],
        assignments: assignments,
        exams: exams,
        progress: data.progress || 0,
        className: data.classe?.nom || "General"
      });

      setTimeout(
        () =>
          setTabLoading({
            chapters: false,
            assignments: false,
            exams: false,
          }),
        500
      );

      // Merge remote submissions: when backend confirms a submission, override local map
      setLocalSubmissionMap(prev => {
        const merged = { ...prev };
        Object.keys(remoteSubmissionMap).forEach(k => {
          merged[k] = remoteSubmissionMap[k];
        });
        return merged;
      });

      // Fetch per-exam notes for current student
      try {
        const examList = allExams;
        const promises = examList.map(ex => {
          if (!ex || !ex._id) return Promise.resolve(null);
          return getNoteByExamenAndEtudiant(ex._id, userId)
            .then(res => res?.data || null)
            .catch((err) => {
              console.debug("getNoteByExamenAndEtudiant failed", { examId: ex._id, err });
              return null;
            });
        });
        const results = await Promise.all(promises);
        const map = {};
        results.forEach((n, idx) => {
          const ex = examList[idx];
          if (n && (n.score !== undefined || n.note !== undefined)) {
            if (ex && ex._id) map[ex._id] = n;
          }
        });
        console.log("📊 notesMap built:", map);
        setNotesMap(map);
      } catch (e) {
        console.warn("Could not fetch per-exam notes:", e);
      }
      return data;
    } catch (err) {
      console.error("❌ Error fetching course:", err);
      showToastMessage(err.message || "Failed to load course");
      return null;
    } finally {
      setLoadingCourse(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchCourseAndMaterials();
    }
  }, [id, token, userId]);

  // Handle file selection
  const handleFileSelect = (e, assignmentId) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToastMessage("File size must be less than 10MB");
      return;
    }

    const validExtensions = ['.pdf', '.doc', '.docx', '.txt', '.zip', '.rar'];
    const fileName = file.name.toLowerCase();
    const isValidType = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidType) {
      showToastMessage("Please upload a valid file type (PDF, DOC, DOCX, TXT, ZIP, RAR)");
      return;
    }

    setSelectedFileMap(prev => ({ ...prev, [assignmentId]: file }));

    // If user is replacing a submission, auto-submit the replacement
    const mode = actionModeMap[assignmentId] || 'submit';
    if (mode === 'replace') {
      handleReplaceSubmission(assignmentId, file);
    }
  };

  // Trigger file input
  const triggerFileInput = (assignmentId, mode = 'submit') => {
    setActionModeMap(prev => ({ ...prev, [assignmentId]: mode }));
    const ref = fileInputRefs.current[assignmentId];
    if (ref) ref.click();
  };

  // ✅ Submit assignment
  const handleSubmitAssignment = async (assignmentId) => {
    const file = selectedFileMap[assignmentId];
    
    if (!file) {
      showToastMessage("Please select a file to submit");
      return;
    }

    try {
      setSubmittingAssignment(assignmentId);

      const response = await submitAssignment(assignmentId, file);

      console.log("✅ Submission response:", response);

      showToastMessage("Assignment submitted successfully!", "success");

      // Clear selected file
      setSelectedFileMap(prev => {
        const copy = { ...prev };
        delete copy[assignmentId];
        return copy;
      });

      // Immediately reflect that the user has submitted locally
      setLocalSubmissionMap(prev => ({
        ...prev,
        [assignmentId]: {
          submitted: true,
          data: {
            dateSubmission: new Date().toISOString(),
            note: null,
            commentaire: null,
            fileName: file.name,
          }
        }
      }));

      // ✅ CRITICAL: Wait a moment for backend to process, then refresh
      setTimeout(async () => {
        await fetchCourseAndMaterials();
      }, 1000);

    } catch (error) {
      console.error("❌ Error submitting assignment:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to submit assignment";
      showToastMessage(errorMessage);

      // If already submitted, refresh to show existing submission
      const msg = (error.response?.data?.message || "").toLowerCase();
      if (msg.includes("déjà soumis") || msg.includes("already submitted") || error.response?.status === 400) {
        console.log('🔄 Detected already-submitted response, refreshing...');
        setTimeout(async () => {
          await fetchCourseAndMaterials();
        }, 500);
      }
    } finally {
      setSubmittingAssignment(null);
    }
  };

  // Replace an existing submitted assignment (student action)
  const handleReplaceSubmission = async (assignmentId, fileOverride = null) => {
    const file = fileOverride || selectedFileMap[assignmentId];
    if (!file) {
      showToastMessage("Please select a file to replace the submission");
      return;
    }

    try {
      setProcessingReplaceAssignment(assignmentId);
      const response = await updateSubmission(assignmentId, file);
      console.log("✅ Replacement response:", response);
      showToastMessage("Submission updated successfully!", "success");
      setSelectedFileMap(prev => {
        const copy = { ...prev };
        delete copy[assignmentId];
        return copy;
      });
      // Refresh
      setTimeout(async () => {
        await fetchCourseAndMaterials();
      }, 500);
      // Immediately reflect replacement locally as submitted
      setLocalSubmissionMap(prev => ({
        ...prev,
        [assignmentId]: {
          submitted: true,
          data: {
            dateSubmission: new Date().toISOString(),
            note: null,
            commentaire: null,
            fileName: file.name,
          }
        }
      }));
    } catch (error) {
      console.error("❌ Error replacing submission:", error);
      showToastMessage(error.response?.data?.message || error.message || "Failed to replace submission");
    } finally {
      setProcessingReplaceAssignment(null);
      // reset action mode
      setActionModeMap(prev => ({ ...prev, [assignmentId]: 'submit' }));
    }
  };

  // Delete a student's submission
  const handleDeleteSubmission = async (assignmentId) => {
    const confirm = window.confirm("Are you sure you want to delete your submission? This action cannot be undone.");
    if (!confirm) return;

    try {
      setDeletingAssignment(assignmentId);
      const response = await deleteSubmission(assignmentId);
      console.log("✅ Delete response:", response);
      showToastMessage("Submission deleted successfully!", "success");
      // Refresh
      setTimeout(async () => {
        await fetchCourseAndMaterials();
      }, 500);
      // Remove local submission map entry to reflect deletion
      setLocalSubmissionMap(prev => {
        const copy = { ...prev };
        delete copy[assignmentId];
        return copy;
      });
    } catch (error) {
      console.error("❌ Error deleting submission:", error);
      showToastMessage(error.response?.data?.message || error.message || "Failed to delete submission");
    } finally {
      setDeletingAssignment(null);
    }
  };

  // Get submission status
  const getSubmissionStatus = (assignment) => {
    console.log(`🔍 Checking submission for: ${assignment.nom || assignment.title}`);
    console.log(`   Assignment ID: ${assignment._id}`);
    console.log(`   Submissions array:`, assignment.submissions);
    console.log(`   Current userId: ${userId}`);

    // First, check local submission map (for immediate feedback after submit)
    const localSub = localSubmissionMap[assignment._id];
    if (localSub) {
      console.log(`✅ Found local submission:`, localSub);
      return localSub;
    }

    if (assignment.submissions && Array.isArray(assignment.submissions) && assignment.submissions.length > 0) {
      const userSubmission = assignment.submissions.find(sub => {
        const subUserId = sub.studentId;

        const match = String(subUserId) === String(userId);
        console.log(`   Comparing: ${subUserId} === ${userId} ? ${match}`);
        return match;
      });

      if (userSubmission) {
        console.log(`✅ Found submission:`, userSubmission);
        const data = { ...userSubmission };
        // Always merge note from notesMap if available, overriding submission data
        const noteFromMap = notesMap[assignment._id || assignment.id];
        if (noteFromMap && (noteFromMap.score !== undefined || noteFromMap.note !== undefined)) {
          data.note = noteFromMap.score ?? noteFromMap.note;
          data.commentaire = noteFromMap.commentaire || noteFromMap.feedback || data.commentaire;
        }
        return {
          submitted: true,
          data
        };
      } else {
        console.log(`❌ No matching submission found in array of ${assignment.submissions.length}`);
      }
    } else {
      console.log(`⚠️ No submissions array or empty array`);
    }

    // Fallback: check pre-fetched notes
    const note = notesMap[assignment._id || assignment.id];
    if (note && (note.score !== undefined || note.note !== undefined)) {
      console.log(`✅ Found note in notesMap:`, note);
      return {
        submitted: true,
        data: {
          note: note.score ?? note.note,
          commentaire: note.commentaire || note.feedback || null,
          dateSubmission: note.createdAt || note.updatedAt || new Date().toISOString()
        }
      };
    }

    console.log(`❌ No submission found for this assignment`);
    return { submitted: false, data: null };
  };

  if (loadingCourse) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <Card className="p-8 text-center m-8">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
        <p className="mt-4">Course not found.</p>
        <Button className="mt-4" onClick={() => navigate("/student/courses")}>
          Back to Courses
        </Button>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="container mx-auto px-4 py-2 flex justify-end">
        <Button size="sm" variant="ghost" onClick={() => setDebugNotesVisible(v => !v)}>
          {debugNotesVisible ? "Hide debug" : "Show debug"}
        </Button>
      </div>
      {toast && (
        <Toast message={toast} onClose={() => setToast(null)} type={toastType} />
      )}

      {/* Header */}
      <div className="mb-6 sm:mb-8 md:mb-10">
        <Card className="border-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 shadow-lg rounded-xl">
          <CardContent className="p-6 sm:p-8 md:p-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-2">
                  {course.title}
                </h1>
                <div className="flex items-center gap-4 text-muted-foreground flex-wrap mb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{course.instructorName}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{course.semestre || "TBA"}</span>
                  </div>
                  <span>•</span>
                  <span>{course.className}</span>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-4 items-center mb-4">
                  <Badge className="bg-white/90 text-gray-900">
                    {course.code || "N/A"}
                  </Badge>
                  <Badge className="bg-white/90 text-gray-900">
                    {course.credits || 3} Credits
                  </Badge>
                </div>
                <div className="max-w-2xl">
                  <Progress value={course.progress} className="h-2 bg-white/20" />
                  <div className="text-sm mt-1">{course.progress}% completed</div>
                </div>
              </div>
              <Button
                variant="ghost"
                className="text-foreground mt-4 sm:mt-0"
                onClick={() => navigate("/student/courses")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Courses
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto mb-4">
            <TabsTrigger value="chapters" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Chapters
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Assignments
              {course.assignments?.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {course.assignments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="exams" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Exams
              {course.exams?.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {course.exams.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Chapters */}
          <TabsContent value="chapters">
            {tabLoading.chapters ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : course.materials?.length > 0 ? (
              <div className="grid gap-6">
                {course.materials.map((m, i) => (
                  <Card
                    key={m._id || i}
                    className="p-6 shadow-md border border-primary/20 rounded-xl"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          {m.titre || "Untitled"}
                        </h3>
                        <p className="text-muted-foreground mt-2">
                          {m.description || "No description available."}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-4">
                          {m.type && (
                            <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                              {m.type.toUpperCase()}
                            </Badge>
                          )}
                          {m.uploadedAt && (
                            <Badge className="bg-gray-100 text-gray-800 px-3 py-1">
                              🗓 {new Date(m.uploadedAt).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {m.fichier && (
                        <div className="flex items-center mt-4 sm:mt-0">
                          <a
                            href={`http://localhost:5000/materials/${m.fichier}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button className="bg-secondary text-white hover:bg-secondary/90">
                              <Download className="h-4 w-4 mr-2" /> Download
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No materials yet.</p>
              </Card>
            )}
          </TabsContent>

          {/* Assignments */}
          <TabsContent value="assignments">
            {tabLoading.assignments ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : course.assignments?.length > 0 ? (
              <div className="grid gap-6">
                {course.assignments.map((a, i) => {
                  const now = new Date();
                  const dueDate = a.date ? new Date(a.date) : null;
                  const submissionInfo = getSubmissionStatus(a);

                  let status = "Pending";
                  if (submissionInfo.submitted) {
                    status = submissionInfo.data.note != null ? "Graded" : "Submitted";
                  } else if (dueDate && dueDate < now) {
                    status = "Overdue";
                  }

                  const formattedDate = dueDate?.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }) || "TBA";

                  const formattedTime = dueDate?.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }) || "TBA";

                  return (
                    <Card
                      key={a._id || i}
                      className="p-6 shadow-md border border-primary/20 rounded-xl"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold flex items-center gap-2">
                              <FileText className="h-5 w-5 text-primary" />
                              {a.nom || a.title || "Assignment"}
                            </h3>
                            <p className="text-muted-foreground mt-1">
                              {a.description || "Assignment details will be shared soon."}
                            </p>
                            <div className="flex flex-wrap gap-3 mt-4">
                              <Badge className="bg-primary/10 text-primary border border-primary/30 px-3 py-1">
                                📅 {formattedDate}
                              </Badge>
                              <Badge className="bg-secondary/10 text-secondary border border-secondary/30 px-3 py-1">
                                ⏰ {formattedTime}
                              </Badge>
                              <Badge className="bg-purple-100 text-purple-800">
                                {a.type || "Assignment"}
                              </Badge>
                              {a.noteMax && (
                                <Badge className="bg-blue-100 text-blue-800">
                                  📝 Max Score: {a.noteMax}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Badge
                              className={
                                status === "Pending"
                                  ? "bg-amber-500 text-white"
                                  : status === "Submitted"
                                  ? "bg-blue-500 text-white"
                                  : status === "Graded"
                                  ? "bg-emerald-500 text-white"
                                  : "bg-red-500 text-white"
                              }
                            >
                              {status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>

                        {/* Always available hidden file input (for submit OR replace) */}
                        <input
                          ref={(el) => (fileInputRefs.current[a._id] = el)}
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFileSelect(e, a._id)}
                          accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                        />

                        {/* Submission info */}
                        {submissionInfo.submitted && (
                          <div className="bg-muted/50 p-4 rounded-lg border border-muted">
                            <div className="flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  Submitted on {new Date(submissionInfo.data.dateSubmission).toLocaleString("fr-FR")}
                                </p>
                                {submissionInfo.data.note != null && (
                                  <div className={`mt-3 p-3 rounded-lg border ${
                                    submissionInfo.data.note >= 14
                                      ? "bg-green-50 border-green-200"
                                      : submissionInfo.data.note >= 10
                                      ? "bg-yellow-50 border-yellow-200"
                                      : "bg-red-50 border-red-200"
                                  }`}>
                                    <p className={`text-sm font-semibold ${
                                      submissionInfo.data.note >= 14
                                        ? "text-green-800"
                                        : submissionInfo.data.note >= 10
                                        ? "text-yellow-800"
                                        : "text-red-800"
                                    }`}>
                                      Your Grade: {submissionInfo.data.note}/{a.noteMax}
                                    </p>
                                    {submissionInfo.data.commentaire && (
                                      <p className={`text-sm mt-1 ${
                                        submissionInfo.data.note >= 14
                                          ? "text-green-700"
                                          : submissionInfo.data.note >= 10
                                          ? "text-yellow-700"
                                          : "text-red-700"
                                      }`}>
                                        {submissionInfo.data.commentaire}
                                      </p>
                                    )}
                                  </div>
                                )}
                                {/* Replace/Delete actions: only if not graded */}
                                {submissionInfo.data.note == null && (
                                  <div className="mt-3 flex gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => triggerFileInput(a._id, 'replace')}
                                      disabled={processingReplaceAssignment === a._id}
                                    >
                                      {processingReplaceAssignment === a._id ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          Replacing...
                                        </>
                                      ) : (
                                        "Replace File"
                                      )}
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleDeleteSubmission(a._id)}
                                      disabled={deletingAssignment === a._id}
                                    >
                                      {deletingAssignment === a._id ? (
                                        <>
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                          Deleting...
                                        </>
                                      ) : (
                                        "Delete Submission"
                                      )}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Submit form */}
                        {!submissionInfo.submitted && dueDate && dueDate > now && (
                          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-muted">
                            <div className="flex-1">
                              {/* File input is now always available above */}

                              <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => triggerFileInput(a._id)}
                              >
                                📎 {selectedFileMap[a._id] ? (
                                  selectedFileMap[a._id].name.length > 30
                                    ? selectedFileMap[a._id].name.substring(0, 30) + "..."
                                    : selectedFileMap[a._id].name
                                ) : "Choose File (PDF, DOC, TXT, ZIP)"}
                              </Button>
                            </div>

                            <Button
                              className="bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                              onClick={() => handleSubmitAssignment(a._id)}
                              disabled={
                                submittingAssignment === a._id ||
                                !selectedFileMap[a._id]
                              }
                            >
                              {submittingAssignment === a._id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                "Submit Assignment"
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No assignments yet.</p>
              </Card>
            )}
          </TabsContent>

          {/* Exams */}
          <TabsContent value="exams">
            {tabLoading.exams ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : course.exams?.length > 0 ? (
              <div className="grid gap-6">
                {course.exams.map((e, i) => {
                  const now = new Date();
                  const examDate = e.date ? new Date(e.date) : null;

                  let status = "TBA";
                  if (examDate) {
                    status = examDate > now ? "Upcoming" : "Completed";
                  }

                  const formattedDate = examDate?.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }) || "TBA";

                  const formattedTime = examDate?.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }) || "TBA";

                  // Prefer embedded note, then fallback to pre-fetched note
                  let studentGrade = e.notes?.find(note => {
                    const noteUserId = typeof note.etudiant === 'object'
                      ? note.etudiant?._id
                      : note.etudiant;
                    return String(noteUserId) === String(userId);
                  });

                  if (!studentGrade) {
                    const fetched = notesMap[e._id || e.id];
                    if (fetched) studentGrade = fetched;
                  }

                  return (
                    <Card
                      key={e._id || i}
                      className="p-6 shadow-md border border-primary/20 rounded-xl"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-primary" />
                            {e.nom || e.title || "Exam"}
                          </h3>
                          <p className="text-muted-foreground mt-1">
                            {e.description || "Exam details will be shared soon."}
                          </p>
                          <div className="flex flex-wrap gap-3 mt-4">
                            <Badge className="bg-primary/10 text-primary border border-primary/30 px-3 py-1">
                              📅 {formattedDate}
                            </Badge>
                            <Badge className="bg-secondary/10 text-secondary border border-secondary/30 px-3 py-1">
                              ⏰ {formattedTime}
                            </Badge>
                            <Badge className="bg-emerald-100 text-emerald-800">
                              {e.type || "Written Exam"}
                            </Badge>
                            {e.duration && (
                              <Badge className="bg-blue-100 text-blue-800">
                                🕒 {e.duration} min
                              </Badge>
                            )}
                          </div>

                          {studentGrade && (
                            <div className={`mt-4 p-3 rounded-lg border ${
                              (studentGrade.score ?? studentGrade.note) >= 14
                                ? "bg-green-50 border-green-200"
                                : (studentGrade.score ?? studentGrade.note) >= 10
                                ? "bg-yellow-50 border-yellow-200"
                                : "bg-red-50 border-red-200"
                            }`}>
                              <p className={`text-sm font-semibold ${
                                (studentGrade.score ?? studentGrade.note) >= 14
                                  ? "text-green-800"
                                  : (studentGrade.score ?? studentGrade.note) >= 10
                                  ? "text-yellow-800"
                                  : "text-red-800"
                              }`}>
                                Your Grade: {(studentGrade.score ?? studentGrade.note)}/{e.noteMax}
                              </p>
                              {studentGrade.commentaire && (
                                <p className={`text-sm mt-1 ${
                                  (studentGrade.score ?? studentGrade.note) >= 14
                                    ? "text-green-700"
                                    : (studentGrade.score ?? studentGrade.note) >= 10
                                    ? "text-yellow-700"
                                    : "text-red-700"
                                }`}>
                                  {studentGrade.commentaire}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end flex-col gap-2">
                          <Badge
                            className={
                              status === "Upcoming"
                                ? "bg-amber-500 text-white"
                                : status === "Completed"
                                ? "bg-emerald-500 text-white"
                                : "bg-gray-400 text-white"
                            }
                          >
                            {status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No exams scheduled.</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      {debugNotesVisible && (
        <div className="container mx-auto p-4">
          <h3 className="font-semibold mb-2">Debug Info</h3>
          <div className="text-xs bg-black/5 p-3 rounded mb-3">
            <p><strong>Current userId:</strong> {userId}</p>
            <p><strong>Token:</strong> {token?.substring(0, 20)}...</p>
          </div>
          <h3 className="font-semibold mb-2">notesMap</h3>
          <pre className="text-xs bg-black/5 p-3 rounded overflow-auto max-h-48">{JSON.stringify(notesMap, null, 2)}</pre>
          <h3 className="font-semibold mt-3 mb-2">Assignment submissions</h3>
          <pre className="text-xs bg-black/5 p-3 rounded overflow-auto max-h-48">{JSON.stringify(course?.assignments?.map(a => ({ 
            id: a._id, 
            name: a.nom, 
            submissions: a.submissions?.map(s => ({
              etudiant: typeof s.etudiant === 'object' ? s.etudiant?._id : s.etudiant,
              note: s.note,
              date: s.dateSubmission
            }))
          })), null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default StudentCourseDetails;