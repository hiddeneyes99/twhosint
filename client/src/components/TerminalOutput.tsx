import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Globe, 
  ShieldCheck, 
  Terminal, 
  Radio, 
  Phone, 
  User, 
  UserCircle, 
  MapPin, 
  Navigation, 
  CreditCard, 
  Mail, 
  Lock,
  ArrowDownCircle,
  Activity,
  Cpu,
  Fingerprint
} from "lucide-react";

interface TerminalOutputProps {
  data: any;
  title?: string;
  className?: string;
  isLoading?: boolean;
}

export function TerminalOutput({ data, title = "OUTPUT STREAM", className, isLoading }: TerminalOutputProps) {
  // Helper to clean address data
  const cleanAddress = (addr: string) => addr?.replace(/!/g, ' ') || "N/A";

  // Specialized mobile result identification
  const getRecords = () => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.result && Array.isArray(data.result)) return data.result;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.records && Array.isArray(data.records)) return data.records;
    
    // If it's a single object that looks like a record
    const mobileFieldIndicators = ['name', 'mobile', 'address', 'father_name', 'id_number', 'circle'];
    const matchCount = mobileFieldIndicators.filter(field => field in data).length;
    if (matchCount >= 2) return [data];
    
    return [];
  };

  const records = getRecords();

  if (isLoading) {
    return (
      <div className={cn("border border-primary/50 bg-black font-mono text-sm relative overflow-hidden min-h-[400px]", className)}>
        <div className="flex items-center justify-between px-4 py-2 border-b border-primary/30 bg-primary/5">
          <div className="flex items-center gap-2">
            <span className="text-primary animate-pulse">🔒 TWH-SECURE INTELLIGENCE TERMINAL [v4.0]</span>
          </div>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse delay-75" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse delay-150" />
          </div>
        </div>
        <div className="p-8 space-y-4">
          <p className="text-primary animate-pulse">{"[ > ]"} INITIALIZING SECURE TRACE...</p>
          <p className="text-primary/70 animate-pulse delay-100">{"[ > ]"} ESTABLISHING MULTI-NODE CONNECTION...</p>
          <p className="text-primary/40 animate-pulse delay-200">{"[ > ]"} DECRYPTING PACKET STREAM (AES-256)...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cn("border border-primary/50 bg-black font-mono text-sm relative overflow-hidden h-[300px] flex flex-col items-center justify-center", className)}>
        <Terminal className="w-8 h-8 text-primary/20 mb-4" />
        <p className="text-primary/30 uppercase tracking-[0.3em]">AWAITING INPUT</p>
        <div className="mt-4 flex gap-2">
          <div className="h-1 w-8 bg-primary/10" />
          <div className="h-1 w-8 bg-primary/20" />
          <div className="h-1 w-8 bg-primary/10" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border border-primary/50 bg-black font-mono text-[10px] md:text-sm relative overflow-hidden", className)}>
      {/* Header Section */}
      <div className="px-4 py-3 border-b border-primary/30 bg-zinc-950/50 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-primary font-black uppercase tracking-tighter text-sm md:text-base">🔒 TWH-SECURE INTELLIGENCE TERMINAL [v4.0]</span>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/30 rounded text-red-500 text-[9px] font-black animate-pulse">
            <Activity className="w-3 h-3" />
            LIVE FEED: ENCRYPTED
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 border border-primary/30 rounded text-primary text-[9px] font-black">
            <ShieldCheck className="w-3 h-3" />
            ACTIVE TRACKING
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-900 border border-white/10 rounded text-white/40 text-[9px] font-black">
            <Cpu className="w-3 h-3" />
            SERVER: KOL-JIO-5G-SECURE
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded">
          <Terminal className="w-4 h-4 text-primary/50" />
          <span className="text-primary/40 uppercase text-[10px]">TARGET_QUERY:</span>
          <span className="text-primary font-bold tracking-widest">{data.query?.value || "REDACTED"}</span>
        </div>
      </div>

      <ScrollArea className="h-[450px] md:h-[550px] w-full">
        <div className="p-4 md:p-6 space-y-6">
          {records.map((item: any, index: number) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <div className="flex flex-col items-center py-2 gap-1">
                  <ArrowDownCircle className="w-5 h-5 text-primary animate-bounce" />
                  <span className="text-[9px] font-black text-primary/40 tracking-[0.2em]">⬇️ LINKED CONNECTION DETECTED</span>
                </div>
              )}
              
              <div className="relative group">
                {/* Decorative corners */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary/50" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary/50" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary/50" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary/50" />

                <div className="bg-zinc-950/80 border border-primary/20 p-5 space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="w-5 h-5 text-primary" />
                      <span className="text-primary font-black uppercase tracking-widest">RECORD_FRAGMENT #{index + 1}</span>
                    </div>
                    <span className="text-[10px] text-primary/30 font-mono">HASH: {Math.random().toString(36).substring(7).toUpperCase()}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {/* Fixed Data Fields */}
                    <DataField icon={Phone} label="MOBILE" value={item.mobile} highlight />
                    <DataField icon={User} label="NAME" value={item.name} />
                    <DataField icon={UserCircle} label="FATHER'S NAME" value={item.father_name} />
                    <DataField icon={Navigation} label="CIRCLE / STATE" value={item.circle} />
                    <DataField icon={CreditCard} label="AADHAR / ID" value={item.id_number} isLockable />
                    <DataField icon={Mail} label="EMAIL" value={item.email} />
                    <DataField icon={Phone} label="ALT CONTACT" value={item.alt_mobile} />
                    <div className="md:col-span-2">
                      <DataField icon={MapPin} label="ADDRESS" value={cleanAddress(item.address)} isAddress />
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}

          {/* System Metadata Footer */}
          <div className="mt-8 p-4 bg-zinc-950/80 border border-primary/10 rounded-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-1">
              <Radio className="w-3 h-3 text-primary/20 animate-pulse" />
            </div>
            <h4 className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
              <Terminal className="w-3 h-3" /> SYSTEM METADATA
            </h4>
            <div className="space-y-1.5 font-mono text-[9px] md:text-[10px]">
              <p className="text-primary/40 leading-none"> {">"} Packet intercepted from TwhOsnit secure gateway.</p>
              <p className="text-primary/40 leading-none"> {">"} Data parsing complete. 2048-bit decryption verified.</p>
              <div className="flex gap-4 pt-1">
                <p className="text-primary/40"> {">"} LATENCY: <span className="text-primary/70">0.9s</span></p>
                <p className="text-primary/40"> {">"} CONFIDENCE SCORE: <span className="text-green-500/70">98.9%</span></p>
              </div>
            </div>
          </div>

          <div className="text-center py-4 space-y-2">
            <p className="text-[10px] font-black text-primary/20 uppercase tracking-[0.5em] animate-pulse">SYSTEM TRACE SECURED</p>
            <p className="text-primary/60 font-black text-xs tracking-widest mt-2">
              💝 Made with ♡ by Technical White Hat 💝
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function DataField({ 
  icon: Icon, 
  label, 
  value, 
  highlight = false, 
  isLockable = false,
  isAddress = false
}: { 
  icon: any, 
  label: string, 
  value?: string | number, 
  highlight?: boolean,
  isLockable?: boolean,
  isAddress?: boolean
}) {
  const displayValue = value ? String(value) : "N/A";
  const isEmpty = !value || displayValue === "N/A" || displayValue === "---";

  return (
    <div className={cn(
      "flex flex-col gap-1.5 p-2 rounded transition-colors border border-transparent hover:border-primary/10 hover:bg-primary/5",
      isAddress && "md:flex-row md:items-start md:gap-4"
    )}>
      <div className="flex items-center gap-2 min-w-[120px]">
        <Icon className={cn("w-3.5 h-3.5", isEmpty ? "text-primary/20" : "text-primary/50")} />
        <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-center gap-2 flex-1">
        {isEmpty && isLockable && <Lock className="w-3 h-3 text-red-500/40" />}
        <span className={cn(
          "font-mono text-xs md:text-sm tracking-tight break-all",
          highlight ? "text-primary font-black text-glow" : "text-white/80",
          isEmpty && "text-white/20 italic"
        )}>
          {displayValue}
        </span>
      </div>
      {isAddress && value && (
        <a 
          href={`https://www.google.com/maps?q=${encodeURIComponent(String(value))}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="md:self-center p-1.5 rounded hover:bg-primary/20 transition-colors"
        >
          <Globe className="w-4 h-4 text-primary" />
        </a>
      )}
    </div>
  );
}
