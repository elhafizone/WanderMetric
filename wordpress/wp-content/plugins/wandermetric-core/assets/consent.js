/**
 * WanderMetric consent and deferred third-party loading.
 *
 * - The choice ("all" | "essential") lives in localStorage and a first-party cookie.
 * - Elements with [data-wm-widget-src] get their partner script only after "all".
 * - Google Analytics loads only after "all", with Google signals and ad
 *   personalisation off.
 * - Any element with [data-wm-consent-open] reopens the notice.
 */
(() => {
	const KEY = "wm_consent";
	const MAX_AGE = 60 * 60 * 24 * 180;
	const ALLOWED_HOSTS = ["tpemd.com"];

	const read = () => {
		try {
			const v = window.localStorage.getItem(KEY);
			if (v) return v;
		} catch {
			/* storage blocked: fall back to the cookie */
		}
		const m = document.cookie.match(/(?:^|;\s*)wm_consent=(all|essential)/);
		return m ? m[1] : null;
	};

	const write = (value) => {
		try {
			window.localStorage.setItem(KEY, value);
		} catch {
			/* ignore */
		}
		const secure = location.protocol === "https:" ? "; Secure" : "";
		document.cookie = `${KEY}=${value}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
	};

	const loadWidgets = () => {
		document.querySelectorAll("[data-wm-widget-src]").forEach((box) => {
			if (box.dataset.wmLoaded) return;
			let url;
			try {
				url = new URL(box.dataset.wmWidgetSrc);
			} catch {
				return;
			}
			if (url.protocol !== "https:" || !ALLOWED_HOSTS.includes(url.hostname)) return;
			const mount = box.querySelector(".wm-widget-mount") || box;
			const s = document.createElement("script");
			s.async = true;
			s.charset = "utf-8";
			s.src = url.href;
			mount.appendChild(s);
			box.dataset.wmLoaded = "1";
			box.classList.add("is-loaded");
		});
	};

	const loadAnalytics = (id) => {
		if (!id || window.__wmGa) return;
		window.__wmGa = true;
		const s = document.createElement("script");
		s.async = true;
		s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
		document.head.appendChild(s);
		window.dataLayer = window.dataLayer || [];
		window.gtag = function gtag() {
			window.dataLayer.push(arguments);
		};
		window.gtag("js", new Date());
		window.gtag("config", id, { allow_google_signals: false, allow_ad_personalization_signals: false });
	};

	const apply = (choice, notice) => {
		if (choice === "all") {
			loadWidgets();
			loadAnalytics(notice ? notice.dataset.gaId : "");
		}
		// Kept apart from [data-wm-consent] (the choice buttons): an ancestor carrying that
		// attribute made every click on the page count as a consent choice.
		document.documentElement.dataset.wmConsentState = choice || "unset";
	};

	const init = () => {
		const notice = document.getElementById("wm-consent");
		const choice = read();
		if (!choice && notice) notice.hidden = false;
		apply(choice, notice);

		document.addEventListener("click", (event) => {
			const set = event.target.closest("button[data-wm-consent]");
			if (set) {
				const value = set.dataset.wmConsent === "all" ? "all" : "essential";
				write(value);
				if (notice) notice.hidden = true;
				apply(value, notice);
				return;
			}
			if (event.target.closest("[data-wm-consent-open]") && notice) {
				event.preventDefault();
				notice.hidden = false;
				notice.querySelector("button")?.focus();
			}
		});
	};

	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
	else init();
})();
