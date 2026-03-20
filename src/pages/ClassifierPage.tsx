import { motion } from "framer-motion";
import { Camera, CheckSquare, Home as HomeIcon, AlertTriangle, Recycle, Upload } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const wasteTypes = [
  { type: "Biodegradable", bin: "Green Bin", color: "text-primary", bgColor: "bg-primary", icon: CheckSquare },
  { type: "Recyclable", bin: "Blue Bin", color: "text-eco-teal", bgColor: "bg-eco-teal", icon: HomeIcon },
  { type: "Hazardous", bin: "Red Bin", color: "text-eco-rose", bgColor: "bg-eco-rose", icon: AlertTriangle },
];

const ClassifierPage = () => {
  const [result, setResult] = useState<typeof wasteTypes[0] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleUpload = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setResult(wasteTypes[0]);
      setAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/" className="text-sm text-primary hover:underline mb-6 inline-block">← Back to Home</Link>
          <h1 className="text-3xl font-bold text-foreground text-center mb-2">AI Waste Classifier</h1>
          <p className="text-center text-muted-foreground mb-10">Upload a photo of your waste and our AI will classify it instantly</p>

          <div className="glass-card-static p-8">
            {!result && !analyzing && (
              <div onClick={handleUpload} className="border-2 border-dashed border-border rounded-2xl p-12 text-center cursor-pointer hover:border-primary/40 transition-all group">
                <div className="w-16 h-16 rounded-2xl bg-accent mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
                <p className="text-lg font-medium text-foreground mb-1">Click to Upload Image</p>
                <p className="text-sm text-muted-foreground">or drag and drop your waste image here</p>
              </div>
            )}

            {analyzing && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
                <p className="text-foreground font-medium">Analyzing waste...</p>
                <p className="text-sm text-muted-foreground">Our AI is classifying your image</p>
              </div>
            )}

            {result && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="flex flex-col md:flex-row items-center gap-8 mb-6">
                  <div className="w-48 h-48 rounded-2xl bg-accent flex items-center justify-center">
                    <Recycle className="w-20 h-20 text-primary/30" />
                  </div>
                  <div>
                    <h2 className={`text-3xl font-bold ${result.color} mb-2`}>{result.type} Waste</h2>
                    <button className={`${result.bgColor} text-primary-foreground px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2`}>
                      <result.icon className="w-5 h-5" /> Use {result.bin}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {wasteTypes.map(w => (
                    <div key={w.type} className={`glass-card p-4 text-center ${result.type === w.type ? "ring-2 ring-primary" : ""}`}>
                      <h3 className={`text-sm font-semibold ${w.color} mb-2`}>{w.type} Waste</h3>
                      <button className={`${w.bgColor} text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 mx-auto`}>
                        <w.icon className="w-3 h-3" /> Use {w.bin}
                      </button>
                    </div>
                  ))}
                </div>

                <button onClick={() => setResult(null)} className="btn-eco-outline w-full mt-6 flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" /> Classify Another
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ClassifierPage;
