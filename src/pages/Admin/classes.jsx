import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Search, Trash2, Loader2, AlertCircle, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { getAllClasses, createClasse, deleteClasseById } from '@/services/classeService';

export default function AdminClasses() {
  const [searchTerm, setSearchTerm] = useState('');
  const [allClasses, setAllClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingClasse, setDeletingClasse] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [newClasse, setNewClasse] = useState({
    nom: '',
    annee: '',
    specialisation: '',
    anneeAcademique: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [createError, setCreateError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllClasses();    // <--- FIXED: now returns array directly
      setAllClasses(data);
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = useMemo(() => {
    if (!searchTerm) return allClasses;
    const term = searchTerm.toLowerCase();
    return allClasses.filter(c =>
      c.nom.toLowerCase().includes(term) ||
      String(c.annee).toLowerCase().includes(term) ||
      c.specialisation.toLowerCase().includes(term) ||
      c.anneeAcademique.toLowerCase().includes(term)
    );
  }, [allClasses, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClasses = filteredClasses.slice(startIndex, endIndex);

  // Pagination controls
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

  const handleDeleteClasse = async () => {
    try {
      setActionLoading(true);
      setDeleteError(null);
      await deleteClasseById(deletingClasse._id);
      setSuccess(`Class "${deletingClasse.nom}" deleted successfully`);
      await fetchClasses();
      setIsDeleteDialogOpen(false);
      setDeletingClasse(null);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setDeleteError(err.message || "Unknown error");
    } finally {
      setActionLoading(false);
    }
  };

  const validateCreateForm = () => {
    const errors = {};
    if (!newClasse.nom.trim()) errors.nom = 'Class name is required';
    if (!newClasse.annee || isNaN(Number(newClasse.annee))) errors.annee = 'Year is required and must be a number';
    if (!newClasse.specialisation.trim()) errors.specialisation = 'Specialization is required';
    if (!newClasse.anneeAcademique.trim()) errors.anneeAcademique = 'Academic year is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateClasse = async () => {
    if (!validateCreateForm()) return;
    try {
      setActionLoading(true);
      setCreateError(null);
      await createClasse(newClasse);
      setSuccess(`Class "${newClasse.nom}" created successfully`);
      await fetchClasses();
      setIsCreateDialogOpen(false);
      resetCreateForm();
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setCreateError(err.message || "Unknown error");
    } finally {
      setActionLoading(false);
    }
  };

  const resetCreateForm = () => {
    setNewClasse({
      nom: '',
      annee: '',
      specialisation: '',
      anneeAcademique: '',
    });
    setFormErrors({});
    setCreateError(null);
  };

  const openCreateDialog = () => {
    resetCreateForm();
    setIsCreateDialogOpen(true);
  };

  const openDeleteDialog = classe => {
    setDeletingClasse(classe);
    setDeleteError(null);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-2 sm:p-4 lg:p-6">
      <div className="container mx-auto space-y-3 sm:space-y-4 lg:space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Class Management
              </h1>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                View and manage all classes
              </p>
            </div>
            <Button onClick={openCreateDialog} className="bg-gradient-to-r from-green-600 via-blue-600 to-cyan-600 hover:from-green-500 hover:via-blue-500 hover:to-cyan-500 text-white shadow-lg w-full sm:w-auto sm:shrink-0" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              <span className="text-sm">Create Class</span>
            </Button>
          </div>
          {error && (
            <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription className="text-sm">{error}</AlertDescription></Alert>
          )}
          {success && (
            <Alert className="bg-green-50 dark:bg-green-950/50 text-green-900 dark:text-green-300 border-green-200 dark:border-green-800/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{success}</AlertDescription>
            </Alert>
          )}
        </div>
        {/* Main card */}
        <Card className="shadow-xl">
          <CardHeader className="space-y-1 p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl">All Classes</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredClasses.length)} of {filteredClasses.length} class{filteredClasses.length !== 1 ? 'es' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* Search/filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search class by name, year, specialization, academic year..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm h-9 sm:h-10"
                />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">Show:</span>
                <Select value={itemsPerPage.toString()} onValueChange={v => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[70px] h-8 text-sm"><SelectValue /></SelectTrigger>
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
            {/* Class List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : currentClasses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {filteredClasses.length === 0 ? 'No classes found' : 'No classes on this page'}
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {currentClasses.map(classe => (
                  <div key={classe._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div>
                        <p className="font-medium truncate text-sm sm:text-base">{classe.nom}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                          <Badge className="bg-blue-600 text-white">{classe.annee}</Badge>
                          <Badge className="bg-purple-600 text-white">{classe.specialisation}</Badge>
                          <Badge className="bg-cyan-700 text-white">{classe.anneeAcademique}</Badge>
                          <Badge className="bg-green-500 text-white">{`Students: ${classe.etudiants?.length || 0}`}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(classe)}
                        className="hover:bg-destructive/10 hover:text-destructive h-8 w-8 sm:h-9 sm:w-9"
                        title="Delete class"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Pagination */}
            {!loading && filteredClasses.length > 0 && totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                  <Button variant="outline" size="icon" onClick={goToFirstPage} disabled={currentPage === 1} className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9">⏪</Button>
                  <Button variant="outline" size="icon" onClick={goToPreviousPage} disabled={currentPage === 1} className="h-8 w-8 sm:h-9 sm:w-9">←</Button>
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, idx) => typeof page === 'string'
                      ? <span key={page+idx} className="px-2 text-muted-foreground hidden sm:inline">…</span>
                      : (
                          <Button key={page} variant={currentPage === page ? "default" : "outline"} size="icon" onClick={() => goToPage(page)}
                            className={`h-8 w-8 sm:h-9 sm:w-9 text-xs sm:text-sm ${currentPage === page ? 'bg-gradient-to-r from-green-600 to-cyan-600' : ''} ${idx > 1 && idx < getPageNumbers().length - 1 ? 'hidden sm:inline-flex' : ''}`}>
                            {page}
                          </Button>
                        ))}
                  </div>
                  <Button variant="outline" size="icon" onClick={goToNextPage} disabled={currentPage === totalPages} className="h-8 w-8 sm:h-9 sm:w-9">→</Button>
                  <Button variant="outline" size="icon" onClick={goToLastPage} disabled={currentPage === totalPages} className="hidden sm:flex h-8 w-8 sm:h-9 sm:w-9">⏩</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={open => { setIsDeleteDialogOpen(open); if (!open) setDeleteError(null); }}>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Delete Class</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deletingClasse?.nom}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {deleteError && (<Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{deleteError}</AlertDescription></Alert>)}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={actionLoading} className="w-full sm:w-auto">Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteClasse} disabled={actionLoading} className="w-full sm:w-auto">
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create/Update Class Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={open => { setIsCreateDialogOpen(open); if (!open) resetCreateForm(); }}>
          <DialogContent className="max-w-md mx-4 sm:mx-auto">
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>Add a new class to the system</DialogDescription>
            </DialogHeader>
            {createError && (<Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{createError}</AlertDescription></Alert>)}
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Class Name *</Label>
                <Input id="nom" placeholder="e.g., 1A" value={newClasse.nom} onChange={e => { setNewClasse({ ...newClasse, nom: e.target.value }); if (formErrors.nom) setFormErrors(s => ({ ...s, nom: '' })); }} className={formErrors.nom ? 'border-destructive' : ''} />
                {formErrors.nom && <div className="text-xs text-destructive">{formErrors.nom}</div>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="annee">Year *</Label>
                <Input id="annee" type="number" placeholder="e.g., 2025" value={newClasse.annee} onChange={e => { setNewClasse({ ...newClasse, annee: e.target.value }); if (formErrors.annee) setFormErrors(s => ({ ...s, annee: '' })); }} className={formErrors.annee ? 'border-destructive' : ''} />
                {formErrors.annee && <div className="text-xs text-destructive">{formErrors.annee}</div>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialisation">Specialization *</Label>
                <Input id="specialisation" placeholder="e.g., Informatique" value={newClasse.specialisation} onChange={e => { setNewClasse({ ...newClasse, specialisation: e.target.value }); if (formErrors.specialisation) setFormErrors(s => ({ ...s, specialisation: '' })); }} className={formErrors.specialisation ? 'border-destructive' : ''} />
                {formErrors.specialisation && <div className="text-xs text-destructive">{formErrors.specialisation}</div>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="anneeAcademique">Academic Year *</Label>
                <Input id="anneeAcademique" placeholder="e.g., 2025-2026" value={newClasse.anneeAcademique} onChange={e => { setNewClasse({ ...newClasse, anneeAcademique: e.target.value }); if (formErrors.anneeAcademique) setFormErrors(s => ({ ...s, anneeAcademique: '' })); }} className={formErrors.anneeAcademique ? 'border-destructive' : ''} />
                {formErrors.anneeAcademique && <div className="text-xs text-destructive">{formErrors.anneeAcademique}</div>}
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={actionLoading} className="w-full sm:w-auto">Cancel</Button>
              <Button onClick={handleCreateClasse} disabled={actionLoading} className="bg-gradient-to-r from-green-600 via-blue-600 to-cyan-600 hover:from-green-500 hover:via-blue-500 hover:to-cyan-500 text-white w-full sm:w-auto">
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Class
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}