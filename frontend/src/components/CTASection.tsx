import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface CTASectionProps {
  onGetStarted: () => void;
}

const CTASection = ({ onGetStarted }: CTASectionProps) => (
  <section className="py-20 px-6">
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="glass-card-static p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-eco-purple/5 rounded-2xl" />
        <div className="relative">
          <h2 className="section-title mb-4">Start Smart Waste Management Today</h2>
          <p className="section-subtitle mb-8 max-w-lg mx-auto">
            Join thousands of cities using AI-powered waste management to create cleaner, greener communities.
          </p>
          <button onClick={onGetStarted} className="btn-eco text-base px-8 py-4 inline-flex items-center gap-2">
            Get Started <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  </section>
);

export default CTASection;
