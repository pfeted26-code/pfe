import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  BookOpen,
  X,
  Loader2,
} from "lucide-react";

import {
  getAllCours,
  deleteCoursById,
  createCours,
  updateCours,
} from "@/services/coursService";
import { getEnseignants } from "@/services/userService";
import { getAllClasses } from "@/services/classeService";

export default function AdminCourses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClasse, setFilterClasse] = useState("all");
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [toast, setToast] = useState(null);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState("");
  const [editTeacherSearchTerm, setEditTeacherSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });

  const [formData, setFormData] = useState({
    nom: "",
    code: "",
    description: "",
    credits: "",
    semestre: "",
    classe: "",
    enseignant: "",
  });

  // Fetch all data
  async function fetchData() {
    try {
      setLoading(true);

      // Fetch courses
      const coursesData = await getAllCours();
      console.log("Courses loaded:", coursesData);
      setCourses(coursesData);

      // Fetch teachers
      const teachersResponse = await getEnseignants();
      const teachersData = teachersResponse.data || teachersResponse;
      console.log("Teachers loaded:", teachersData);
      setTeachers(teachersData);

      // Fetch classes
      const classesResponse = await getAllClasses();
      const classesData = classesResponse.data || classesResponse;
      console.log("Classes loaded:", classesData);
      setClasses(classesData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      showToast("error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    console.log(`Setting ${name} to:`, value);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getTeacherName = (enseignantId) => {
    if (!enseignantId) return "Not assigned";
    const teacher = teachers.find((t) => (t.id || t._id) === enseignantId);
    return teacher ? `${teacher.prenom} ${teacher.nom}` : "Not assigned";
  };

  const getClassName = (classeId) => {
    if (!classeId) return "Not assigned";
    const classe = classes.find((c) => (c.id || c._id) === classeId);
    return classe ? classe.nom : "Not assigned";
  };

  const openCreateDialog = () => {
    setFormData({
      nom: "",
      code: "",
      description: "",
      credits: "3",
      semestre: "1",
      classe: "",
      enseignant: "",
    });
    setTeacherSearchTerm("");
    setShowCreateDialog(true);
  };

  const openEditDialog = (course) => {
    setSelectedCourse(course);
    setFormData({
      nom: course.nom || "",
      code: course.code || "",
      description: course.description || "",
      credits: course.credits?.toString() || "3",
      semestre: course.semestre || "1",
      classe: course.classe?._id || course.classe || "",
      enseignant: course.enseignant?._id || course.enseignant || "",
    });
    setEditTeacherSearchTerm("");
    setShowEditDialog(true);
  };

  const handleCreate = async () => {
    try {
      setSubmitting(true);

      // Validation
      if (!formData.nom || !formData.code || !formData.classe) {
        showToast(
          "error",
          "Please fill in required fields (Name, Code, Class)"
        );
        return;
      }

      const courseData = {
        nom: formData.nom,
        code: formData.code,
        description: formData.description || "",
        credits: parseInt(formData.credits) || 3,
        semestre: formData.semestre || "1",
        classe: formData.classe,
      };

      // Only add enseignant if selected
      if (formData.enseignant) {
        courseData.enseignant = formData.enseignant;
      }

      console.log("Creating course with data:", courseData);

      await createCours(courseData);

      showToast("success", "Course created successfully!");
      setShowCreateDialog(false);
      fetchData(); // Refresh list
    } catch (err) {
      console.error("Failed to create course:", err);
      showToast(
        "error",
        err.response?.data?.message || "Failed to create course"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSubmitting(true);

      const courseData = {
        nom: formData.nom,
        code: formData.code,
        description: formData.description || "",
        credits: parseInt(formData.credits) || 3,
        semestre: formData.semestre || "1",
        classe: formData.classe,
      };

      // Only add enseignant if selected
      if (formData.enseignant) {
        courseData.enseignant = formData.enseignant;
      }

      console.log("Updating course with data:", courseData);

      await updateCours(selectedCourse._id || selectedCourse.id, courseData);

      showToast("success", "Course updated successfully!");
      setShowEditDialog(false);
      fetchData(); // Refresh list
    } catch (err) {
      console.error("Failed to update course:", err);
      showToast(
        "error",
        err.response?.data?.message || "Failed to update course"
      );
    } finally {
      setSubmitting(false);
    }
  };

  async function handleDelete(id) {
    try {
      await deleteCoursById(id);
      showToast("success", "Course deleted successfully!");
      fetchData();
    } catch (err) {
      console.error("Failed to delete course:", err);
      showToast("error", "Failed to delete course");
    }
  }

  // Filter teachers based on search
  const filteredTeachers = teachers.filter((teacher) => {
    if (!teacherSearchTerm) return true;
    const searchLower = teacherSearchTerm.toLowerCase();
    return (
      teacher.prenom?.toLowerCase().includes(searchLower) ||
      teacher.nom?.toLowerCase().includes(searchLower) ||
      teacher.email?.toLowerCase().includes(searchLower)
    );
  });

  const filteredEditTeachers = teachers.filter((teacher) => {
    if (!editTeacherSearchTerm) return true;
    const searchLower = editTeacherSearchTerm.toLowerCase();
    return (
      teacher.prenom?.toLowerCase().includes(searchLower) ||
      teacher.nom?.toLowerCase().includes(searchLower) ||
      teacher.email?.toLowerCase().includes(searchLower)
    );
  });

  // Filtering courses
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false ||
      course.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;

    const matchesClasse =
      filterClasse === "all" ||
      course.classe?._id === filterClasse ||
      course.classe === filterClasse;

    return matchesSearch && matchesClasse;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="container mx-auto space-y-6">
        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
            <Alert
              className={`min-w-[300px] shadow-lg border-2 ${
                toast.type === "success"
                  ? "bg-green-50 border-green-500 text-green-900"
                  : "bg-red-50 border-red-500 text-red-900"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <AlertDescription className="font-medium ml-2">
                {toast.message}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Course Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage all courses and their assignments
            </p>
          </div>
          <Button className="gap-2" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Add Course
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Courses</CardTitle>
            <CardDescription>
              View and manage all system courses
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterClasse} onValueChange={setFilterClasse}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((classe) => (
                    <SelectItem
                      key={classe._id || classe.id}
                      value={classe._id || classe.id}
                    >
                      {classe.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="mt-4 text-muted-foreground">Loading courses...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredCourses.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No courses found.</p>
              </div>
            )}

            {/* Courses List */}
            <div className="space-y-3">
              {!loading &&
                filteredCourses.map((course) => (
                  <div
                    key={course._id || course.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-lg">
                        {course.code?.slice(0, 2).toUpperCase() || "CO"}
                      </div>

                      <div>
                        <p className="font-medium text-lg">{course.nom}</p>
                        <p className="text-sm text-muted-foreground">
                          {course.code} •{" "}
                          {getClassName(course.classe?._id || course.classe)} •{" "}
                          {course.credits || 3} credits • S
                          {course.semestre || 1}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[120px]">
                        <p className="text-sm font-medium">
                          {getTeacherName(
                            course.enseignant?._id || course.enseignant
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">Teacher</p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(course)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setDeleteConfirm({
                            open: true,
                            id: course._id || course.id,
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Create Course Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>
                Add a new course to the system
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Course Name *</Label>
                  <Input
                    id="nom"
                    name="nom"
                    placeholder="e.g., Advanced Mathematics"
                    value={formData.nom}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Course Code *</Label>
                  <Input
                    id="code"
                    name="code"
                    placeholder="e.g., MATH301"
                    value={formData.code}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="classe">Class *</Label>
                  <Select
                    value={formData.classe}
                    onValueChange={(value) =>
                      handleSelectChange("classe", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((classe) => (
                        <SelectItem
                          key={classe._id || classe.id}
                          value={classe._id || classe.id}
                        >
                          {classe.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credits">Credits *</Label>
                  <Input
                    id="credits"
                    name="credits"
                    type="number"
                    placeholder="3"
                    value={formData.credits}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semestre">Semester *</Label>
                  <Select
                    value={formData.semestre}
                    onValueChange={(value) =>
                      handleSelectChange("semestre", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Teacher Selection - OPENS ONLY ON INTERACTION */}
              <div className="space-y-2">
                <Label>Assigned Teacher (Optional)</Label>
                <div className="space-y-2">
                  {/* Search Input with Click Handler */}
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-3 h-4 w-4 text-muted-foreground cursor-pointer"
                      onClick={() => {
                        if (!formData.enseignant && teachers.length > 0) {
                          setTeacherSearchTerm(" "); // Trigger list to show
                          setTimeout(() => setTeacherSearchTerm(""), 0); // Clear immediately
                        }
                      }}
                    />
                    <Input
                      placeholder="Search teacher by name or click search icon..."
                      value={teacherSearchTerm}
                      onChange={(e) => setTeacherSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Selected Teacher Display */}
                  {formData.enseignant && (
                    <div className="flex items-center justify-between p-3 border rounded-md bg-primary/10 border-primary/30">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {getTeacherName(formData.enseignant)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          handleSelectChange("enseignant", "");
                          setTeacherSearchTerm("");
                        }}
                        type="button"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Teacher List - ONLY SHOWS WHEN SEARCHING */}
                  {teacherSearchTerm && !formData.enseignant && (
                    <div className="border rounded-md max-h-[200px] overflow-y-auto bg-background">
                      {filteredTeachers.length > 0 ? (
                        filteredTeachers.slice(0, 10).map((teacher) => (
                          <div
                            key={teacher.id || teacher._id}
                            onClick={() => {
                              const teacherId = teacher.id || teacher._id;
                              console.log(
                                "Selecting teacher:",
                                teacherId,
                                teacher
                              );
                              handleSelectChange("enseignant", teacherId);
                              setTeacherSearchTerm("");
                            }}
                            className="p-3 cursor-pointer hover:bg-accent transition-colors border-b last:border-b-0"
                          >
                            <p className="font-medium">
                              {teacher.prenom} {teacher.nom}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {teacher.email}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="p-4 text-center text-sm text-muted-foreground">
                          No teachers found
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Course description..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Course"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Course Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
              <DialogDescription>Update course information</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nom">Course Name *</Label>
                  <Input
                    id="edit-nom"
                    name="nom"
                    placeholder="e.g., Advanced Mathematics"
                    value={formData.nom}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-code">Course Code *</Label>
                  <Input
                    id="edit-code"
                    name="code"
                    placeholder="e.g., MATH301"
                    value={formData.code}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-classe">Class *</Label>
                  <Select
                    value={formData.classe}
                    onValueChange={(value) =>
                      handleSelectChange("classe", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((classe) => (
                        <SelectItem
                          key={classe._id || classe.id}
                          value={classe._id || classe.id}
                        >
                          {classe.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-credits">Credits *</Label>
                  <Input
                    id="edit-credits"
                    name="credits"
                    type="number"
                    placeholder="3"
                    value={formData.credits}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-semestre">Semester *</Label>
                  <Select
                    value={formData.semestre}
                    onValueChange={(value) =>
                      handleSelectChange("semestre", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Teacher Selection for Edit - OPENS ONLY ON INTERACTION */}
              <div className="space-y-2">
                <Label>Assigned Teacher (Optional)</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-3 h-4 w-4 text-muted-foreground cursor-pointer"
                      onClick={() => {
                        if (!formData.enseignant && teachers.length > 0) {
                          setEditTeacherSearchTerm(" ");
                          setTimeout(() => setEditTeacherSearchTerm(""), 0);
                        }
                      }}
                    />
                    <Input
                      placeholder="Search teacher by name or click search icon..."
                      value={editTeacherSearchTerm}
                      onChange={(e) => setEditTeacherSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {formData.enseignant && (
                    <div className="flex items-center justify-between p-3 border rounded-md bg-primary/10 border-primary/30">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {getTeacherName(formData.enseignant)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          handleSelectChange("enseignant", "");
                          setEditTeacherSearchTerm("");
                        }}
                        type="button"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Teacher List - ONLY SHOWS WHEN SEARCHING */}
                  {editTeacherSearchTerm && !formData.enseignant && (
                    <div className="border rounded-md max-h-[200px] overflow-y-auto bg-background">
                      {filteredEditTeachers.length > 0 ? (
                        filteredEditTeachers.slice(0, 10).map((teacher) => (
                          <div
                            key={teacher.id || teacher._id}
                            onClick={() => {
                              const teacherId = teacher.id || teacher._id;
                              handleSelectChange("enseignant", teacherId);
                              setEditTeacherSearchTerm("");
                            }}
                            className="p-3 cursor-pointer hover:bg-accent transition-colors border-b last:border-b-0"
                          >
                            <p className="font-medium">
                              {teacher.prenom} {teacher.nom}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {teacher.email}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="p-4 text-center text-sm text-muted-foreground">
                          No teachers found
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  placeholder="Course description..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Course"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirm.open}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm({ open: false, id: null });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this course? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm({ open: false, id: null })}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={async () => {
                await handleDelete(deleteConfirm.id);
                setDeleteConfirm({ open: false, id: null });
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
