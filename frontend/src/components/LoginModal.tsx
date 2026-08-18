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
            className="glass-card-static w-full max-w-md p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {isSignup ? 'Create Account' : 'Welcome Back'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-eco-rose/10 border border-eco-rose/30 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-eco-rose" />
                <span className="text-sm text-eco-rose">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignup && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Username</label>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    placeholder="Choose a username" 
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" 
                    required 
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="you@example.com" 
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" 
                  required 
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" 
                  required 
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">Select Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map(role => (
                    <button 
                      key={role.id} 
                      type="button" 
                      onClick={() => setSelectedRole(role.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        selectedRole === role.id 
                          ? "border-primary bg-accent" 
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <role.icon className={`w-5 h-5 mx-auto mb-1 ${
                        selectedRole === role.id ? "text-primary" : "text-muted-foreground"
                      }`} />
                      <span className="text-xs font-medium text-foreground block">{role.label}</span>
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
                className="w-full text-center py-3 rounded-xl font-semibold text-sm transition-all bg-accent/50 hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Loading...' : `Demo Login as ${roles.find(r => r.id === selectedRole)?.label}`}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsSignup(!isSignup)}
                  className="text-sm text-primary hover:underline"
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
