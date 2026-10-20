"use client";

const DEVICE_ID_KEY = "qpaper_device_id";
const DEVICE_FP_KEY = "qpaper_device_fp";

// Simple fast deterministic string hash (djb2 / murmur hybrid)
function hashString(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c64e6d;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const hex2 = (h2 >>> 0).toString(16).padStart(8, "0");
  return `${hex1}${hex2}`;
}

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "no-canvas";

    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial', sans-serif";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("ExamCraft Q-Paper <dev:id>", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("ExamCraft Q-Paper <dev:id>", 4, 17);

    return hashString(canvas.toDataURL());
  } catch {
    return "canvas-blocked";
  }
}

function getWebGlFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return "no-webgl";
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return "no-debug-info";
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "";
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "";
    return `${vendor}~${renderer}`;
  } catch {
    return "webgl-blocked";
  }
}

let cachedInfo: { deviceId: string; fingerprintHash: string } | null = null;

export function getClientDeviceInfo(): { deviceId: string; fingerprintHash: string } {
  if (typeof window === "undefined") {
    return { deviceId: "ssr-device", fingerprintHash: "ssr-fp" };
  }

  if (cachedInfo) return cachedInfo;

  // 1. Retrieve or generate persistent deviceId
  let deviceId: string | null = null;
  try {
    deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      // Check cookie
      const match = document.cookie.match(new RegExp(`(^| )${DEVICE_ID_KEY}=([^;]+)`));
      if (match) deviceId = match[2];
    }
  } catch {
    // LocalStorage blocked
  }

  if (!deviceId) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      deviceId = `dev_${crypto.randomUUID()}`;
    } else {
      deviceId = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }

    try {
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
      document.cookie = `${DEVICE_ID_KEY}=${deviceId}; path=/; max-age=315360000; SameSite=Lax`;
    } catch {
      // Ignore storage errors
    }
  }

  // 2. Compute stable browser/hardware fingerprint
  let fingerprintHash: string | null = null;
  try {
    fingerprintHash = sessionStorage.getItem(DEVICE_FP_KEY);
  } catch {
    // Ignore
  }

  if (!fingerprintHash) {
    const signals = [
      window.screen?.width || 0,
      window.screen?.height || 0,
      window.screen?.colorDepth || 0,
      window.devicePixelRatio || 1,
      navigator.hardwareConcurrency || 1,
      (navigator as any).deviceMemory || 0,
      navigator.platform || "",
      navigator.language || "",
      Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      getCanvasFingerprint(),
      getWebGlFingerprint()
    ];

    fingerprintHash = `fp_${hashString(signals.join("###"))}`;
    try {
      sessionStorage.setItem(DEVICE_FP_KEY, fingerprintHash);
    } catch {
      // Ignore
    }
  }

  cachedInfo = { deviceId, fingerprintHash };
  return cachedInfo;
}

export function getDeviceHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const info = getClientDeviceInfo();
  return {
    "x-device-id": info.deviceId,
    "x-device-fingerprint": info.fingerprintHash
  };
}
