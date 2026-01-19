import { CyberCard } from "@/components/CyberCard";
import { Navbar } from "@/components/Navbar";
import { Shield, Lock, Eye } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container px-4 py-8">
        <CyberCard className="max-w-4xl mx-auto p-8">
          <div className="flex items-center gap-4 mb-8 border-b border-primary/20 pb-4">
            <Shield className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-bold text-primary uppercase tracking-tighter italic">Privacy Policy</h1>
          </div>
          
          <div className="space-y-6 text-muted-foreground font-mono text-sm leading-relaxed">
            <section>
              <h2 className="text-primary font-bold uppercase mb-2">1. Data Collection</h2>
              <p>We collect minimal data required for authentication and service tracking. This includes email, username, and query history.</p>
            </section>
            
            <section>
              <h2 className="text-primary font-bold uppercase mb-2">2. Data Usage</h2>
              <p>Your data is used strictly for providing intelligence services and managing your credit balance. We do not sell or share your data with third parties.</p>
            </section>

            <section>
              <h2 className="text-primary font-bold uppercase mb-2">3. Security</h2>
              <p>All queries are processed through encrypted channels. We implement industry-standard protocols to protect your information.</p>
            </section>
          </div>
        </CyberCard>
      </main>
    </div>
  );
}
