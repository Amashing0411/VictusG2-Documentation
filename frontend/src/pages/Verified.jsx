import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function Verified() {
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Play the countdown every 1 second
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    // 2. When 5 seconds pass, auto-redirect to Login!
    const redirect = setTimeout(() => {
      navigate('/auth');
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-victus-dark text-gray-900 dark:text-white transition-colors duration-300 p-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white dark:bg-victus-card p-10 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 text-center max-w-md w-full"
      >
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          transition={{ type: "spring", delay: 0.2 }}
          className="bg-green-100 dark:bg-green-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </motion.div>
        
        <h1 className="text-3xl font-extrabold mb-4 text-gray-900 dark:text-white">Authentication Complete!</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
          Your email has been successfully verified. You are now a registered user of VictusG2 Cloud.
        </p>

        <div className="flex items-center justify-center gap-3 text-victus-accent font-medium bg-sky-50 dark:bg-sky-500/10 p-4 rounded-xl">
          <Loader2 className="h-5 w-5 animate-spin" />
          Redirecting to Sign In in {countdown} seconds...
        </div>
      </motion.div>
    </div>
  );
}