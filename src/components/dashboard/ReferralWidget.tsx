import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Copy, Check, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const STUDYFLOW_LINK = "https://studyflowv.lovable.app";

function generateCode(): string {
  return "SF-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

const ReferralWidget = () => {
  const { user } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [bonusDays, setBonusDays] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("referrals" as any)
        .select("*")
        .eq("referrer_id", user.id);

      const rows = (data || []) as any[];
      if (rows.length > 0) {
        setCode(rows[0].referral_code);
        const redeemed = rows.filter((r: any) => r.status === "redeemed");
        setReferralCount(redeemed.length);
        setBonusDays(redeemed.reduce((s: number, r: any) => s + (r.bonus_days || 3), 0));
      } else {
        const newCode = generateCode();
        await supabase.from("referrals" as any).insert({
          referrer_id: user.id,
          referral_code: newCode,
        } as any);
        setCode(newCode);
      }
    })();
  }, [user]);

  const handleCopy = async () => {
    if (!code) return;
    const msg = `📚 Study smarter with StudyFlow! Use my referral code ${code} to sign up and we both get 3 free Pro days.\n\n${STUDYFLOW_LINK}?ref=${code}`;
    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      toast({ title: "Referral link copied!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy", variant: "destructive" });
    }
  };

  const handleWhatsApp = () => {
    if (!code) return;
    const msg = encodeURIComponent(`📚 Study smarter with StudyFlow! Use my code ${code} to sign up and we both get 3 free Pro days.\n\n${STUDYFLOW_LINK}?ref=${code}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/10 overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="rounded-xl p-2 bg-primary/10">
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-foreground">Invite Friends, Get Pro Free</h3>
            <p className="text-[11px] text-muted-foreground">Share your code — both get 3 Pro days!</p>
          </div>
        </div>

        {code && (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted/50 rounded-xl px-3 py-2 font-mono text-sm font-bold text-foreground tracking-wider text-center border border-border/50">
              {code}
            </div>
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1 shrink-0 rounded-xl">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Button size="sm" className="flex-1 gap-1.5 rounded-xl text-xs" onClick={handleWhatsApp}>
            Share on WhatsApp
          </Button>
        </div>

        {referralCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
            <Users className="h-3.5 w-3.5" />
            <span>{referralCount} friend{referralCount > 1 ? "s" : ""} joined • <span className="text-primary font-semibold">{bonusDays} bonus days earned</span></span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralWidget;
