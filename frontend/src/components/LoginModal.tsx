import { useState } from "react";
import { X, Shield, Truck, Users, AlertCircle, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

const roles = [
  { id: "admin", label: "MCD Admin", icon: Shield, desc: "City waste management administration" },
  { id: "collector", label: "Garbage Collector", icon: Truck, desc: "Route optimization & task management" },
  { id: "citizen", label: "Citizen", icon: Users, desc: "Report garbage & earn rewards" },
];

const LoginModal = ({ isOpen, onClose, onLoginSuccess }: LoginModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [selectedRole, setSelectedRole] = useState("citizen");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isSignup) {
        await register({
          username,
          email,
          password,
          role: selectedRole as 'admin' | 'citizen' | 'collector',
          profile: {
            firstName: username.split(' ')[0],
            lastName: username.split(' ')[1] || '',
          }
        });
      } else {
        await login(email, password, selectedRole as 'admin' | 'citizen' | 'collector');
      }
      onClose();
      onLoginSuccess?.();
      // Reset form
      setEmail("");
      setPassword("");
      setUsername("");
      setIsSignup(false);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError("");
    setIsLoading(true);

    try {
      // Demo credentials
      const demoCredentials = {
        admin: { email: 'admin@wastewise.com', password: 'admin123' },
        collector: { email: 'collector@wastewise.com', password: 'collector123' },
        citizen: { email: 'citizen@wastewise.com', password: 'citizen123' }
      };

      const credentials = demoCredentials[selectedRole as keyof typeof demoCredentials];
      await login(credentials.email, credentials.password, selectedRole as 'admin' | 'citizen' | 'collector');
      onClose();
      onLoginSuccess?.();
    } catch (err: any) {
      setError('Demo login failed. Please try manual login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4" 
          style={{ background: "hsla(220, 25%, 12%, 0.4)", backdropFilter: "blur(8px)" }}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.9, opacity: 0 }} 
            className="modal-card w-full max-w-md p-8 bg-white text-slate-900 border border-slate-200 shadow-2xl rounded-3xl relative z-50"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {isSignup ? 'Create Account' : 'Welcome Back'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700 font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignup && (
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Username</label>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    placeholder="Choose a username" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all" 
                    required 
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="you@example.com" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all" 
                  required 
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all" 
                  required 
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-3 block">Select Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map(role => (
                    <button 
                      key={role.id} 
                      type="button" 
                      onClick={() => setSelectedRole(role.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        selectedRole === role.id 
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm" 
                          : "border-slate-200 bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-300 text-slate-700"
                      }`}
                    >
                      <role.icon className={`w-5 h-5 mx-auto mb-1 ${
                        selectedRole === role.id ? "text-emerald-600" : "text-slate-400"
                      }`} />
                      <span className="text-xs font-semibold block">{role.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="btn-eco w-full text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isSignup ? 'Creating Account...' : 'Logging in...'}
                  </span>
                ) : (
                  isSignup ? 'Create Account' : 'Login'
                )}
              </button>
            </form>

            <div className="mt-4 space-y-3">
              <button 
                type="button"
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="w-full text-center py-3 rounded-xl font-semibold text-sm transition-all bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Loading...' : `Demo Login as ${roles.find(r => r.id === selectedRole)?.label}`}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsSignup(!isSignup)}
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign up"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
