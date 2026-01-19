import { useState, useEffect } from "react";
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type FirebaseUser
} from "@/lib/firebase";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingFirebase, setIsLoadingFirebase] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        setToken(idToken);
        (window as any).firebaseToken = idToken;
        setFirebaseUser(user);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      } else {
        setToken(null);
        (window as any).firebaseToken = null;
        setFirebaseUser(null);
        queryClient.setQueryData(["/api/auth/user"], null);
      }
      setIsLoadingFirebase(false);
    });
    return () => unsubscribe();
  }, [queryClient]);

  const { data: user, isLoading: isLoadingUser } = useQuery<User | null>({
    queryKey: ["/api/auth/user", token],
    queryFn: async () => {
      if (!token) return null;
      const headers: Record<string, string> = { "Authorization": `Bearer ${token}` };
      
      const storedHeaders = sessionStorage.getItem('auth_headers');
      if (storedHeaders) {
        try {
          const extraHeaders = JSON.parse(storedHeaders);
          Object.assign(headers, extraHeaders);
          sessionStorage.removeItem('auth_headers');
        } catch (e) {
          console.error("Error parsing stored auth headers", e);
        }
      }

      const res = await fetch("/api/auth/user", {
        headers
      });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    enabled: !!token,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: any) => {
      const res = await signInWithEmailAndPassword(auth, email, password);
      return res.user;
    }
  });

  const registerMutation = useMutation({
    mutationFn: async ({ email, password, headers }: any) => {
      if (headers) {
        sessionStorage.setItem('auth_headers', JSON.stringify(headers));
      }
      const res = await createUserWithEmailAndPassword(auth, email, password);
      return res.user;
    }
  });

  const googleLoginMutation = useMutation({
    mutationFn: async (headers?: Record<string, string>) => {
      if (headers) {
        sessionStorage.setItem('auth_headers', JSON.stringify(headers));
      }
      const res = await signInWithPopup(auth, googleProvider);
      return res.user;
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await signOut(auth);
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return {
    user,
    isLoading: isLoadingFirebase || (!!firebaseUser && isLoadingUser),
    isAuthenticated: !!firebaseUser,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    googleLogin: googleLoginMutation.mutateAsync,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
