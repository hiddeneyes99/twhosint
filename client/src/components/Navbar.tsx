import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { CyberButton } from "@/components/CyberButton";
import { Terminal, Shield, LogOut, User, CreditCard, Lock } from "lucide-react";
import { useState } from "react";
import { AuthModal } from "./AuthModal";

export function Navbar() {
  const { user, isLoading, logout, isLoggingOut } = useAuth();
  const [location] = useLocation();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-display text-lg md:text-xl font-bold tracking-wider text-primary hover:text-primary/80 transition-colors shrink-0">
            <img src="/favicon.png" className="h-5 w-5 md:h-6 md:w-6 rounded-sm" alt="Logo" />
            <span className="text-glow">TWH_OSINT</span>
          </Link>
        </div>

        <nav className="flex items-center gap-1 md:gap-4 shrink-0">
          {isLoading ? (
            <div className="flex items-center gap-2 font-mono text-[9px] md:text-xs text-primary/60 animate-pulse">
              SYNCING...
            </div>
          ) : user ? (
            <>
              <div className="flex items-center gap-2 md:gap-4 mr-1 md:mr-4 border-r border-primary/20 pr-1 md:pr-4">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] md:text-[10px] text-primary/60 font-mono text-glow">USER</span>
                  <span className="font-mono text-[8px] md:text-xs text-primary truncate max-w-[50px] md:max-w-none">{user.username}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[8px] md:text-[10px] text-primary/60 font-mono text-glow">CREDITS</span>
                  <span className="font-mono text-[8px] md:text-xs font-bold text-primary text-glow">{user.credits}</span>
                </div>
              </div>

              <CyberButton 
                variant="primary" 
                className="hidden md:flex text-sm px-4 py-2 h-auto animate-pulse shadow-[0_0_15px_rgba(0,255,0,0.4)] border-primary bg-primary/20"
                onClick={() => (window as any).openRedeemModal?.()}
                data-testid="button-buy-credits-nav"
              >
                <CreditCard className="mr-1 h-4 w-4" />
                <span>BUY CREDITS</span>
              </CyberButton>
              
              <Link href="/dashboard">
                <CyberButton variant={location === "/dashboard" ? "primary" : "outline"} className="text-[9px] md:text-sm px-2 md:px-4 py-1.5 md:py-2 h-auto">
                  <Shield className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden xs:inline">TOOLS</span>
                </CyberButton>
              </Link>
              
              <Link href="/privacy">
                <CyberButton variant={location === "/privacy" ? "primary" : "ghost"} className="text-[9px] md:text-sm px-2 md:px-4 py-1.5 md:py-2 h-auto hidden md:flex">
                  <Lock className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                  <span className="hidden xs:inline">PRIVACY</span>
                </CyberButton>
              </Link>

              <CyberButton 
                variant="danger" 
                className="text-[9px] md:text-sm px-2 md:px-4 py-1.5 md:py-2 h-auto"
                onClick={() => logout()}
                isLoading={isLoggingOut}
              >
                <LogOut className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden xs:inline">LOGOUT</span>
              </CyberButton>
            </>
          ) : (
            <div className="flex gap-2">
              <Link href="/privacy" className="hidden md:block">
                <CyberButton variant="ghost" className="text-[10px] uppercase">Privacy</CyberButton>
              </Link>
              <Link href="/terms" className="hidden md:block">
                <CyberButton variant="ghost" className="text-[10px] uppercase">Terms</CyberButton>
              </Link>
              <CyberButton variant="primary" className="text-[10px] md:text-sm px-3 md:px-6 py-2 h-auto" onClick={() => setIsAuthModalOpen(true)}>
                <User className="mr-1 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden xs:inline">ACCESS</span>
                <span className="xs:hidden">LOGIN</span>
              </CyberButton>
            </div>
          )}
        </nav>
      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}
