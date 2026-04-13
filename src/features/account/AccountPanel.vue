<script setup>
import { computed, onMounted, ref } from "vue";
import { useLocale } from "@/composables/useLocale";
import { useAuthStore } from "@/stores/authStore";

const { t } = useLocale();
const {
    user,
    loading,
    sessionError,
    isAuthenticated,
    submittingMagicLink,
    magicLinkMessage,
    magicLinkError,
    magicLinkRetryAfter,
    refreshSession,
    requestMagicLink,
    logout,
    clearFeedback,
} = useAuthStore();

const email = ref("");
const panelError = ref(null);

const callbackUrl = computed(
    () => `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`,
);

const memberSinceLabel = computed(() => {
    if (!user.value?.created_at) return null;
    const date = new Date(user.value.created_at);
    if (Number.isNaN(date.getTime())) return user.value.created_at;
    return date.toLocaleString();
});

const refreshSessionState = async () => {
    panelError.value = null;
    try {
        await refreshSession();
    } catch {
        panelError.value = t("panel.account.errorSession");
    }
};

const submitMagicLink = async () => {
    panelError.value = null;
    const result = await requestMagicLink(email.value, callbackUrl.value);
    if (result.ok) {
        email.value = "";
    }
};

const logoutSession = async () => {
    panelError.value = null;
    try {
        await logout();
    } catch {
        panelError.value = t("panel.account.errorLogout");
    }
};

onMounted(() => {
    clearFeedback();
    refreshSessionState();
});
</script>

<template>
    <div class="onrte-account-panel">
        <div class="sidebar-section sidebar-section-body p-3 pb-0">
            <h5 class="mb-0">{{ t("panel.account.title") }}</h5>
        </div>

        <div class="sidebar-section sidebar-section-body p-3 border-top">
            <p class="small text-body-secondary mb-3">
                {{ t("panel.account.description") }}
            </p>

            <div v-if="loading" class="small text-body-secondary">
                {{ t("panel.account.loading") }}
            </div>

            <template v-else-if="isAuthenticated">
                <p class="mb-1">
                    <strong>{{ t("panel.account.signedInAs") }}:</strong>
                    {{ user.username }}
                </p>
                <p v-if="memberSinceLabel" class="mb-3 small text-body-secondary">
                    <strong>{{ t("panel.account.memberSince") }}:</strong>
                    {{ memberSinceLabel }}
                </p>
                <div class="d-flex gap-2">
                    <button
                        id="account-refresh-session"
                        type="button"
                        class="btn btn-sm btn-outline-secondary"
                        @click="refreshSessionState"
                    >
                        {{ t("panel.account.checkSession") }}
                    </button>
                    <button
                        id="account-logout"
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        @click="logoutSession"
                    >
                        {{ t("panel.account.logout") }}
                    </button>
                </div>
            </template>

            <template v-else>
                <label for="account-email" class="form-label small">
                    {{ t("panel.account.emailLabel") }}
                </label>
                <input
                    id="account-email"
                    v-model.trim="email"
                    type="email"
                    class="form-control form-control-sm"
                    :placeholder="t('panel.account.emailPlaceholder')"
                    autocomplete="email"
                />
                <div class="d-flex gap-2 mt-2">
                    <button
                        id="account-request-magic-link"
                        type="button"
                        class="btn btn-sm btn-primary"
                        :disabled="submittingMagicLink"
                        @click="submitMagicLink"
                    >
                        {{
                            submittingMagicLink
                                ? t("panel.account.requesting")
                                : t("panel.account.requestMagicLink")
                        }}
                    </button>
                    <button
                        id="account-check-session"
                        type="button"
                        class="btn btn-sm btn-outline-secondary"
                        @click="refreshSessionState"
                    >
                        {{ t("panel.account.checkSession") }}
                    </button>
                </div>
            </template>

            <p
                v-if="magicLinkMessage"
                class="alert alert-success small py-2 px-3 mt-3 mb-0"
                role="status"
            >
                {{ magicLinkMessage }}
            </p>

            <p
                v-if="magicLinkError"
                class="alert alert-warning small py-2 px-3 mt-3 mb-0"
                role="alert"
            >
                {{ magicLinkError }}
                <span v-if="magicLinkRetryAfter">
                    ({{ magicLinkRetryAfter }}s). {{ t("panel.account.retryAfterHint") }}
                </span>
            </p>

            <p
                v-if="panelError || sessionError"
                class="alert alert-danger small py-2 px-3 mt-3 mb-0"
                role="alert"
            >
                {{ panelError || sessionError }}
            </p>
        </div>
    </div>
</template>
