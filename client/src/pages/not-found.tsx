import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";
import { CyberButton } from "@/components/CyberButton";
import { CyberCard } from "@/components/CyberCard";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="scanline" />
      <CyberCard className="max-w-md w-full text-center py-12 border-destructive/50">
        <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-6 animate-pulse" />
        <h1 className="text-4xl font-bold text-destructive mb-2 font-display">404 ERROR</h1>
        <p className="text-muted-foreground mb-8 font-mono">
          RESOURCE NOT FOUND OR ACCESS RESTRICTED.<br/>
          THE REQUESTED PATH DOES NOT EXIST IN THIS REALITY.
        </p>
        <Link href="/">
          <CyberButton variant="outline" className="w-full">
            RETURN TO BASE
          </CyberButton>
        </Link>
      </CyberCard>
    </div>
  );
}
