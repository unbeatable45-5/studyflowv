import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, CheckCircle2 } from "lucide-react";

interface SlidePreviewCarouselProps {
  images: string[];
  excludedSlides?: Set<number>;
  onExcludedChange?: (excluded: Set<number>) => void;
}

const SlidePreviewCarousel = ({ images, excludedSlides, onExcludedChange }: SlidePreviewCarouselProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const excluded = excludedSlides ?? new Set<number>();

  if (images.length === 0) return null;

  const toggleExclude = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(excluded);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    onExcludedChange?.(next);
  };

  const includedCount = images.length - excluded.size;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-foreground">
          Slide Preview ({includedCount}/{images.length} selected)
        </p>
        {excluded.size > 0 && (
          <button
            onClick={() => onExcludedChange?.(new Set())}
            className="text-[10px] text-primary hover:underline"
          >
            Select all
          </button>
        )}
      </div>

      {/* Thumbnail grid */}
      <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
        {images.map((img, i) => {
          const isExcluded = excluded.has(i);
          return (
            <div key={i} className="relative">
              <button
                onClick={() => setSelectedIndex(selectedIndex === i ? null : i)}
                className={`relative rounded-md overflow-hidden border-2 transition-all aspect-[4/3] w-full ${
                  isExcluded
                    ? "border-destructive/40 opacity-40 grayscale"
                    : selectedIndex === i
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <img
                  src={img}
                  alt={`Slide ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <span className="absolute bottom-0 right-0 bg-background/80 text-[9px] font-medium px-1 py-0.5 rounded-tl text-foreground">
                  {i + 1}
                </span>
              </button>
              {/* Exclude/include toggle */}
              <button
                onClick={(e) => toggleExclude(i, e)}
                className={`absolute -top-1 -right-1 rounded-full p-0.5 shadow-sm transition-colors z-10 ${
                  isExcluded
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
                title={isExcluded ? "Include this slide" : "Exclude this slide"}
              >
                {isExcluded ? (
                  <X className="h-3 w-3" />
                ) : (
                  <CheckCircle2 className="h-3 w-3" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Enlarged preview */}
      {selectedIndex !== null && (
        <div className="relative rounded-lg border border-border overflow-hidden bg-muted animate-fade-in">
          <img
            src={images[selectedIndex]}
            alt={`Slide ${selectedIndex + 1}`}
            className={`w-full object-contain max-h-64 ${excluded.has(selectedIndex) ? "opacity-40 grayscale" : ""}`}
          />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={selectedIndex === 0}
              onClick={() => setSelectedIndex(selectedIndex - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[10px] font-medium text-foreground min-w-[3rem] text-center">
              {selectedIndex + 1} / {images.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={selectedIndex === images.length - 1}
              onClick={() => setSelectedIndex(selectedIndex + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlidePreviewCarousel;
