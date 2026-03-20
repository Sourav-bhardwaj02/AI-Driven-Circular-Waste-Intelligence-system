import { motion } from "framer-motion";
import { Shield, Truck, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const dashboards = [
  {
    icon: Shield,
    title: "MCD Admin Dashboard",
    desc: "City overview analytics, complaint heatmaps, real-time GPS tracking, area-wise monitoring, and alert systems.",
    btn: "Open MCD Dashboard",
    link: "/dashboard/admin",
    color: "from-primary to-eco-teal",
  },
  {
    icon: Truck,
    title: "Garbage Collector Dashboard",
    desc: "Assigned routes, optimized path navigation, pickup checklists, task completion tracking, and ETA updates.",
    btn: "Start Route",
    link: "/dashboard/collector",
    color: "from-eco-teal to-eco-purple",
  },
  {
    icon: Users,
    title: "Citizen Dashboard",
    desc: "Report garbage with photo & GPS, track nearby trucks, earn reward points, and redeem cashback for bills.",
    btn: "Open App",
    link: "/dashboard/citizen",
    color: "from-eco-purple to-primary",
  },
];

const DashboardSection = () => {
  const navigate = useNavigate();

  return (
    <section id="dashboards" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="section-title mb-3">Role-Based Dashboards</h2>
          <p className="section-subtitle max-w-xl mx-auto">Each stakeholder gets a tailored experience with real-time data and actionable insights</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {dashboards.map((d, i) => (
            <motion.div key={d.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              className="glass-card p-6 flex flex-col">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${d.color} flex items-center justify-center mb-5`}>
                <d.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{d.title}</h3>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed flex-1">{d.desc}</p>
              <button onClick={() => navigate(d.link)} className="btn-eco w-full flex items-center justify-center gap-2">
                {d.btn} <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DashboardSection;
