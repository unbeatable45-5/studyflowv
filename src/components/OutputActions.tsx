import { Copy, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyToClipboard, shareContent } from "@/lib/streaming";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface OutputActionsProps {
  text: string;
  title?: string;
}

const OutputActions = ({ text, title = "StudyFlow" }: OutputActionsProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied to clipboard!" });
    }
  };

  const handleShare = async () => {
    await shareContent(title, text);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy"}
      </Button>
      <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
        <Share2 className="h-4 w-4" />
        Share
      </Button>
    </div>
  );
};

export default OutputActions;
