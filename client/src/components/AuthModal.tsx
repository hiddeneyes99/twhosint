import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { CyberButton } from "@/components/CyberButton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

  const authSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    termsAccepted: z.boolean().optional(),
    privacyAccepted: z.boolean().optional(),
  });

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register, googleLogin } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
      termsAccepted: false,
      privacyAccepted: false,
    },
  });

  const onSubmit = async (data: z.infer<typeof authSchema>) => {
    if (!isLogin && (!data.termsAccepted || !data.privacyAccepted)) {
      toast({
        title: "Validation Error",
        description: "Please accept all terms and conditions to continue",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        await login({ email: data.email, password: data.password });
      } else {
        // Pass terms and privacy headers for the registration request
        const registerHeaders = {
          'x-terms-accepted': String(data.termsAccepted),
          'x-privacy-accepted': String(data.privacyAccepted),
        };
        
        await register({ 
          email: data.email, 
          password: data.password,
          termsAccepted: data.termsAccepted,
          privacyAccepted: data.privacyAccepted,
          headers: registerHeaders // This needs support in useAuth/apiRequest
        } as any);
      }
      onClose();
      setLocation("/dashboard");
      toast({
        title: "Success",
        description: isLogin ? "Logged in successfully" : "Account created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isLogin) {
      const termsAccepted = form.getValues("termsAccepted");
      const privacyAccepted = form.getValues("privacyAccepted");

      if (!termsAccepted || !privacyAccepted) {
        toast({
          title: "SIGNUP_RESTRICTED",
          description: "PLEASE ACCEPT TERMS AND PRIVACY POLICY BEFORE INITIALIZING GOOGLE_AUTH",
          variant: "destructive",
        });
        
        // Trigger validation errors on the form fields
        form.trigger(["termsAccepted", "privacyAccepted"]);
        return;
      }
    }

    try {
      // Pass terms/privacy headers for Google login if it's a new signup
      const headers: Record<string, string> = {};
      if (!isLogin) {
        headers['x-terms-accepted'] = String(form.getValues("termsAccepted"));
        headers['x-privacy-accepted'] = String(form.getValues("privacyAccepted"));
      }
      
      await googleLogin(headers);
      onClose();
      setLocation("/dashboard");
    } catch (error: any) {
      if (error.code !== "auth/popup-closed-by-user") {
        toast({
          title: "Error",
          description: "Google login failed",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-background border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold font-display text-primary text-glow">
            {isLogin ? "SYSTEM ACCESS" : "CREATE IDENTIFIER"}
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {isLogin ? "Enter credentials to initialize session" : "Register new user in the database"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs">EMAIL_ADDRESS</FormLabel>
                    <FormControl>
                      <Input placeholder="user@system.local" {...field} className="bg-black/50 border-primary/30" />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono text-xs">PASSWORD_TOKEN</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="bg-black/50 border-primary/30" />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              {!isLogin && (
                <>
                  <FormField
                    control={form.control}
                    name="termsAccepted"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-[10px] font-mono text-primary/70">
                            I ACCEPT THE{" "}
                            <Link href="/terms" className="text-primary hover:underline underline-offset-4 decoration-primary/30">
                              TERMS_OF_SERVICE
                            </Link>
                          </FormLabel>
                          <FormMessage className="text-[8px]" />
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="privacyAccepted"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-1">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-[10px] font-mono text-primary/70">
                            I ACCEPT THE{" "}
                            <Link href="/privacy" className="text-primary hover:underline underline-offset-4 decoration-primary/30">
                              PRIVACY_POLICY
                            </Link>
                          </FormLabel>
                          <FormMessage className="text-[8px]" />
                        </div>
                      </FormItem>
                    )}
                  />
                </>
              )}
              <CyberButton type="submit" className="w-full" isLoading={isLoading}>
                {isLogin ? "INITIALIZE LOGIN" : "EXECUTE SIGNUP"}
              </CyberButton>
            </form>
          </Form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full bg-primary/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-mono">OR_AUTH_VIA</span>
            </div>
          </div>

          <CyberButton
            variant="outline"
            className="w-full border-primary/30"
            onClick={handleGoogleLogin}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            GOOGLE_ACCOUNT
          </CyberButton>

          <div className="text-center pt-2">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-mono text-primary/60 hover:text-primary transition-colors uppercase tracking-widest"
            >
              {isLogin ? "Need an identifier? Create one →" : "Existing identifier? Login →"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
