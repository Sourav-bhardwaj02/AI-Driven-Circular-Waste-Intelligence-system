import { motion } from "framer-motion";
import { Brain, Route, Gift, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: Brain,
    title: "AI Waste Classifier",
    desc: "Upload waste images and get instant AI classification — biodegradable, recyclable, or hazardous. Reduces contamination by 95%.",
    stats: ["+95% accuracy", "-20% time"],
    color: "from-primary to-eco-teal",
    link: "/classifier",
  },
  {
    icon: Route,
    title: "Optimized Route System",
    desc: "AI-driven route optimization for garbage collectors. Reduces fuel consumption and ensures timely pickups across all zones.",
    stats: ["-35% fuel use", "-30% time"],
    color: "from-eco-teal to-eco-purple",
    link: "/dashboard/collector",
  },
  {
    icon: Gift,
    title: "Community & Rewards",
    desc: "Citizens earn reward points for proper waste disposal. Redeem cashback for bill payments, mobile recharges, and more.",
    stats: ["2,550+ avg points", "4 redemption types"],
    color: "from-eco-purple to-primary",
    link: "/rewards",
  },
];

const FeaturesSection = () => {
  const navigate = useNavigate();

  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="section-title mb-3">Intelligent Features</h2>
          <p className="section-subtitle max-w-xl mx-auto">Powered by AI and IoT to revolutionize waste management across cities</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              onClick={() => navigate(f.link)}
              className="glass-card p-6 cursor-pointer group">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <f.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{f.desc}</p>
              <div className="flex gap-4 mb-4">
                {f.stats.map(s => (
                  <span key={s} className="status-green text-xs">{s}</span>
                ))}
              </div>
              <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                Explore <ArrowRight className="w-4 h-4" />
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
