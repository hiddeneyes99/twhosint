import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Megaphone, ShieldAlert, Cpu, CreditCard, Send, CheckCircle2, Info } from "lucide-react";
import { Link } from "wouter";

export default function Updates() {
  return (
    <div className="min-h-screen bg-black text-primary p-4 md:p-8 font-mono">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
        
        {/* Header section */}
        <header className="text-center space-y-4 border-b border-primary/30 pb-8">
          <div className="inline-block p-3 border-2 border-primary rounded-full mb-2 shadow-[0_0_15px_rgba(0,255,157,0.3)]">
            <Megaphone className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">
            Updates & <span className="text-white">Announcements</span>
          </h1>
          <p className="text-primary/70 text-sm md:text-base max-w-2xl mx-auto uppercase tracking-widest">
            Official News Feed // System Status // TWH OSINT Protocol
          </p>
        </header>

        {/* API Status Section */}
        <Card className="bg-black/40 border-primary/50 shadow-[0_0_20px_rgba(0,255,157,0.1)] overflow-hidden">
          <CardHeader className="bg-primary/10 border-b border-primary/30">
            <CardTitle className="flex items-center gap-3 text-primary uppercase tracking-tighter">
              <CheckCircle2 className="w-5 h-5" />
              API Status Update
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/20 rounded">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg leading-none mb-2">Mobile Number Search Fixed</h3>
                <p className="text-primary/80 text-sm leading-relaxed">
                  The Mobile Number Search API is now fully operational. To achieve this, we have purged the legacy History Database. This reset was necessary to eliminate a persistent bug where failed search results were being cached, preventing users from receiving fresh, accurate data. Everyone now has access to the updated lookup engine.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credit System Changes Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-black/40 border-primary/50 shadow-[0_0_20px_rgba(0,255,157,0.1)]">
            <CardHeader className="bg-primary/10 border-b border-primary/30">
              <CardTitle className="flex items-center gap-3 text-primary uppercase tracking-tighter text-lg">
                <CreditCard className="w-5 h-5" />
                Credit System Changes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-4 text-sm">
                <li className="flex justify-between items-center border-b border-primary/10 pb-2">
                  <span className="text-primary/60 uppercase">New Signup Bonus</span>
                  <span className="text-white font-bold font-mono">5 Credits</span>
                </li>
                <li className="flex justify-between items-center border-b border-primary/10 pb-2">
                  <span className="text-primary/60 uppercase">Mobile Search Cost</span>
                  <span className="text-white font-bold font-mono">2 Credits <span className="text-[10px] text-primary/40 leading-none">(Effective Feb 13)</span></span>
                </li>
                <li className="flex flex-col gap-1">
                  <span className="text-primary/60 uppercase text-[10px]">Other Services</span>
                  <p className="text-primary/80 italic">IP and Vehicle search costs remain unchanged. All future adjustments will be announced here.</p>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
            <CardHeader className="bg-red-500/10 border-b border-red-500/30">
              <CardTitle className="flex items-center gap-3 text-red-500 uppercase tracking-tighter text-lg">
                <AlertCircle className="w-5 h-5" />
                Service Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="p-3 border border-red-500/20 bg-red-500/5 rounded space-y-2">
                <h4 className="text-red-500 font-bold uppercase text-xs tracking-widest">Aadhar Search: OFFLINE</h4>
                <p className="text-red-400/80 text-[13px] leading-relaxed">
                  Aadhar Search services are currently CLOSED. TWH OSINT does not have the necessary infrastructure funding to maintain this API at the moment.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security & Access Section */}
        <Card className="bg-black/40 border-yellow-500/50">
          <CardContent className="p-6">
            <div className="flex gap-4 items-center mb-4">
              <ShieldAlert className="w-10 h-10 text-yellow-500 shrink-0" />
              <h3 className="text-white font-bold uppercase tracking-widest">Security Protocol & Free Access</h3>
            </div>
            <p className="text-yellow-500/80 text-sm leading-relaxed mb-4 italic">
              "Detecting fake account activity will result in an immediate and permanent BAN from all TWH services."
            </p>
            <p className="text-primary/80 text-sm leading-relaxed border-t border-primary/10 pt-4">
              We understand that not everyone can pay for credits. For genuine users, we provide the <span className="text-white font-bold">Redeem Code</span> system. You can use this system to obtain free credits and continue your investigations.
            </p>
          </CardContent>
        </Card>

        {/* Transparency Section */}
        <Card className="bg-black/40 border-primary/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Info className="w-24 h-24" />
          </div>
          <CardContent className="p-6 space-y-4 relative z-10">
            <h3 className="text-white font-bold uppercase tracking-tighter text-xl">Operational Transparency</h3>
            <div className="text-primary/90 text-base leading-relaxed space-y-4">
              <p className="border-l-4 border-primary pl-4 py-2 bg-primary/5 italic font-bold text-white">
                "Every single search costs TWH ₹2.5! Plus we pay for hosting, API servers, and maintenance."
              </p>
              <p className="text-sm">
                Paid credits are the lifeblood of this project; they keep the tool alive and the data fresh. While we offer free options for genuine users, the financial support from our community ensures we can continue to provide high-level OSINT capabilities.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Business Note */}
        <footer className="pt-8 border-t border-primary/30 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="space-y-1">
            <h4 className="text-white font-bold uppercase text-sm tracking-widest flex items-center gap-2 justify-center md:justify-start">
              <Send className="w-4 h-4 text-primary" />
              Business & Services
            </h4>
            <p className="text-primary/60 text-xs uppercase tracking-tight">
              Custom Development // API Procurement // OSINT Solutions
            </p>
            <p className="text-primary font-bold mt-2">
              Telegram: <span className="text-white tracking-widest">@Twhosint</span>
            </p>
          </div>
          <Link href="/" className="px-6 py-2 border border-primary text-primary uppercase text-xs tracking-[0.3em] font-bold hover:bg-primary hover:text-black transition-all duration-300">
            RETURN_TO_BASE
          </Link>
        </footer>

      </div>
    </div>
  );
}
