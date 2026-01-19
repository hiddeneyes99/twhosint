import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: "primary" | "danger" | "outline";
}

export function CyberButton({ 
  className, 
  children, 
  isLoading, 
  variant = "primary", 
  disabled,
  ...props 
}: CyberButtonProps) {
  const baseStyles = "relative overflow-hidden font-display uppercase tracking-widest transition-all duration-200 border-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none";
  
  const variants = {
    primary: "bg-primary/10 border-primary text-primary hover:bg-primary hover:text-black hover:shadow-[0_0_20px_rgba(34,197,94,0.6)]",
    danger: "bg-destructive/10 border-destructive text-destructive hover:bg-destructive hover:text-white hover:shadow-[0_0_20px_rgba(255,0,0,0.6)]",
    outline: "bg-transparent border-primary/50 text-primary/70 hover:border-primary hover:text-primary"
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        "px-2 py-1.5 xs:px-3 xs:py-2 md:px-6 md:py-3",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </div>
      
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-current opacity-50" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-50" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-50" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-current opacity-50" />
    </button>
  );
}
