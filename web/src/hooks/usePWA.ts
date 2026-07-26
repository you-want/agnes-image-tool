"use client";

import { useCallback, useEffect, useState, useRef } from "react";

interface ExtendedServiceWorkerRegistration extends Omit<ServiceWorkerRegistration, "showNotification" | "getNotifications"> {
  showNotification?: (title: string, options?: NotificationOptions) => Promise<void>;
  getNotifications?: () => Promise<Notification[]>;
}

interface UsePWAProps {
  immediate?: boolean;
  onRegister?: (registration: ExtendedServiceWorkerRegistration) => void;
  onUpdate?: (registration: ExtendedServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

export function usePWA({
  immediate = true,
  onRegister,
  onUpdate,
  onOffline,
  onOnline,
}: UsePWAProps = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [registration, setRegistration] = useState<ExtendedServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const isSWSupportedRef = useRef(false);

  useEffect(() => {
    // Check if service workers are supported
    isSWSupportedRef.current = "serviceWorker" in navigator;
    setIsSupported(isSWSupportedRef.current);

    if (!isSWSupportedRef.current) return;

    // Handle online/offline status
    const handleOnline = () => {
      setIsOffline(false);
      onOnline?.();
    };

    const handleOffline = () => {
      setIsOffline(true);
      onOffline?.();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Seed from the current status — a page loaded while already offline would
    // otherwise report itself as online until the next transition.
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [onOffline, onOnline]);

  const registerServiceWorker = useCallback(async () => {
    if (!isSWSupportedRef.current) return;

    try {
      const reg = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      setRegistration(reg as ExtendedServiceWorkerRegistration);

      // Listen for updates
      reg.addEventListener("updatefound", () => {
        const installingWorker = reg.installing;
        installingWorker?.addEventListener("statechange", () => {
          if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
            onUpdate?.(reg as ExtendedServiceWorkerRegistration);
          }
        });
      });

      // Handle service worker messages
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "UPDATE_AVAILABLE") {
          setUpdateAvailable(true);
        }
      });

      onRegister?.(reg as ExtendedServiceWorkerRegistration);
    } catch (error) {
      console.error("Failed to register service worker:", error);
    }
  }, [onRegister, onUpdate]);

  useEffect(() => {
    if (!immediate || !isSWSupportedRef.current) return;

    registerServiceWorker();
  }, [immediate, registerServiceWorker]);

  const updateServiceWorker = () => {
    if (updateAvailable && registration) {
      registration.waiting?.postMessage({ type: "SKIP_WAITING" });
      setUpdateAvailable(false);
    }
  };

  return {
    isSupported,
    isOffline,
    registration,
    updateAvailable,
    updateServiceWorker,
  };
}

// Hook to check if the app is running as a PWA
export function useIsPWA() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      setIsStandalone(
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
      );
    };

    checkStandalone();
    window.addEventListener("displaymodechange", checkStandalone);

    return () => window.removeEventListener("displaymodechange", checkStandalone);
  }, []);

  return isStandalone;
}

// Hook to handle install prompt
/** The non-standard (Chromium-only) beforeinstallprompt event. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return false;

    try {
      // `userChoice` lives on the event itself, not on prompt()'s return value.
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setIsInstallable(false);

      return outcome === "accepted";
    } catch (error) {
      console.error("Failed to install app:", error);
      return false;
    }
  };

  return {
    isInstallable,
    installApp,
    deferredPrompt,
  };
}
