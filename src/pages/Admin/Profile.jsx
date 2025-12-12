import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import { User, Mail, Loader2, Camera, Save, X, Lock, Bell, Trash2, Settings, Key, Users, BookOpen, CheckCircle2, XCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { updatePassword } from "@/services/userService"; // ADD THIS IMPORT

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function AdminProfile() {
  const [formData, setFormData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false); // ADD THIS
  
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const [passwordError, setPasswordError] = useState(null);

  const [emailPreferences, setEmailPreferences] = useState({
    newsletter: true,
    notifications: true,
    updates: false
  });

  // Fetch connected admin info
  useEffect(() => {
    fetchAdminData();
  }, []);

  // Sync dateOfBirth with formData.datedeNaissance
  useEffect(() => {
    if (formData) {
      setFormData(prev => ({
        ...prev,
        datedeNaissance: dateOfBirth ? dateOfBirth.toISOString() : prev.datedeNaissance
      }));
    }
  }, [dateOfBirth]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const result = await response.json();
      const userData = result.data || result;
      
      setFormData(userData);
      setOriginalData(userData);

      // Set date of birth if exists
      if (userData.datedeNaissance) {
        setDateOfBirth(new Date(userData.datedeNaissance));
      }

      // Set preview image if exists
      if (userData.image_User) {
        setPreviewImage(`${API_BASE_URL}/images/${userData.image_User}`);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
      showToast("error", "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image_User: file });
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const createFormData = (data) => {
    const formDataObj = new FormData();
    Object.keys(data).forEach((key) => {
      if (Array.isArray(data[key])) {
        data[key].forEach((item) => formDataObj.append(key, item));
      } else if (data[key] !== null && data[key] !== undefined) {
        formDataObj.append(key, data[key]);
      }
    });
    return formDataObj;
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Check if image changed and is a File object
      const updatedData = { ...formData };
      if (formData.image_User && !(formData.image_User instanceof File)) {
        delete updatedData.image_User; // Don't send existing image path
      }

      const response = await fetch(`${API_BASE_URL}/users/update/${formData._id}`, {
        method: "PUT",
        body: createFormData(updatedData),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Error" }));
        throw new Error(error.message || "Failed to update profile");
      }

      const result = await response.json();
      showToast("success", "Profile updated successfully!");
      setIsEditing(false);
      
      // Refresh data
      await fetchAdminData();
    } catch (error) {
      console.error("Update error:", error);
      showToast("error", error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CORRECTED PASSWORD CHANGE FUNCTION
  // ============================================
  const handlePasswordChange = async () => {
    setPasswordError(null);
    
    // Validation
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      setPasswordError({ type: "error", message: "Please fill in all password fields!" });
      return;
    }
    
    if (passwordData.new !== passwordData.confirm) {
      setPasswordError({ type: "error", message: "New passwords don't match!" });
      return;
    }
    
    if (passwordData.new.length < 8) {
      setPasswordError({ type: "error", message: "Password must be at least 8 characters long!" });
      return;
    }

    try {
      setPasswordLoading(true);
      
      // Use the service function instead of direct fetch
      const response = await updatePassword(formData._id, {
        oldPassword: passwordData.current,
        newPassword: passwordData.new,
      });

      // Success
      setPasswordError({ type: "success", message: "Password changed successfully!" });
      
      setTimeout(() => {
        showToast("success", "Password changed successfully!");
        setShowPasswordDialog(false);
        setPasswordData({ current: "", new: "", confirm: "" });
        setPasswordError(null);
      }, 1500);
      
    } catch (error) {
      console.error("Password change error:", error);
      
      // Handle axios error response
      const errorMessage = error.response?.data?.message 
        || error.message 
        || "Failed to change password";
      
      setPasswordError({ type: "error", message: errorMessage });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEmailPreferences = () => {
    // This could be extended to actually save preferences to the backend
    showToast("success", "Email preferences updated successfully!");
    setShowEmailDialog(false);
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/delete/${formData._id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Error" }));
        throw new Error(error.message || "Failed to delete account");
      }

      showToast("success", "Account deleted successfully. Redirecting...");
      setShowDeleteDialog(false);
      
      // Logout and redirect after 2 seconds
      setTimeout(async () => {
        await fetch(`${API_BASE_URL}/users/logout`, {
          method: "POST",
          credentials: "include",
        });
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      console.error("Delete account error:", error);
      showToast("error", error.message || "Failed to delete account");
      setShowDeleteDialog(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setPreviewImage(originalData.image_User ? `${API_BASE_URL}/images/${originalData.image_User}` : null);
    setIsEditing(false);
  };

  if (loading || !formData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
          <Alert 
            className={`min-w-[300px] shadow-lg border-2 ${
              toast.type === "success" 
                ? "bg-green-50 border-green-500 text-green-900" 
                : toast.type === "error"
                ? "bg-red-50 border-red-500 text-red-900"
                : "bg-amber-50 border-amber-500 text-amber-900"
            }`}
          >
            {toast.type === "success" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            {toast.type === "error" && <XCircle className="h-5 w-5 text-red-600" />}
            {toast.type === "warning" && <AlertCircle className="h-5 w-5 text-amber-600" />}
            <AlertDescription className="font-medium ml-2">
              {toast.message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
            Admin Profile
          </h1>
          <p className="text-muted-foreground mt-1">Manage your admin account & security</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-gradient-to-r from-secondary to-accent">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="bg-gradient-to-r from-secondary to-accent">
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile Header Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary to-accent opacity-5"></div>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                <AvatarImage src={previewImage} alt="Profile" />
                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-secondary to-accent text-white">
                  {formData.prenom?.[0]?.toUpperCase()}{formData.nom?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-secondary text-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-secondary/90 transition-all">
                  <Camera className="h-5 w-5" />
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div>
                <h2 className="text-3xl font-bold">
                  {formData.prenom} {formData.nom}
                </h2>
                <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {formData.email}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge variant="secondary" className="px-3 py-1">
                  <Settings className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
                <Badge variant="outline" className="border-purple-500 text-purple-600">
                  Super Admin
                </Badge>
                {formData.verified && (
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    ✓ Verified
                  </Badge>
                )}
                {formData.Status && (
                  <Badge variant="outline" className="border-blue-500 text-blue-600">
                    ● Active
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-secondary" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prenom">First Name</Label>
                  <Input
                    id="prenom"
                    name="prenom"
                    value={formData.prenom || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom">Last Name</Label>
                  <Input
                    id="nom"
                    name="nom"
                    value={formData.nom || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="NumTel">Phone Number</Label>
                  <Input
                    id="NumTel"
                    name="NumTel"
                    type="tel"
                    value={formData.NumTel || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="datedeNaissance">Date of Birth</Label>
                  <DatePicker
                    date={dateOfBirth}
                    setDate={setDateOfBirth}
                    placeholder="Select date of birth"
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="Adresse">Address</Label>
                <Textarea
                  id="Adresse"
                  name="Adresse"
                  value={formData.Adresse || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-secondary" />
                Admin Settings
              </CardTitle>
              <CardDescription>Your admin level and join date are managed by the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    name="role"
                    value={formData.role || 'admin'}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="createdAt">Member Since</Label>
                  <Input
                    id="createdAt"
                    name="createdAt"
                    type="date"
                    value={formData.createdAt?.split('T')[0] || ''}
                    disabled
                  />
                </div>
              </div>
              <Alert className="border-secondary/30 bg-secondary/5">
                <Settings className="h-4 w-4 text-secondary" />
                <AlertDescription>
                  Platform-level permissions are managed by administration. Contact the super-admin for changes.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Stats & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account Type</span>
                <Badge variant="secondary">Admin</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Verification</span>
                <Badge variant={formData.verified ? "default" : "outline"}>
                  {formData.verified ? "Verified" : "Pending"}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={formData.Status ? "default" : "secondary"}>
                  {formData.Status ? "Active" : "Inactive"}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Member Since</span>
                <span className="text-sm font-medium">
                  {formData.createdAt ? new Date(formData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Admin Overview */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-secondary/10 to-accent/10 border-b">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-secondary" />
                Admin Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 divide-y">
                <div className="p-4 hover:bg-secondary/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <Users className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Users</p>
                        <p className="text-2xl font-bold text-secondary">1,248</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="border-secondary/30 text-secondary">
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 hover:bg-accent/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent/10 rounded-lg">
                        <BookOpen className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Classes</p>
                        <p className="text-2xl font-bold text-accent">52</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="border-accent/30 text-accent">
                        Running
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 hover:bg-blue-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Key className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Admin Actions</p>
                        <p className="text-2xl font-bold text-blue-600">847</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="border-blue-500 text-blue-600">
                        This Month
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Security & Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Change Password Dialog */}
              <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Lock className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Enter your current password and choose a new secure password
                    </DialogDescription>
                  </DialogHeader>
                  
                  {passwordError && (
                    <Alert 
                      className={`border-2 ${
                        passwordError.type === "success" 
                          ? "bg-green-50 border-green-500 text-green-900" 
                          : "bg-red-50 border-red-500 text-red-900"
                      }`}
                    >
                      {passwordError.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription className="font-medium">
                        {passwordError.message}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showPassword ? "text" : "password"}
                          value={passwordData.current}
                          onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                          placeholder="Enter current password"
                          disabled={passwordLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          disabled={passwordLoading}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        value={passwordData.new}
                        onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                        placeholder="Enter new password"
                        disabled={passwordLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type={showPassword ? "text" : "password"}
                        value={passwordData.confirm}
                        onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                        placeholder="Confirm new password"
                        disabled={passwordLoading}
                      />
                    </div>
                    <Alert>
                      <AlertDescription className="text-xs">
                        Password must be at least 8 characters long and contain uppercase, lowercase, and numbers.
                      </AlertDescription>
                    </Alert>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowPasswordDialog(false);
                        setPasswordError(null);
                        setPasswordData({ current: "", new: "", confirm: "" });
                      }}
                      disabled={passwordLoading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handlePasswordChange}
                      disabled={passwordLoading}
                    >
                      {passwordLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Email Preferences Dialog */}
              <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="mr-2 h-4 w-4" />
                    Email Preferences
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Email Preferences</DialogTitle>
                    <DialogDescription>
                      Manage your email notification settings
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">System Alerts</p>
                        <p className="text-sm text-muted-foreground">Critical system notifications</p>
                      </div>
                      <Button
                        variant={emailPreferences.newsletter ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEmailPreferences({...emailPreferences, newsletter: !emailPreferences.newsletter})}
                      >
                        {emailPreferences.newsletter ? "On" : "Off"}
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">User Notifications</p>
                        <p className="text-sm text-muted-foreground">Updates about user activities</p>
                      </div>
                      <Button
                        variant={emailPreferences.notifications ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEmailPreferences({...emailPreferences, notifications: !emailPreferences.notifications})}
                      >
                        {emailPreferences.notifications ? "On" : "Off"}
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Weekly Reports</p>
                        <p className="text-sm text-muted-foreground">Platform statistics and reports</p>
                      </div>
                      <Button
                        variant={emailPreferences.updates ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEmailPreferences({...emailPreferences, updates: !emailPreferences.updates})}
                      >
                        {emailPreferences.updates ? "On" : "Off"}
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleEmailPreferences}>
                      Save Preferences
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Delete Account Dialog */}
              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-red-600">Delete Account</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                    </DialogDescription>
                  </DialogHeader>
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-sm text-red-800">
                      ⚠️ Warning: All your data, including account information and admin logs will be permanently deleted.
                    </AlertDescription>
                  </Alert>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteAccount}>
                      Yes, Delete My Account
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
