import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, User, MapPin, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  name: string;
  phone: string;
  email: string;
  address: string;
  location: string;
  avatar: string | null;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData;
  onSave: (profile: ProfileData) => void;
  readonlyEmail?: boolean;
}

const EditProfileModal = ({ isOpen, onClose, profile, onSave, readonlyEmail = false }: EditProfileModalProps) => {
  const [form, setForm] = useState<ProfileData>(profile);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarPreview(result);
        setForm({ ...form, avatar: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave(form);
    toast({ title: "Profile Updated", description: "Your profile has been saved successfully." });
    onClose();
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setForm({ ...form, location: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}` }),
        () => setForm({ ...form, location: "New Delhi, India (default)" })
      );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: "spring", damping: 25 }}
            className="glass-card-static p-6 w-full max-w-md relative z-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">Edit Profile</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            {/* Avatar Upload */}
            <div className="flex justify-center mb-5">
              <label className="relative cursor-pointer group">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-eco-teal flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-primary-foreground" />
                  )}
                </div>
                <div className="absolute inset-0 rounded-2xl bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="w-5 h-5 text-background" />
                </div>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone Number</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                <input value={form.email} onChange={e => !readonlyEmail && setForm({ ...form, email: e.target.value })} readOnly={readonlyEmail}
                  className={`w-full px-3 py-2 rounded-xl border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 ${readonlyEmail ? "bg-muted cursor-not-allowed" : "bg-background/50"}`} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Address</label>
                <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Location</label>
                <div className="flex gap-2">
                  <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <button onClick={handleGetLocation} className="px-3 py-2 rounded-xl border border-border hover:bg-accent transition-colors" title="Auto-detect">
                    <MapPin className="w-4 h-4 text-primary" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={onClose} className="btn-eco-outline flex-1 text-sm py-2.5">Cancel</button>
              <button onClick={handleSave} className="btn-eco flex-1 text-sm py-2.5 flex items-center justify-center gap-1"><Check className="w-4 h-4" /> Save Changes</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditProfileModal;
