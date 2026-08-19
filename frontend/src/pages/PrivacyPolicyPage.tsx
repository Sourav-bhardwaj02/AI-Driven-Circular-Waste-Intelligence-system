import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const PrivacyPolicyPage = () => (
  <div className="min-h-screen bg-background pt-20">
    <div className="max-w-3xl mx-auto px-6 py-16">
      <Link to="/" className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block">← Back to Home</Link>
      <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: March 2026</p>

      <div className="space-y-6 text-muted-foreground leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Information We Collect</h2>
          <p>We collect personal information you provide when creating an account, including your name, email address, phone number, and location. We also collect usage data such as complaint reports, community posts, and reward activity.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. How We Use Your Information</h2>
          <p>Your information is used to provide and improve our waste management services. This includes assigning garbage collectors to your area, processing your complaints, tracking reward points, and improving route optimisation.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Data Sharing</h2>
          <p>We do not sell your personal data. Information may be shared with municipal authorities (MCD) for complaint resolution and service improvement. Aggregated, anonymous data may be used for analytics and public reporting.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Data Security</h2>
          <p>We take reasonable measures to protect your data, including encryption and secure server infrastructure. However, no method of electronic transmission is completely secure, and we cannot guarantee absolute security.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Location Data</h2>
          <p>With your permission, we collect location data to enable features like live truck tracking, complaint geo-tagging, and route optimisation. You can disable location access in your device settings at any time.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Your Rights</h2>
          <p>You may request access to, correction of, or deletion of your personal data at any time by contacting us at support@ecosortai.in. We will respond to your request within 30 days.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">7. Changes to This Policy</h2>
          <p>We may update this policy from time to time. Changes will be posted on this page with a revised date. Continued use of the platform after changes constitutes acceptance of the updated policy.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">8. Contact</h2>
          <p>For any privacy-related questions, please reach out to us at <span className="text-foreground font-medium">support@ecosortai.in</span> or visit our <Link to="/contact" className="text-primary hover:underline">Contact page</Link>.</p>
        </section>
      </div>
    </div>
    <Footer />
  </div>
);

export default PrivacyPolicyPage;
