import * as React from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Globe } from "lucide-react";

interface TerminalOutputProps {
  data: any;
  title?: string;
  className?: string;
  isLoading?: boolean;
}

export function TerminalOutput({ data, title = "OUTPUT STREAM", className, isLoading }: TerminalOutputProps) {
  return (
    <div className={cn("border border-primary/50 bg-black/90 font-mono text-[10px] md:text-sm relative overflow-hidden", className)}>
      <div className="flex items-center justify-between px-2 py-1.5 md:px-4 md:py-2 border-b border-primary/30 bg-primary/5">
        <div className="flex items-center gap-2">
          <span className="text-primary/70 uppercase text-[9px] md:text-xs tracking-widest truncate max-w-[120px] md:max-w-none">{title}</span>
        </div>
        <div className="flex gap-1 md:gap-1.5">
          <div className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full bg-red-500/50" />
          <div className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full bg-yellow-500/50" />
          <div className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full bg-green-500/50" />
        </div>
      </div>
      
      <ScrollArea className="h-[250px] md:h-[300px] w-full p-2 md:p-4">
        {isLoading ? (
          <div className="space-y-2">
            <p className="text-primary animate-pulse">{'>'} INITIALIZING TRACE...</p>
            <p className="text-primary/70 animate-pulse delay-75">{'>'} ESTABLISHING CONNECTION...</p>
            <p className="text-primary/50 animate-pulse delay-150">{'>'} DECRYPTING DATA PACKETS...</p>
          </div>
        ) : data ? (
          <div className="space-y-1">
            <p className="text-primary mb-4">{'>'} PROCESS COMPLETE. DATA RETRIEVED:</p>
            {Object.entries(data).map(([key, value]) => {
              if (key === 'credit' || key === 'API DEVELOPER' || key === 'api_developer') return null;
              
              if (key === 'details' && typeof value === 'object' && value !== null) {
                // Check for latitude and longitude in details
                const typedValue = value as Record<string, any>;
                const lat = typedValue.latitude || typedValue.lat;
                const lon = typedValue.longitude || typedValue.lon || typedValue.lng;
                
                return (
                  <div key={key}>
                    {Object.entries(typedValue).map(([dKey, dValue]) => (
                      <div key={dKey} className="grid grid-cols-[140px_1fr] gap-4 hover:bg-primary/5 p-1">
                        <span className="text-primary/60 uppercase">{dKey.replace(/_/g, ' ')}:</span>
                        <span className="text-primary">{String(dValue)}</span>
                      </div>
                    ))}
                    {lat && lon && (
                      <div className="grid grid-cols-[140px_1fr] gap-4 hover:bg-primary/5 p-1 border-t border-primary/20 mt-2 pt-2">
                        <span className="text-primary/60 uppercase">LOCATION MAP:</span>
                        <a 
                          href={`https://www.google.com/maps?q=${lat},${lon}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary underline hover:text-primary/80 flex items-center gap-2"
                        >
                          OPEN IN GOOGLE MAPS
                          <Globe className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              }

              // Also check for top-level lat/lon (often found in IP API responses)
              const lat = data.latitude || data.lat;
              const lon = data.longitude || data.lon;
    const isLocationField = key.toLowerCase().includes('lat') || key.toLowerCase().includes('lon');

    // Special formatting for Mobile Info results
    const isMobileResult = (data.query?.type === 'mobile_lookup' || data.source?.type === 'mobile') && key === 'result' && Array.isArray(value);
    
    if (isMobileResult) {
      return (
        <div key={key} className="space-y-4 font-mono text-sm">
          {value.map((item: any, index: number) => (
            <div key={index} className="space-y-3 bg-primary/5 p-4 border border-primary/20 shadow-[0_0_15px_rgba(0,255,0,0.05)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
              <div className="flex justify-between items-center mb-3 border-b border-primary/20 pb-2">
                <span className="text-primary font-bold tracking-tighter">DATA RECORD #{index + 1}</span>
                <span className="text-[10px] text-primary/40">ID: {item.id}</span>
              </div>
              <div className="grid grid-cols-[85px_1fr] gap-x-3 gap-y-2">
                <span className="text-primary/40 text-[10px] uppercase self-center">NAME</span>
                <span className="text-primary font-bold uppercase tracking-wide">{item.name || "N/A"}</span>
                
                <span className="text-primary/40 text-[10px] uppercase self-center">FATHER</span>
                <span className="text-primary uppercase text-sm">{item.father_name || "N/A"}</span>
                
                <div className="col-span-2 my-1 border-t border-primary/10" />

                <span className="text-primary/40 text-[10px] uppercase self-center">MOBILE</span>
                <span className="text-primary font-bold text-glow">{item.mobile || "N/A"}</span>
                
                <span className="text-primary/40 text-[10px] uppercase self-center">ALT NUM</span>
                <span className="text-primary">{item.alt_mobile || "N/A"}</span>
                
                <div className="col-span-2 my-1 border-t border-primary/10" />

                <span className="text-primary/40 text-[10px] uppercase self-center">AADHAR</span>
                <span className="text-primary tracking-widest">{item.id_number || "N/A"}</span>
                
                <span className="text-primary/40 text-[10px] uppercase self-center">CIRCLE</span>
                <span className="text-primary uppercase text-xs">{item.circle?.replace(/&amp;/g, '&') || "N/A"}</span>
                
                <div className="col-span-2 my-1 border-t border-primary/10" />

                <span className="text-primary/40 text-[10px] uppercase pt-0.5">ADDRESS</span>
                <div className="space-y-1">
                  <span className="text-primary text-xs leading-relaxed block">{item.address?.replace(/!/g, ' ') || "N/A"}</span>
                  {item.address && (
                    <a 
                      href={`https://www.google.com/maps?q=${encodeURIComponent(item.address.replace(/!/g, ' '))}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary text-[10px] underline hover:text-primary/80 flex items-center gap-1 mt-1 font-bold"
                    >
                      OPEN IN GOOGLE MAPS
                      <Globe className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
                
                {item.email && (
                  <>
                    <div className="col-span-2 my-1 border-t border-primary/10" />
                    <span className="text-primary/40 text-[10px] uppercase self-center">EMAIL</span>
                    <span className="text-primary text-xs truncate">{item.email}</span>
                  </>
                )}
              </div>
            </div>
          ))}
          <div className="text-center pt-2 text-primary/40 font-bold animate-pulse text-[10px] uppercase tracking-[0.3em]">
            SYSTEM TRACE COMPLETE
          </div>
        </div>
      );
    }
    
    // Hide metadata fields if specialized view is active
    const isMetadata = key === 'query' || key === 'success' || key === 'status_code' || key === 'result_count' || key === 'timestamp' || key === 'credit' || key === 'dev' || key === 'source' || key === 'usage';
    if ((data.query?.type === 'mobile_lookup' || data.source?.type === 'mobile') && isMetadata) {
      return null;
    }

    // Ensure value is safe to display
    const displayValue = typeof value === 'object' && value !== null 
      ? JSON.stringify(value) 
      : String(value ?? "N/A");

    return (
      <div key={key} className="grid grid-cols-[140px_1fr] gap-4 hover:bg-primary/5 p-1">
        <span className="text-primary/60 uppercase">{key.replace(/_/g, ' ')}:</span>
        <span className="text-primary">
          {displayValue}
        </span>
                  {isLocationField && lat && lon && key.toLowerCase().includes('lon') && (
                     <div className="col-start-2 mt-1">
                        <a 
                          href={`https://www.google.com/maps?q=${lat},${lon}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary text-xs underline hover:text-primary/80 flex items-center gap-1"
                        >
                          VIEW ON MAP
                          <Globe className="w-3 h-3" />
                        </a>
                     </div>
                  )}
                </div>
              );
            })}
            <p className="text-primary mt-4 animate-pulse">_</p>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-primary/30">
            <p className="uppercase tracking-widest">AWAITING INPUT</p>
            <p className="text-xs mt-2 opacity-50">System Ready.</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
