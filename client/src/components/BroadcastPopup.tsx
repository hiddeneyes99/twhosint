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

  if (!broadcast || !isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-6 right-6 z-[60] max-w-sm w-full"
      >
        <CyberCard className="relative p-0 overflow-hidden border-primary/50 bg-black/90 backdrop-blur-xl">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 z-10 p-1 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-1 bg-primary/20 flex items-center gap-2 px-3">
            <Megaphone className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">System Broadcast</span>
          </div>

          {broadcast.mediaUrl && (
            <div className="relative aspect-video w-full bg-black/50 overflow-hidden border-b border-primary/20">
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
              <h3 className="text-lg font-bold text-primary leading-tight uppercase tracking-tight">
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
                <CyberButton variant="primary" className="w-full h-9 text-xs">
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