import { computed, inject } from "vue";
import { useSettings } from "@/composables/useSettings";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";

const LOCALES = { en, fr };

export const LOCALE_NAMES = {
	en: "English",
	fr: "Français",
};

/**
 * Overrides for cases where the UI locale code does not directly match the
 * preferred OSM `name:xx` tag suffix. For most languages this is empty —
 * the locale code IS the OSM tag. Add entries here only when they diverge
 * (e.g. if a UI locale ever uses a non-standard code for display purposes).
 *
 * Note: CJK languages should be added as full BCP 47 subtags (`zh-Hans`,
 * `zh-Hant`) rather than bare `zh`, so no override is needed for those either.
 */
const MAP_LANGUAGE_TAG_OVERRIDES = {};

const cache = new Map();

/**
 * Pre-seed the locale cache for use outside Vue setup context (e.g., feature install).
 * Called by main.js before features are installed.
 */
export function initLocaleCache(instanceId, locale, messages) {
	if (!cache.has(instanceId)) {
		cache.set(instanceId, { defaultLocale: locale, customMessages: messages ?? {} });
	}
}

/**
 * @param {string} [instanceId] - App instance ID. If omitted, resolved via inject('onrteAppId').
 *   Pass explicitly when calling from outside Vue setup context (e.g. a feature install()).
 */
export const useLocale = (instanceId) => {
	const id = instanceId ?? inject("onrteAppId", "app");

	if (!cache.has(id)) {
		const defaultLocale = inject("navigatorLocale", null);
		const customMessages = inject("navigatorMessages", {});
		cache.set(id, { defaultLocale, customMessages });
	}

	const { defaultLocale, customMessages } = cache.get(id);
	const { language, setLanguage } = useSettings(id);

	const locale = computed(() => {
		// 1. Explicit user choice stored in settings
		if (language.value) return language.value;

		// 2. Default locale from ?locale= URL param
		if (defaultLocale && LOCALES[defaultLocale]) return defaultLocale;

		// 3. Browser language — try exact match then base code
		if (typeof navigator !== "undefined" && navigator.language) {
			const full = navigator.language; // e.g. "fr-CA"
			const base = full.split("-")[0]; // e.g. "fr"
			if (LOCALES[full]) return full;
			if (LOCALES[base]) return base;
		}

		// 4. English fallback
		return "en";
	});

	/**
	 * Translate a key. Resolution order:
	 *   custom messages for active locale → active locale → English → key itself
	 */
	const t = (key) => {
		const lang = locale.value;
		const custom = customMessages[lang] ?? {};
		const msgs = LOCALES[lang] ?? LOCALES.en;
		return custom[key] ?? msgs[key] ?? LOCALES.en[key] ?? key;
	};

	const setLocale = (code) => setLanguage(code);

	/**
	 * The locale code formatted as an OSM `name:xx` tag suffix.
	 * For most locales this equals `locale.value` directly.
	 * Use this value when building MapLibre coalesce expressions for
	 * multilingual map labels (see docs/core/6.locale.md — OSM Multilingual Names).
	 */
	const mapLanguageTag = computed(
		() => MAP_LANGUAGE_TAG_OVERRIDES[locale.value] ?? locale.value,
	);

	return {
		locale,
		locales: Object.keys(LOCALES),
		localeNames: LOCALE_NAMES,
		mapLanguageTag,
		t,
		setLocale,
	};
};
