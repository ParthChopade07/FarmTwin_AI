// Web Audio API Chime synthesizer + Native Web/PWA Notification Manager

class NotificationManager {
  constructor() {
    this.audioCtx = null;
    this.permission = (typeof window !== "undefined" && "Notification" in window)
      ? Notification.permission
      : "default";
  }

  // Synthesize audible chime tone based on alert severity
  playChime(severity = "warning") {
    try {
      if (typeof window === "undefined") return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (severity === "critical" || severity === "CRITICAL") {
        // High urgency 2-tone siren
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);
        osc.frequency.setValueAtTime(880, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.35);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else {
        // Friendly 3-tone harmonic chime
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880.00, now + 0.1); // A5
        osc.frequency.setValueAtTime(1174.66, now + 0.2); // D6

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch {
      // Audio context autoplay policy or device muted
    }
  }

  // Request browser permission for Native OS popups
  async requestPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    try {
      const res = await Notification.requestPermission();
      this.permission = res;
      return res;
    } catch {
      return "denied";
    }
  }

  // Display native OS Notification (works online, minimized, or in background)
  showNative(title, { body, icon = "/favicon.ico", tag = "farmtwin-alert", data = {} } = {}) {
    if (typeof window === "undefined" || !("Notification" in window)) return null;

    if (Notification.permission === "granted") {
      try {
        const notif = new Notification(`🌱 FarmTwin: ${title}`, {
          body,
          icon,
          badge: icon,
          tag,
          renotify: true,
          requireInteraction: true,
          data,
        });

        notif.onclick = () => {
          window.focus();
          window.location.href = "/alerts";
          notif.close();
        };

        return notif;
      } catch {
        // Fallback for Service Worker push on mobile Android
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "SHOW_NOTIFICATION",
            title: `🌱 FarmTwin: ${title}`,
            options: { body, icon, tag },
          });
        }
      }
    }
    return null;
  }
}

export const notifier = new NotificationManager();
