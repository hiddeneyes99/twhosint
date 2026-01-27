import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import {
  Smartphone,
  CreditCard,
  Car,
  Globe,
  AlertTriangle,
  History,
  ShieldAlert,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Navbar } from "@/components/Navbar";
import { CyberButton } from "@/components/CyberButton";
import { CyberCard } from "@/components/CyberCard";
import { TerminalOutput } from "@/components/TerminalOutput";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useMobileInfo,
  useAadharInfo,
  useVehicleInfo,
  useIpInfo,
} from "@/hooks/use-services";
import { useAuth } from "@/hooks/use-auth";
import {
  mobileInfoSchema,
  aadharInfoSchema,
  vehicleInfoSchema,
  ipInfoSchema,
} from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AuthModal } from "@/components/AuthModal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import sirenSound from "@assets/siren_1768712570112.mp3";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("mobile");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showProtectedAlert, setShowProtectedAlert] = useState(false);
  const [protectionReason, setProtectionReason] = useState<string | null>(null);
  const [showLowCreditAlert, setShowLowCreditAlert] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [selectedHistoryLog, setSelectedHistoryLog] = useState<any>(null);
  
  // Infinite scroll state for history
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [isInitialHistoryLoad, setIsInitialHistoryLoad] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const historyScrollRef = useRef<HTMLDivElement>(null);
  const HISTORY_LIMIT = 10;

  useEffect(() => {
    (window as any).openRedeemModal = () => setIsRedeemModalOpen(true);
    return () => {
      delete (window as any).openRedeemModal;
    };
  }, []);

  // Fetch history with pagination
  const fetchHistory = useCallback(async (page: number, reset: boolean = false) => {
    if (isFetchingHistory || !isAuthenticated) return;
    
    setIsFetchingHistory(true);
    try {
      const token = (window as any).firebaseToken;
      const response = await fetch(`/api/user/history?page=${page}&limit=${HISTORY_LIMIT}`, {
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Failed to fetch history");
      
      const result = await response.json();
      const newData = result.data || [];
      
      if (reset) {
        setHistoryData(newData);
        setHistoryPage(1);
      } else {
        setHistoryData(prev => [...prev, ...newData]);
      }
      
      setHasMoreHistory(result.hasMore);
      setIsInitialHistoryLoad(false);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setIsFetchingHistory(false);
    }
  }, [isAuthenticated, isFetchingHistory]);

  // Initial load when authenticated
  useEffect(() => {
    if (isAuthenticated && isInitialHistoryLoad) {
      fetchHistory(1, true);
    }
  }, [isAuthenticated, isInitialHistoryLoad, fetchHistory]);

  // Load more when scrolling to bottom
  const loadMoreHistory = useCallback(() => {
    if (hasMoreHistory && !isFetchingHistory) {
      const nextPage = historyPage + 1;
      setHistoryPage(nextPage);
      fetchHistory(nextPage, false);
    }
  }, [hasMoreHistory, isFetchingHistory, historyPage, fetchHistory]);

  // Scroll handler for infinite scroll (works inside ScrollArea)
  const handleHistoryScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    
    if (scrollBottom < 100 && hasMoreHistory && !isFetchingHistory) {
      loadMoreHistory();
    }
  }, [hasMoreHistory, isFetchingHistory, loadMoreHistory]);

  // Refresh history when a new search is made
  const refreshHistory = useCallback(() => {
    setHistoryPage(1);
    setHasMoreHistory(true);
    fetchHistory(1, true);
  }, [fetchHistory]);

  // Service Mutations
  const mobileMutation = useMobileInfo();
  const aadharMutation = useAadharInfo();
  const vehicleMutation = useVehicleInfo();
  const ipMutation = useIpInfo();

  // Watch for successful mutations and check credits + refresh history
  useEffect(() => {
    const mutations = [
      mobileMutation,
      aadharMutation,
      vehicleMutation,
      ipMutation,
    ];
    const anySuccess = mutations.some((m) => m.isSuccess);
    const anyError = mutations.some((m) => m.isError);

    if ((anySuccess || anyError) && user && user.credits < 10) {
      setShowLowCreditAlert(true);
    }
    
    // Refresh history when a search succeeds
    if (anySuccess) {
      refreshHistory();
    }
  }, [
    mobileMutation.isSuccess,
    aadharMutation.isSuccess,
    vehicleMutation.isSuccess,
    ipMutation.isSuccess,
    mobileMutation.isError,
    aadharMutation.isError,
    vehicleMutation.isError,
    ipMutation.isError,
    user?.credits,
    refreshHistory,
  ]);

  // Initial check for 0 credits
  useEffect(() => {
    if (user && user.credits === 0) {
      setShowLowCreditAlert(true);
    }
  }, [user?.credits]);

  // Watch for protected number errors
  useEffect(() => {
    const mutations = [
      mobileMutation,
      aadharMutation,
      vehicleMutation,
      ipMutation,
    ];
    const mutationWithError = mutations.find(
      (m) =>
        m.error &&
        (m.error as any).message?.toLowerCase().includes("protected"),
    );

    if (mutationWithError && !showProtectedAlert) {
      const reason =
        (mutationWithError.error as any).reason ||
        "SECURITY PROTOCOL ACTIVATED. ACCESS RESTRICTED.";
      setProtectionReason(reason);
      setShowProtectedAlert(true);
      if (!audioRef.current) {
        audioRef.current = new Audio(sirenSound);
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(console.error);
    }
  }, [
    mobileMutation.error,
    aadharMutation.error,
    vehicleMutation.error,
    ipMutation.error,
  ]);

  const closeProtectedAlert = () => {
    setShowProtectedAlert(false);
    setProtectionReason(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Reset mutations to clear error state and prevent the default toast/error UI
    mobileMutation.reset();
    aadharMutation.reset();
    vehicleMutation.reset();
    ipMutation.reset();
  };

  // Forms
  const mobileForm = useForm<z.infer<typeof mobileInfoSchema>>({
    resolver: zodResolver(mobileInfoSchema),
    defaultValues: { number: "" },
  });

  const aadharForm = useForm<z.infer<typeof aadharInfoSchema>>({
    resolver: zodResolver(aadharInfoSchema),
    defaultValues: { number: "" },
  });

  const vehicleForm = useForm<z.infer<typeof vehicleInfoSchema>>({
    resolver: zodResolver(vehicleInfoSchema),
    defaultValues: { number: "" },
  });

  const ipForm = useForm<z.infer<typeof ipInfoSchema>>({
    resolver: zodResolver(ipInfoSchema),
    defaultValues: { ip: "" },
  });

  // Handlers
  const onMobileSubmit = (data: z.infer<typeof mobileInfoSchema>) =>
    mobileMutation.mutate(data);
  const onAadharSubmit = (data: z.infer<typeof aadharInfoSchema>) =>
    aadharMutation.mutate(data);
  const onVehicleSubmit = (data: z.infer<typeof vehicleInfoSchema>) =>
    vehicleMutation.mutate(data);
  const onIpSubmit = (data: z.infer<typeof ipInfoSchema>) => {
    // Force reset mutation state before new request to fix "double click" issue
    ipMutation.reset();
    ipMutation.mutate(data);
  };

  const handleRedeem = async () => {
    if (!redeemCode) return;
    setIsRedeeming(true);
    try {
      const res = await apiRequest("POST", "/api/user/redeem", { code: redeemCode });
      const data = await res.json();
      toast({ title: "SUCCESS", description: data.message });
      setRedeemCode("");
      setIsRedeemModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "ERROR", 
        description: error.message || "System failure" 
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const [showPlans, setShowPlans] = useState(false);

  const starterPacks = [
    { id: "s1", credits: 10, price: "49" },
    { id: "s2", credits: 30, price: "99" },
    { id: "s3", credits: 60, price: "149" },
    { id: "s4", credits: 120, price: "199" },
  ];

  const unlimitedPacks = [
    { id: "u1", duration: "7 Days", price: "249" },
    { id: "u2", duration: "30 Days", price: "349" },
  ];

  const handleBuyPlan = (plan: string) => {
    const message = encodeURIComponent(`Hello, I want to buy the following plan: ${plan}\nUsername: ${user?.username}\nEmail: ${user?.email}`);
    window.open(`https://t.me/Twhosint?text=${message}`, "_blank");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <CyberCard className="max-w-md w-full text-center py-12">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-6 animate-pulse" />
            <h2 className="text-2xl font-bold text-destructive mb-2">
              ACCESS DENIED
            </h2>
            <p className="text-muted-foreground mb-8">
              Authentication required to access system tools.
            </p>
            <CyberButton
              className="w-full"
              onClick={() => setIsAuthModalOpen(true)}
            >
              INITIALIZE LOGIN SEQUENCE
            </CyberButton>
          </CyberCard>
        </div>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <Navbar />

      {/* Protected Number Alert Overlay */}
      <AnimatePresence>
        {showProtectedAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4 text-white overflow-hidden"
          >
            {/* Animated Red + Black Background */}
            <div className="absolute inset-0 z-0">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-red-950 via-black to-red-950 opacity-80"
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%"],
                }}
                transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(185,28,28,0.2)_0%,transparent_70%)]" />
              {/* Scanning Lines */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />
              <motion.div
                className="absolute top-0 left-0 w-full h-1 bg-red-600/30 blur-sm z-20"
                animate={{ top: ["0%", "100%"] }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              />
            </div>

            <div className="relative z-30 flex flex-col items-center max-w-4xl w-full">
              {/* Enhanced Shield Icon with Glow and Pulse */}
              <motion.div
                animate={{
                  scale: [1, 1.15, 0.95, 1.1, 1],
                  filter: [
                    "drop-shadow(0 0 20px rgba(220,38,38,0.7))",
                    "drop-shadow(0 0 50px rgba(220,38,38,1))",
                    "drop-shadow(0 0 20px rgba(220,38,38,0.7))",
                  ],
                  rotate: [0, -5, 5, -5, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.8,
                  ease: "easeInOut",
                }}
                className="mb-8"
              >
                <ShieldAlert className="w-32 h-32 md:w-48 md:h-48 text-red-600" />
              </motion.div>

              {/* PROTECTED CONTENT with Glitch + Shake */}
              <motion.div
                animate={{
                  x: [-2, 2, -3, 3, 0],
                  y: [2, -2, 3, -3, 0],
                  skew: [0, 5, -5, 2, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.08,
                  repeatType: "mirror",
                }}
                className="relative mb-4"
              >
                <h1 className="text-6xl md:text-9xl font-black text-center tracking-tighter uppercase leading-none italic text-white drop-shadow-[0_0_25px_rgba(255,0,0,0.8)]">
                  PROTECTED
                </h1>
                <motion.div
                  className="absolute inset-0 text-red-600 opacity-70 translate-x-2"
                  animate={{
                    opacity: [0, 0.8, 0],
                    x: [2, -2, 2],
                  }}
                  transition={{ repeat: Infinity, duration: 0.04 }}
                >
                  PROTECTED
                </motion.div>
                <motion.div
                  className="absolute inset-0 text-cyan-500 opacity-70 -translate-x-2"
                  animate={{
                    opacity: [0, 0.8, 0],
                    x: [-2, 2, -2],
                  }}
                  transition={{ repeat: Infinity, duration: 0.06, delay: 0.01 }}
                >
                  PROTECTED
                </motion.div>
              </motion.div>

              {/* ACCESS RESTRICTED */}
              <motion.h2
                animate={{
                  opacity: [1, 0.5, 1],
                  scale: [1, 1.02, 1],
                }}
                transition={{ repeat: Infinity, duration: 0.2 }}
                className="text-4xl md:text-7xl font-black text-red-600 mb-8 tracking-[0.2em] uppercase drop-shadow-[0_0_30px_rgba(220,38,38,1)] text-center"
              >
                ACCESS RESTRICTED
              </motion.h2>

              <div className="bg-red-950/60 border-y-4 border-red-600 py-6 px-10 mb-12 backdrop-blur-md w-full relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-red-600/10"
                  animate={{ opacity: [0, 0.2, 0] }}
                  transition={{ repeat: Infinity, duration: 0.1 }}
                />
                <div className="flex flex-col items-center gap-4">
                  <p className="text-2xl md:text-4xl font-mono text-center uppercase tracking-[0.3em] font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                    {protectionReason}
                  </p>
              
                </div>
              </div>

              <div className="flex gap-4">
                <motion.button
                  whileHover={{
                    scale: 1.1,
                    boxShadow: "0 0 60px rgba(220,38,38,1)",
                    backgroundColor: "#ff0000",
                  }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    closeProtectedAlert();
                  }}
                  className="bg-red-700 text-white border-4 border-white text-2xl px-20 py-8 h-auto font-black uppercase tracking-widest shadow-[0_0_30px_rgba(220,38,38,0.8)] transition-all"
                >
                  Back
                </motion.button>
              </div>
            </div>

            {/* Violent Blinking Overlay */}
            <motion.div
              className="absolute inset-0 bg-red-600 pointer-events-none mix-blend-hard-light"
              animate={{ opacity: [0, 0.3, 0, 0.5, 0] }}
              transition={{ repeat: Infinity, duration: 0.1 }}
            />

            {/* Static Noise Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[url('https://media.giphy.com/media/oEI9uWUicKgH6/giphy.gif')] bg-cover" />
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showLowCreditAlert} onOpenChange={setShowLowCreditAlert}>
        <DialogContent className="bg-black border-primary/50 text-white font-mono max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2 text-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-500 animate-bounce" />
              CRITICAL: SYSTEM ALERT
            </DialogTitle>
            <DialogDescription className="text-white pt-4 leading-relaxed text-base border-t border-primary/20 mt-2">
              <span className="text-yellow-400 font-bold">⚠️ ACCESS RESTRICTED!</span><br/>
              Your credit balance is <span className="text-primary font-bold">{user?.credits || 0}</span>. 
              Please recharge immediately to restore full system access and avoid service interruption.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <CyberButton
              variant="outline"
              className="w-full sm:flex-1 h-9"
              onClick={() => setShowLowCreditAlert(false)}
            >
              CONTINUE
            </CyberButton>
            <CyberButton
              variant="primary"
              className="w-full sm:flex-1 h-9 shadow-[0_0_10px_rgba(0,255,0,0.3)]"
              onClick={() => {
                setShowLowCreditAlert(false);
                setIsRedeemModalOpen(true);
              }}
            >
              RECHARGE / REDEEM
            </CyberButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRedeemModalOpen} onOpenChange={setIsRedeemModalOpen}>
        <DialogContent className="bg-black border-primary/50 text-white font-mono max-w-lg overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2 text-lg">
              <CreditCard className="w-6 h-6" />
              SELECT PLAN & RECHARGE
            </DialogTitle>
            <DialogDescription className="text-white/60 pt-2">
              Select a plan below or redeem a code. Credits will be added within 10 minutes after payment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {!showPlans ? (
              <div className="space-y-4">
                <CyberButton 
                  variant="primary" 
                  className="w-full h-12"
                  onClick={() => setShowPlans(true)}
                >
                  BUY CREDITS
                </CyberButton>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-primary/20" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-black px-2 text-muted-foreground">Or Redeem Code</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Input
                    placeholder="ENTER REDEEM CODE..."
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                    className="bg-black/50 border-primary/40 focus:border-primary font-mono text-sm"
                  />
                  <CyberButton 
                    variant="outline" 
                    className="w-full h-10"
                    onClick={handleRedeem}
                    isLoading={isRedeeming}
                  >
                    REDEEM CODE
                  </CyberButton>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-primary text-xs uppercase tracking-widest mb-3 border-b border-primary/20 pb-1 flex justify-between items-center">
                    Starter Packs
                    <button onClick={() => setShowPlans(false)} className="text-[10px] text-white/40 hover:text-white">BACK</button>
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {starterPacks.map((pack) => (
                      <button
                        key={pack.id}
                        onClick={() => handleBuyPlan(`${pack.credits} Credits - ₹${pack.price}`)}
                        className="flex flex-col items-center justify-center p-3 border border-primary/20 bg-primary/5 hover:bg-primary/20 hover:border-primary transition-all rounded group"
                      >
                        <span className="text-lg font-bold text-primary">{pack.credits} CREDITS</span>
                        <span className="text-sm font-mono text-white/80 mt-1">₹{pack.price}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-primary text-xs uppercase tracking-widest mb-3 border-b border-primary/20 pb-1">Ultimate Unlimited Packs</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {unlimitedPacks.map((pack) => (
                      <button
                        key={pack.id}
                        onClick={() => handleBuyPlan(`Unlimited - ${pack.duration} - ₹${pack.price}`)}
                        className="flex flex-col items-center justify-center p-3 border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/20 hover:border-yellow-500 transition-all rounded group"
                      >
                        <span className="text-lg font-bold text-yellow-500">{pack.duration}</span>
                        <span className="text-sm font-mono text-white/80 mt-1">₹{pack.price}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <CyberButton 
                    variant="outline" 
                    className="w-full text-xs"
                    onClick={() => handleBuyPlan("Custom Plan Request")}
                  >
                    CUSTOM PLAN - CONTACT US
                  </CyberButton>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <main className="flex-1 container px-4 py-4 md:py-8">
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          {/* Sidebar / Tools Selector */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="mb-4">
              <h2 className="text-[10px] md:text-xs font-mono text-primary/60 mb-2 uppercase tracking-widest px-2">
                Select Module
              </h2>
              <div className="h-[1px] bg-primary/20 w-full mb-2" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-col gap-2 w-full">
              <CyberButton
                onClick={() => setIsRedeemModalOpen(true)}
                variant="primary"
                className="lg:hidden justify-center px-2 py-2 font-mono text-[9px] uppercase animate-pulse shadow-[0_0_10px_rgba(0,255,0,0.3)] border-primary bg-primary/20 h-auto"
              >
                <CreditCard className="w-3 h-3 mr-1.5 shrink-0" />
                <span className="truncate">Buy / Redeem</span>
              </CyberButton>

              <CyberButton
                onClick={() => setActiveTab("mobile")}
                variant={activeTab === "mobile" ? "primary" : "outline"}
                className="justify-start px-2 md:px-4 py-2 md:py-3 font-mono text-[9px] md:text-sm uppercase transition-all h-auto"
              >
                <Smartphone className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-3 shrink-0" />{" "}
                <span className="truncate">Mobile</span>
              </CyberButton>

              <CyberButton
                onClick={() => setActiveTab("aadhar")}
                variant={activeTab === "aadhar" ? "primary" : "outline"}
                className="justify-start px-2 md:px-4 py-2 md:py-3 font-mono text-[9px] md:text-sm uppercase transition-all h-auto"
              >
                <CreditCard className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-3 shrink-0" />{" "}
                <span className="truncate">Aadhar</span>
              </CyberButton>

              <CyberButton
                onClick={() => setActiveTab("vehicle")}
                variant={activeTab === "vehicle" ? "primary" : "outline"}
                className="justify-start px-2 md:px-4 py-2 md:py-3 font-mono text-[9px] md:text-sm uppercase transition-all h-auto"
              >
                <Car className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-3 shrink-0" />{" "}
                <span className="truncate">Vehicle</span>
              </CyberButton>

              <CyberButton
                onClick={() => setActiveTab("ip")}
                variant={activeTab === "ip" ? "primary" : "outline"}
                className="justify-start px-2 md:px-4 py-2 md:py-3 font-mono text-[9px] md:text-sm uppercase transition-all h-auto"
              >
                <Globe className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-3 shrink-0" />{" "}
                <span className="truncate">IP Probe</span>
              </CyberButton>

              <CyberButton
                onClick={() => setActiveTab("history")}
                variant={activeTab === "history" ? "primary" : "outline"}
                className="justify-start px-2 md:px-4 py-2 md:py-3 font-mono text-[9px] md:text-sm uppercase transition-all h-auto"
              >
                <History className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-3 shrink-0" />{" "}
                <span className="truncate">History</span>
              </CyberButton>
            </div>

            <div className="mt-4 lg:mt-8 p-3 md:p-4 border border-primary/20 bg-primary/5 rounded-none">
              <h3 className="text-[10px] md:text-xs font-bold text-primary mb-2">
                SYSTEM STATUS
              </h3>
              <div className="space-y-1 md:space-y-2 text-[10px] md:text-xs font-mono text-muted-foreground">
                <div className="flex justify-between">
                  <span>USER:</span>
                  <span className="text-primary truncate max-w-[80px]">
                    {user?.username}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>EXPIRY:</span>
                  <span className="text-primary font-bold">
                    {user?.creditsExpiry ? new Date(user.creditsExpiry).toLocaleDateString() : 'NEVER'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>CREDITS:</span>
                  <span className="text-primary font-bold">
                    {user?.credits ?? 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>SERVER:</span>
                  <span className="text-green-500 font-bold">ONLINE</span>
                </div>
                <div className="pt-2">
                  <CyberButton 
                    className="w-full text-[10px] py-1.5 h-auto animate-pulse" 
                    variant="primary"
                    onClick={() => setIsRedeemModalOpen(true)}
                  >
                    <CreditCard className="w-3 h-3 mr-2" />
                    RECHARGE / REDEEM
                  </CyberButton>
                </div>
              </div>
              <div className="space-y-1 md:space-y-2 text-[10px] md:text-xs font-mono text-muted-foreground mt-4 border-t border-primary/20 pt-4">
                <div className="flex justify-between">
                  <span>UPTIME:</span>
                  <span className="text-primary font-bold">99.9%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-h-[400px] md:min-h-[500px] w-full overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === "mobile" && (
                <motion.div
                  key="mobile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full flex flex-col gap-4 md:gap-6"
                >
                  <CyberCard>
                    <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 border-b border-primary/20 pb-3 md:pb-4">
                      <Smartphone className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                      <h2 className="text-base md:text-xl font-bold font-display tracking-wider">
                        MOBILE NUMBER INTELLIGENCE
                      </h2>
                    </div>

                    <Form {...mobileForm}>
                      <form
                        onSubmit={mobileForm.handleSubmit(onMobileSubmit)}
                        className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end"
                      >
                        <FormField
                          control={mobileForm.control}
                          name="number"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-primary/80 font-mono text-[10px] md:text-xs">
                                TARGET NUMBER (IN)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter 10-digit number..."
                                  className="bg-black/50 border-primary/40 focus:border-primary font-mono text-base md:text-lg h-10 md:h-12"
                                  maxLength={10}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-destructive font-mono text-[10px] md:text-xs" />
                            </FormItem>
                          )}
                        />
                        <CyberButton
                          type="submit"
                          className="h-10 md:h-12 w-full sm:w-32"
                          isLoading={mobileMutation.isPending}
                        >
                          EXECUTE
                        </CyberButton>
                      </form>
                    </Form>
                  </CyberCard>

                  <TerminalOutput
                    data={mobileMutation.data?.data}
                    title="MOBILE DATA STREAM"
                    isLoading={mobileMutation.isPending}
                    className="flex-1"
                  />
                </motion.div>
              )}

              {activeTab === "aadhar" && (
                <motion.div
                  key="aadhar"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full flex flex-col gap-6"
                >
                  <CyberCard className="flex flex-col items-center justify-center py-20 text-center">
                    <AlertTriangle className="w-16 h-16 text-primary mb-6 animate-pulse" />
                    <h2 className="text-2xl font-bold font-display tracking-widest text-primary mb-2">
                      AADHAR INFO MODULE
                    </h2>
                    <p className="text-primary/60 font-mono text-sm uppercase tracking-widest">
                      Status: [ COMING SOON ]
                    </p>
                    <div className="mt-8 h-1 w-48 bg-primary/20 relative overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-primary"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{
                          repeat: Infinity,
                          duration: 2,
                          ease: "linear",
                        }}
                      />
                    </div>
                  </CyberCard>
                </motion.div>
              )}

              {activeTab === "vehicle" && (
                <motion.div
                  key="vehicle"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full flex flex-col gap-4 md:gap-6"
                >
                  <CyberCard>
                    <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 border-b border-primary/20 pb-3 md:pb-4">
                      <Car className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                      <h2 className="text-base md:text-xl font-bold font-display tracking-wider">
                        VEHICLE RECONNAISSANCE
                      </h2>
                    </div>

                    <Form {...vehicleForm}>
                      <form
                        onSubmit={vehicleForm.handleSubmit(onVehicleSubmit)}
                        className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end"
                      >
                        <FormField
                          control={vehicleForm.control}
                          name="number"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-primary/80 font-mono text-[10px] md:text-xs">
                                REGISTRATION NUMBER (RC)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ex: MH01AB1234"
                                  className="bg-black/50 border-primary/40 focus:border-primary font-mono text-base md:text-lg h-10 md:h-12 uppercase"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-destructive font-mono text-[10px] md:text-xs" />
                            </FormItem>
                          )}
                        />
                        <CyberButton
                          type="submit"
                          className="h-10 md:h-12 w-full sm:w-32"
                          isLoading={vehicleMutation.isPending}
                        >
                          SCAN
                        </CyberButton>
                      </form>
                    </Form>
                  </CyberCard>

                  <TerminalOutput
                    data={vehicleMutation.data?.data}
                    title="VEHICLE REGISTRY DUMP"
                    isLoading={vehicleMutation.isPending}
                    className="flex-1"
                  />
                </motion.div>
              )}

              {activeTab === "ip" && (
                <motion.div
                  key="ip"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full flex flex-col gap-4 md:gap-6"
                >
                  <CyberCard>
                    <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 border-b border-primary/20 pb-3 md:pb-4">
                      <Globe className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                      <h2 className="text-base md:text-xl font-bold font-display tracking-wider">
                        NETWORK PROBE
                      </h2>
                    </div>

                    <Form {...ipForm}>
                      <form
                        onSubmit={ipForm.handleSubmit(onIpSubmit)}
                        className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end"
                      >
                        <FormField
                          control={ipForm.control}
                          name="ip"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-primary/80 font-mono text-[10px] md:text-xs">
                                IP ADDRESS (IPv4)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ex: 192.168.1.1"
                                  className="bg-black/50 border-primary/40 focus:border-primary font-mono text-base md:text-lg h-10 md:h-12"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage className="text-destructive font-mono text-[10px] md:text-xs" />
                            </FormItem>
                          )}
                        />
                        <CyberButton
                          type="submit"
                          className="h-10 md:h-12 w-full sm:w-32"
                          isLoading={ipMutation.isPending}
                        >
                          PING
                        </CyberButton>
                      </form>
                    </Form>
                  </CyberCard>

                  <TerminalOutput
                    data={ipMutation.data?.data}
                    title="PACKET TRACE RESULTS"
                    isLoading={ipMutation.isPending}
                    className="flex-1"
                  />
                </motion.div>
              )}

              {activeTab === "history" && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full flex flex-col gap-6"
                >
                  <CyberCard className="flex-1">
                    <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 border-b border-primary/20 pb-3 md:pb-4">
                      <History className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                      <h2 className="text-base md:text-xl font-bold font-display tracking-wider">
                        SEARCH LOG HISTORY
                      </h2>
                    </div>

                    <div 
                      className="h-[350px] md:h-[400px] pr-2 md:pr-4 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent"
                      onScroll={handleHistoryScroll}
                    >
                      <div className="space-y-3 md:space-y-4">
                        {isInitialHistoryLoad && isFetchingHistory ? (
                          <div className="flex flex-col items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-primary animate-spin mb-2" />
                            <p className="text-muted-foreground font-mono text-xs">LOADING LOGS...</p>
                          </div>
                        ) : historyData.length === 0 ? (
                          <p className="text-center text-muted-foreground font-mono text-xs md:text-sm">
                            NO LOGS FOUND
                          </p>
                        ) : (
                          <>
                            {historyData.map((log: any) => (
                              <div
                                key={log.id}
                                className="border border-primary/20 p-3 md:p-4 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
                                data-testid={`history-log-${log.id}`}
                                onClick={() => log.result && setSelectedHistoryLog(log)}
                              >
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-1 mb-2">
                                  <span className="text-primary font-bold uppercase text-[10px] md:text-sm">
                                    {log.service} MODULE
                                  </span>
                                  <span className="text-[9px] md:text-xs text-muted-foreground font-mono">
                                    {new Date(log.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="font-mono text-[10px] md:text-sm text-primary/80 tracking-tight break-all">
                                  QUERY: {log.query}
                                </p>
                                {log.result && (
                                  <p className="text-[9px] md:text-xs text-primary/50 mt-2 font-mono">
                                    TAP TO VIEW FULL DATA
                                  </p>
                                )}
                              </div>
                            ))}
                            
                            {/* Infinite scroll trigger element */}
                            <div ref={loadMoreRef} className="py-4 flex justify-center">
                              {isFetchingHistory ? (
                                <div className="flex items-center gap-2 text-primary">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span className="font-mono text-xs">LOADING MORE...</span>
                                </div>
                              ) : hasMoreHistory ? (
                                <span className="font-mono text-xs text-muted-foreground">SCROLL FOR MORE</span>
                              ) : (
                                <span className="font-mono text-xs text-muted-foreground">END OF LOGS</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </CyberCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* History Log Detail Modal */}
      <Dialog open={!!selectedHistoryLog} onOpenChange={() => setSelectedHistoryLog(null)}>
        <DialogContent className="max-w-3xl bg-black/95 border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-primary font-mono uppercase tracking-widest flex items-center gap-2">
              <History className="w-5 h-5" />
              {selectedHistoryLog?.service} MODULE DATA
            </DialogTitle>
            <DialogDescription className="text-primary/50 font-mono text-xs">
              Query: {selectedHistoryLog?.query} | {selectedHistoryLog?.createdAt && new Date(selectedHistoryLog.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedHistoryLog?.result && (
              <TerminalOutput
                data={selectedHistoryLog.result}
                title="RETRIEVED DATA"
                className="border-primary/20"
              />
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
