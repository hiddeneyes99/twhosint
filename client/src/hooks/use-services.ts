import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Helper to handle API errors consistently
const handleApiError = (error: unknown) => {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message.replace(/^\d+:\s*/, ''));
      return parsed.message || error.message;
    } catch {
      return error.message;
    }
  }
  return "An unknown error occurred";
};

// Mobile Info Hook
export function useMobileInfo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: z.infer<typeof api.services.mobile.input>) => {
      const token = (window as any).firebaseToken;
      const res = await fetch(api.services.mobile.path, {
        method: api.services.mobile.method,
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const error = new Error(errorData.message || res.statusText);
        (error as any).reason = errorData.reason;
        throw error;
      }
      
      return api.services.mobile.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.user.me.path] });
    },
    onError: (error: Error) => {
      // Don't show toast for protected numbers as we have a custom full-screen alert
      if (error.message.toLowerCase().includes("protected")) {
        return;
      }
      toast({
        title: "SYSTEM ERROR",
        description: handleApiError(error),
        variant: "destructive",
      });
    }
  });
}

// Aadhar Info Hook
export function useAadharInfo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: z.infer<typeof api.services.aadhar.input>) => {
      const token = (window as any).firebaseToken;
      const res = await fetch(api.services.aadhar.path, {
        method: api.services.aadhar.method,
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const error = new Error(errorData.message || res.statusText);
        (error as any).reason = errorData.reason;
        throw error;
      }
      
      return api.services.aadhar.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.user.me.path] });
    },
    onError: (error: Error) => {
      // Don't show toast for protected numbers as we have a custom full-screen alert
      if (error.message.toLowerCase().includes("protected")) {
        return;
      }
      toast({
        title: "SYSTEM ERROR",
        description: handleApiError(error),
        variant: "destructive",
      });
    }
  });
}

// Vehicle Info Hook
export function useVehicleInfo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: z.infer<typeof api.services.vehicle.input>) => {
      const token = (window as any).firebaseToken;
      const res = await fetch(api.services.vehicle.path, {
        method: api.services.vehicle.method,
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const error = new Error(errorData.message || res.statusText);
        (error as any).reason = errorData.reason;
        throw error;
      }
      
      return api.services.vehicle.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.user.me.path] });
    },
    onError: (error: Error) => {
      // Don't show toast for protected numbers as we have a custom full-screen alert
      if (error.message.toLowerCase().includes("protected")) {
        return;
      }
      toast({
        title: "SYSTEM ERROR",
        description: handleApiError(error),
        variant: "destructive",
      });
    }
  });
}

// IP Info Hook
export function useIpInfo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: z.infer<typeof api.services.ip.input>) => {
      const token = (window as any).firebaseToken;
      const res = await fetch(api.services.ip.path, {
        method: api.services.ip.method,
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const error = new Error(errorData.message || res.statusText);
        (error as any).reason = errorData.reason;
        throw error;
      }
      
      return api.services.ip.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.user.me.path] });
    },
    onError: (error: Error) => {
      // Don't show toast for protected numbers as we have a custom full-screen alert
      if (error.message.toLowerCase().includes("protected")) {
        return;
      }
      toast({
        title: "SYSTEM ERROR",
        description: handleApiError(error),
        variant: "destructive",
      });
    }
  });
}
