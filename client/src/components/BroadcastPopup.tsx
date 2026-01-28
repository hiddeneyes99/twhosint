import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X, ExternalLink, Megaphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CyberButton } from "./CyberButton";
import { CyberCard } from "./CyberCard";
import type { BroadcastMessage } from "@shared/schema";

export function BroadcastPopup() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: broadcast } = useQuery<BroadcastMessage>({
    queryKey: ["/api/broadcast/active"],
    refetchInterval: 30000, // Check every 30s
  });

  useEffect(() => {
    if (broadcast) {
      const dismissedId = localStorage.getItem("dismissed_broadcast_id");
      if (dismissedId !== String(broadcast.id)) {
        setIsOpen(true);
        setIsExpanded(false); // Reset to notification mode
      }
    } else {
      setIsOpen(false);
    }
  }, [broadcast]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (broadcast) {
      localStorage.setItem("dismissed_broadcast_id", String(broadcast.id));
    }
    setIsOpen(false);
  };

  const getTypeStyles = (type: string) => {
    switch (type.toUpperCase()) {
      case "WARNING":
        return {
          border: "border-red-500/50",
          headerBg: "bg-red-500/20",
          text: "text-red-500",
          glow: "shadow-[0_0_15px_rgba(239,68,68,0.3)]",
          label: "Critical Warning",
          iconColor: "text-red-500"
        };
      case "PROMO":
        return {
          border: "border-yellow-500/50",
          headerBg: "bg-yellow-500/20",
          text: "text-yellow-500",
          glow: "shadow-[0_0_15px_rgba(234,179,8,0.3)]",
          label: "Special Promotion",
          iconColor: "text-yellow-500"
        };
      case "INFO":
      default:
        return {
          border: "border-primary/50",
          headerBg: "bg-primary/20",
          text: "text-primary",
          glow: "shadow-[0_0_15px_rgba(0,255,0,0.3)]",
          label: "System Broadcast",
          iconColor: "text-primary"
        };
    }
  };

  if (!broadcast || !isOpen) return null;

  const styles = getTypeStyles(broadcast.type);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        className="fixed bottom-6 right-6 z-[60] max-w-sm w-[calc(100%-3rem)] md:w-full"
      >
        <CyberCard 
          className={`relative p-0 overflow-hidden ${styles.border} bg-black/90 backdrop-blur-xl ${styles.glow} transition-all duration-500 cursor-pointer shadow-2xl`}
          onClick={() => !isExpanded && setIsExpanded(true)}
        >
          {/* Header / Notification Mode */}
          <div className={`p-4 ${styles.headerBg} flex items-center justify-between gap-3 border-b ${styles.border}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${styles.headerBg} border ${styles.border} shadow-inner`}>
                <Megaphone className={`w-5 h-5 ${styles.iconColor} ${!isExpanded ? 'animate-pulse' : ''}`} />
              </div>
              <div className="flex flex-col">
                <span className={`text-[10px] font-black ${styles.text} uppercase tracking-[0.2em] leading-none mb-1`}>
                  {styles.label}
                </span>
                {!isExpanded && (
                  <span className="text-sm font-bold text-white uppercase line-clamp-1 tracking-tight">
                    {broadcast.title}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!isExpanded && (
                <div className={`w-2 h-2 rounded-full ${styles.iconColor} animate-ping mr-2`} />
              )}
              <button
                onClick={handleDismiss}
                className="p-2 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Expanded Content */}
          <motion.div
            initial={false}
            animate={{ 
              height: isExpanded ? "auto" : 0,
              opacity: isExpanded ? 1 : 0
            }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="overflow-hidden bg-gradient-to-b from-black/20 to-transparent"
          >
            {broadcast.mediaUrl && (
              <div className={`relative aspect-video w-full bg-black/80 overflow-hidden border-b ${styles.border} group`}>
                {broadcast.mediaType === "video" ? (
                  <video
                    src={broadcast.mediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                ) : broadcast.mediaType === "youtube" ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${broadcast.mediaUrl.split("v=")[1] || broadcast.mediaUrl.split("/").pop()}`}
                    className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <img
                    src={broadcast.mediaUrl}
                    alt="Broadcast media"
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              </div>
            )}

            <div className="p-5 space-y-5">
              <div className="space-y-3">
                <h3 className={`text-2xl font-black ${styles.text} leading-[0.9] uppercase tracking-tighter filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]`}>
                  {broadcast.title}
                </h3>
                <div 
                  className="text-sm text-white/90 font-mono leading-relaxed prose prose-invert prose-sm max-w-none
                    [&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/30 hover:[&_a]:decoration-primary [&_a]:transition-all
                    [&_strong]:text-white [&_strong]:font-black
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
                    [&_p]:mb-3 last:[&_p]:mb-0"
                  dangerouslySetInnerHTML={{ __html: broadcast.message }}
                />
              </div>

              <div className="flex gap-3 pt-2">
                {broadcast.actionLink && (
                  <a
                    href={broadcast.actionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-[2]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <CyberButton 
                      variant={broadcast.type.toUpperCase() === "WARNING" ? "danger" : "primary"} 
                      className={`w-full h-11 text-[11px] font-black tracking-[0.15em] shadow-lg active:scale-[0.98] transition-transform
                        ${broadcast.type.toUpperCase() === "PROMO" ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/40" : ""}`}
                    >
                      {broadcast.buttonText || "ACCESS_DATA"} <ExternalLink className="ml-2 w-3.5 h-3.5 opacity-70" />
                    </CyberButton>
                  </a>
                )}
                <CyberButton 
                  variant="outline" 
                  className="h-11 px-5 text-[10px] font-bold tracking-widest border-white/10 hover:border-white/30 active:scale-[0.98] transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                >
                  COLLAPSE
                </CyberButton>
              </div>
            </div>
          </motion.div>
        </CyberCard>
      </motion.div>
    </AnimatePresence>
  );
}