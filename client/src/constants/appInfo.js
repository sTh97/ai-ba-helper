/** Injected at build/dev time from total git commits on HEAD (see vite.config.js). */
export const APP_COMMIT_COUNT = __APP_COMMIT_COUNT__;
export const APP_VERSION = `v${APP_COMMIT_COUNT}`;
export const APP_POWERED_BY = "powered by Multi AI";
export const APP_VERSION_LABEL = `${APP_VERSION} · ${APP_POWERED_BY}`;
