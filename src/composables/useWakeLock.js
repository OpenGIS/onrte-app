import { inject } from "vue";

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

    const acquire = async () => {
        if (!supported || s.sentinel) return;
        try {
            s.sentinel = await navigator.wakeLock.request("screen");
            s.sentinel.addEventListener("release", () => {
                s.sentinel = null;
            });
        } catch {
            // Browser denied the request (e.g. low battery, permission policy)
        }
    };

    const onVisibilityChange = () => {
        if (s.activated && document.visibilityState === "visible") {
            acquire();
        }
    };

    const init = (el) => {
        if (!supported) return;

        el.addEventListener(
            "pointerdown",
            () => {
                s.activated = true;
                acquire();
            },
            { once: true },
        );

        document.addEventListener("visibilitychange", onVisibilityChange);
    };

    return { init };
};
