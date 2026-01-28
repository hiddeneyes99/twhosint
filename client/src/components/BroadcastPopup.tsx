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
  const { data: broadcast } = useQuery<BroadcastMessage>({
    queryKey: ["/api/broadcast/active"],
    refetchInterval: 30000, // Check every 30s
  });

  useEffect(() => {
    if (broadcast) {
      const dismissedId = localStorage.getItem("dismissed_broadcast_id");
      if (dismissedId !== String(broadcast.id)) {
        setIsOpen(true);
      }
    } else {
      setIsOpen(false);
    }
  }, [broadcast]);

  const handleDismiss = () => {
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
          label: "Critical Warning"
        };
      case "PROMO":
        return {
          border: "border-yellow-500/50",
          headerBg: "bg-yellow-500/20",
          text: "text-yellow-500",
          glow: "shadow-[0_0_15px_rgba(234,179,8,0.3)]",
          label: "Special Promotion"
        };
      case "INFO":
      default:
        return {
          border: "border-primary/50",
          headerBg: "bg-primary/20",
          text: "text-primary",
          glow: "shadow-[0_0_15px_rgba(0,255,0,0.3)]",
          label: "System Broadcast"
        };
    }
  };

  if (!broadcast || !isOpen) return null;

  const styles = getTypeStyles(broadcast.type);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-6 right-6 z-[60] max-w-sm w-full"
      >
        <CyberCard className={`relative p-0 overflow-hidden ${styles.border} bg-black/90 backdrop-blur-xl ${styles.glow}`}>
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 z-10 p-1 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className={`p-1 ${styles.headerBg} flex items-center gap-2 px-3`}>
            <Megaphone className={`w-3 h-3 ${styles.text}`} />
            <span className={`text-[10px] font-mono font-bold ${styles.text} uppercase tracking-widest`}>{styles.label}</span>
          </div>

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

          <div className="p-4 space-y-3">
            <div>
              <h3 className={`text-lg font-bold ${styles.text} leading-tight uppercase tracking-tight`}>
                {broadcast.title}
              </h3>
              <p className="text-sm text-white/80 mt-1 whitespace-pre-wrap font-mono leading-relaxed">
                {broadcast.message}
              </p>
            </div>

            {broadcast.actionLink && (
              <a
                href={broadcast.actionLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <CyberButton 
                  variant={broadcast.type.toUpperCase() === "WARNING" ? "danger" : "primary"} 
                  className={`w-full h-9 text-xs ${broadcast.type.toUpperCase() === "PROMO" ? "bg-yellow-500/20 border-yellow-500 text-yellow-500 hover:bg-yellow-500/40" : ""}`}
                >
                  LEARN MORE <ExternalLink className="ml-2 w-3 h-3" />
                </CyberButton>
              </a>
            )}
          </div>
        </CyberCard>
      </motion.div>
    </AnimatePresence>
  );
}