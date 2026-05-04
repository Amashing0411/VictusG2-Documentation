import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Cloud, Shield, Zap, HardDrive, ArrowRight, Code, Sun, Moon } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  
  // 🌗 THEME STATE (Syncs with Dashboard!)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-victus-dark text-gray-900 dark:text-white overflow-hidden font-sans transition-colors duration-300">
      
      {/* NAVBAR */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <div className="bg-victus-accent/10 dark:bg-victus-accent/20 p-2 rounded-lg">
            <Cloud className="h-6 w-6 text-victus-accent" />
          </div>
          <span className="text-xl font-bold tracking-tight">VictusG2 Cloud</span>
        </div>
        <div className="flex items-center gap-4">
          
          {/* 🌗 THEME TOGGLE BUTTON */}
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button onClick={() => navigate('/auth')} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors">Sign In</button>
          <button onClick={() => navigate('/auth')} className="bg-victus-accent hover:bg-sky-500 text-white px-5 py-2 rounded-full font-medium transition-all shadow-lg shadow-sky-500/20">
            Get 1GB Free
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-32 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight text-gray-900 dark:text-white">
            Secure cloud storage <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">for students & pros.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
            Store, share, and manage your files with enterprise-grade security. 
            Powered by a dedicated Ubuntu LTS Server. 
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/auth')} className="w-full sm:w-auto bg-victus-accent hover:bg-sky-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-lg shadow-sky-500/30 flex items-center justify-center gap-2 group">
              Start Uploading <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="https://github.com/Amashing0411/VictusG2-Documentation/tree/main" target="_blank" rel="noreferrer" className="w-full sm:w-auto bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-700 shadow-sm">
              <Code className="h-5 w-5" /> View on GitHub
            </a>
          </div>
        </motion.div>
      </div>

      {/* FEATURES GRID */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 relative z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Industry Standard Features</h2>
            <p className="text-gray-600 dark:text-gray-400">Everything you need, built exactly how tech giants do it.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-gray-50 dark:bg-victus-card p-8 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-sky-500/50 transition-colors shadow-sm">
              <div className="bg-sky-100 dark:bg-sky-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6"><HardDrive className="h-7 w-7 text-sky-500 dark:text-sky-400"/></div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">1GB Persistent Storage</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Files are saved directly to a dedicated Ubuntu VM hard drive, ensuring your data never disappears on restart.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-gray-50 dark:bg-victus-card p-8 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-purple-500/50 transition-colors shadow-sm">
              <div className="bg-purple-100 dark:bg-purple-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6"><Shield className="h-7 w-7 text-purple-500 dark:text-purple-400"/></div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Row Level Security</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Database access is strictly guarded. Users can only see and access their own files. Fully encrypted Auth system.</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-gray-50 dark:bg-victus-card p-8 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-green-500/50 transition-colors shadow-sm">
              <div className="bg-green-100 dark:bg-green-500/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6"><Zap className="h-7 w-7 text-green-500 dark:text-green-400"/></div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Real-Time Admin Panel</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">A dedicated live monitoring dashboard for administrators to track Server CPU, RAM, and Disk space every second.</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* BACKGROUND GLOW EFFECTS */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-10 dark:opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-blue-600 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen"></div>
      </div>
    </div>
  );
}