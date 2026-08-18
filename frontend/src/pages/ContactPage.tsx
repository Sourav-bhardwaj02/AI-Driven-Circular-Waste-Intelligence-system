import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import Footer from "@/components/Footer";

const ContactPage = () => (
  <div className="min-h-screen bg-background pt-20">
    <div className="max-w-3xl mx-auto px-6 py-16">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block">← Back to Home</Link>
      <h1 className="text-3xl font-bold text-foreground mb-6">Contact Us</h1>

      <p className="text-muted-foreground leading-relaxed mb-10">
        Have a question, suggestion, or complaint? We'd love to hear from you. Reach out through any of the channels below and our team will get back to you as soon as possible.
      </p>

      <div className="grid gap-6 sm:grid-cols-3 mb-12">
        <div className="glass-card-static p-6 text-center space-y-3">
          <Mail className="w-6 h-6 text-primary mx-auto" />
          <h3 className="font-semibold text-foreground text-sm">Email</h3>
          <p className="text-sm text-muted-foreground">support@ecosortai.in</p>
        </div>
        <div className="glass-card-static p-6 text-center space-y-3">
          <Phone className="w-6 h-6 text-primary mx-auto" />
          <h3 className="font-semibold text-foreground text-sm">Phone</h3>
          <p className="text-sm text-muted-foreground">+91 11-2345-6789</p>
        </div>
        <div className="glass-card-static p-6 text-center space-y-3">
          <MapPin className="w-6 h-6 text-primary mx-auto" />
          <h3 className="font-semibold text-foreground text-sm">Office</h3>
          <p className="text-sm text-muted-foreground">MCD HQ, New Delhi, India</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-foreground mb-4">Send us a message</h2>
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid sm:grid-cols-2 gap-4">
          <input type="text" placeholder="Your Name" className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          <input type="email" placeholder="Your Email" className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <input type="text" placeholder="Subject" className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <textarea placeholder="Your message..." rows={5} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
        <button type="submit" className="btn-eco text-sm">Send Message</button>
      </form>
    </div>
    <Footer />
  </div>
);

export default ContactPage;
