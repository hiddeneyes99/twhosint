import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  ShieldCheck, 
  CreditCard, 
  Ban, 
  ArrowLeft,
  Search,
  RefreshCw,
  History as HistoryIcon,
  Terminal,
  Lock,
  ShieldAlert,
  Loader2,
  Megaphone,
  Settings
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { User, RequestLog, BroadcastMessage, AppSettings } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const loginSchema = z.object({
  id: z.string().min(1, "ID is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserHistory, setSelectedUserHistory] = useState<{ id: string; email: string } | null>(null);
  const [isProtectedModalOpen, setIsProtectedModalOpen] = useState(false);
  const [isAdminToolsOpen, setIsAdminToolsOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [protectedInput, setProtectedInput] = useState({ number: "", reason: "" });
  const [toolInput, setToolInput] = useState({ credits: 10 });
  const [broadcastInput, setBroadcastInput] = useState({
    title: "",
    message: "",
    type: "INFO",
    mediaUrl: "",
    mediaType: "image",
    actionLink: "",
    durationMinutes: "60"
  });
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<RequestLog | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const { data: settings, refetch: refetchSettings } = useQuery<AppSettings>({
    queryKey: ["/api/admin/settings"],
    enabled: isLoggedIn,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<AppSettings>) => {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      refetchSettings();
      toast({ title: "SETTINGS UPDATED", description: "Global configuration synchronized." });
    },
  });

  const { data: activeBroadcast, refetch: refetchBroadcast } = useQuery<BroadcastMessage | null>({
    queryKey: ["/api/broadcast/active"],
    enabled: isLoggedIn,
  });

  const createBroadcastMutation = useMutation({
    mutationFn: async (data: any) => {
      const expiresAt = data.durationMinutes ? new Date(Date.now() + parseInt(data.durationMinutes) * 60000).toISOString() : null;
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, expiresAt }),
      });
      if (!res.ok) throw new Error("Failed to create broadcast");
      return res.json();
    },
    onSuccess: () => {
      refetchBroadcast();
      setIsBroadcastModalOpen(false);
      setBroadcastInput({
        title: "",
        message: "",
        type: "INFO",
        mediaUrl: "",
        mediaType: "image",
        actionLink: "",
        durationMinutes: "60"
      });
      toast({ title: "BROADCAST LIVE", description: "The message has been sent to all users." });
    },
  });

  const stopBroadcastMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/broadcast/${id}/stop`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to stop broadcast");
      return res.json();
    },
    onSuccess: () => {
      refetchBroadcast();
      toast({ title: "BROADCAST STOPPED", description: "The message has been removed." });
    },
  });

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      id: "",
      password: "",
    },
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isLoggedIn,
  });

  const { data: protectedNumbersList, refetch: refetchProtected } = useQuery<string[]>({
    queryKey: ["/api/admin/protected-numbers"],
    enabled: isLoggedIn,
  });

  const generateCodeMutation = useMutation({
    mutationFn: async (data: { credits: number }) => {
      const res = await fetch("/api/admin/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits: data.credits }),
      });
      if (!res.ok) throw new Error("Failed to generate code");
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedCode(data.code);
      toast({ title: "REDEEM CODE GENERATED", description: `Code: ${data.code}` });
    },
  });

  const giftAllMutation = useMutation({
    mutationFn: async (data: { credits: number }) => {
      const res = await fetch("/api/admin/gift-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits: data.credits }),
      });
      if (!res.ok) throw new Error("Failed to gift credits");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "GIFTED ALL USERS", description: "Credits have been distributed." });
    },
  });

  const addProtectedMutation = useMutation({
    mutationFn: async (data: { number: string; reason: string }) => {
      const res = await fetch("/api/admin/protected-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add protection");
      return res.json();
    },
    onSuccess: () => {
      refetchProtected();
      setProtectedInput({ number: "", reason: "" });
      toast({ title: "Target protected successfully" });
    },
  });

  const removeProtectedMutation = useMutation({
    mutationFn: async (number: string) => {
      const res = await fetch(`/api/admin/protected-numbers/${number}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove protection");
      return res.json();
    },
    onSuccess: () => {
      refetchProtected();
      toast({ title: "Protection removed" });
    },
  });

  // Infinite scroll state for admin user history
  const [adminHistoryData, setAdminHistoryData] = useState<RequestLog[]>([]);
  const [adminHistoryPage, setAdminHistoryPage] = useState(1);
  const [hasMoreAdminHistory, setHasMoreAdminHistory] = useState(true);
  const [isFetchingAdminHistory, setIsFetchingAdminHistory] = useState(false);
  const adminLoadMoreRef = useRef<HTMLDivElement>(null);
  const ADMIN_HISTORY_LIMIT = 10;

  // Fetch admin user history with pagination
  const fetchAdminHistory = useCallback(async (userId: string, page: number, reset: boolean = false) => {
    if (isFetchingAdminHistory) return;
    
    setIsFetchingAdminHistory(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/history?page=${page}&limit=${ADMIN_HISTORY_LIMIT}`, {
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Failed to fetch history");
      
      const result = await response.json();
      const newData = result.data || [];
      
      if (reset) {
        setAdminHistoryData(newData);
        setAdminHistoryPage(1);
      } else {
        setAdminHistoryData(prev => [...prev, ...newData]);
      }
      
      setHasMoreAdminHistory(result.hasMore);
    } catch (error) {
      console.error("Error fetching admin history:", error);
    } finally {
      setIsFetchingAdminHistory(false);
    }
  }, [isFetchingAdminHistory]);

  // Load initial history when user is selected
  useEffect(() => {
    if (selectedUserHistory && isLoggedIn) {
      setAdminHistoryData([]);
      setAdminHistoryPage(1);
      setHasMoreAdminHistory(true);
      fetchAdminHistory(selectedUserHistory.id, 1, true);
    }
  }, [selectedUserHistory, isLoggedIn]);

  // Load more when scrolling
  const loadMoreAdminHistory = useCallback(() => {
    if (hasMoreAdminHistory && !isFetchingAdminHistory && selectedUserHistory) {
      const nextPage = adminHistoryPage + 1;
      setAdminHistoryPage(nextPage);
      fetchAdminHistory(selectedUserHistory.id, nextPage, false);
    }
  }, [hasMoreAdminHistory, isFetchingAdminHistory, adminHistoryPage, selectedUserHistory, fetchAdminHistory]);

  // IntersectionObserver for admin history infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreAdminHistory && !isFetchingAdminHistory) {
          loadMoreAdminHistory();
        }
      },
      { threshold: 0.1 }
    );

    if (adminLoadMoreRef.current) {
      observer.observe(adminLoadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMoreAdminHistory, isFetchingAdminHistory, loadMoreAdminHistory]);

  const onSubmit = async (values: LoginForm) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        toast({
          title: "Access Granted",
          description: "Welcome to the secure terminal.",
        });
        setIsLoggedIn(true);
      } else {
        const data = await res.json();
        throw new Error(data.message || "Invalid credentials");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateCreditsMutation = useMutation({
    mutationFn: async ({ userId, credits }: { userId: string; credits: number }) => {
      const res = await fetch(`/api/admin/users/${userId}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits }),
      });
      if (!res.ok) throw new Error("Failed to update credits");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Credits updated successfully" });
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: async ({ userId, blocked }: { userId: string; blocked: boolean }) => {
      const res = await fetch(`/api/admin/users/${userId}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User status updated" });
    },
  });

  const blockIpMutation = useMutation({
    mutationFn: async ({ userId, blockIp }: { userId: string; blockIp: boolean }) => {
      const res = await fetch(`/api/admin/users/${userId}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked: false, blockIp }),
      });
      if (!res.ok) throw new Error("Failed to update IP status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "IP status updated" });
    },
  });

  const filteredUsers = users?.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastIp?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_2px,3px_100%]" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-20"
        >
          <Card className="bg-zinc-950 border-primary/30 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
            <CardHeader className="text-center space-y-1">
              <div className="flex justify-center mb-2">
                <div className="p-3 bg-primary/10 rounded-full border border-primary/20">
                  <ShieldAlert className="w-8 h-8 text-primary animate-pulse" />
                </div>
              </div>
              <CardTitle className="text-2xl font-mono text-primary flex items-center justify-center gap-2">
                <Terminal className="w-5 h-5" />
                SECURE ACCESS
              </CardTitle>
              <CardDescription className="text-zinc-500 font-mono">
                LEVEL 4 CLEARANCE REQUIRED
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-mono uppercase text-xs tracking-widest">Operator ID</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              {...field} 
                              autoComplete="off"
                              className="bg-black/50 border-primary/20 focus-visible:ring-primary/40 font-mono text-primary" 
                              placeholder="ENTER ID..."
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs font-mono" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-primary font-mono uppercase text-xs tracking-widest">Access Key</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="password" 
                              {...field} 
                              className="bg-black/50 border-primary/20 focus-visible:ring-primary/40 font-mono text-primary" 
                              placeholder="••••••••"
                            />
                            <Lock className="absolute right-3 top-2.5 w-4 h-4 text-primary/30" />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs font-mono" />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary font-mono uppercase tracking-widest h-11"
                    data-testid="button-admin-login"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <motion.span
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          AUTHENTICATING...
                        </motion.span>
                      </span>
                    ) : (
                      "INITIALIZE UPLINK"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-primary font-mono p-4 sm:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_2px,3px_100%]" />
      
      <div className="max-w-7xl mx-auto space-y-8 relative z-20">
        <header className="flex items-center justify-between border-b border-primary/20 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-3">
              <ShieldCheck className="w-8 h-8" />
              ADMIN_CORE_INTERFACE
            </h1>
            <p className="text-primary/60 text-sm">SECURE ADMINISTRATIVE TERMINAL</p>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/")}
            className="hover:bg-primary/10 text-primary border border-primary/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            EXIT_TERMINAL
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-zinc-950 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="w-4 h-4" /> TOTAL_USERS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-950 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> GLOBAL_CREDITS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users?.reduce((acc, u) => acc + (u.credits || 0), 0) || 0}
              </div>
            </CardContent>
          </Card>
          <Card 
            className="bg-zinc-950 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
            onClick={() => setIsProtectedModalOpen(true)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> PROTECTED_TARGETS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{protectedNumbersList?.length || 0}</div>
            </CardContent>
          </Card>
          <Card 
            className="bg-zinc-950 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
            onClick={() => setIsAdminToolsOpen(true)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Terminal className="w-4 h-4" /> ADMIN_TOOLS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">UTILITIES</div>
            </CardContent>
          </Card>
          <Card 
            className={`bg-zinc-950 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer ${activeBroadcast ? 'border-primary shadow-[0_0_15px_rgba(34,197,94,0.2)]' : ''}`}
            onClick={() => setIsBroadcastModalOpen(true)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Megaphone className="w-4 h-4" /> BROADCAST_SYSTEM
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeBroadcast ? "ACTIVE" : "OFFLINE"}</div>
            </CardContent>
          </Card>
          <Card 
            className="bg-zinc-950 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer"
            onClick={() => setIsSettingsModalOpen(true)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Settings className="w-4 h-4" /> APP_SETTINGS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">CONFIG</div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
          <DialogContent className="bg-zinc-950 border-primary/20 text-primary font-mono max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 uppercase tracking-widest text-primary">
                <Settings className="w-5 h-5" />
                GLOBAL_SETTINGS_CONFIG
              </DialogTitle>
              <DialogDescription className="text-primary/40 uppercase text-[10px] tracking-widest">
                CONFIGURE FREE CREDITS AND SEARCH COSTS
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              <div className="space-y-4 border border-primary/10 p-4 bg-black/50">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-primary/40">Free Signup Credits</label>
                  <Input 
                    type="number"
                    defaultValue={settings?.freeCreditsOnSignup}
                    key={settings?.freeCreditsOnSignup}
                    onBlur={(e) => updateSettingsMutation.mutate({ freeCreditsOnSignup: parseInt(e.target.value) || 0 })}
                    className="bg-black/50 border-primary/20 font-mono text-primary h-8"
                    data-testid="input-signup-credits"
                  />
                </div>
                
                <div className="pt-2 border-t border-primary/10">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-3">Service Costs (Credits per Search)</h4>
                  <div className="space-y-3">
                    {['mobile', 'vehicle', 'ip', 'aadhar'].map((service) => (
                      <div key={service} className="space-y-1">
                        <label className="text-[10px] uppercase text-primary/40">{service} Search Cost</label>
                        <Input 
                          type="number"
                          defaultValue={(settings?.serviceCosts as Record<string, number>)?.[service] || 1}
                          key={(settings?.serviceCosts as Record<string, number>)?.[service]}
                          onBlur={(e) => {
                            const newCosts = { ...(settings?.serviceCosts as Record<string, number>), [service]: parseInt(e.target.value) || 0 };
                            updateSettingsMutation.mutate({ serviceCosts: newCosts });
                          }}
                          className="bg-black/50 border-primary/20 font-mono text-primary h-8"
                          data-testid={`input-cost-${service}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isBroadcastModalOpen} onOpenChange={setIsBroadcastModalOpen}>
          <DialogContent className="bg-zinc-950 border-primary/20 text-primary font-mono max-w-2xl overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 uppercase tracking-widest text-primary">
                <Megaphone className="w-5 h-5" />
                SYSTEM_BROADCAST_CONTROL
              </DialogTitle>
              <DialogDescription className="text-primary/40 uppercase text-[10px] tracking-widest">
                SEND LIVE ALERTS AND MEDIA TO ALL USERS
              </DialogDescription>
            </DialogHeader>

            {activeBroadcast ? (
              <div className="space-y-4 border border-primary/30 p-4 bg-primary/5 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-primary font-bold uppercase text-lg">{activeBroadcast.title}</h3>
                    <p className="text-white/70 text-sm mt-1">{activeBroadcast.message}</p>
                    <div className="mt-2 flex gap-4 text-[10px] uppercase text-primary/60">
                      <span>Type: {activeBroadcast.type}</span>
                      {activeBroadcast.expiresAt && (
                        <span>Expires: {new Date(activeBroadcast.expiresAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="bg-red-900/50 hover:bg-red-600 border border-red-500 h-9"
                    onClick={() => stopBroadcastMutation.mutate(activeBroadcast.id)}
                    disabled={stopBroadcastMutation.isPending}
                  >
                    🛑 STOP_NOW
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-primary/20 rounded">
                <p className="text-primary/40 text-xs">NO ACTIVE BROADCAST</p>
              </div>
            )}

            <div className="space-y-4 mt-6">
              <h3 className="text-xs font-bold uppercase tracking-widest border-b border-primary/20 pb-1">Create New Broadcast</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-primary/40">Title</label>
                  <Input 
                    value={broadcastInput.title}
                    onChange={(e) => setBroadcastInput({...broadcastInput, title: e.target.value})}
                    className="bg-black/50 border-primary/20 h-8 text-sm"
                    placeholder="⚡ FLASH SALE"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-primary/40">Type</label>
                  <Select 
                    value={broadcastInput.type} 
                    onValueChange={(v) => setBroadcastInput({...broadcastInput, type: v})}
                  >
                    <SelectTrigger className="bg-black/50 border-primary/20 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-primary/20 text-primary">
                      <SelectItem value="INFO">INFO</SelectItem>
                      <SelectItem value="WARNING">WARNING</SelectItem>
                      <SelectItem value="PROMO">PROMO</SelectItem>
                      <SelectItem value="VIDEO">VIDEO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase text-primary/40">Message</label>
                <textarea 
                  value={broadcastInput.message}
                  onChange={(e) => setBroadcastInput({...broadcastInput, message: e.target.value})}
                  className="w-full bg-black/50 border border-primary/20 p-2 text-sm font-mono min-h-[80px] rounded focus:outline-none focus:border-primary/50"
                  placeholder="ENETR MESSAGE CONTENT..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-primary/40">Media URL (Optional)</label>
                  <Input 
                    value={broadcastInput.mediaUrl}
                    onChange={(e) => setBroadcastInput({...broadcastInput, mediaUrl: e.target.value})}
                    className="bg-black/50 border-primary/20 h-8 text-sm"
                    placeholder="HTTPS://..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-primary/40">Media Type</label>
                  <Select 
                    value={broadcastInput.mediaType} 
                    onValueChange={(v) => setBroadcastInput({...broadcastInput, mediaType: v})}
                  >
                    <SelectTrigger className="bg-black/50 border-primary/20 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-primary/20 text-primary">
                      <SelectItem value="image">IMAGE</SelectItem>
                      <SelectItem value="video">VIDEO (MP4)</SelectItem>
                      <SelectItem value="youtube">YOUTUBE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-primary/40">Action Link (Optional)</label>
                  <Input 
                    value={broadcastInput.actionLink}
                    onChange={(e) => setBroadcastInput({...broadcastInput, actionLink: e.target.value})}
                    className="bg-black/50 border-primary/20 h-8 text-sm"
                    placeholder="HTTPS://T.ME/..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase text-primary/40">Duration (Minutes)</label>
                  <Input 
                    type="number"
                    value={broadcastInput.durationMinutes}
                    onChange={(e) => setBroadcastInput({...broadcastInput, durationMinutes: e.target.value})}
                    className="bg-black/50 border-primary/20 h-8 text-sm"
                  />
                </div>
              </div>

              <Button 
                className="w-full bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary h-10 mt-2"
                onClick={() => createBroadcastMutation.mutate(broadcastInput)}
                disabled={createBroadcastMutation.isPending || !broadcastInput.title || !broadcastInput.message}
              >
                {createBroadcastMutation.isPending ? "SENDING..." : "🚀 LAUNCH_BROADCAST"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isProtectedModalOpen} onOpenChange={setIsProtectedModalOpen}>
          <DialogContent className="bg-zinc-950 border-primary/20 text-primary font-mono max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 uppercase tracking-widest text-primary">
                <ShieldCheck className="w-5 h-5" />
                PROTECTED_TARGETS_MANAGEMENT
              </DialogTitle>
              <DialogDescription className="text-primary/40 uppercase text-[10px] tracking-widest">
                MANAGE NUMBERS, VEHICLES, IP, AND AADHAR PROTECTION
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="TARGET (MOBILE/VEHICLE/IP/AADHAR)..."
                  value={protectedInput.number}
                  onChange={(e) => setProtectedInput({ ...protectedInput, number: e.target.value })}
                  className="bg-black/50 border-primary/20 font-mono text-primary"
                />
                <Input 
                  placeholder="REASON..."
                  value={protectedInput.reason}
                  onChange={(e) => setProtectedInput({ ...protectedInput, reason: e.target.value })}
                  className="bg-black/50 border-primary/20 font-mono text-primary"
                />
                <Button 
                  onClick={() => addProtectedMutation.mutate(protectedInput)}
                  className="bg-primary/20 border-primary/50 text-primary hover:bg-primary/30"
                  disabled={addProtectedMutation.isPending}
                >
                  PROTECT
                </Button>
              </div>
              <ScrollArea className="h-[300px] border border-primary/10 rounded p-2 bg-black/50">
                <div className="space-y-2">
                  {protectedNumbersList?.map((num) => (
                    <div key={num} className="flex items-center justify-between p-2 bg-primary/5 border border-primary/10 rounded group">
                      <span className="text-sm">{num}</span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 text-red-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeProtectedMutation.mutate(num)}
                      >
                        REMOVE
                      </Button>
                    </div>
                  ))}
                  {(!protectedNumbersList || protectedNumbersList.length === 0) && (
                    <div className="text-center py-8 text-primary/20 text-xs">NO PROTECTED TARGETS FOUND</div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isAdminToolsOpen} onOpenChange={setIsAdminToolsOpen}>
          <DialogContent className="bg-zinc-950 border-primary/20 text-primary font-mono max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 uppercase tracking-widest text-primary">
                <Terminal className="w-5 h-5" />
                ADMIN_UTILITY_TERMINAL
              </DialogTitle>
              <DialogDescription className="text-primary/40 uppercase text-[10px] tracking-widest">
                EXECUTE GLOBAL COMMANDS AND GENERATE KEYS
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              <div className="space-y-4 border border-primary/10 p-4 bg-black/50">
                <h3 className="text-xs font-bold uppercase tracking-widest border-b border-primary/10 pb-2">Credit Distribution</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-primary/40">Amount</label>
                    <Input 
                      type="number"
                      value={toolInput.credits}
                      onChange={(e) => setToolInput({ ...toolInput, credits: parseInt(e.target.value) || 0 })}
                      className="bg-black/50 border-primary/20 font-mono text-primary h-8"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={() => giftAllMutation.mutate({ credits: toolInput.credits })}
                    disabled={giftAllMutation.isPending}
                    className="flex-1 bg-primary/20 border-primary/50 text-primary hover:bg-primary/30 h-9 text-[10px] uppercase tracking-widest"
                  >
                    GIFT ALL USERS
                  </Button>
                  <Button 
                    onClick={() => generateCodeMutation.mutate({ credits: toolInput.credits })}
                    disabled={generateCodeMutation.isPending}
                    className="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 h-9 text-[10px] uppercase tracking-widest"
                  >
                    GENERATE CODE
                  </Button>
                </div>
                {generatedCode && (
                  <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded text-center">
                    <div className="text-[10px] uppercase text-primary/60 mb-1">Generated Code</div>
                    <div className="text-lg font-bold tracking-[0.2em]">{generatedCode}</div>
                    <Button 
                      variant="ghost" 
                      className="text-[10px] p-0 h-auto mt-1 text-primary/40 hover:text-primary"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCode);
                        toast({ title: "COPIED TO CLIPBOARD" });
                      }}
                    >
                      COPY_TO_CLIPBOARD
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="bg-zinc-950 border-primary/20 overflow-hidden">
          <CardHeader className="border-b border-primary/10 flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>OPERATIVE_REGISTRY</CardTitle>
              <CardDescription>MANAGE ACCESS AND CREDITS</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-primary/40" />
              <Input 
                placeholder="SEARCH_BY_ID_EMAIL_USER..." 
                className="pl-8 bg-black/50 border-primary/20 text-primary placeholder:text-primary/20 font-mono"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-primary/5 text-xs">
                  <tr>
                    <th className="p-4 font-bold border-b border-primary/10 uppercase tracking-widest">Operative</th>
                    <th className="p-4 font-bold border-b border-primary/10 uppercase tracking-widest">IP Address</th>
                    <th className="p-4 font-bold border-b border-primary/10 uppercase tracking-widest">Credits</th>
                    <th className="p-4 font-bold border-b border-primary/10 uppercase tracking-widest">Status</th>
                    <th className="p-4 font-bold border-b border-primary/10 uppercase tracking-widest">History</th>
                    <th className="p-4 font-bold border-b border-primary/10 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  <AnimatePresence>
                    {filteredUsers?.map((user) => (
                      <motion.tr 
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-primary/5 transition-colors group"
                      >
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-primary font-bold">{user.username || "Unknown"}</span>
                            <span className="text-[10px] text-primary/40 font-mono">{user.email}</span>
                            <span className="text-[10px] text-primary/20 font-mono">{user.id}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-mono text-primary/60">{user.lastIp || "NO_IP"}</span>
                            {user.lastIp && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`h-6 text-[9px] px-2 border ${user.isIpBlocked ? 'border-red-500 text-red-500' : 'border-primary/20 text-primary/40'}`}
                                onClick={() => blockIpMutation.mutate({ userId: user.id, blockIp: !user.isIpBlocked })}
                              >
                                {user.isIpBlocked ? "IP_BLOCKED" : "BLOCK_IP"}
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Input
                            type="number"
                            defaultValue={user.credits}
                            onBlur={(e) => {
                              const newVal = parseInt(e.target.value);
                              if (!isNaN(newVal) && newVal !== user.credits) {
                                updateCreditsMutation.mutate({ userId: user.id, credits: newVal });
                              }
                            }}
                            className="w-24 bg-black/50 border-primary/20 text-primary h-8 text-sm focus:border-primary/50 font-mono"
                          />
                        </td>
                        <td className="p-4">
                          {user.isBlocked ? (
                            <span className="text-red-500 flex items-center gap-1 text-[10px] font-bold tracking-tighter">
                              <Ban className="w-3 h-3" /> BLOCKED
                            </span>
                          ) : (
                            <span className="text-primary flex items-center gap-1 text-[10px] font-bold tracking-tighter">
                              <ShieldCheck className="w-3 h-3" /> ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 hover:bg-primary/10 border border-primary/10"
                            onClick={() => setSelectedUserHistory({ id: user.id, email: user.email || user.username || "User" })}
                          >
                            <HistoryIcon className="w-4 h-4" />
                          </Button>
                        </td>
                        <td className="p-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className={user.isBlocked 
                              ? "border-primary/50 text-primary bg-primary/5 hover:bg-primary/10 h-8 font-mono uppercase text-[10px] tracking-widest" 
                              : "border-red-500/50 text-red-500 bg-red-500/5 hover:bg-red-500/10 h-8 font-mono uppercase text-[10px] tracking-widest"
                            }
                            onClick={() => blockUserMutation.mutate({ userId: user.id, blocked: !user.isBlocked })}
                          >
                            {user.isBlocked ? "Restore" : "Terminate"}
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedUserHistory} onOpenChange={() => setSelectedUserHistory(null)}>
        <DialogContent className="bg-zinc-950 border-primary/20 text-primary font-mono max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 uppercase tracking-widest">
              <HistoryIcon className="w-5 h-5" />
              Operative Activity Log: {selectedUserHistory?.email}
            </DialogTitle>
            <DialogDescription className="text-primary/40 uppercase text-[10px] tracking-widest">
              Full archive of all executed queries in secure database
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] mt-4 border border-primary/10 rounded p-4 bg-black/50">
            {isFetchingAdminHistory && adminHistoryData.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
              </div>
            ) : adminHistoryData.length > 0 ? (
              <div className="space-y-4">
                {adminHistoryData.map((log) => (
                  <div key={log.id} className="border-b border-primary/10 pb-4 last:border-0">
                    <div className="flex justify-between text-[10px] mb-2 font-bold">
                      <span className="text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-sm">{log.service} MODULE</span>
                      <span className="text-primary/40 uppercase tracking-tighter">{new Date(log.createdAt || "").toLocaleString()}</span>
                    </div>
                    <div className="text-xs break-all text-primary/80 bg-primary/5 p-3 border border-primary/5 font-mono leading-relaxed cursor-pointer hover:bg-primary/10" onClick={() => setSelectedLog(log)}>
                      <span className="text-primary/30 mr-2">QUERY &gt;</span> {log.query}
                    </div>
                  </div>
                ))}
                
                {/* Infinite scroll trigger */}
                <div ref={adminLoadMoreRef} className="py-4 flex justify-center">
                  {isFetchingAdminHistory ? (
                    <div className="flex items-center gap-2 text-primary">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="font-mono text-xs">LOADING...</span>
                    </div>
                  ) : hasMoreAdminHistory ? (
                    <span className="font-mono text-xs text-primary/40">SCROLL FOR MORE</span>
                  ) : (
                    <span className="font-mono text-xs text-primary/40">END OF LOGS</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-primary/20">
                <ShieldAlert className="w-12 h-12 mb-4 opacity-10" />
                <p className="text-center font-bold tracking-widest uppercase">No Activity Detected</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="bg-zinc-950 border-primary/20 text-primary font-mono max-w-3xl">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest">QUERY_FULL_DETAILS</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px] mt-4 p-4 bg-black/50 border border-primary/10 rounded">
            <div className="space-y-4">
              <div>
                <h4 className="text-[10px] text-primary/40 uppercase mb-1">Service</h4>
                <div className="text-sm font-bold text-primary">{selectedLog?.service}</div>
              </div>
              <div>
                <h4 className="text-[10px] text-primary/40 uppercase mb-1">Query</h4>
                <div className="text-sm font-bold text-primary break-all">{selectedLog?.query}</div>
              </div>
              <div>
                <h4 className="text-[10px] text-primary/40 uppercase mb-1">Timestamp</h4>
                <div className="text-sm text-primary/60">{selectedLog?.createdAt && new Date(selectedLog.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <h4 className="text-[10px] text-primary/40 uppercase mb-1">Raw Result</h4>
                <pre className="text-xs text-primary/80 whitespace-pre-wrap bg-primary/5 p-4 border border-primary/10 rounded">
                  {JSON.stringify(selectedLog?.result, null, 2)}
                </pre>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
