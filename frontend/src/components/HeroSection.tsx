import { motion } from "framer-motion";
import { Leaf, Recycle, Truck } from "lucide-react";
import landingHero from "@/assets/landing-hero.png";

const HeroSection = () => {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="hero" className="relative pt-20 overflow-hidden">
      {/* Floating decorative elements */}
      <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-32 right-[5%] opacity-10 z-10">
        <Leaf className="w-12 h-12 text-primary" />
      </motion.div>
      <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-48 left-[3%] opacity-10 z-10">
        <Recycle className="w-16 h-16 text-eco-purple" />
      </motion.div>
      <motion.div animate={{ y: [0, -18, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-32 left-[5%] opacity-10 z-10">
        <Truck className="w-14 h-14 text-eco-teal" />
      </motion.div>

      {/* Full width hero image */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="w-full"
      >
        <img
          src={landingHero}
          alt="WasteWise AI - Smart Waste Management System"
          className="w-full h-auto object-cover"
        />
      </motion.div>
    </section>
  );
};

export default HeroSection;
