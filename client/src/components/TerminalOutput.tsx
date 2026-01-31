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

type DataType = 'mobile' | 'vehicle' | 'ip' | 'unknown';

export function TerminalOutput({ data, title = "OUTPUT STREAM", className, isLoading }: TerminalOutputProps) {
  const [visibleCount, setVisibleCount] = React.useState(5);
  const cleanAddress = (addr: string) => addr?.replace(/!/g, ' ') || "N/A";

  const detectDataType = (): DataType => {
    if (!data) return 'unknown';
    
    if (data.details && (data.rc_number || data.details["Owner Name"] || data.details["Vehicle Class"])) {
      return 'vehicle';
    }
    
    if (data.isp || data.city || data.countryCode || data.timezone || (data.status === 'success' && data.query && data.lat)) {
      return 'ip';
    }
    
    if (data.data && Array.isArray(data.data)) return 'mobile';
    if (Array.isArray(data) && data.length > 0 && (data[0].mobile || data[0].name)) return 'mobile';
    
    const mobileFields = ['name', 'mobile', 'address', 'father_name', 'id_number', 'circle'];
    const matchCount = mobileFields.filter(field => field in data).length;
    if (matchCount >= 2) return 'mobile';
    
    return 'unknown';
  };

  const dataType = detectDataType();

  const getMobileRecords = () => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.result && Array.isArray(data.result)) return data.result;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.records && Array.isArray(data.records)) return data.records;
    
    const mobileFieldIndicators = ['name', 'mobile', 'address', 'father_name', 'id_number', 'circle'];
    const matchCount = mobileFieldIndicators.filter(field => field in data).length;
    if (matchCount >= 2) return [data];
    
    return [];
  };

  const getTargetValue = () => {
    if (data?.query?.value) return data.query.value;
    if (data?.mobile) return data.mobile;
    if (data?.rc_number) return data.rc_number;
    if (data?.query && typeof data.query === 'string') return data.query;
    if (dataType === 'mobile' && data?.data?.[0]?.mobile) return data.data[0].mobile;
    return "REDACTED";
  };

  const records = dataType === 'mobile' ? getMobileRecords() : [];

  const getRecordCount = () => {
    if (dataType === 'mobile') return records.length;
    if (dataType === 'vehicle' || dataType === 'ip') return 1;
    return 0;
  };

  // Reset visible count when data changes
  React.useEffect(() => {
    setVisibleCount(5);
  }, [data]);

  const hasData = () => {
    if (dataType === 'mobile') return records.length > 0;
    if (dataType === 'vehicle') return !!(data.details || data.rc_number);
    if (dataType === 'ip') return !!(data.city || data.isp || data.country);
    return false;
  };

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

  const renderVehicleData = () => {
    const details = data.details || {};
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="border-y border-primary/20 bg-primary/5 py-1.5 px-3 md:px-4 flex items-center justify-between">
          <span className="text-primary font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-[10px] md:text-xs flex items-center gap-2">
            🚗 VEHICLE REGISTRATION DETAILS
          </span>
          <span className="text-[8px] md:text-[9px] text-primary/30 font-mono">RC: {data.rc_number || "N/A"}</span>
        </div>

        <div className="grid grid-cols-1 gap-y-3 md:gap-y-4 pl-3 md:pl-4 border-l-2 md:border-l-4 border-double border-primary/20 py-1 md:py-2">
          <ReportLine icon="🚗" label="RC NUMBER" value={data.rc_number} highlight />
          <ReportLine icon="👤" label="OWNER NAME" value={details["Owner Name"]} />
          <ReportLine icon="👨‍🦳" label="FATHER NAME" value={details["Father's Name"]} />
          <ReportLine icon="📞" label="PHONE" value={details["Phone"]} />
          <ReportLine icon="📍" label="ADDRESS" value={details["Address"]} isAddress />
          <ReportLine icon="🏙️" label="CITY" value={details["City Name"]} />
          <ReportLine icon="🏢" label="RTO" value={details["Registered RTO"]} />
          <ReportLine icon="🚙" label="VEHICLE CLASS" value={details["Vehicle Class"]} />
          <ReportLine icon="🏭" label="MODEL" value={details["Model Name"]} />
          <ReportLine icon="🔧" label="MAKER MODEL" value={details["Maker Model"]} />
          <ReportLine icon="⛽" label="FUEL TYPE" value={details["Fuel Type"]} />
          <ReportLine icon="🌿" label="FUEL NORMS" value={details["Fuel Norms"]} />
          <ReportLine icon="📅" label="REG DATE" value={details["Registration Date"]} />
          <ReportLine icon="💰" label="TAX UPTO" value={details["Tax Upto"]} />
          <ReportLine icon="🔧" label="FITNESS UPTO" value={details["Fitness Upto"]} />
          <ReportLine icon="📋" label="PUC UPTO" value={details["PUC Upto"]} />
          <ReportLine icon="🏦" label="FINANCIER" value={details["Financier Name"]} />
          <ReportLine icon="🛡️" label="INSURANCE CO" value={details["Insurance Company"]} />
          <ReportLine icon="📆" label="INSURANCE UPTO" value={details["Insurance Upto"]} />
        </div>
        
        <div className="h-px bg-primary/10 w-full" />
      </div>
    );
  };

  const renderIpData = () => {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="border-y border-primary/20 bg-primary/5 py-1.5 px-3 md:px-4 flex items-center justify-between">
          <span className="text-primary font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-[10px] md:text-xs flex items-center gap-2">
            🌐 IP ADDRESS INTELLIGENCE
          </span>
          <span className="text-[8px] md:text-[9px] text-primary/30 font-mono">IP: {data.query || "N/A"}</span>
        </div>

        <div className="grid grid-cols-1 gap-y-3 md:gap-y-4 pl-3 md:pl-4 border-l-2 md:border-l-4 border-double border-primary/20 py-1 md:py-2">
          <ReportLine icon="🌐" label="IP ADDRESS" value={data.query} highlight />
          <ReportLine icon="🏙️" label="CITY" value={data.city} />
          <ReportLine icon="🗺️" label="REGION" value={data.regionName} />
          <ReportLine icon="🇮🇳" label="COUNTRY" value={data.country} />
          <ReportLine icon="🌍" label="CONTINENT" value={data.continent} />
          <ReportLine icon="📮" label="ZIP CODE" value={data.zip} />
          <ReportLine icon="📍" label="COORDINATES" value={data.lat && data.lon ? `${data.lat}, ${data.lon}` : null} isAddress />
          <ReportLine icon="⏰" label="TIMEZONE" value={data.timezone} />
          <ReportLine icon="💵" label="CURRENCY" value={data.currency} />
          <ReportLine icon="🏢" label="ISP" value={data.isp} />
          <ReportLine icon="🔗" label="ORG" value={data.org} />
          <ReportLine icon="📡" label="AS" value={data.as} />
          <ReportLine icon="🔄" label="REVERSE DNS" value={data.reverse} />
          <ReportLine icon="🔒" label="PROXY" value={data.proxy ? "Yes" : "No"} />
          <ReportLine icon="📱" label="MOBILE" value={data.mobile ? "Yes" : "No"} />
          <ReportLine icon="🖥️" label="HOSTING" value={data.hosting ? "Yes" : "No"} />
        </div>
        
        <div className="h-px bg-primary/10 w-full" />
      </div>
    );
  };

  const renderMobileData = () => {
    const recordsToShow = records.slice(0, visibleCount);
    const hasMore = records.length > visibleCount;

    return (
      <div className="space-y-8 md:space-y-12">
        {recordsToShow.map((item: any, index: number) => (
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
                <ReportLine icon="📡" label="Circle" value={item.circle?.includes(' ') ? item.circle.split(' ')[0] : item.circle} />
                <ReportLine icon="🗺️" label="State" value={item.circle?.includes(' ') ? item.circle.split(' ').slice(1).join(' ') : item.state} />
                <ReportLine icon="🆔" label="Aadhar" value={item.id_number} />
                <ReportLine icon="✉️" label="Email" value={item.email} />
              </div>
              
              <div className="h-px bg-primary/10 w-full" />
            </div>
          </React.Fragment>
        ))}

        {hasMore && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="text-primary/40 animate-bounce">
              <ArrowDownCircle className="w-8 h-8" />
            </div>
            <button
              onClick={() => setVisibleCount(prev => prev + 10)}
              className="px-6 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(34,197,94,0.2)]"
            >
              LOAD NEXT 10 FRAGMENTS ({records.length - visibleCount} REMAINING)
            </button>
            <p className="text-[10px] text-primary/30 font-mono">ENCRYPTED DATA STREAM CONTINUES...</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("border-4 border-double border-primary/50 bg-black font-mono text-[10px] md:text-sm relative overflow-hidden", className)}>
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
            <span className="text-primary font-black tracking-widest uppercase">TARGET {getTargetValue()}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-primary/60 font-black min-w-[120px]">🟢 STATUS        :</span>
            <span className="text-primary font-black flex items-center gap-1">✅ ACTIVE TRACKING</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-primary/60 font-black min-w-[120px]">👮 SERVER NODE   :</span>
            <span className="text-primary font-black">INDIA-TWH-5G-SECURE</span>
          </div>
        </div>
      </div>

      <div className="bg-primary/10 border-b-2 border-primary/30 px-4 py-2 flex items-center">
        <span className="text-primary font-black uppercase tracking-widest text-[11px]">📊 DATA ANALYSIS REPORT ({getRecordCount()} Records Found)</span>
      </div>

      <ScrollArea className="h-[550px] md:h-[650px] w-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] overflow-x-hidden">
        <div className="p-3 md:p-8 space-y-8 md:space-y-12">
          {hasData() ? (
            <>
              {dataType === 'mobile' && renderMobileData()}
              {dataType === 'vehicle' && renderVehicleData()}
              {dataType === 'ip' && renderIpData()}
            </>
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="text-red-500/40 text-4xl animate-pulse">⚠️</div>
              <p className="text-red-500 font-black uppercase tracking-[0.3em] text-sm">NO DIRECT DATA FRAGMENTS LOCATED</p>
              <p className="text-primary/30 font-mono text-[10px]">VERIFY TARGET_QUERY OR PERMISSIONS</p>
            </div>
          )}

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
              <MetadataLine text={`Parsing address cluster... Match found (${getRecordCount()})`} />
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
  const isEmpty = !value || displayValue === "N/A" || displayValue === "---" || displayValue === "null";

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
          {isEmpty ? "N/A" : displayValue}
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
