import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallPlatform = "native" | "ios-safari" | "android-browser" | "none";

function getInstallPlatform(): InstallPlatform {
  // Already installed as standalone
  if (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  ) {
    return "none";
  }

  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);
  const isAndroid = /android/.test(ua);
  const isChrome = /chrome/.test(ua) && !/edge|edg/.test(ua);

  // iOS Safari doesn't support beforeinstallprompt — must guide user manually
  if (isIOS && isSafari) return "ios-safari";
  // Older Android browsers without prompt support
  if (isAndroid && !isChrome) return "android-browser";

  return "native";
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>("native");
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const p = getInstallPlatform();
    setPlatform(p);

    if (p === "none") {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const installedHandler = () => setIsInstalled(true);

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const install = useCallback(async () => {
    // Native prompt available (Chrome, Edge, Samsung Internet, etc.)
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === "accepted") {
        setIsInstalled(true);
        return true;
      }
      return false;
    }

    // iOS Safari — show manual guide
    if (platform === "ios-safari") {
      setShowIOSGuide(true);
      return false;
    }

    // Android browser without prompt — show manual guide
    if (platform === "android-browser") {
      setShowIOSGuide(true); // reuse the guide dialog
      return false;
    }

    return false;
  }, [deferredPrompt, platform]);

  const dismissGuide = useCallback(() => setShowIOSGuide(false), []);

  // canInstall is true if:
  // 1. Native prompt is available, OR
  // 2. iOS Safari (can always guide user), OR
  // 3. Android browser (can guide user)
  const canInstall =
    !isInstalled &&
    (!!deferredPrompt || platform === "ios-safari" || platform === "android-browser");

  return {
    canInstall,
    isInstalled,
    install,
    platform,
    showIOSGuide,
    dismissGuide,
  };
}
