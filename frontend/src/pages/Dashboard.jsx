import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, UploadCloud, HardDrive, File, Loader2, Download, Trash2, Image as ImageIcon, FileText, Grid, List, X, Settings, User, Mail, Calendar, Shield, Phone, AlignLeft, Sun, Moon, Clock, PlayCircle, LayoutGrid, FolderSearch, Edit2, Camera, Bell, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [files, setFiles] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // <-- The Search Bar text
  const [activeCategory, setActiveCategory] = useState('ALL'); // 'ALL', 'IMAGE', 'DOC', 'MEDIA'
  
  // 🌗 THEME STATE
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // UI States
  const [viewMode, setViewMode] = useState('grid');
  const [previewFile, setPreviewFile] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Settings States
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState('profile'); 
  const [editForm, setEditForm] = useState({ full_name: '', bio: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const navigate = useNavigate();
  const MAX_STORAGE = 1073741824; 

  // Automatically use localhost:5000 for testing, but use relative paths for production!
  const API_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';

  // Apply Theme to HTML tag
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  useEffect(() => { checkUser(); }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate('/');
    setUser(session.user);
    fetchProfile(session.user.id);
    fetchFiles(session.user.id);
    fetchNotifications(session.user.id); // <-- ADD THIS
  };

  const fetchNotifications = async (userId) => {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (data) setNotifications(data);
  };

  const markAsRead = async (notifId) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    setNotifications(notifications.map(n => n.id === notifId ? { ...n, is_read: true } : n));
  };

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
    setLoading(false);
  };

  const fetchFiles = async (userId) => {
    const response = await fetch(`${API_URL}/api/files/${userId}`);
    const data = await response.json();
    setFiles(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragOver = (e) => {
    e.preventDefault(); // Stop the browser from opening the file
    setIsDragging(true); // Make the box glow!
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false); // Stop glowing when the mouse leaves
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false); // Stop glowing

    // Grab the first file they dropped
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    // Send it directly to the upload function!
    await processUpload(droppedFile);
  };

  // 1. The classic "Click" handler
  const handleFileInputChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    await processUpload(selectedFile);
    e.target.value = null; // Reset the input so they can upload the same file again if they want
  };

  // 2. The brain that actually sends it to the backend
  const processUpload = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.id);

    try {
      const response = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: formData });
      const result = await response.json();
      
      if (!response.ok) throw new Error(result.error || "Upload failed");
      
      fetchProfile(user.id); 
      fetchFiles(user.id);
      toast.success("File uploaded securely!");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId) => { window.open(`${API_URL}/api/download/${fileId}`, '_blank'); };

  const handleDelete = async (fileId) => {
    if (!window.confirm("Delete this file permanently?")) return;
    await fetch(`${API_URL}/api/delete/${fileId}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id })
    });
    fetchProfile(user.id);
    fetchFiles(user.id);
    setPreviewFile(null);
    toast.success("File permanently deleted.");
  };

  // 📷 UPLOAD CUSTOM AVATAR
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const toastId = toast.loading("Uploading avatar...");
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('userId', user.id);

    try {
      const response = await fetch(`${API_URL}/api/avatar`, { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      setProfile({ ...profile, avatar_url: result.avatar_url });
      toast.success("Profile picture updated!", { id: toastId });
    } catch (error) {
      toast.error(error.message, { id: toastId });
    }
  };

  // ✏️ RENAME FILE
  const handleRename = async (fileId, currentName) => {
    const newName = window.prompt("Enter new file name:", currentName);
    if (!newName || newName === currentName) return;

    try {
      const response = await fetch(`${API_URL}/api/rename/${fileId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, newName })
      });
      if (!response.ok) throw new Error("Rename failed");
      
      toast.success("File renamed!");
      fetchFiles(user.id);
      setPreviewFile(null); // Close preview if open
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await supabase.from('profiles').update({ full_name: editForm.full_name, bio: editForm.bio, phone: editForm.phone }).eq('id', user.id);
      setProfile({ ...profile, full_name: editForm.full_name, bio: editForm.bio, phone: editForm.phone });
      toast.success("Profile updated!");
    } catch (error) {
      toast.error("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      await supabase.auth.resetPasswordForEmail(user.email, { 
        redirectTo: `${window.location.origin}/auth` 
      });
      toast.success(`Reset link sent to ${user.email}!`);
    } catch (error) {
      toast.error("Error sending email.");
    }
  };

  const openSettings = () => {
    setEditForm({ full_name: profile?.full_name || '', bio: profile?.bio || '', phone: profile?.phone || '' });
    setSettingsTab('profile');
    setShowSettingsModal(true);
    setShowProfileMenu(false);
  };

  // 🔍 FILTER BY SEARCH AND CATEGORY
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesCategory = true;
    if (activeCategory === 'IMAGE') matchesCategory = file.file_type.includes('image');
    if (activeCategory === 'DOC') matchesCategory = file.file_type.includes('pdf') || file.file_type.includes('document') || file.file_type.includes('text');
    if (activeCategory === 'MEDIA') matchesCategory = file.file_type.includes('video') || file.file_type.includes('audio');
    
    return matchesSearch && matchesCategory;
  });

  // 🧮 CALCULATE QUICK INSIGHTS
  const totalFiles = files.length;
  const lastUpload = files.length > 0 ? new Date(files[0].upload_date) : null;
  
  // Format the "Time Ago" for the last upload
  const timeAgo = (date) => {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-victus-dark"><Loader2 className="animate-spin h-10 w-10 text-victus-accent" /></div>;

  const storageUsed = profile?.storage_used || 0;
  const storagePercent = Math.min((storageUsed / MAX_STORAGE) * 100, 100);
  const usedMB = (storageUsed / (1024 * 1024)).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-victus-dark text-gray-900 dark:text-white p-6 relative transition-colors duration-300">
      
      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto flex justify-between items-center bg-white dark:bg-victus-card p-4 rounded-xl shadow-sm dark:shadow-lg border border-gray-200 dark:border-gray-800 mb-8 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="bg-victus-accent/20 p-2 rounded-lg"><HardDrive className="h-6 w-6 text-victus-accent" /></div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">VictusG2 Drive</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Secure Cloud Storage</p>
          </div>
        </div>

        <div className="flex items-center gap-4 relative">
          
          {/* 🔔 NOTIFICATION BELL */}
          <div className="relative">
            <button onClick={() => setShowNotifMenu(!showNotifMenu)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors relative">
              <Bell className="h-5 w-5" />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="absolute top-1 right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white dark:border-victus-card"></span>
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifMenu && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-2 w-80 bg-white dark:bg-victus-card border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                    <span className="text-xs bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-1 rounded-full font-bold">{notifications.filter(n => !n.is_read).length} New</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">No new notifications.</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} onClick={() => markAsRead(n.id)} className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors ${n.is_read ? 'bg-transparent' : 'bg-red-50 dark:bg-red-500/5'}`}>
                          <div className="flex gap-3">
                            <AlertTriangle className={`h-5 w-5 shrink-0 ${n.is_read ? 'text-gray-400' : 'text-red-500'}`} />
                            <div>
                              <p className={`text-sm ${n.is_read ? 'text-gray-600 dark:text-gray-300' : 'font-bold text-red-600 dark:text-red-400'}`}>{n.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{n.message}</p>
                              <p className="text-[10px] text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 🌗 THEME TOGGLE BUTTON */}
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {profile?.role === 'admin' && (
            <button onClick={() => navigate('/admin')} className="text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">Admin</button>
          )}
          
          <div className="relative">
            <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors h-12 w-12">
              {profile?.avatar_url ? (
                <img src={`${API_URL}${profile.avatar_url}`} alt="Avatar" className="h-full w-full rounded-full object-cover" />
              ) : (
                <div className="bg-sky-500 text-white w-full h-full rounded-full flex items-center justify-center font-bold text-xl">
                  {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-2 w-48 bg-white dark:bg-victus-card border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <p className="font-medium truncate text-gray-900 dark:text-white">{profile?.full_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <button onClick={() => { setShowProfileModal(true); setShowProfileMenu(false); }} className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><User className="h-4 w-4"/> Profile Info</button>
                  <button onClick={openSettings} className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><Settings className="h-4 w-4"/> Settings</button>
                  <button onClick={handleLogout} className="w-full text-left p-3 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center gap-2 text-sm border-t border-gray-200 dark:border-gray-700"><LogOut className="h-4 w-4"/> Sign Out</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* 📊 QUICK INSIGHTS BANNER */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-victus-card p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4 transition-colors duration-300">
          <div className="bg-sky-100 dark:bg-sky-500/10 p-3 rounded-lg"><File className="h-6 w-6 text-sky-500" /></div>
          <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Files</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{totalFiles}</p></div>
        </div>
        <div className="bg-white dark:bg-victus-card p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4 transition-colors duration-300">
          <div className="bg-green-100 dark:bg-green-500/10 p-3 rounded-lg"><HardDrive className="h-6 w-6 text-green-500" /></div>
          <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Available Storage</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{(1024 - parseFloat(usedMB)).toFixed(2)} MB</p></div>
        </div>
        <div className="bg-white dark:bg-victus-card p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4 transition-colors duration-300">
          <div className="bg-purple-100 dark:bg-purple-500/10 p-3 rounded-lg"><Clock className="h-6 w-6 text-purple-500" /></div>
          <div><p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Activity</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{timeAgo(lastUpload)}</p></div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* LEFT SIDEBAR */}
        <div className="space-y-6">
          
          {/* DRAG & DROP ZONE */}
          <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`p-8 rounded-xl border-2 border-dashed relative overflow-hidden group transition-all duration-300 flex flex-col items-center justify-center text-center ${isDragging ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-500 scale-[1.02] shadow-lg shadow-sky-500/20' : 'bg-white dark:bg-victus-card border-gray-300 dark:border-gray-700 hover:border-sky-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 shadow-sm'}`}>
            <input type="file" onChange={handleFileInputChange} disabled={uploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" />
            {uploading ? (
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center text-sky-500"><Loader2 className="h-10 w-10 animate-spin mb-3" /><p className="font-bold">Uploading...</p></motion.div>
            ) : (
              <motion.div animate={{ scale: isDragging ? 1.1 : 1 }} className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${isDragging ? 'bg-sky-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-sky-500'}`}><UploadCloud className="h-8 w-8" /></div>
                <h3 className={`text-lg font-bold mb-1 ${isDragging ? 'text-sky-500' : 'text-gray-900 dark:text-white'}`}>{isDragging ? 'Drop file here!' : 'Upload New File'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Drag & drop or click</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 font-medium">Max size: 50MB</p>
              </motion.div>
            )}
          </div>

          {/* STORAGE QUOTA */}
          <div className="bg-white dark:bg-victus-card p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300">
            <h2 className="text-sm font-semibold mb-3 text-gray-600 dark:text-gray-400 flex items-center gap-2"><HardDrive className="h-4 w-4"/> Storage Quota</h2>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 mb-2 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${storagePercent}%` }} className={`h-full rounded-full ${storagePercent > 90 ? 'bg-red-500' : 'bg-victus-accent'}`} />
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-medium">{usedMB} MB used</span>
              <span className="text-gray-400 dark:text-gray-500">1024 MB total</span>
            </div>
          </div>

          {/* ⏳ RECENT ACTIVITY FEED */}
          <div className="bg-white dark:bg-victus-card p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300 hidden lg:block">
            <h2 className="text-sm font-semibold mb-4 text-gray-600 dark:text-gray-400 flex items-center gap-2"><Clock className="h-4 w-4"/> Recent Activity</h2>
            <div className="space-y-4">
              {files.slice(0, 3).map((file, i) => (
                <div key={i} className="flex gap-3 relative">
                  {i !== 2 && files.length > 1 && <div className="absolute top-6 bottom-[-16px] left-[11px] w-px bg-gray-200 dark:bg-gray-800"></div>}
                  <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-500/20 border border-sky-200 dark:border-sky-500/30 flex items-center justify-center shrink-0 z-10">
                    <UploadCloud className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-800 dark:text-gray-200"><span className="font-medium text-gray-900 dark:text-white">You uploaded</span> {file.file_name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{timeAgo(new Date(file.upload_date))}</p>
                  </div>
                </div>
              ))}
              {files.length === 0 && <p className="text-sm text-gray-400 italic">No activity yet.</p>}
            </div>
          </div>
        </div>

        {/* RIGHT AREA (Files Workspace) */}
        <div className="lg:col-span-3 bg-white dark:bg-victus-card p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm min-h-[600px] flex flex-col transition-colors duration-300">
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white shrink-0">
              <FolderSearch className="h-6 w-6 text-victus-accent" /> Workspace
            </h2>
            
            <div className="relative w-full max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FolderSearch className="h-4 w-4 text-gray-400" /></div>
              <input type="text" placeholder="Search files..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-xl py-2 pl-10 pr-10 focus:outline-none focus:border-victus-accent focus:ring-1 focus:ring-victus-accent transition-colors shadow-inner" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"><X className="h-4 w-4" /></button>}
            </div>
          </div>
          
          {/* 🗂️ SMART CATEGORIES */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setActiveCategory('ALL')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeCategory === 'ALL' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}>All Files</button>
              <button onClick={() => setActiveCategory('IMAGE')} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeCategory === 'IMAGE' ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30' : 'bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20'}`}><ImageIcon className="h-4 w-4" /> Images</button>
              <button onClick={() => setActiveCategory('DOC')} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeCategory === 'DOC' ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30' : 'bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:bg-purple-500/20'}`}><FileText className="h-4 w-4" /> Documents</button>
              <button onClick={() => setActiveCategory('MEDIA')} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeCategory === 'MEDIA' ? 'bg-red-500 text-white shadow-md shadow-red-500/30' : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20'}`}><PlayCircle className="h-4 w-4" /> Media</button>
            </div>
            
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg shrink-0">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`} title="Grid View"><LayoutGrid className="h-4 w-4" /></button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`} title="List View"><List className="h-4 w-4" /></button>
            </div>
          </div>

          {/* THE FILES */}
          <div className="flex-1">
            {files.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-400 dark:text-gray-500"><UploadCloud className="h-16 w-16 mb-4 opacity-20" /><p className="text-lg font-medium text-gray-900 dark:text-white mb-1">Your drive is empty</p><p className="text-sm">Upload a file to get started.</p></div>
            ) : filteredFiles.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-400 dark:text-gray-500"><FolderSearch className="h-16 w-16 mb-4 opacity-20 text-sky-500" /><p className="text-lg font-medium text-gray-900 dark:text-white mb-1">No files found</p><p className="text-sm">Try adjusting your filters or search query.</p></div>
            ) : (
              <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" : "space-y-2"}>
                <AnimatePresence>
                  {filteredFiles.map((file) => {
                    const isImage = file.file_type.includes('image');
                    const isVideo = file.file_type.includes('video');
                    const isPDF = file.file_type.includes('pdf');
                    return viewMode === 'grid' ? (
                      <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }} key={file.id} layoutId={`card-${file.id}`} onClick={() => setPreviewFile(file)} className="bg-gray-50 dark:bg-victus-dark border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:border-victus-accent dark:hover:border-victus-accent transition-colors cursor-pointer group shadow-sm flex flex-col">
                        <div className="h-32 bg-gray-100 dark:bg-gray-900 flex items-center justify-center relative overflow-hidden shrink-0">
                          {isImage ? <img src={`${API_URL}/api/view/${file.id}`} alt={file.file_name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" /> : isVideo ? <PlayCircle className="h-12 w-12 text-sky-500" /> : isPDF ? <FileText className="h-12 w-12 text-red-500" /> : <File className="h-12 w-12 text-gray-400 dark:text-gray-600" />}
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <p className="text-sm font-semibold truncate text-gray-900 dark:text-gray-200 mb-1">{file.file_name}</p>
                          <div className="flex justify-between items-center text-[10px] text-gray-500 font-medium">
                            <span className="bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded uppercase tracking-wider">{file.file_type.split('/')[1] || 'FILE'}</span>
                            <span>{(file.file_size / (1024*1024)).toFixed(2)} MB</span>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} key={file.id} layoutId={`card-${file.id}`} onClick={() => setPreviewFile(file)} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-victus-dark border border-gray-200 dark:border-gray-700 rounded-lg hover:border-victus-accent cursor-pointer shadow-sm group">
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className="bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-800 group-hover:border-victus-accent transition-colors">
                            {isImage ? <ImageIcon className="h-5 w-5 text-sky-500 dark:text-sky-400" /> : isVideo ? <PlayCircle className="h-5 w-5 text-sky-500 dark:text-sky-400" /> : isPDF ? <FileText className="h-5 w-5 text-red-500 dark:text-red-400" /> : <File className="h-5 w-5 text-gray-400" />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold truncate w-[150px] sm:w-[300px] md:w-[400px] text-gray-900 dark:text-white group-hover:text-victus-accent transition-colors">{file.file_name}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium uppercase tracking-wider">{file.file_type.split('/')[1] || 'FILE'}</p>
                          </div>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{(file.file_size / (1024*1024)).toFixed(2)} MB</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{new Date(file.upload_date).toLocaleDateString()}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 👤 PROFILE INFO MODAL */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-victus-card border border-gray-200 dark:border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
              <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white"><X className="h-5 w-5" /></button>

              <div className="text-center mb-6">
                <div className="mx-auto mb-4 h-24 w-24">
                  {profile?.avatar_url ? (
                    <img src={`${API_URL}${profile.avatar_url}`} alt="Avatar" className="h-full w-full rounded-full object-cover shadow-lg shadow-sky-500/20" />
                  ) : (
                    <div className="bg-sky-500 text-white w-full h-full rounded-full flex items-center justify-center font-bold text-4xl shadow-lg shadow-sky-500/20">
                      {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.full_name}</h2>
                <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 mt-1"><Mail className="h-4 w-4"/> {user?.email}</p>
              </div>

              <div className="space-y-4 bg-gray-50 dark:bg-victus-dark p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                {profile?.bio && (
                  <div className="border-b border-gray-200 dark:border-gray-800 pb-3">
                    <span className="text-gray-500 dark:text-gray-400 text-sm block mb-1">About Me</span>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{profile.bio}</p>
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-3">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Phone</span>
                    <span className="text-sm text-gray-800 dark:text-gray-200">{profile.phone}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Account Role</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${profile?.role === 'admin' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400'}`}>{profile?.role?.toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Member Since</span>
                  <span className="text-sm text-gray-700 dark:text-gray-200 flex items-center gap-1"><Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500"/> {new Date(profile?.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <button onClick={() => setShowProfileModal(false)} className="w-full mt-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white py-3 rounded-lg font-medium transition-colors">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ⚙️ SETTINGS & SECURITY MODAL */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-victus-card border border-gray-200 dark:border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl flex overflow-hidden">
              
              <div className="w-1/3 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 pl-2">Settings</h2>
                <button onClick={() => setSettingsTab('profile')} className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center gap-3 transition-colors ${settingsTab === 'profile' ? 'bg-victus-accent/10 text-victus-accent border border-victus-accent/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
                  <User className="h-4 w-4" /> Personal Info
                </button>
                <button onClick={() => setSettingsTab('security')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${settingsTab === 'security' ? 'bg-victus-accent/10 text-victus-accent border border-victus-accent/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}>
                  <Shield className="h-4 w-4" /> Security
                </button>
              </div>

              <div className="w-2/3 p-6 relative bg-white dark:bg-victus-card">
                <button onClick={() => setShowSettingsModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white"><X className="h-5 w-5" /></button>
                
                {settingsTab === 'profile' ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Personal Info</h3>
                    
                    {/* AVATAR UPLOAD */}
                    <label className="relative group cursor-pointer mx-auto block w-24 h-24 mb-6 shadow-lg rounded-full">
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                      
                      {profile?.avatar_url ? (
                        <img src={`${API_URL}${profile.avatar_url}`} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="bg-sky-500 text-white w-full h-full rounded-full flex items-center justify-center font-bold text-4xl">
                          {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-8 w-8 text-white" />
                      </div>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2"><User className="h-4 w-4"/> Display Name</label>
                      <input type="text" value={editForm.full_name} onChange={(e) => setEditForm({...editForm, full_name: e.target.value})} className="w-full bg-gray-50 dark:bg-victus-dark text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg py-2.5 px-4 focus:outline-none focus:border-victus-accent focus:ring-1 focus:ring-victus-accent" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2"><AlignLeft className="h-4 w-4"/> Bio / About Me</label>
                      <textarea value={editForm.bio} onChange={(e) => setEditForm({...editForm, bio: e.target.value})} className="w-full bg-gray-50 dark:bg-victus-dark text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg py-2.5 px-4 focus:outline-none focus:border-victus-accent focus:ring-1 focus:ring-victus-accent h-24 resize-none" placeholder="Tell us about yourself..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2"><Phone className="h-4 w-4"/> Phone Number</label>
                      <input type="text" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-gray-50 dark:bg-victus-dark text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg py-2.5 px-4 focus:outline-none focus:border-victus-accent focus:ring-1 focus:ring-victus-accent" placeholder="+1 (555) 000-0000" />
                    </div>
                    <div className="pt-4 flex justify-end">
                      <button type="submit" disabled={savingProfile} className="bg-victus-accent hover:bg-sky-500 text-white py-2.5 px-6 rounded-lg font-medium transition-colors flex items-center gap-2">
                        {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Security & Password</h3>
                    <div className="bg-gray-50 dark:bg-victus-dark p-4 rounded-xl border border-gray-200 dark:border-gray-800 mb-6">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Clicking the button below will send a secure password reset link to <span className="text-gray-900 dark:text-white font-medium">{user?.email}</span>.</p>
                      <button onClick={handlePasswordReset} className="w-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                        <Mail className="h-5 w-5" /> Send Password Reset Email
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎬 FILE PREVIEW MODAL */}
      <AnimatePresence>
        {previewFile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="absolute top-4 right-4 flex gap-4">
              <button onClick={() => handleRename(previewFile.id, previewFile.file_name)} className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full text-white transition-colors" title="Rename"><Edit2 className="h-5 w-5" /></button>
              <button onClick={() => handleDownload(previewFile.id)} className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full text-white transition-colors"><Download className="h-5 w-5" /></button>
              <button onClick={() => handleDelete(previewFile.id)} className="bg-gray-800 hover:bg-red-500/20 hover:text-red-400 p-3 rounded-full text-white transition-colors"><Trash2 className="h-5 w-5" /></button>
              <button onClick={() => setPreviewFile(null)} className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full text-white transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <motion.div layoutId={`card-${previewFile.id}`} className="w-full max-w-5xl h-full max-h-[85vh] flex flex-col items-center justify-center p-6">
              
              <div className="w-full h-full flex items-center justify-center bg-black/40 rounded-xl overflow-hidden shadow-2xl relative group">
                {previewFile.file_type.includes('image') ? (
                  <img src={`${API_URL}/api/view/${previewFile.id}`} alt="Preview" className="w-auto h-auto max-w-full max-h-full object-contain drop-shadow-2xl" />
                ) : previewFile.file_type.includes('video') ? (
                  <video src={`${API_URL}/api/view/${previewFile.id}`} controls autoPlay className="w-full h-full max-h-[75vh] object-contain bg-black rounded-lg shadow-2xl">Your browser does not support the video tag.</video>
                ) : previewFile.file_type.includes('pdf') ? (
                  <iframe src={`${API_URL}/api/view/${previewFile.id}`} className="w-full h-full min-h-[75vh] bg-white rounded-lg shadow-2xl" title="PDF Preview"></iframe>
                ) : (
                  <div className="text-center p-12 bg-gray-900 rounded-2xl border border-gray-800">
                    <FileText className="h-32 w-32 text-gray-500 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-white mb-2">No preview available</h3>
                    <p className="text-gray-400">This file type ({previewFile.file_type}) cannot be previewed in the browser.</p>
                    <button onClick={() => handleDownload(previewFile.id)} className="mt-6 bg-victus-accent hover:bg-sky-500 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mx-auto"><Download className="h-5 w-5" /> Download File Instead</button>
                  </div>
                )}
              </div>

              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-6 text-center">
                <p className="text-xl font-bold text-white drop-shadow-md">{previewFile.file_name}</p>
                <p className="text-sm text-gray-400 mt-1">{(previewFile.file_size / (1024*1024)).toFixed(2)} MB • {previewFile.file_type}</p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🚨 FORCED ADMIN WARNING MODAL */}
      <AnimatePresence>
        {notifications.filter(n => !n.is_read && n.title.includes('Official Admin Warning')).map((warning) => (
          <motion.div 
            key={`warning-${warning.id}`} 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }} 
              className="bg-white dark:bg-victus-card border-2 border-red-500 rounded-3xl p-8 w-full max-w-lg shadow-[0_0_50px_rgba(239,68,68,0.3)] relative text-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-red-500/20 to-transparent pointer-events-none"></div>

              <div className="bg-red-100 dark:bg-red-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                <AlertOctagon className="h-12 w-12 text-red-600 dark:text-red-500 animate-pulse" />
              </div>
              
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 relative z-10">ADMIN WARNING</h2>
              <p className="text-red-600 dark:text-red-400 font-bold mb-6 text-sm tracking-widest uppercase relative z-10">Please read carefully</p>

              <div className="bg-gray-50 dark:bg-victus-dark p-6 rounded-xl border border-gray-200 dark:border-gray-800 mb-8 text-left relative z-10">
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-medium">{warning.message}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-4 border-t border-gray-200 dark:border-gray-800 pt-3">
                  Issued on: {new Date(warning.created_at).toLocaleString()}
                </p>
              </div>

              <button 
                onClick={() => markAsRead(warning.id)} 
                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-red-600/30 flex items-center justify-center gap-2"
              >
                I Understand and Acknowledge
              </button>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>

    </div>
  );
}