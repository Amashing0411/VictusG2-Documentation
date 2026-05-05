import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Activity, Cpu, HardDrive, Users, ArrowLeft, Trash2, ShieldCheck, Shield, FileText, Download, FolderSearch, Sun, Moon, FileWarning, Image as ImageIcon, PlayCircle, File as FileIcon, CreditCard, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); 
  
  const [stats, setStats] = useState({ cpuUsage: 0, ramTotal: 0, ramUsed: 0, diskTotal: 0, diskUsed: 0 });
  const [chartData, setChartData] = useState([]);
  const [users, setUsers] = useState([]);
  const [globalFiles, setGlobalFiles] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [upgradeRequests, setUpgradeRequests] = useState([]); // <-- NEW STATE
  const [fileFilterUser, setFileFilterUser] = useState('ALL');
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  const API_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';
  const ROOT_ADMIN_ID = import.meta.env.VITE_ROOT_ADMIN_ID;

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    verifyAdmin();
    const interval = setInterval(() => { 
      if (activeTab === 'overview') fetchServerStats(); 
      if (activeTab === 'logs') fetchAuditLogs();
      if (activeTab === 'upgrades') fetchUpgradeRequests(); // <-- ADD THIS
    }, 2000); 
    return () => clearInterval(interval);
  }, [activeTab]);

  const verifyAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate('/');

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
    if (profile?.role !== 'admin') {
      toast.error("Access Denied: Admins Only");
      return navigate('/dashboard');
    }
    
    setAdminUser(session.user);
    
    // --- DEBUGGING THE ROOT OWNER BUG ---
    console.log("===============================");
    console.log("MY CURRENT USER ID:", session.user.id);
    console.log("THE ROOT ADMIN ID FROM .ENV:", ROOT_ADMIN_ID);
    console.log("DO THEY MATCH?", session.user.id === ROOT_ADMIN_ID);
    console.log("===============================");

    fetchAllUsers();
    fetchAllFiles(session.user.id);
    fetchAuditLogs();
    fetchUpgradeRequests();
    setLoading(false);
  };

  const fetchServerStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stats`);
      const data = await response.json();
      setStats(data);
      
      setChartData(prevData => {
        const time = new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
        const newDataPoint = { time: time, cpu: parseFloat(data.cpuUsage), ram: Math.round((data.ramUsed / data.ramTotal) * 100) };
        const newHistory = [...prevData, newDataPoint];
        if (newHistory.length > 30) newHistory.shift();
        return newHistory;
      });
    } catch (error) { }
  };

  const fetchAllUsers = async () => {
    const { data } = await supabase.rpc('get_all_users');
    if (data) setUsers(data);
  };

  const fetchAllFiles = async (adminId) => {
    const response = await fetch(`${API_URL}/api/admin/files`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId })
    });
    const data = await response.json();
    setGlobalFiles(data);
  };

  const fetchAuditLogs = async () => {
    const { data } = await supabase.from('audit_logs').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(50);
    if (data) setAuditLogs(data);
  };

  const fetchUpgradeRequests = async () => {
    // Fetch all pending requests and join the user's name
    const { data } = await supabase
      .from('upgrade_requests')
      .select('*, profiles(full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (data) setUpgradeRequests(data);
  };

  const handleChangeRole = async (targetId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) return;
    const response = await fetch(`${API_URL}/api/admin/users/role`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId: adminUser.id, targetUserId: targetId, newRole })
    });
    if (response.ok) {
      toast.success(`User is now an ${newRole}!`);
      fetchAllUsers();
    } else toast.error("Failed to change role.");
  };

  // 💾 MODERATION: Change Storage Tier
  const handleUpgradeStorage = async (targetId, newStorageBytes) => {
    const gbAmount = newStorageBytes / (1024*1024*1024);
    if (!window.confirm(`Upgrade this user to the ${gbAmount}GB Tier?`)) return;

    const response = await fetch(`${API_URL}/api/admin/users/storage`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId: adminUser.id, targetUserId: targetId, newStorageLimit: newStorageBytes })
    });
    
    if (response.ok) {
      toast.success(`User upgraded to ${gbAmount}GB Tier!`);
      fetchAllUsers();
    } else {
      toast.error("Failed to upgrade storage.");
    }
  };

  const handleBanUser = async (targetId, targetName) => {
    if (!window.confirm(`DANGER: Are you sure you want to BAN ${targetName}? This will wipe their account and delete all their files permanently!`)) return;
    const response = await fetch(`${API_URL}/api/admin/users/${targetId}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId: adminUser.id })
    });
    if (response.ok) {
      toast.success(`${targetName} has been wiped from the server.`);
      fetchAllUsers();
      fetchAllFiles(adminUser.id);
    }
  };

  const handleAdminDeleteFile = async (fileId) => {
    if (!window.confirm("Delete this file from the server?")) return;
    const response = await fetch(`${API_URL}/api/admin/files/${fileId}`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId: adminUser.id })
    });
    if (response.ok) {
      toast.success("File forcefully deleted.");
      fetchAllFiles(adminUser.id);
    }
  };

  // 💳 MODERATION: Process GCash Upgrade Requests
  const handleProcessRequest = async (requestId, userId, requestedTier, status) => {
    const actionStr = status === 'approved' ? 'APPROVE' : 'REJECT';
    if (!window.confirm(`Are you sure you want to ${actionStr} this payment?`)) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/requests/${requestId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: adminUser.id, status, userId, requestedTier })
      });
      if (!response.ok) throw new Error("Failed to process request");
      
      toast.success(`Request ${status} successfully!`);
      fetchUpgradeRequests(); // Refresh the list
      fetchAllUsers(); // Refresh the user list so their storage updates!
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleWarnUser = async (targetId, targetName) => {
    const warningMessage = window.prompt(`Enter warning message for ${targetName}:`);
    if (!warningMessage || warningMessage.trim() === '') return;

    try {
      const response = await fetch(`${API_URL}/api/admin/warn`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: adminUser.id, targetUserId: targetId, message: warningMessage })
      });
      if (!response.ok) throw new Error("Failed to send warning");
      toast.success("Warning sent successfully!");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = totalUsers - adminCount;
  const totalStorageBytes = users.reduce((sum, u) => sum + (Number(u.storage_used) || 0), 0);
  const totalStorageMB = (totalStorageBytes / (1024 * 1024)).toFixed(2);
  
  const roleData = [
    { name: 'Admins', value: adminCount, color: '#ef4444' },
    { name: 'Users', value: userCount, color: '#0ea5e9' }
  ];

  const activityCounts = {};
  globalFiles.forEach(file => {
    const dateStr = new Date(file.upload_date).toISOString().split('T')[0];
    activityCounts[dateStr] = (activityCounts[dateStr] || 0) + 1;
  });
  const last90Days = Array.from({ length: 90 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (89 - i));
    return d.toISOString().split('T')[0];
  });

  if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-victus-dark"></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-victus-dark text-gray-900 dark:text-white p-6 transition-colors duration-300">
      
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl shadow-lg border border-gray-200 dark:border-red-900/50 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 dark:bg-red-500/20 p-2 rounded-lg"><ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-500" /></div>
          <div>
            <h1 className="text-xl font-bold text-red-600 dark:text-red-400">God-Mode Console</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">System Administrator</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Drive
          </button>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto mb-8 flex gap-4 border-b border-gray-200 dark:border-gray-800 pb-2 overflow-x-auto">
        <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'overview' ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
          <Activity className="h-4 w-4" /> Live Server Stats
        </button>
        <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'users' ? 'bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
          <Users className="h-4 w-4" /> User Moderation
        </button>
        <button onClick={() => setActiveTab('files')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'files' ? 'bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
          <FolderSearch className="h-4 w-4" /> Global Files
        </button>
        <button onClick={() => setActiveTab('logs')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'logs' ? 'bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
          <FileWarning className="h-4 w-4" /> Security Logs
        </button>
        {/* NEW UPGRADES TAB */}
        <button onClick={() => setActiveTab('upgrades')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors relative ${activeTab === 'upgrades' ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
          <CreditCard className="h-4 w-4" /> Pending Upgrades
          {/* Notification Dot if there are pending requests! */}
          {upgradeRequests.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
        </button>
      </div>

      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-victus-card p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
                  <div><h3 className="text-gray-500 dark:text-gray-400 font-bold mb-1">Total Users</h3><div className="text-4xl font-extrabold">{totalUsers}</div></div>
                  <div className="bg-sky-100 dark:bg-sky-500/10 p-4 rounded-full"><Users className="h-8 w-8 text-sky-500" /></div>
                </div>
                <div className="bg-white dark:bg-victus-card p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
                  <div><h3 className="text-gray-500 dark:text-gray-400 font-bold mb-1">Files Hosted</h3><div className="text-4xl font-extrabold">{globalFiles.length}</div></div>
                  <div className="bg-purple-100 dark:bg-purple-500/10 p-4 rounded-full"><FileText className="h-8 w-8 text-purple-500" /></div>
                </div>
                <div className="bg-white dark:bg-victus-card p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
                  <div><h3 className="text-gray-500 dark:text-gray-400 font-bold mb-1">Storage Used</h3><div className="text-4xl font-extrabold">{totalStorageMB} <span className="text-lg text-gray-500">MB</span></div></div>
                  <div className="bg-green-100 dark:bg-green-500/10 p-4 rounded-full"><HardDrive className="h-8 w-8 text-green-500" /></div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-victus-card p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm h-80 flex flex-col">
                  <div className="flex justify-between items-center mb-4"><h3 className="text-gray-500 dark:text-gray-400 font-bold flex items-center gap-2"><Cpu className="h-5 w-5 text-sky-500" /> CPU Usage (Live)</h3><span className="text-xl font-bold text-sky-500">{stats.cpuUsage}%</span></div>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs><linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/><stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickMargin={10} />
                        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(tick) => `${tick}%`} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} itemStyle={{ color: '#38bdf8' }} />
                        <Area type="monotone" dataKey="cpu" stroke="#38bdf8" strokeWidth={3} fill="url(#colorCpu)" isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-victus-card p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm h-80 flex flex-col">
                  <div className="flex justify-between items-center mb-4"><h3 className="text-gray-500 dark:text-gray-400 font-bold flex items-center gap-2"><Activity className="h-5 w-5 text-purple-500" /> Memory Usage (Live)</h3><span className="text-xl font-bold text-purple-500">{stats.ramUsed} / {stats.ramTotal} GB</span></div>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs><linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/><stop offset="95%" stopColor="#a855f7" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickMargin={10} />
                        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(tick) => `${tick}%`} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} itemStyle={{ color: '#a855f7' }} />
                        <Area type="monotone" dataKey="ram" stroke="#a855f7" strokeWidth={3} fill="url(#colorRam)" isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-victus-card p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm h-64 flex flex-col items-center">
                  <h3 className="text-gray-500 dark:text-gray-400 font-bold mb-2 w-full text-left">Account Roles</h3>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={roleData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                          {roleData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-4 text-sm mt-2">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-sky-500"></div> Users ({userCount})</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Admins ({adminCount})</div>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-victus-card p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm h-64 flex flex-col">
                  <h3 className="text-gray-500 dark:text-gray-400 font-bold mb-4 flex items-center gap-2"><HardDrive className="h-5 w-5 text-green-500" /> Physical Server Disk</h3>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={[{ name: 'Disk Space (GB)', used: parseFloat(stats.diskUsed), free: parseFloat(stats.diskTotal) - parseFloat(stats.diskUsed) }]} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                        <XAxis type="number" stroke="#64748b" domain={[0, 'dataMax']} />
                        <YAxis dataKey="name" type="category" stroke="#64748b" width={100} />
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                        <Bar dataKey="used" name="Used (GB)" stackId="a" fill="#ef4444" radius={[4, 0, 0, 4]} />
                        <Bar dataKey="free" name="Free (GB)" stackId="a" fill="#22c55e" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-white dark:bg-victus-card rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800"><h2 className="text-lg font-bold flex items-center gap-2"><Users className="h-5 w-5 text-sky-500 dark:text-sky-400" /> Registered Accounts</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-sm">
                    <tr><th className="p-4">User</th><th className="p-4">Storage Used</th><th className="p-4">Joined</th><th className="p-4 text-right">Moderation Actions</th></tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        <td className="p-4">
                          <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            {u.full_name || 'Unknown'} 
                            {u.role === 'admin' ? <ShieldCheck className="h-4 w-4 text-red-500" title="Admin" /> : <Shield className="h-4 w-4 text-gray-400 dark:text-gray-600" title="User" />}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{(u.storage_used / (1024 * 1024)).toFixed(2)} MB / {((u.max_storage || 1073741824) / (1024 * 1024 * 1024)).toFixed(0)} GB</td>
                        <td className="p-4 text-sm text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="p-4 flex justify-end items-center gap-3">
                          {/* Show moderation tools IF they are a normal user OR if YOU are the Root Owner! */}
                          {(u.role !== 'admin' || adminUser.id === ROOT_ADMIN_ID) && u.id !== adminUser.id && (
                            <>
                              <select value={u.role} onChange={(e) => handleChangeRole(u.id, e.target.value)} className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-victus-accent cursor-pointer">
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                              
                              <select value={u.max_storage || 1073741824} onChange={(e) => handleUpgradeStorage(u.id, Number(e.target.value))} className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-victus-accent cursor-pointer">
                                <option value={1073741824}>1 GB</option>
                                <option value={5368709120}>5 GB</option>
                                <option value={16106127360}>15 GB</option>
                              </select>

                              <button onClick={() => handleWarnUser(u.id, u.full_name)} className="bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-500 hover:text-white px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3" /> Warn
                              </button>
                              
                              <button onClick={() => handleBanUser(u.id, u.full_name)} className="bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1">
                                <Trash2 className="h-3 w-3" /> Ban & Wipe
                              </button>
                            </>
                          )}

                          {/* Hide the buttons and show "Protected" if the target is an Admin and you are NOT the Root Owner */}
                          {u.role === 'admin' && u.id !== adminUser.id && adminUser.id !== ROOT_ADMIN_ID && (
                            <span className="text-xs font-bold text-red-500 bg-red-100 dark:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/20">
                              Protected Admin
                            </span>
                          )}

                          {/* Show the Root Owner badge for yourself! */}
                          {u.id === adminUser.id && (
                            <span className="text-xs font-bold text-sky-500 bg-sky-100 dark:bg-sky-500/10 px-3 py-1.5 rounded-lg border border-sky-200 dark:border-sky-500/20">
                              You ({adminUser.id === ROOT_ADMIN_ID ? 'Root Owner' : 'Admin'})
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'files' && (
            <motion.div key="files" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h2 className="text-xl font-medium text-gray-900 dark:text-white">System Activity</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Filter:</span>
                  <select value={fileFilterUser} onChange={(e) => setFileFilterUser(e.target.value)} className="bg-transparent text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-victus-accent cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <option value="ALL">All Users</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name || 'Unknown'}</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-10 shadow-sm">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">{globalFiles.length} uploads in the last 90 days</h3>
                <div className="flex flex-wrap gap-1">
                  {last90Days.map(date => {
                    const count = activityCounts[date] || 0;
                    let colorClass = 'bg-gray-100 dark:bg-gray-800/50'; 
                    if (count === 1) colorClass = 'bg-[#9be9a8] dark:bg-[#0e4429]';
                    else if (count === 2) colorClass = 'bg-[#40c463] dark:bg-[#006d32]';
                    else if (count === 3) colorClass = 'bg-[#30a14e] dark:bg-[#26a641]';
                    else if (count >= 4) colorClass = 'bg-[#216e39] dark:bg-[#39d353]';
                    return <div key={date} className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[2px] ${colorClass} hover:ring-1 ring-gray-400 dark:ring-gray-300 transition-all cursor-crosshair`} title={`${count} upload${count !== 1 ? 's' : ''} on ${date}`} />;
                  })}
                </div>
              </div>

              <div className="relative pl-4 sm:pl-8">
                <div className="absolute top-4 bottom-0 left-8 sm:left-12 w-px bg-gray-200 dark:bg-gray-800"></div>
                {globalFiles.length === 0 ? <div className="text-center p-12 text-gray-500">No files found.</div> : (
                  globalFiles.filter(f => fileFilterUser === 'ALL' || f.user_id === fileFilterUser).map((f) => (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={f.id} className="relative mb-10 group">
                        <div className="absolute -left-6 sm:-left-6 mt-1.5">
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center z-10 relative">
                            {f.file_type.includes('image') ? <ImageIcon className="h-4 w-4 text-sky-500" /> : f.file_type.includes('video') ? <PlayCircle className="h-4 w-4 text-purple-500" /> : f.file_type.includes('pdf') ? <FileText className="h-4 w-4 text-red-500" /> : <FileIcon className="h-4 w-4 text-gray-400" />}
                          </div>
                        </div>
                        <div className="ml-8 sm:ml-10">
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span className="font-semibold text-gray-900 dark:text-white">{f.profiles?.full_name || 'Deleted User'}</span><span>uploaded a {f.file_type.split('/')[0]}</span><span className="text-gray-400 dark:text-gray-500">•</span><span className="text-xs">{new Date(f.upload_date).toLocaleDateString()}</span>
                          </div>
                          <div className="bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-start gap-3 overflow-hidden">
                                <div className="mt-1"><FileText className="h-5 w-5 text-gray-400" /></div>
                                <div>
                                  <h3 className="text-base font-medium text-sky-600 dark:text-sky-400 hover:underline cursor-pointer truncate max-w-[200px]" onClick={() => window.open(`${API_URL}/api/download/${f.id}`, '_blank')} title={f.file_name}>{f.file_name}</h3>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" /> {(f.file_size / (1024*1024)).toFixed(2)} MB</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button onClick={() => window.open(`${API_URL}/api/download/${f.id}`, '_blank')} className="text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-1.5 rounded-md text-xs font-medium border border-gray-200 dark:border-gray-700 transition-colors flex items-center gap-1"><Download className="h-3.5 w-3.5" /> Download</button>
                                <button onClick={() => handleAdminDeleteFile(f.id)} className="text-red-500 hover:text-white bg-red-50 hover:bg-red-500 dark:bg-red-500/10 dark:hover:bg-red-600 px-3 py-1.5 rounded-md text-xs font-medium border border-red-200 dark:border-red-500/30 transition-colors flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div key="logs" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-white dark:bg-victus-card rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white"><FileWarning className="h-5 w-5 text-orange-500 dark:text-orange-400" /> System Audit Logs</h2>
                <button onClick={fetchAuditLogs} className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-md transition-colors">Refresh Logs</button>
              </div>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-left relative">
                  <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-sm sticky top-0 z-10">
                    <tr><th className="p-4">Timestamp</th><th className="p-4">Action Type</th><th className="p-4">Description</th><th className="p-4">User</th><th className="p-4">IP Address</th></tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr><td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">No security events logged yet.</td></tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <td className="p-4 text-xs text-gray-500 dark:text-gray-400 font-mono">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                          <td className="p-4"><span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold tracking-wider uppercase ${log.action_type.includes('MALWARE') ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/30' : log.action_type.includes('BANNED') ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30' : log.action_type.includes('WARN') ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/30' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}>{log.action_type}</span></td>
                          <td className="p-4 text-sm text-gray-800 dark:text-gray-200 font-medium">{log.description}</td>
                          <td className="p-4 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">{log.profiles?.full_name || <span className="italic text-gray-400">System / Anonymous</span>}</td>
                          <td className="p-4 text-xs text-gray-400 dark:text-gray-500 font-mono">{log.ip_address}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 5: UPGRADE REQUESTS */}
          {activeTab === 'upgrades' && (
            <motion.div key="upgrades" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-white dark:bg-victus-card rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                  <CreditCard className="h-5 w-5 text-blue-500 dark:text-blue-400" /> Pending GCash Payments
                </h2>
                <span className="text-sm bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full font-bold">{upgradeRequests.length} Pending</span>
              </div>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto p-6">
                
                {upgradeRequests.length === 0 ? (
                  <div className="text-center p-12 text-gray-500 dark:text-gray-400">No pending upgrade requests.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upgradeRequests.map((req) => (
                      <div key={req.id} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm flex flex-col">
                        
                        {/* Header: User & Tier */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start bg-white dark:bg-[#0d1117]">
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white truncate w-40">{req.profiles?.full_name}</p>
                            <p className="text-xs text-gray-500">{new Date(req.created_at).toLocaleString()}</p>
                          </div>
                          <span className="bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                            {(req.requested_tier / (1024*1024*1024)).toFixed(0)} GB Plan
                          </span>
                        </div>

                        {/* Middle: The GCash Screenshot */}
                        <div className="h-48 bg-gray-200 dark:bg-black p-2 flex items-center justify-center relative group cursor-pointer" onClick={() => window.open(`${API_URL}${req.receipt_url}`, '_blank')}>
                          <img src={`${API_URL}${req.receipt_url}`} alt="Receipt" className="max-w-full max-h-full object-contain" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white font-bold flex items-center gap-2"><ImageIcon className="h-5 w-5"/> View Full Image</span>
                          </div>
                        </div>

                        {/* Bottom: Approve / Reject Buttons */}
                        <div className="p-4 flex gap-3 mt-auto bg-white dark:bg-[#0d1117]">
                          <button onClick={() => handleProcessRequest(req.id, req.user_id, req.requested_tier, 'rejected')} className="flex-1 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-600 hover:text-white py-2 rounded-lg font-bold text-sm transition-colors">
                            Reject
                          </button>
                          <button onClick={() => handleProcessRequest(req.id, req.user_id, req.requested_tier, 'approved')} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-1">
                            <CheckCircle2 className="h-4 w-4"/> Approve
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}