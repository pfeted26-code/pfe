import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { Search, Trash2, Mail, Loader2, AlertCircle, UserPlus, Eye, EyeOff, Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getAllUsers, deleteUserById, createUser } from '@/services/userService';
import { getAllClasses } from '@/services/classeService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// ✅ SUPER SIMPLE UserAvatar Component
const UserAvatar = ({ user, size = 'default' }) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    small: 'h-8 w-8 text-xs',
    default: 'h-9 w-9 sm:h-10 sm:w-10 text-sm',
    large: 'h-12 w-12 sm:h-14 sm:w-14 text-base'
  };

  const initial = user.prenom?.charAt(0)?.toUpperCase() || user.nom?.charAt(0)?.toUpperCase() || 'U';

  // If no image or error, show initial
  if (!user.image_User || imageError) {
    return (
      <div className={`${sizeClasses[size]} flex-shrink-0 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center text-white font-semibold`}>
        {initial}
      </div>
    );
  }

  // Simple direct path to image
  return (
    <div className={`${sizeClasses[size]} flex-shrink-0 rounded-full overflow-hidden border-2 border-purple-600/20 bg-gray-100`}>
      <img
       src={`${API_BASE_URL}/images/${user.image_User}`}
        alt={`${user.prenom} ${user.nom}`}
        className="h-full w-full object-cover"
        onError={() => setImageError(true)}
        loading="lazy"
      />
    </div>
  );
};

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [allUsers, setAllUsers] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [newUser, setNewUser] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'etudiant',
    image_User: null,
    NumTel: '',
    Adresse: '',
    datedeNaissance: '',
    classe: '',
    dateInscription: '',
    specialite: '',
    dateEmbauche: '',
    NumTelEnseignant: '',
    classes: [],
    adminCode: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [createError, setCreateError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchClasses();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

 const fetchUsers = async () => {
  try {
    setLoading(true);
    setError(null);
    const response = await getAllUsers();
    
    // ✅ Handle the nested structure: response.data.data.userList
    const users = response?.data?.data?.userList || 
                  response?.data?.userList || 
                  response?.data || 
                  [];
    
    console.log('Fetched users:', users);
    setAllUsers(users);
  } catch (err) {
    setAllUsers([]);
    setError(err?.response?.data?.message || err.message);
  } finally {
    setLoading(false);
  }
};


  const fetchClasses = async () => {
    try {
      const response = await getAllClasses();
      const classes = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      setAllClasses(classes);
    } catch (err) {
      setAllClasses([]);
      console.error('Error fetching classes:', err);
    }
  };

  const filteredUsers = useMemo(() => {
    return (Array.isArray(allUsers) ? allUsers : []).filter(user => {
      if (roleFilter !== 'all' && user.role !== roleFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const fullName = `${user.prenom || ''} ${user.nom || ''}`.toLowerCase();
        return fullName.includes(term) || (user.email || '').toLowerCase().includes(term);
      }
      return true;
    });
  }, [allUsers, searchTerm, roleFilter]);

  const totalPages = Math.ceil((filteredUsers || []).length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = (filteredUsers || []).slice(startIndex, endIndex);

  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 4; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...');
      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, '...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push('...', totalPages);
    }
    return pages;
  };

  const getRoleBadgeColor = role => {
    switch (role) {
      case 'admin': return 'bg-red-500 text-white hover:bg-red-600';
      case 'enseignant': return 'bg-blue-500 text-white hover:bg-blue-600';
      case 'etudiant': return 'bg-green-500 text-white hover:bg-green-600';
      default: return 'bg-gray-500 text-white hover:bg-gray-600';
    }
  };

  const getRoleLabel = role => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'enseignant': return 'Teacher';
      case 'etudiant': return 'Student';
      default: return role;
    }
  };

  const handleDeleteUser = async () => {
    try {
      setActionLoading(true);
      setDeleteError(null);
      await deleteUserById(deletingUser._id);
      setSuccess(`User ${deletingUser.prenom} ${deletingUser.nom} deleted successfully`);
      await fetchUsers();
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setDeleteError(err?.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const validateCreateForm = () => {
    const errors = {};
    if (!newUser.nom.trim()) errors.nom = 'Last name is required';
    if (!newUser.prenom.trim()) errors.prenom = 'First name is required';
    if (!newUser.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      errors.email = 'Invalid email address';
    }
    if (!newUser.password) {
      errors.password = 'Password is required';
    } else if (!/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(newUser.password)) {
      errors.password = 'Password must contain at least 8 characters, one uppercase, one lowercase and one number';
    }
    if (!newUser.role) errors.role = 'Role is required';
    if (newUser.role === 'etudiant' && !newUser.classe) {
      errors.classe = 'Class is required for students';
    }
    if (newUser.role === 'enseignant' && !newUser.specialite?.trim()) {
      errors.specialite = 'Specialty is required for teachers';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

const handleCreateUser = async () => {
  if (!validateCreateForm()) return;

  try {
    setActionLoading(true);
    setCreateError(null);

    // Build the base user data
    const userData = {
      nom: newUser.nom,
      prenom: newUser.prenom,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role,
    };

    // Add role-specific fields
    if (newUser.role === "etudiant") {
      if (newUser.NumTel) userData.NumTel = newUser.NumTel;
      if (newUser.Adresse) userData.Adresse = newUser.Adresse;
      if (newUser.datedeNaissance) userData.datedeNaissance = newUser.datedeNaissance;
      if (newUser.classe) userData.classe = newUser.classe;
      if (newUser.dateInscription) userData.dateInscription = newUser.dateInscription;
    }

    if (newUser.role === "enseignant") {
      if (newUser.specialite) userData.specialite = newUser.specialite;
      if (newUser.dateEmbauche) userData.dateEmbauche = newUser.dateEmbauche;
      if (newUser.NumTelEnseignant) userData.NumTelEnseignant = newUser.NumTelEnseignant;
      if ((newUser.classes || []).length > 0) userData.classes = newUser.classes;
    }

    if (newUser.role === "admin") {
      if (newUser.adminCode) userData.adminCode = newUser.adminCode;
    }

    // Add image file if exists
    if (newUser.image_User instanceof File) {
      userData.image_User = newUser.image_User;
    }

    // Call the API (createUser handles FormData internally)
    await createUser(userData);

    // Success handling
    setSuccess(`User ${newUser.prenom} ${newUser.nom} created successfully`);
    await fetchUsers();
    setIsCreateDialogOpen(false);
    resetCreateForm();
    setTimeout(() => setSuccess(null), 3000);

  } catch (err) {
    setCreateError(err.message);
  } finally {
    setActionLoading(false);
  }
};

 

  const resetCreateForm = () => {
    setNewUser({
      nom: '',
      prenom: '',
      email: '',
      password: '',
      role: 'etudiant',
      image_User: null,
      NumTel: '',
      Adresse: '',
      datedeNaissance: '',
      classe: '',
      dateInscription: '',
      specialite: '',
      dateEmbauche: '',
      NumTelEnseignant: '',
      classes: [],
      adminCode: '',
    });
    setFormErrors({});
    setShowPassword(false);
    setCreateError(null);
  };

  const openCreateDialog = () => {
    resetCreateForm();
    setIsCreateDialogOpen(true);
  };

  const openDeleteDialog = user => {
    setDeletingUser(user);
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  };

  const handleRoleChange = (value) => {
    setNewUser({
      ...newUser,
      role: value,
      NumTel: '',
      Adresse: '',
      datedeNaissance: '',
      classe: '',
      dateInscription: '',
      specialite: '',
      dateEmbauche: '',
      NumTelEnseignant: '',
      classes: [],
      adminCode: '',
    });
    setFormErrors({});
  };

  const handleClassesChange = (classId) => {
    const currentClasses = newUser.classes || [];
    if (currentClasses.includes(classId)) {
      setNewUser({
        ...newUser,
        classes: currentClasses.filter(id => id !== classId)
      });
    } else {
      setNewUser({
        ...newUser,
        classes: [...currentClasses, classId]
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewUser({ ...newUser, image_User: file });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-2 sm:p-4 lg:p-6">
      <div className="container mx-auto space-y-3 sm:space-y-4 lg:space-y-6 max-w-7xl">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                User Management
              </h1>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                View and manage all users in the system
              </p>
            </div>
            <Button onClick={openCreateDialog} className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-500 hover:via-blue-500 hover:to-cyan-500 text-white shadow-lg w-full sm:w-auto sm:shrink-0" size="sm">
              <UserPlus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-sm">Create User</span>
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 dark:bg-green-950/50 text-green-900 dark:text-green-300 border-green-200 dark:border-green-800/50 animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{success}</AlertDescription>
            </Alert>
          )}
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1 p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl">All Users</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Showing {startIndex + 1}-{Math.min(endIndex, (filteredUsers || []).length)} of {(filteredUsers || []).length} user{(filteredUsers || []).length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm h-9 sm:h-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] lg:w-[180px] h-9 sm:h-10 text-sm">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="enseignant">Teacher</SelectItem>
                    <SelectItem value="etudiant">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">Show:</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => { setItemsPerPage(Number(value)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[70px] h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground text-xs sm:text-sm">per page</span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (Array.isArray(currentUsers) && currentUsers.length === 0) ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {(filteredUsers || []).length === 0 ? 'No users found' : 'No users on this page'}
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {(Array.isArray(currentUsers) ? currentUsers : []).map(user => (
                  <div key={user._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <UserAvatar user={user} size="default" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-sm sm:text-base">
                          {user.prenom} {user.nom}
                        </p>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <Badge className={`${getRoleBadgeColor(user.role)} text-xs px-2 py-0.5`}>
                        {getRoleLabel(user.role)}
                      </Badge>
                      <Badge className={`text-xs px-2 py-0.5 ${user.Status ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-600 hover:bg-slate-700'}`}>
                        {user.Status ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(user)} className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 sm:h-9 sm:w-9">
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && (filteredUsers || []).length > 0 && totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                  <Button variant="outline" size="icon" onClick={goToFirstPage} disabled={currentPage === 1} className="h-8 w-8 sm:h-9 sm:w-9 hidden sm:flex">
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={goToPreviousPage} disabled={currentPage === 1} className="h-8 w-8 sm:h-9 sm:w-9">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {(Array.isArray(getPageNumbers()) ? getPageNumbers() : []).map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground hidden sm:inline">
                          ...
                        </span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="icon"
                          onClick={() => goToPage(page)}
                          className={`h-8 w-8 sm:h-9 sm:w-9 text-xs sm:text-sm ${
                            currentPage === page 
                              ? 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500' 
                              : ''
                          } ${index > 1 && index < getPageNumbers().length - 1 ? 'hidden sm:inline-flex' : ''}`}
                        >
                          {page}
                        </Button>
                      )
                    ))}
                  </div>
                  <Button variant="outline" size="icon" onClick={goToNextPage} disabled={currentPage === totalPages} className="h-8 w-8 sm:h-9 sm:w-9">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={goToLastPage} disabled={currentPage === totalPages} className="h-8 w-8 sm:h-9 sm:w-9 hidden sm:flex">
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => { setIsDeleteDialogOpen(open); if (!open) setDeleteError(null); }}>
          <DialogContent className="max-w-[90vw] sm:max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Delete User</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Are you sure you want to delete {deletingUser?.prenom} {deletingUser?.nom}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {deleteError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{deleteError}</AlertDescription>
              </Alert>
            )}
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={actionLoading} className="w-full sm:w-auto text-sm" size="sm">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser} disabled={actionLoading} className="w-full sm:w-auto text-sm" size="sm">
                {actionLoading && <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { setIsCreateDialogOpen(open); if (!open) resetCreateForm(); }}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Create New User</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Add a new user to the system
              </DialogDescription>
            </DialogHeader>
            {createError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{createError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-4 py-2 sm:py-4">
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prenom" className="text-xs sm:text-sm">First Name *</Label>
                    <Input
                      id="prenom"
                      placeholder="John"
                      value={newUser.prenom}
                      onChange={(e) => { setNewUser({...newUser, prenom: e.target.value}); if (formErrors.prenom) setFormErrors({...formErrors, prenom: ''}); }}
                      className={`text-sm h-9 ${formErrors.prenom ? 'border-destructive' : ''}`}
                    />
                    {formErrors.prenom && <p className="text-xs text-destructive">{formErrors.prenom}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nom" className="text-xs sm:text-sm">Last Name *</Label>
                    <Input
                      id="nom"
                      placeholder="Doe"
                      value={newUser.nom}
                      onChange={(e) => { setNewUser({...newUser, nom: e.target.value}); if (formErrors.nom) setFormErrors({...formErrors, nom: ''}); }}
                      className={`text-sm h-9 ${formErrors.nom ? 'border-destructive' : ''}`}
                    />
                    {formErrors.nom && <p className="text-xs text-destructive">{formErrors.nom}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs sm:text-sm">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={newUser.email}
                    onChange={(e) => { setNewUser({...newUser, email: e.target.value}); if (formErrors.email) setFormErrors({...formErrors, email: ''}); }}
                    className={`text-sm h-9 ${formErrors.email ? 'border-destructive' : ''}`}
                  />
                  {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs sm:text-sm">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newUser.password}
                      onChange={(e) => { setNewUser({...newUser, password: e.target.value}); if (formErrors.password) setFormErrors({...formErrors, password: ''}); }}
                      className={`pr-10 text-sm h-9 ${formErrors.password ? 'border-destructive' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {formErrors.password && <p className="text-xs text-destructive">{formErrors.password}</p>}
                  <p className="text-xs text-muted-foreground">Must contain 8+ characters, uppercase, lowercase & number</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-xs sm:text-sm">Role *</Label>
                  <Select value={newUser.role} onValueChange={handleRoleChange}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="etudiant">Student</SelectItem>
                      <SelectItem value="enseignant">Teacher</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.role && <p className="text-xs text-destructive">{formErrors.role}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image_User" className="text-xs sm:text-sm">Profile Image</Label>
                  <Input
                    id="image_User"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="text-sm h-9 file:text-sm"
                  />
                </div>
              </div>

              {newUser.role === 'etudiant' && (
                <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t">
                  <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground">Student Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="classe" className="text-xs sm:text-sm">Class *</Label>
                    <Select value={newUser.classe} onValueChange={(value) => { setNewUser({...newUser, classe: value}); if (formErrors.classe) setFormErrors({...formErrors, classe: ''}); }}>
                      <SelectTrigger className={`h-9 text-sm ${formErrors.classe ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Array.isArray(allClasses) ? allClasses : []).map((classe) => (
                          <SelectItem key={classe._id} value={classe._id} className="text-sm">
                            {classe.nom} - {classe.annee} {classe.specialisation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.classe && <p className="text-xs text-destructive">{formErrors.classe}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="NumTel" className="text-xs sm:text-sm">Phone Number</Label>
                      <Input
                        id="NumTel"
                        placeholder="+216 XX XXX XXX"
                        value={newUser.NumTel}
                        onChange={(e) => setNewUser({...newUser, NumTel: e.target.value})}
                        className="text-sm h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="datedeNaissance" className="text-xs sm:text-sm">Date of Birth</Label>
                      <DatePicker
                        date={newUser.datedeNaissance ? new Date(newUser.datedeNaissance) : null}
                        setDate={(date) => setNewUser({...newUser, datedeNaissance: date ? date.toISOString().split('T')[0] : ''})}
                        placeholder="Select date of birth"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="Adresse" className="text-xs sm:text-sm">Address</Label>
                    <Input
                      id="Adresse"
                      placeholder="123 Main St, City"
                      value={newUser.Adresse}
                      onChange={(e) => setNewUser({...newUser, Adresse: e.target.value})}
                      className="text-sm h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateInscription" className="text-xs sm:text-sm">Enrollment Date</Label>
                    <DatePicker
                      date={newUser.dateInscription ? new Date(newUser.dateInscription) : null}
                      setDate={(date) => setNewUser({...newUser, dateInscription: date ? date.toISOString().split('T')[0] : ''})}
                      placeholder="Select enrollment date"
                    />
                  </div>
                </div>
              )}

              {newUser.role === 'enseignant' && (
                <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t">
                  <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground">Teacher Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="specialite" className="text-xs sm:text-sm">Specialty *</Label>
                    <Input
                      id="specialite"
                      placeholder="Mathematics, Physics, etc."
                      value={newUser.specialite}
                      onChange={(e) => { setNewUser({...newUser, specialite: e.target.value}); if (formErrors.specialite) setFormErrors({...formErrors, specialite: ''}); }}
                      className={`text-sm h-9 ${formErrors.specialite ? 'border-destructive' : ''}`}
                    />
                    {formErrors.specialite && <p className="text-xs text-destructive">{formErrors.specialite}</p>}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="NumTelEnseignant" className="text-xs sm:text-sm">Phone Number</Label>
                      <Input
                        id="NumTelEnseignant"
                        placeholder="+216 XX XXX XXX"
                        value={newUser.NumTelEnseignant}
                        onChange={(e) => setNewUser({...newUser, NumTelEnseignant: e.target.value})}
                        className="text-sm h-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateEmbauche" className="text-xs sm:text-sm">Hire Date</Label>
                      <DatePicker
                        date={newUser.dateEmbauche ? new Date(newUser.dateEmbauche) : null}
                        setDate={(date) => setNewUser({...newUser, dateEmbauche: date ? date.toISOString().split('T')[0] : ''})}
                        placeholder="Select hire date"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm">Classes (Optional)</Label>
                    <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                      {(Array.isArray(allClasses) ? allClasses : []).length === 0 ? (
                        <p className="text-xs sm:text-sm text-muted-foreground">No classes available</p>
                      ) : (
                        (Array.isArray(allClasses) ? allClasses : []).map((classe) => (
                          <div key={classe._id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`class-${classe._id}`}
                              checked={(newUser.classes || []).includes(classe._id)}
                              onChange={() => handleClassesChange(classe._id)}
                              className="rounded"
                            />
                            <label htmlFor={`class-${classe._id}`} className="text-xs sm:text-sm cursor-pointer">
                              {classe.nom} - {classe.annee} {classe.specialisation}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {newUser.role === 'admin' && (
                <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t">
                  <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground">Admin Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="adminCode" className="text-xs sm:text-sm">Admin Code (Optional)</Label>
                    <Input
                      id="adminCode"
                      placeholder="Enter admin access code"
                      value={newUser.adminCode}
                      onChange={(e) => setNewUser({...newUser, adminCode: e.target.value})}
                      className="text-sm h-9"
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={actionLoading} className="w-full sm:w-auto text-sm" size="sm">
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={actionLoading} className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-500 hover:via-blue-500 hover:to-cyan-500 text-white w-full sm:w-auto text-sm" size="sm">
                {actionLoading && <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
