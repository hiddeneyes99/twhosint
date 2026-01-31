import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Globe, 
  Terminal, 
  ArrowDownCircle,
  ChevronRight
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
      <div className={cn("border-4 border-double border-primary/50 bg-black font-mono text-sm relative overflow-hidden min-h-[400px]", className)}>
        <div className="flex items-center justify-between px-4 py-2 border-b-4 border-double border-primary/30 bg-primary/5">
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
      <div className={cn("border-4 border-double border-primary/50 bg-black font-mono text-sm relative overflow-hidden h-[300px] flex flex-col items-center justify-center", className)}>
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
    <div className={cn("border-4 border-double border-primary/50 bg-black font-mono text-[10px] md:text-sm relative overflow-hidden", className)}>
      {/* ASCII Header Section */}
      <div className="bg-zinc-950">
        <div className="px-4 py-2 border-b-4 border-double border-primary/30 flex items-center justify-between">
          <span className="text-primary font-black uppercase tracking-tight text-xs md:text-sm">🔒 TWH-SECURE INTELLIGENCE TERMINAL [v4.0]</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <span className="text-red-500 text-[10px] font-black uppercase tracking-tighter">LIVE FEED: ENCRYPTED</span>
          </div>
        </div>
        
        <div className="px-4 py-3 space-y-1 border-b-4 border-double border-primary/30">
          <div className="flex items-center gap-4">
            <span className="text-primary/60 font-black min-w-[120px]">🕵️‍♂️ TARGET REPORT:</span>
            <span className="text-primary font-black tracking-widest uppercase">TARGET {data.query?.value || "REDACTED"}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-primary/60 font-black min-w-[120px]">🟢 STATUS        :</span>
            <span className="text-primary font-black flex items-center gap-1">✅ ACTIVE TRACKING</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-primary/60 font-black min-w-[120px]">👮 SERVER NODE   :</span>
            <span className="text-primary font-black">KOL-JIO-5G-SECURE</span>
          </div>
        </div>
      </div>

      <div className="bg-primary/10 border-b-2 border-primary/30 px-4 py-2 flex items-center">
        <span className="text-primary font-black uppercase tracking-widest text-[11px]">📊 DATA ANALYSIS REPORT ({records.length} Records Found)</span>
      </div>

      <ScrollArea className="h-[550px] md:h-[650px] w-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] overflow-x-hidden">
        <div className="p-3 md:p-8 space-y-8 md:space-y-12">
          {records.length > 0 ? records.map((item: any, index: number) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <div className="w-full border-t border-primary/10 border-dashed my-4" />
              )}
              
              <div className="space-y-4 md:space-y-6">
                <div className="border-y border-primary/20 bg-primary/5 py-1.5 px-3 md:px-4 flex items-center justify-between">
                  <span className="text-primary font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-[10px] md:text-xs flex items-center gap-2">
                    📂 RECORD #{String(index + 1).padStart(2, '0')} - {index === 0 ? "DIRECT MATCH" : "ASSOCIATED ENTITY"}
                  </span>
                  <span className="text-[8px] md:text-[9px] text-primary/30 font-mono">UID: {item.id || "N/A"}</span>
                </div>

                <div className="grid grid-cols-1 gap-y-3 md:gap-y-4 pl-3 md:pl-4 border-l-2 md:border-l-4 border-double border-primary/20 py-1 md:py-2">
                  <ReportLine icon="📱" label="Mobile" value={item.mobile} highlight />
                  <ReportLine icon="👤" label="NAME" value={item.name} />
                  <ReportLine icon="👨‍🦳" label="FATHER" value={item.father_name} />
                  <ReportLine icon="📍" label="Address" value={cleanAddress(item.address)} isAddress />
                  <ReportLine icon="📞" label="ALT CONTACT" value={item.alt_mobile} />
                  <ReportLine icon="🇮🇳" label="Country" value="India" />
                  <ReportLine icon="📡" label="Circle" value={item.circle} />
                  <ReportLine icon="🗺️" label="State" value={item.state} />
                  <ReportLine icon="🆔" label="Aadhar" value={item.id_number} />
                  <ReportLine icon="✉️" label="Email" value={item.email} />
                </div>
                
                <div className="h-px bg-primary/10 w-full" />
              </div>
            </React.Fragment>
          )) : (
            <div className="py-20 text-center space-y-4">
              <div className="text-red-500/40 text-4xl animate-pulse">⚠️</div>
              <p className="text-red-500 font-black uppercase tracking-[0.3em] text-sm">NO DIRECT DATA FRAGMENTS LOCATED</p>
              <p className="text-primary/30 font-mono text-[10px]">VERIFY TARGET_QUERY OR PERMISSIONS</p>
            </div>
          )}

          {/* System Metadata Footer */}
          <div className="mt-12 border-4 border-double border-primary/30 bg-zinc-950 p-5 space-y-1 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
            <h4 className="text-primary font-black uppercase tracking-[0.3em] text-[12px] mb-4 flex items-center gap-2 border-b border-primary/20 pb-2">
              <span className="text-lg">📟</span> SYSTEM METADATA
            </h4>
            <div className="space-y-1.5 font-mono text-[10px] md:text-[11px]">
              <MetadataLine text="Packet intercepted from TwhOsnit secure gateway." />
              <MetadataLine text="Data parsing complete. 2048-bit decryption verified." />
              <div className="flex flex-wrap gap-x-8">
                <MetadataLine text={`LATENCY: 0.${Math.floor(Math.random() * 900) + 100}s`} />
                <MetadataLine text="CONFIDENCE SCORE: 98.9%" />
              </div>
              <MetadataLine text={`Parsing address cluster... Match found (${records.length})`} />
              <MetadataLine text="RENDERING OUTPUT..." highlight />
            </div>
          </div>

          <div className="text-center pt-12 pb-6">
            <p className="text-primary/80 font-black text-sm md:text-base tracking-[0.2em] uppercase filter drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">
              💝 Made with ♡ by Technical White Hat 💝
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function ReportLine({ icon, label, value, highlight = false, isAddress = false }: { icon: string, label: string, value?: any, highlight?: boolean, isAddress?: boolean }) {
  const displayValue = value ? String(value) : "N/A";
  const isEmpty = !value || displayValue === "N/A" || displayValue === "---";

  return (
    <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-4 group">
      <div className="flex items-center gap-3 min-w-[120px] md:min-w-[160px]">
        <span className="text-xl transition-all flex-shrink-0">{icon}</span>
        <span className="text-primary font-black uppercase tracking-tight text-xs md:text-base whitespace-nowrap">
          {label}:
        </span>
      </div>
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <span className={cn(
          "font-mono text-xs md:text-base tracking-wide leading-tight break-words",
          highlight ? "text-primary font-black bg-primary/20 px-2 rounded-sm border border-primary/30" : "text-white/90",
          isEmpty && "text-white/20 italic"
        )}>
          {displayValue}
        </span>
        {isAddress && value && !isEmpty && (
          <a 
            href={`https://www.google.com/maps?q=${encodeURIComponent(String(value))}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary/40 hover:text-primary transition-colors p-1 bg-primary/5 rounded flex-shrink-0"
          >
            <Globe className="w-4 h-4 md:w-5 md:h-5" />
          </a>
        )}
      </div>
    </div>
  );
}

function MetadataLine({ text, highlight = false }: { text: string, highlight?: boolean }) {
  const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
  return (
    <p className={cn(
      "text-primary/50 leading-tight flex items-center gap-2 font-mono",
      highlight && "text-primary font-black animate-pulse bg-primary/10 w-fit px-1"
    )}>
      <span className="opacity-30">[{time}]</span>
      <ChevronRight className="w-3 h-3 opacity-30" />
      <span className="tracking-wide">{">"} {text}</span>
    </p>
  );
}
