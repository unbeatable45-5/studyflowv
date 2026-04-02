import { Share2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ShareResultButtonProps {
  text: string;
  title?: string;
  showWhatsApp?: boolean;
  className?: string;
}

const STUDYFLOW_LINK = "https://studyflowv.lovable.app";

const ShareResultButton = ({ text, title = "StudyFlow Result", showWhatsApp = true, className }: ShareResultButtonProps) => {
  const branded = `${text}\n\n📚 Generated with StudyFlow — ${STUDYFLOW_LINK}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: branded });
        return;
      } catch { /* user cancelled */ }
    }
    await navigator.clipboard.writeText(branded);
    toast({ title: "Copied to clipboard!" });
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(branded);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  return (
    <div className={`flex gap-2 ${className || ""}`}>
      <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5 text-xs">
        <Share2 className="h-3.5 w-3.5" /> Share 🔥
      </Button>
      {showWhatsApp && (
        <Button variant="outline" size="sm" onClick={handleWhatsApp} className="gap-1.5 text-xs text-green-600 hover:text-green-700 border-green-200 hover:border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/30">
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </Button>
      )}
    </div>
  );
};

export default ShareResultButton;
