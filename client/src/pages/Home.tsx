import { Link } from "wouter";
import { motion } from "framer-motion";
import { Smartphone, CreditCard, Car, Globe, ArrowRight, ShieldCheck, Lock, Database } from "lucide-react";
import { CyberButton } from "@/components/CyberButton";
import { CyberCard } from "@/components/CyberCard";
import { Navbar } from "@/components/Navbar";
import { BroadcastPopup } from "@/components/BroadcastPopup";
import { useState } from "react";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/hooks/use-auth";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      <BroadcastPopup />
      <main className="flex-1 container px-4 py-8 md:py-12 relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 md:w-96 h-72 md:h-96 bg-primary/20 rounded-full blur-[80px] md:blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-48 md:w-64 h-48 md:h-64 bg-primary/10 rounded-full blur-[60px] md:blur-[80px]" />
        </div>

        <div className="flex flex-col items-center text-center space-y-6 md:space-y-8 mb-12 md:mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block"
          >
            <div className="px-3 py-1 border border-primary/50 bg-primary/10 rounded-full text-[10px] md:text-xs font-mono text-primary mb-2 md:mb-4">● SYSTEM ONLINE v4.0</div>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight max-w-4xl px-2"
          >
            OPEN SOURCE INTELLIGENCE
            <span className="block text-primary text-glow mt-2">DATA EXTRACTION SUITE</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm md:text-lg text-muted-foreground max-w-2xl font-mono px-4"
          >
            Advanced reconnaissance tools for digital footprint analysis.
            Secure access to vehicle, identity, and network data streams.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0"
          >
            {isLoading ? (
              <CyberButton className="h-10 md:h-14 px-6 md:px-8 text-sm md:text-lg opacity-50 cursor-wait w-full sm:w-auto">
                LOADING...
              </CyberButton>
            ) : user ? (
              <Link href="/dashboard" className="w-full sm:w-auto">
                <CyberButton className="h-10 md:h-14 px-6 md:px-8 text-sm md:text-lg w-full sm:w-auto">
                  INITIALIZE TOOLS <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
                </CyberButton>
              </Link>
            ) : (
              <CyberButton className="h-10 md:h-14 px-6 md:px-8 text-sm md:text-lg w-full sm:w-auto" onClick={() => setIsAuthModalOpen(true)}>
                ACCESS SYSTEM <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
              </CyberButton>
            )}
          </motion.div>
        </div>

        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-20"
        >
          <motion.div variants={itemVariants}>
            <CyberCard className="h-full">
              <Smartphone className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">MOBILE INTEL</h3>
              <p className="text-muted-foreground text-sm">Extract carrier data, location info, and roaming status from 10-digit mobile identifiers.</p>
            </CyberCard>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <CyberCard className="h-full">
              <CreditCard className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">IDENTITY TRACE</h3>
              <p className="text-muted-foreground text-sm">Verify identity card authenticity and extract linked demographic metadata securely.</p>
            </CyberCard>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <CyberCard className="h-full">
              <Car className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">VEHICLE RECON</h3>
              <p className="text-muted-foreground text-sm">Retrieve ownership details, registration status, and vehicle specifications from RC numbers.</p>
            </CyberCard>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <CyberCard className="h-full">
              <Globe className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">NETWORK PROBE</h3>
              <p className="text-muted-foreground text-sm">Geolocation analysis and ISP identification for IPv4 addresses globally.</p>
            </CyberCard>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 border-t border-primary/20 pt-8 md:pt-12">
          <div className="flex flex-col items-center text-center p-2 md:p-4">
            <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-primary/70 mb-2 md:mb-3" />
            <h4 className="text-base md:text-lg font-bold">SECURE ACCESS</h4>
            <p className="text-xs md:text-sm text-muted-foreground">End-to-end encrypted requests with strict access logging.</p>
          </div>
          <div className="flex flex-col items-center text-center p-2 md:p-4">
            <Database className="w-6 h-6 md:w-8 md:h-8 text-primary/70 mb-2 md:mb-3" />
            <h4 className="text-base md:text-lg font-bold">CREDIT SYSTEM</h4>
            <p className="text-xs md:text-sm text-muted-foreground">Pay-per-use architecture. 1 request = 1 credit debit.</p>
          </div>
          <div className="flex flex-col items-center text-center p-2 md:p-4">
            <Lock className="w-6 h-6 md:w-8 md:h-8 text-primary/70 mb-2 md:mb-3" />
            <h4 className="text-base md:text-lg font-bold">VERIFIED DATA</h4>
            <p className="text-xs md:text-sm text-muted-foreground">Direct integration with official government and ISP APIs.</p>
          </div>
        </div>
      </main>
      <footer className="border-t border-primary/20 py-8 bg-black/50">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="flex items-center gap-2 font-display text-xl font-bold tracking-wider text-primary">
                <img src="/favicon.png" className="h-6 w-6 rounded-sm" alt="Logo" />
                <span className="text-glow">TWH_OSINT</span>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Advanced Intelligence Systems</p>
            </div>
            <div className="flex gap-8">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Legal</span>
                <Link href="/privacy" className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors uppercase">Privacy Policy</Link>
                <Link href="/terms" className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors uppercase">Terms of Service</Link>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">System</span>
                <Link href="/updates" className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors uppercase">Updates & News</Link>
                <span className="text-xs font-mono text-muted-foreground uppercase">Status: Online</span>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-primary/10 text-center">
            <p className="text-[10px] font-mono text-primary/20 uppercase tracking-widest">
              &copy; 2026 TWH OSINT INTELLIGENCE SYSTEMS. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
