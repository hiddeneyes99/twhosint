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
          className={`relative p-0 overflow-hidden ${styles.border} bg-black/90 backdrop-blur-xl ${styles.glow} transition-all duration-500 cursor-pointer`}
          onClick={() => !isExpanded && setIsExpanded(true)}
        >
          {/* Header / Notification Mode */}
          <div className={`p-3 ${styles.headerBg} flex items-center justify-between gap-2`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${styles.headerBg}`}>
                <Megaphone className={`w-4 h-4 ${styles.iconColor} ${!isExpanded ? 'animate-bounce' : ''}`} />
              </div>
              <div className="flex flex-col">
                <span className={`text-[10px] font-mono font-bold ${styles.text} uppercase tracking-widest leading-none`}>
                  {styles.label}
                </span>
                {!isExpanded && (
                  <span className="text-xs font-bold text-white uppercase mt-1 line-clamp-1">
                    {broadcast.title}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Expanded Content */}
          <motion.div
            initial={false}
            animate={{ 
              height: isExpanded ? "auto" : 0,
              opacity: isExpanded ? 1 : 0
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {broadcast.mediaUrl && (
              <div className={`relative aspect-video w-full bg-black/50 overflow-hidden border-b ${styles.border}`}>
                {broadcast.mediaType === "video" ? (
                  <video
                    src={broadcast.mediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : broadcast.mediaType === "youtube" ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${broadcast.mediaUrl.split("v=")[1] || broadcast.mediaUrl.split("/").pop()}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <img
                    src={broadcast.mediaUrl}
                    alt="Broadcast media"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            )}

            <div className="p-4 space-y-4">
              <div>
                <h3 className={`text-xl font-black ${styles.text} leading-none uppercase tracking-tighter mb-2`}>
                  {broadcast.title}
                </h3>
                <div 
                  className="text-sm text-white/80 font-mono leading-relaxed prose prose-invert prose-sm max-w-none
                    [&_a]:text-primary [&_a]:underline [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-4"
                  dangerouslySetInnerHTML={{ __html: broadcast.message }}
                />
              </div>

              <div className="flex gap-2">
                {broadcast.actionLink && (
                  <a
                    href={broadcast.actionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <CyberButton 
                      variant={broadcast.type.toUpperCase() === "WARNING" ? "danger" : "primary"} 
                      className={`w-full h-10 text-xs font-bold tracking-widest ${broadcast.type.toUpperCase() === "PROMO" ? "bg-yellow-500/20 border-yellow-500 text-yellow-500 hover:bg-yellow-500/40" : ""}`}
                    >
                      {broadcast.buttonText || "LEARN MORE"} <ExternalLink className="ml-2 w-3 h-3" />
                    </CyberButton>
                  </a>
                )}
                <CyberButton 
                  variant="outline" 
                  className="h-10 px-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                >
                  MINIMIZE
                </CyberButton>
              </div>
            </div>
          </motion.div>
        </CyberCard>
      </motion.div>
    </AnimatePresence>
  );
}