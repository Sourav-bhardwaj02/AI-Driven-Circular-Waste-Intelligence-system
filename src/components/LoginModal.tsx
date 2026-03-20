import { useState } from "react";
import { X, Shield, Truck, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (role: string) => void;
}

const roles = [
  { id: "admin", label: "MCD Admin", icon: Shield, desc: "City waste management administration" },
  { id: "collector", label: "Garbage Collector", icon: Truck, desc: "Route optimization & task management" },
  { id: "citizen", label: "Citizen", icon: Users, desc: "Report garbage & earn rewards" },
];

const LoginModal = ({ isOpen, onClose, onLogin }: LoginModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("citizen");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(selectedRole);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "hsla(220, 25%, 12%, 0.4)", backdropFilter: "blur(8px)" }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card-static w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Welcome Back</h2>
              <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-border bg-background/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" required />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">Select Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map(role => (
                    <button key={role.id} type="button" onClick={() => setSelectedRole(role.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${selectedRole === role.id ? "border-primary bg-accent" : "border-border hover:border-primary/30"}`}>
                      <role.icon className={`w-5 h-5 mx-auto mb-1 ${selectedRole === role.id ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-xs font-medium text-foreground block">{role.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-eco w-full text-center">Login</button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Demo mode — enter any credentials to explore
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
