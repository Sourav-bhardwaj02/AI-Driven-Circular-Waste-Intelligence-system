import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="glass-nav py-10 px-6 mt-10">
    <div className="max-w-6xl mx-auto">
      <div className="grid md:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-eco-teal flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">E</span>
            </div>
            <span className="font-bold text-foreground">WasteWise AI</span>
          </div>
          <p className="text-sm text-muted-foreground">AI-powered smart waste management for cleaner cities.</p>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-3 text-sm">Dashboards</h4>
          <div className="flex flex-col gap-2">
            <Link to="/dashboard/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">MCD Admin</Link>
            <Link to="/dashboard/collector" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Garbage Collector</Link>
            <Link to="/dashboard/citizen" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Citizen</Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-3 text-sm">Features</h4>
          <div className="flex flex-col gap-2">
            <Link to="/classifier" className="text-sm text-muted-foreground hover:text-foreground transition-colors">AI Classifier</Link>
            <Link to="/community" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Community</Link>
            <Link to="/rewards" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Rewards</Link>
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-3 text-sm">Company</h4>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">About Us</span>
            <span className="text-sm text-muted-foreground">Contact</span>
            <span className="text-sm text-muted-foreground">Privacy Policy</span>
          </div>
        </div>
      </div>
      <div className="border-t border-border pt-6 text-center">
        <p className="text-xs text-muted-foreground">© 2026 WasteWise Inc. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
