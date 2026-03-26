import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const AboutPage = () => (
  <div className="min-h-screen bg-background pt-20">
    <div className="max-w-3xl mx-auto px-6 py-16">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block">← Back to Home</Link>
      <h1 className="text-3xl font-bold text-foreground mb-6">About Us</h1>

      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <p>
          EcoSort AI is a smart waste management initiative designed to make our cities cleaner, greener, and more livable. We work closely with municipal corporations, garbage collectors, and citizens to build a connected waste management ecosystem.
        </p>
        <p>
          Our platform helps citizens report garbage issues in their neighbourhood, track collection trucks in real time, and earn rewards for responsible waste disposal. Garbage collectors receive optimized routes and task assignments, while administrators get a bird's-eye view of city-wide operations.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">Our Mission</h2>
        <p>
          To create a waste-free environment through community participation, technology, and transparent governance. We believe every small action — sorting your waste, reporting an overflow, or simply being aware — contributes to a healthier planet.
        </p>

        <h2 className="text-xl font-semibold text-foreground pt-4">Our Values</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Transparency in waste collection and complaint resolution</li>
          <li>Community-first approach to urban cleanliness</li>
          <li>Respect for the environment and the people who keep it clean</li>
          <li>Accessible technology for every citizen</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground pt-4">Our Team</h2>
        <p>
          We are a small team of civic-minded engineers, designers, and municipal partners who care deeply about public sanitation. Our work is guided by feedback from real users — the citizens who live in these neighbourhoods and the collectors who serve them every day.
        </p>
      </div>
    </div>
    <Footer />
  </div>
);

export default AboutPage;
