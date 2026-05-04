import { useState, useEffect } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Auth() {
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'reset_request', 'update_password'
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null); // <-- NEW STATE
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('update_password');
    });
  }, []);

  // 🟢 REAL-TIME PASSWORD CHECKLIST
  const getPasswordStrength = (pass) => {
    return {
      length: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
    };
  };

  const strength = getPasswordStrength(formData.password);
  
  // Calculate how many rules passed (0 to 5) to determine the bar color
  const passedRulesCount = Object.values(strength).filter(Boolean).length;
  const strengthColor = 
    passedRulesCount <= 2 ? 'bg-red-500' : 
    passedRulesCount <= 4 ? 'bg-yellow-500' : 
    'bg-green-500';

  const validatePassword = (password) => {
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter.";
    if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter.";
    if (!/[0-9]/.test(password)) return "Password must contain a number.";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password must contain a special character.";
    return null;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'update_password') {
        if (formData.password !== formData.confirmPassword) throw new Error("Passwords do not match.");
        const passwordError = validatePassword(formData.password);
        if (passwordError) throw new Error(passwordError);

        const { error } = await supabase.auth.updateUser({ password: formData.password });
        if (error) throw error;
        
        toast.success('Password updated! You can now sign in.');
        setMode('login');
      } 
      
      else if (mode === 'reset_request') {
        if (!captchaToken) throw new Error("Please complete the captcha.");
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/auth`,
          options: { captchaToken } // <-- Pass the token!
        });
        if (error) throw error;
        toast.success(`Reset link sent to ${formData.email}`);
        setMode('login');
      }
      
      else if (mode === 'login') {
        if (!captchaToken) throw new Error("Please complete the captcha.");
        const { data, error } = await supabase.auth.signInWithPassword({ 
          email: formData.email, 
          password: formData.password,
          options: { captchaToken } // <-- Pass the token!
        });
        if (error) throw error;
        if (data.user) navigate('/dashboard');
      } 
      
      else if (mode === 'signup') {
        if (!captchaToken) throw new Error("Please complete the captcha.");
        if (formData.password !== formData.confirmPassword) throw new Error("Passwords do not match.");
        const passwordError = validatePassword(formData.password);
        if (passwordError) throw new Error(passwordError);

        const { error } = await supabase.auth.signUp({
          email: formData.email, 
          password: formData.password, 
          options: { 
            data: { full_name: formData.fullName },
            captchaToken // <-- Pass the token!
          },
        });
        if (error) throw error;
        toast.success('Success! Check your email to verify your account.');
        setMode('login');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      // ALWAYS WIPE PASSWORDS AFTER SUBMIT
      setFormData({ ...formData, password: '', confirmPassword: '' });
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    // ALWAYS WIPE PASSWORDS WHEN SWITCHING TABS
    setFormData({ ...formData, password: '', confirmPassword: '' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-victus-dark text-gray-900 dark:text-white transition-colors duration-300">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white dark:bg-victus-card p-8 rounded-2xl shadow-xl dark:shadow-2xl border border-gray-200 dark:border-gray-800">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-victus-accent">VictusG2 Cloud</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {mode === 'update_password' ? 'Enter your new secure password' : mode === 'reset_request' ? 'Reset your password' : mode === 'login' ? 'Welcome back to your secure drive' : 'Create your 1GB free cloud drive'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <AnimatePresence mode="popLayout">
            
            {mode === 'signup' && (
              <motion.div key="nameBox" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative">
                <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input type="text" placeholder="Full Name" required value={formData.fullName} className="w-full bg-gray-50 dark:bg-victus-dark text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-victus-accent" onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
              </motion.div>
            )}

            {mode !== 'update_password' && (
              <motion.div key="emailBox" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input type="email" placeholder="Email Address" required value={formData.email} className="w-full bg-gray-50 dark:bg-victus-dark text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-victus-accent" onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </motion.div>
            )}

            {mode !== 'reset_request' && (
              <motion.div key="passwordBox" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                {/* autoComplete="new-password" forces the browser to NOT auto-fill this box! */}
                <input type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder={mode === 'update_password' ? "New Password" : "Password"} required value={formData.password} className="w-full bg-gray-50 dark:bg-victus-dark text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg py-3 pl-10 pr-12 focus:outline-none focus:border-victus-accent" onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </motion.div>
            )}

            {/* 🟢 DYNAMIC PASSWORD STRENGTH METER & CHECKLIST */}
            {(mode === 'signup' || mode === 'update_password') && formData.password.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                
                {/* The Strength Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-3 mt-2">
                  <motion.div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${strengthColor}`} 
                    initial={{ width: 0 }}
                    animate={{ width: `${(passedRulesCount / 5) * 100}%` }}
                  />
                </div>

                {/* The Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center gap-1.5 ${strength.length ? 'text-green-500 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {strength.length ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />} 8+ characters
                  </div>
                  <div className={`flex items-center gap-1.5 ${strength.uppercase ? 'text-green-500 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {strength.uppercase ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />} Uppercase letter
                  </div>
                  <div className={`flex items-center gap-1.5 ${strength.lowercase ? 'text-green-500 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {strength.lowercase ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />} Lowercase letter
                  </div>
                  <div className={`flex items-center gap-1.5 ${strength.number ? 'text-green-500 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {strength.number ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />} Number
                  </div>
                  <div className={`flex items-center gap-1.5 ${strength.special ? 'text-green-500 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {strength.special ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />} Special char (!@#$%)
                  </div>
                </div>
              </motion.div>
            )}

            {(mode === 'signup' || mode === 'update_password') && (
              <motion.div key="confirmBox" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" placeholder="Confirm Password" required value={formData.confirmPassword} className="w-full bg-gray-50 dark:bg-victus-dark text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg py-3 pl-10 pr-12 focus:outline-none focus:border-victus-accent" onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </motion.div>
            )}
            
          </AnimatePresence>

          {/* FORGOT PASSWORD LINK */}
          {mode === 'login' && (
            <div className="flex justify-end">
              <button type="button" onClick={() => switchMode('reset_request')} className="text-sm text-victus-accent hover:underline">Forgot password?</button>
            </div>
          )}

          {/* 🛡️ CLOUDFLARE TURNSTILE WIDGET (Bypassed in Dev Mode) */}
          {mode !== 'update_password' && (
            <div className="flex justify-center my-4">
              {import.meta.env.DEV ? (
                <div className="bg-green-500/10 text-green-500 border border-green-500/20 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Dev Mode: Captcha Bypassed
                  {/* Automatically set a fake token so the button unlocks! */}
                  {setTimeout(() => setCaptchaToken('dev-bypass-token'), 100)}
                </div>
              ) : (
                <Turnstile 
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY} 
                  onSuccess={(token) => setCaptchaToken(token)}
                  onError={() => toast.error("Captcha failed. Please try again.")}
                  options={{ theme: 'auto' }}
                />
              )}
            </div>
          )}

          <button type="submit" disabled={loading || (mode !== 'update_password' && !captchaToken)} className="w-full bg-victus-accent hover:bg-sky-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2">
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : mode === 'update_password' ? 'Update Password' : mode === 'reset_request' ? 'Send Reset Link' : mode === 'login' ? 'Sign In' : 'Create Account'}
            {!loading && <ArrowRight className="h-5 w-5" />}
          </button>
        </form>

        {mode !== 'update_password' && (
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')} className="text-victus-accent hover:underline font-bold">
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}