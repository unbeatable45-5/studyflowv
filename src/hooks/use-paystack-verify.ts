import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * After Paystack redirects back, verify the payment reference
 * and activate premium if successful.
 */
export const usePaystackVerify = (onVerified?: () => void) => {
  useEffect(() => {
    const reference = localStorage.getItem("paystack_reference");
    const url = new URL(window.location.href);
    const refFromUrl = url.searchParams.get("reference") || url.searchParams.get("trxref");

    const ref = refFromUrl || reference;
    if (!ref) return;

    // Clean up
    localStorage.removeItem("paystack_reference");
    url.searchParams.delete("reference");
    url.searchParams.delete("trxref");
    window.history.replaceState({}, "", url.pathname);

    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("paystack-verify", {
          body: { reference: ref },
        });

        if (error) throw error;

        if (data?.success && data?.premium) {
          toast({ title: "🎉 Welcome to StudyFlow Pro!", description: "Your premium features are now active." });
          onVerified?.();
        } else {
          toast({ title: "Payment verification failed", description: "Please contact support.", variant: "destructive" });
        }
      } catch (err: any) {
        toast({ title: "Verification error", description: err.message, variant: "destructive" });
      }
    };

    verify();
  }, [onVerified]);
};
