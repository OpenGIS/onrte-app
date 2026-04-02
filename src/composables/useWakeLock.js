import { inject } from "vue";
import { createDebug } from "@/debug.js";

const debug = createDebug("wake-lock");
const instances = new Map();

/**
 * Manages the Screen Wake Lock API for an app instance.
 *
 * Acquires a wake lock on first user interaction with the app container and
 * re-acquires it automatically whenever the page becomes visible again after
 * being hidden (e.g. tab switch, screen lock).
 *
 * Usage: call `init(el)` from onMounted, passing the root app element.
 */
export const useWakeLock = () => {
    const instanceId = inject("onrteAppId", "app");

    if (!instances.has(instanceId)) {
        instances.set(instanceId, {
            sentinel: null,
            activated: false,
        });
    }

    const s = instances.get(instanceId);
    const supported = "wakeLock" in navigator;
    if (!supported) debug.warn("Wake Lock API not supported in this browser");

    const acquire = async () => {
        if (!supported || s.sentinel) return;
        debug.log("requesting screen wake lock");
        try {
            s.sentinel = await navigator.wakeLock.request("screen");
            debug.log("wake lock acquired", s.sentinel);
            s.sentinel.addEventListener("release", () => {
                debug.log("wake lock released", { visibilityState: document.visibilityState });
                s.sentinel = null;
            });
        } catch (err) {
            debug.warn("wake lock request denied", err);
        }
    };

    const onVisibilityChange = () => {
        debug.log("visibilitychange", { visibilityState: document.visibilityState, activated: s.activated, hasSentinel: !!s.sentinel });
        if (s.activated && document.visibilityState === "visible") {
            acquire();
        }
    };

    const init = () => {
        if (!supported) return;
        debug.log("init — waiting for first interaction");

        document.addEventListener(
            "pointerdown",
            () => {
                debug.log("first interaction detected — acquiring wake lock");
                s.activated = true;
                acquire();
            },
            { once: true },
        );

        document.addEventListener("visibilitychange", onVisibilityChange);
    };

    return { init };
};
