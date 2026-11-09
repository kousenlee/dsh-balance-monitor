window.__ModuleLoader__.load({
	id: "dsh-balance-monitor",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		const react = require("react");
		const reactDom = require("react-dom");
		const h = react.createElement;
		const createPortal = reactDom.createPortal;

		const PLUGIN_ID = "dsh-balance-monitor";
		const PLUGIN_VERSION = "0.1.0";
		const STORAGE_KEY = "dsh-balance-monitor/settings/v1";
		const ALERT_REPEAT_MS = 30 * 60 * 1000;

		/** Default settings; persisted per browser (localStorage). */
		const DEFAULTS = {
			enabled: true,
			threshold: 5,
			currency: "CNY",
			intervalSec: 60,
			toast: true,
			desktop: false
		};

		const SYMBOLS = { CNY: "\u00a5", USD: "$" };

		const CSS = [
			".bm-bar{display:flex;align-items:center;justify-content:flex-end;gap:8px;box-sizing:border-box;min-height:26px;padding:0 10px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);border-top:.5px solid var(--dsw-alias-border-l1);background:transparent}",
			".bm-trigger{display:inline-flex;align-items:center;gap:6px;min-height:20px;padding:1px 6px;border:0;border-radius:var(--dsw-radius-sm);background:transparent;color:inherit;font:inherit;cursor:pointer}",
			".bm-trigger:hover,.bm-trigger:focus-visible{background:var(--dsw-alias-fill-l1);color:var(--dsw-alias-label-secondary)}",
			".bm-dot{flex:none;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-label-tertiary)}",
			".bm-dot-ok{background:#16a34a}",
			".bm-dot-low{background:var(--dsw-alias-state-error-primary,#dc2626)}",
			".bm-dot-stale{background:#d97706}",
			".bm-label{color:inherit}",
			".bm-amount{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary)}",
			".bm-trigger-low{color:var(--dsw-alias-state-error-primary,#dc2626)}",
			".bm-trigger-low .bm-amount{color:var(--dsw-alias-state-error-primary,#dc2626)}",
			".bm-badge{flex:none;padding:0 5px;border-radius:999px;font-size:10px;line-height:16px;color:var(--dsw-alias-state-error-primary,#dc2626);background:color-mix(in srgb, var(--dsw-alias-state-error-primary,#dc2626) 14%, transparent)}",
			".bm-panel{position:fixed;right:12px;bottom:32px;z-index:1200;box-sizing:border-box;width:308px;max-width:calc(100vw - 24px);display:flex;flex-direction:column;gap:8px;padding:12px;border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md);background:var(--dsw-specific-menu,#fff);box-shadow:var(--dsw-elevation-prominent);color:var(--dsw-alias-label-primary);font-size:12px;line-height:17px}",
			".bm-panel-head{display:flex;align-items:center;gap:6px}",
			".bm-panel-title{flex:1;min-width:0;font-size:13px;font-weight:600;line-height:18px}",
			".bm-icon-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;padding:0;border:0;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-tertiary);font-size:14px;line-height:1;cursor:pointer}",
			".bm-icon-btn:hover,.bm-icon-btn:focus-visible{background:var(--dsw-alias-fill-l1);color:var(--dsw-alias-label-primary)}",
			".bm-row{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:20px}",
			".bm-row-label{flex:none;color:var(--dsw-alias-label-secondary)}",
			".bm-row-value{font-variant-numeric:tabular-nums;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".bm-total{font-weight:600}",
			".bm-muted{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}",
			".bm-warn{color:#b45309}",
			".bm-error{color:var(--dsw-alias-state-error-primary,#dc2626)}",
			".bm-divider{height:1px;margin:2px 0;background:var(--dsw-alias-border-l1)}",
			".bm-field{display:flex;align-items:center;justify-content:space-between;gap:10px}",
			".bm-input{box-sizing:border-box;width:78px;height:24px;padding:0 6px;border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-fill-l1);color:var(--dsw-alias-label-primary);font:inherit;font-variant-numeric:tabular-nums;text-align:right}",
			".bm-select{box-sizing:border-box;height:24px;padding:0 4px;border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-fill-l1);color:var(--dsw-alias-label-primary);font:inherit}",
			".bm-check{display:inline-flex;align-items:center;gap:6px;cursor:pointer;color:var(--dsw-alias-label-secondary)}",
			".bm-check input{accent-color:var(--dsw-alias-label-primary);margin:0}",
			".bm-note{color:var(--dsw-alias-label-tertiary);font-size:10px;line-height:15px}",
			".bm-toast{position:fixed;right:16px;bottom:40px;z-index:1300;box-sizing:border-box;max-width:360px;display:flex;align-items:flex-start;gap:8px;padding:10px 12px;border:.5px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md);background:var(--dsw-specific-menu,#fff);box-shadow:var(--dsw-elevation-prominent);color:var(--dsw-alias-label-primary);font-size:12px;line-height:18px}",
			".bm-toast-error{border-color:color-mix(in srgb, var(--dsw-alias-state-error-primary,#dc2626) 45%, transparent)}",
			".bm-toast-text{flex:1;min-width:0}",
			".bm-settings-title{font-size:12px;font-weight:600;line-height:17px;margin-top:2px}"
		].join("");

		/** Inject the plugin stylesheet once per document. */
		function installCss() {
			if (typeof document === "undefined") return;
			var tagId = PLUGIN_ID + "/client.css";
			if (document.querySelector('style[data-plugin-css="' + tagId + '"]') !== null) return;
			var tag = document.createElement("style");
			tag.dataset.plugin = PLUGIN_ID;
			tag.dataset.pluginCss = tagId;
			tag.textContent = CSS;
			document.head.appendChild(tag);
		}

		/** Read persisted settings, falling back to defaults on any parse failure. */
		function readSettings() {
			var stored = {};
			try {
				stored = JSON.parse(globalThis.localStorage.getItem(STORAGE_KEY) || "{}") || {};
			} catch (error) {
				stored = {};
			}
			var next = Object.assign({}, DEFAULTS);
			if (typeof stored.enabled === "boolean") next.enabled = stored.enabled;
			if (typeof stored.threshold === "number" && Number.isFinite(stored.threshold) && stored.threshold >= 0) next.threshold = stored.threshold;
			if (typeof stored.currency === "string" && stored.currency.length > 0) next.currency = stored.currency;
			if (typeof stored.intervalSec === "number" && Number.isFinite(stored.intervalSec)) next.intervalSec = Math.min(3600, Math.max(15, Math.round(stored.intervalSec)));
			if (typeof stored.toast === "boolean") next.toast = stored.toast;
			if (typeof stored.desktop === "boolean") next.desktop = stored.desktop;
			return next;
		}

		/** Persist settings; storage failures keep the in-memory value working. */
		function writeSettings(settings) {
			try {
				globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
			} catch (error) {
				/* ignore quota/private-mode failures */
			}
		}

		/**
		 * Account request identity required by the account Remote methods.
		 * The version comes from the boot graph release, so it tracks the host
		 * installation instead of this plugin's own version.
		 */
		function accountMetadata(ctx) {
			var version = PLUGIN_VERSION;
			try {
				var boot = globalThis.__DSH_BOOT__;
				var release = boot === null || boot === void 0 ? void 0 : boot.release;
				var candidate = typeof release === "string" ? release : release === null || release === void 0 ? void 0 : release.version;
				if (typeof candidate === "string" && candidate.length > 0) version = candidate;
			} catch (error) {
				/* keep the plugin version fallback */
			}
			var locale = "en";
			try {
				locale = ctx.locale.getSnapshot().active;
			} catch (error) {
				locale = "en";
			}
			return {
				version: version,
				locale: locale,
				timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60
			};
		}

		/**
		 * Split a decimal string (including scientific notation) into sign and
		 * digit groups, so display never rounds and never loses the raw string.
		 * @param raw - balance string from the account balance snapshot.
		 * @returns `{negative, int, frac}` with `frac` already truncated to 2 digits, or null.
		 */
		function splitDecimal(raw) {
			if (typeof raw !== "string") return null;
			var text = raw.trim();
			if (text.length === 0) return null;
			var match = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(text);
			if (match === null) return null;
			var negative = match[1] === "-";
			var int = match[2] || "0";
			var frac = match[3] || "";
			var exponent = match[4] === void 0 ? 0 : Number(match[4]);
			if (!Number.isFinite(exponent)) return null;
			var digits = int + frac;
			var point = int.length + exponent;
			if (point <= 0) {
				int = "0";
				frac = new Array(1 - point).join("0") + digits;
			} else if (point >= digits.length) {
				int = digits + new Array(point - digits.length + 1).join("0");
				frac = "";
			} else {
				int = digits.slice(0, point);
				frac = digits.slice(point);
			}
			int = int.replace(/^0+(?=\d)/, "");
			frac = (frac + "00").slice(0, 2);
			return { negative: negative, int: int, frac: frac };
		}

		/** Add thousands separators to a digit string. */
		function groupDigits(int) {
			return int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		}

		/**
		 * Format one amount exactly like the account settings card: two decimals
		 * truncated toward zero, digit grouping, `<0.01` for positive sub-cent.
		 * @param raw - decimal string from the balance snapshot.
		 * @param currency - `CNY` or `USD`.
		 */
		function formatAmount(raw, currency) {
			var parts = splitDecimal(raw);
			if (parts === null) return "\u2014";
			var symbol = SYMBOLS[currency] || (currency ? currency + " " : "");
			var zero = parts.int === "0" && /^0+$/.test(parts.frac);
			if (zero) return symbol + "0.00";
			if (parts.int === "0" && parts.frac === "00") return (parts.negative ? "-" : "") + symbol + "<0.01";
			return (parts.negative ? "-" : "") + symbol + groupDigits(parts.int) + "." + parts.frac;
		}

		/** Sum wallet strings of one currency without losing the string to rounding. */
		function sumWallets(wallets, currency) {
			var total = 0;
			var found = false;
			for (var i = 0; i < (wallets || []).length; i++) {
				var wallet = wallets[i];
				if (wallet === null || wallet === void 0 || wallet.currency !== currency) continue;
				var amount = Number(wallet.balance);
				if (!Number.isFinite(amount)) continue;
				total += amount;
				found = true;
			}
			return found ? total : null;
		}

		/** Amount in the requested currency, formatted with the same decimal rules. */
		function formatTotal(amount, currency) {
			if (amount === null || amount === void 0 || !Number.isFinite(amount)) return "\u2014";
			return formatAmount(String(amount), currency);
		}

		/** Currencies present in a balance snapshot, in stable order. */
		function currenciesOf(snapshot) {
			var seen = {};
			var list = [];
			var all = [].concat(snapshot.normal || [], snapshot.bonus || []);
			for (var i = 0; i < all.length; i++) {
				var wallet = all[i];
				if (wallet === null || wallet === void 0 || typeof wallet.currency !== "string") continue;
				if (seen[wallet.currency] === true) continue;
				seen[wallet.currency] = true;
				list.push(wallet.currency);
			}
			return list;
		}

		/** Clock time for the last successful read. */
		function formatTime(timestamp) {
			if (!timestamp) return "\u2014";
			try {
				return new Date(timestamp).toLocaleTimeString(void 0, { hour: "2-digit", minute: "2-digit" });
			} catch (error) {
				return new Date(timestamp).toTimeString().slice(0, 5);
			}
		}

		/**
		 * Read the account balance once.
		 * Resolves to a UI snapshot and never throws: `ok:false` is a transport
		 * problem, `value:null` means no usable login, `status:"failed"` means the
		 * Platform read failed. None of them manufacture a zero balance.
		 */
		function readBalance(ctx) {
			return Promise.resolve()
				.then(function () {
					return ctx.remote.account.getBalance(accountMetadata(ctx));
				})
				.then(function (result) {
					if (result === null || result === void 0 || result.ok !== true) {
						var code = result === null || result === void 0 ? void 0 : result.error === null || result.error === void 0 ? void 0 : result.error.code;
						return { status: "error", error: typeof code === "string" && code.length > 0 ? code : "remote-failed" };
					}
					var value = result.value;
					if (value === null || value === void 0) return { status: "signed-out" };
					if (value.status !== "ready") return { status: "error", error: "balance-failed" };
					return {
						status: "ready",
						normal: Array.isArray(value.value) ? value.value : [],
						bonus: Array.isArray(value.bonusWallets) ? value.bonusWallets : [],
						updatedAt: Date.now()
					};
				})
				.catch(function (error) {
					return { status: "error", error: error !== null && error !== void 0 && error.message ? String(error.message) : "network" };
				});
		}

		/** Small shared store so every surface of the plugin sees one settings object. */
		function createSettingsStore() {
			var current = readSettings();
			var listeners = new Set();
			return {
				get: function () {
					return current;
				},
				update: function (patch) {
					current = Object.assign({}, current, patch);
					writeSettings(current);
					listeners.forEach(function (listener) {
						listener();
					});
				},
				subscribe: function (listener) {
					listeners.add(listener);
					return function () {
						listeners.delete(listener);
					};
				}
			};
		}

		function useSettings(store) {
			return react.useSyncExternalStore(store.subscribe, store.get, store.get);
		}

		/** Request OS notifications once, resolving to whether they are allowed. */
		function ensureNotificationPermission() {
			return new Promise(function (resolve) {
				try {
					if (typeof Notification === "undefined") {
						resolve(false);
						return;
					}
					if (Notification.permission === "granted") {
						resolve(true);
						return;
					}
					if (Notification.permission === "denied") {
						resolve(false);
						return;
					}
					var request = Notification.requestPermission();
					if (request && typeof request.then === "function") {
						request.then(function (permission) {
							resolve(permission === "granted");
						}, function () {
							resolve(false);
						});
						return;
					}
					resolve(false);
				} catch (error) {
					resolve(false);
				}
			});
		}

		/** Required client services. */
		const inject = ["slots", "locale", "remote", "remote.account", "remoteAccess"];

		/** Localized copy. Chinese and English are the required baseline locales. */
		const dictionaries = {
			zh: {
				balance: "\u4f59\u989d",
				title: "DeepSeek \u8d26\u6237\u4f59\u989d",
				loading: "\u6b63\u5728\u8bfb\u53d6\u2026",
				unavailable: "\u4f59\u989d\u4e0d\u53ef\u7528",
				stale: "\u672c\u6b21\u5237\u65b0\u5931\u8d25\uff0c\u4e0a\u56fe\u4e3a\u4e0a\u6b21\u7ed3\u679c",
				signedOutShort: "\u672a\u767b\u5f55",
				signedOut: "\u5f53\u524d\u6ca1\u6709 DeepSeek \u8d26\u6237\u767b\u5f55\uff0c\u767b\u5f55\u540e\u624d\u80fd\u8bfb\u53d6\u4f59\u989d\u3002",
				recharge: "\u5145\u503c\u4f59\u989d",
				bonus: "\u8d60\u9001\u91d1\u989d",
				total: "\u53ef\u7528\u5408\u8ba1",
				updated: "\u66f4\u65b0\u4e8e {time}",
				refresh: "\u7acb\u5373\u5237\u65b0",
				close: "\u5173\u95ed",
				settings: "\u63d0\u9192\u8bbe\u7f6e",
				threshold: "\u4f4e\u4e8e\u6b64\u503c\u63d0\u9192",
				interval: "\u81ea\u52a8\u5237\u65b0\u95f4\u9694",
				enabled: "\u81ea\u52a8\u5237\u65b0\u4f59\u989d",
				toast: "\u4f59\u989d\u4e0d\u8db3\u65f6\u5f39\u51fa\u63d0\u9192",
				desktop: "\u540c\u65f6\u53d1\u7cfb\u7edf\u901a\u77e5",
				low: "\u4f4e",
				lowAlert: "\u4f59\u989d\u4e0d\u8db3\uff1a\u5f53\u524d {amount}\uff0c\u5df2\u4f4e\u4e8e\u9608\u503c {threshold}\u3002",
				lowAlertTitle: "DeepSeek \u4f59\u989d\u63d0\u9192",
				seconds: "{n} \u79d2",
				minute: "1 \u5206\u949f",
				minutes: "{n} \u5206\u949f",
				note: "\u4f59\u989d\u6765\u81ea DeepSeek \u5e73\u53f0\u5b9e\u65f6\u67e5\u8be2\uff1b\u63d0\u9192\u8bbe\u7f6e\u4fdd\u5b58\u5728\u5f53\u524d\u6d4f\u89c8\u5668\u3002",
				nav: "\u4f59\u989d\u63d0\u9192",
				errorHint: "\u8bfb\u53d6\u5931\u8d25\uff0c\u70b9\u51fb\u5237\u65b0\u91cd\u8bd5\u3002"
			},
			en: {
				balance: "Balance",
				title: "DeepSeek account balance",
				loading: "Reading\u2026",
				unavailable: "Unavailable",
				stale: "Refresh failed; showing the last successful read.",
				signedOutShort: "Signed out",
				signedOut: "No DeepSeek account is signed in, so the balance cannot be read.",
				recharge: "Recharge",
				bonus: "Bonus credit",
				total: "Total available",
				updated: "Updated {time}",
				refresh: "Refresh now",
				close: "Close",
				settings: "Reminder settings",
				threshold: "Alert below",
				interval: "Auto refresh every",
				enabled: "Auto refresh balance",
				toast: "Show a reminder when balance is low",
				desktop: "Also send a system notification",
				low: "Low",
				lowAlert: "Low balance: {amount} left, below the {threshold} threshold.",
				lowAlertTitle: "DeepSeek low balance",
				seconds: "{n}s",
				minute: "1 minute",
				minutes: "{n} minutes",
				note: "Balance is read live from the DeepSeek Platform; reminder settings stay in this browser.",
				nav: "Balance reminder",
				errorHint: "Read failed. Press refresh to retry."
			}
		};

		/**
		 * Register the client half: dictionaries, the always-visible balance bar,
		 * and the settings section that exposes the same controls from Settings.
		 * Registration waits for the account Remote grant, so a non-owner viewer
		 * never sees a balance surface it cannot call.
		 * @param ctx - client plugin context.
		 */
		function apply(ctx) {
			installCss();
			const t = ctx.locale.bind("balanceMonitor");
			const store = createSettingsStore();

			ctx.effect(
				() => ctx.locale.register("balanceMonitor", dictionaries),
				"balance-monitor: dictionaries"
			);

			/** Read the current settings through the shared store. */
			function useCurrentSettings() {
				return useSettings(store);
			}

			/**
			 * The always-visible bottom bar plus its detail/settings popover.
			 * Mounted in the root-scoped `shell.bottom` slot so it stays on screen
			 * on the welcome page, settings pages, and every session.
			 */
			function BalanceBar(props) {
				const translate = props.t || t;
				const settings = useCurrentSettings();
				const [snapshot, setSnapshot] = react.useState({ status: "loading" });
				const [open, setOpen] = react.useState(false);
				const [toast, setToast] = react.useState(null);
				const [thresholdDraft, setThresholdDraft] = react.useState(String(settings.threshold));
				const inFlight = react.useRef(false);
				const wasBelow = react.useRef(false);
				const lastAlertAt = react.useRef(0);
				const toastTimer = react.useRef(0);
				const panelRef = react.useRef(null);
				const rootRef = react.useRef(null);

				const refresh = react.useCallback(function () {
					if (inFlight.current) return Promise.resolve();
					inFlight.current = true;
					setSnapshot(function (previous) {
						if (previous.status === "ready") return Object.assign({}, previous, { refreshing: true });
						return { status: "loading" };
					});
					return readBalance(ctx).then(function (next) {
						inFlight.current = false;
						setSnapshot(function (previous) {
							if (next.status === "error" && previous.status === "ready") {
								return Object.assign({}, previous, { refreshing: false, stale: true });
							}
							return next;
						});
					});
				}, []);

				react.useEffect(
					function () {
						refresh();
						if (!settings.enabled) return void 0;
						const period = Math.max(15, Math.round(settings.intervalSec)) * 1000;
						const timer = setInterval(function () {
							if (typeof document === "undefined" || document.visibilityState !== "hidden") refresh();
						}, period);
						const onFocus = function () {
							refresh();
						};
						const onVisibility = function () {
							if (typeof document === "undefined" || document.visibilityState !== "hidden") refresh();
						};
						window.addEventListener("focus", onFocus);
						document.addEventListener("visibilitychange", onVisibility);
						return function () {
							clearInterval(timer);
							window.removeEventListener("focus", onFocus);
							document.removeEventListener("visibilitychange", onVisibility);
						};
					},
					[settings.enabled, settings.intervalSec, refresh]
				);

				react.useEffect(
					function () {
						setThresholdDraft(String(settings.threshold));
					},
					[settings.threshold]
				);

				react.useEffect(
					function () {
						if (!open) return void 0;
						const onPointerDown = function (event) {
							const target = event.target;
							if (panelRef.current !== null && panelRef.current.contains(target)) return;
							if (rootRef.current !== null && rootRef.current.contains(target)) return;
							setOpen(false);
						};
						const onKeyDown = function (event) {
							if (event.key === "Escape") setOpen(false);
						};
						document.addEventListener("mousedown", onPointerDown);
						document.addEventListener("keydown", onKeyDown);
						return function () {
							document.removeEventListener("mousedown", onPointerDown);
							document.removeEventListener("keydown", onKeyDown);
						};
					},
					[open]
				);

				react.useEffect(
					function () {
						return function () {
							if (toastTimer.current) clearTimeout(toastTimer.current);
						};
					},
					[]
				);

				const currency = settings.currency;
				const rechargeAmount = snapshot.status === "ready" ? sumWallets(snapshot.normal, currency) : null;
				const bonusAmount = snapshot.status === "ready" ? sumWallets(snapshot.bonus, currency) : null;
				const total = snapshot.status === "ready" ? (rechargeAmount || 0) + (bonusAmount || 0) : null;
				const availableCurrencies = snapshot.status === "ready" ? currenciesOf(snapshot) : [];
				const threshold = Number(settings.threshold) || 0;
				const below = snapshot.status === "ready" && total !== null && total < threshold;

				const showToast = react.useCallback(function (message) {
					setToast({ text: message });
					if (toastTimer.current) clearTimeout(toastTimer.current);
					toastTimer.current = setTimeout(function () {
						setToast(null);
					}, 10000);
				}, []);

				react.useEffect(
					function () {
						if (snapshot.status !== "ready" || total === null) {
							wasBelow.current = false;
							return;
						}
						if (!settings.enabled || !settings.toast) return;
						const isBelow = total < threshold;
						if (!isBelow) {
							wasBelow.current = false;
							return;
						}
						const now = Date.now();
						if (wasBelow.current && now - lastAlertAt.current < ALERT_REPEAT_MS) return;
						wasBelow.current = true;
						lastAlertAt.current = now;
						const message = translate("lowAlert", {
							amount: formatTotal(total, currency),
							threshold: formatTotal(threshold, currency)
						});
						showToast(message);
						if (settings.desktop) {
							try {
								if (typeof Notification !== "undefined" && Notification.permission === "granted") {
									new Notification(translate("lowAlertTitle"), { body: message });
								}
							} catch (error) {
								/* notifications are best-effort */
							}
						}
					},
					[snapshot.status, total, threshold, currency, settings.enabled, settings.toast, settings.desktop, showToast, translate]
				);

				const commitThreshold = function () {
					const parsed = Number(thresholdDraft);
					if (Number.isFinite(parsed) && parsed >= 0) store.update({ threshold: parsed });
					else setThresholdDraft(String(settings.threshold));
				};

				const toggleDesktop = function (enabled) {
					if (!enabled) {
						store.update({ desktop: false });
						return;
					}
					ensureNotificationPermission().then(function (allowed) {
						store.update({ desktop: allowed });
					});
				};

				const body = [];
				if (snapshot.status === "ready") {
					body.push(
						h(
							"div",
							{ key: "recharge", className: "bm-row" },
							h("span", { className: "bm-row-label" }, translate("recharge")),
							h("span", { className: "bm-row-value bm-amount" }, rechargeAmount === null ? "\u2014" : formatTotal(rechargeAmount, currency))
						)
					);
					if (bonusAmount !== null) {
						body.push(
							h(
								"div",
								{ key: "bonus", className: "bm-row" },
								h("span", { className: "bm-row-label" }, translate("bonus")),
								h("span", { className: "bm-row-value bm-amount" }, formatTotal(bonusAmount, currency))
							)
						);
					}
					body.push(
						h(
							"div",
							{ key: "total", className: "bm-row" },
							h("span", { className: "bm-row-label" }, translate("total")),
							h("span", { className: "bm-row-value bm-amount bm-total" }, formatTotal(total, currency))
						)
					);
					body.push(
						h(
							"div",
							{ key: "updated", className: "bm-row" },
							h("span", { className: "bm-muted" }, translate("updated", { time: formatTime(snapshot.updatedAt) })),
							snapshot.stale === true ? h("span", { className: "bm-muted bm-warn" }, translate("stale")) : null
						)
					);
				} else if (snapshot.status === "signed-out") {
					body.push(h("div", { key: "signed-out", className: "bm-muted" }, translate("signedOut")));
				} else if (snapshot.status === "error") {
					body.push(h("div", { key: "error", className: "bm-muted bm-error" }, translate("errorHint")));
				} else {
					body.push(h("div", { key: "loading", className: "bm-muted" }, translate("loading")));
				}

				const panel =
					open === true
						? h(
								"div",
								{ className: "bm-panel", ref: panelRef, role: "dialog", "aria-label": translate("title") },
								h(
									"div",
									{ className: "bm-panel-head" },
									h("span", { className: "bm-panel-title" }, translate("title")),
									h(
										"button",
										{
											type: "button",
											className: "bm-icon-btn",
											title: translate("refresh"),
											"aria-label": translate("refresh"),
											onClick: refresh
										},
										"\u21bb"
									),
									h(
										"button",
										{
											type: "button",
											className: "bm-icon-btn",
											title: translate("close"),
											"aria-label": translate("close"),
											onClick: function () {
												setOpen(false);
											}
										},
										"\u00d7"
									)
								),
								body,
								h("div", { className: "bm-divider" }),
								h("div", { className: "bm-settings-title" }, translate("settings")),
								h(
									"label",
									{ className: "bm-check" },
									h("input", {
										type: "checkbox",
										checked: settings.enabled,
										onChange: function (event) {
											store.update({ enabled: event.target.checked });
										}
									}),
									translate("enabled")
								),
								h(
									"div",
									{ className: "bm-field" },
									h("span", { className: "bm-row-label" }, translate("threshold")),
									h(
										"span",
										{ style: { display: "inline-flex", alignItems: "center", gap: "4px" } },
										availableCurrencies.length > 1 || availableCurrencies.indexOf(currency) < 0
											? h(
													"select",
													{
														className: "bm-select",
														value: currency,
														onChange: function (event) {
															store.update({ currency: event.target.value });
														}
													},
													(availableCurrencies.length > 0 ? availableCurrencies : [currency]).map(function (code) {
														return h("option", { key: code, value: code }, code);
													})
												)
											: h("span", { className: "bm-muted" }, SYMBOLS[currency] || currency),
										h("input", {
											type: "text",
											inputMode: "decimal",
											className: "bm-input",
											value: thresholdDraft,
											onChange: function (event) {
												setThresholdDraft(event.target.value);
											},
											onBlur: commitThreshold,
											onKeyDown: function (event) {
												if (event.key === "Enter") commitThreshold();
											}
										})
									)
								),
								h(
									"div",
									{ className: "bm-field" },
									h("span", { className: "bm-row-label" }, translate("interval")),
									h(
										"select",
										{
											className: "bm-select",
											value: String(settings.intervalSec),
											onChange: function (event) {
												store.update({ intervalSec: Number(event.target.value) });
											}
										},
										[
											[30, translate("seconds", { n: 30 })],
											[60, translate("minute")],
											[300, translate("minutes", { n: 5 })],
											[600, translate("minutes", { n: 10 })]
										].map(function (entry) {
											return h("option", { key: String(entry[0]), value: String(entry[0]) }, entry[1]);
										})
									)
								),
								h(
									"label",
									{ className: "bm-check" },
									h("input", {
										type: "checkbox",
										checked: settings.toast,
										onChange: function (event) {
											store.update({ toast: event.target.checked });
										}
									}),
									translate("toast")
								),
								h(
									"label",
									{ className: "bm-check" },
									h("input", {
										type: "checkbox",
										checked: settings.desktop,
										onChange: function (event) {
											toggleDesktop(event.target.checked);
										}
									}),
									translate("desktop")
								),
								h("div", { className: "bm-note" }, translate("note"))
							)
						: null;

				const dotClass =
					snapshot.status === "ready" ? (below ? "bm-dot-low" : snapshot.stale === true ? "bm-dot-stale" : "bm-dot-ok") : "bm-dot-idle";
				const label =
					snapshot.status === "ready"
						? formatTotal(total, currency)
						: snapshot.status === "signed-out"
							? translate("signedOutShort")
							: snapshot.status === "error"
								? translate("unavailable")
								: translate("loading");

				return h(
					"div",
					{ className: "bm-bar", ref: rootRef },
					h(
						"button",
						{
							type: "button",
							className: "bm-trigger" + (below ? " bm-trigger-low" : ""),
							title: translate("title"),
							"aria-expanded": open,
							onClick: function () {
								setOpen(function (value) {
									return !value;
								});
							}
						},
						h("span", { className: "bm-dot " + dotClass }),
						h("span", { className: "bm-label" }, translate("balance")),
						h("span", { className: "bm-amount" }, label),
						below ? h("span", { className: "bm-badge" }, translate("low")) : null
					),
					panel === null ? null : createPortal(panel, document.body),
					toast !== null && toast !== void 0
						? createPortal(
								h(
									"div",
									{ className: "bm-toast", role: "status" },
									h("span", { className: "bm-toast-text" }, toast.text),
									h(
										"button",
										{
											type: "button",
											className: "bm-icon-btn",
											"aria-label": translate("close"),
											onClick: function () {
												setToast(null);
											}
										},
										"\u00d7"
									)
								),
								document.body
							)
						: null
				);
			}

			/**
			 * Settings section mirroring the same controls, so the reminder policy
			 * is discoverable from Settings as well as from the balance bar.
			 */
			function BalanceSettings(props) {
				const translate = props.t || t;
				const settings = useCurrentSettings();
				const [thresholdDraft, setThresholdDraft] = react.useState(String(settings.threshold));
				const [snapshot, setSnapshot] = react.useState({ status: "idle" });
				const [reading, setReading] = react.useState(false);

				react.useEffect(
					function () {
						setThresholdDraft(String(settings.threshold));
					},
					[settings.threshold]
				);

				const read = react.useCallback(function () {
					setReading(true);
					return readBalance(ctx)
						.then(function (next) {
							setSnapshot(next);
						})
						.finally(function () {
							setReading(false);
						});
				}, []);

				react.useEffect(
					function () {
						read();
					},
					[read]
				);

				const commitThreshold = function () {
					const parsed = Number(thresholdDraft);
					if (Number.isFinite(parsed) && parsed >= 0) store.update({ threshold: parsed });
					else setThresholdDraft(String(settings.threshold));
				};

				const toggleDesktop = function (enabled) {
					if (!enabled) {
						store.update({ desktop: false });
						return;
					}
					ensureNotificationPermission().then(function (allowed) {
						store.update({ desktop: allowed });
					});
				};

				const currency = settings.currency;
				const rechargeAmount = snapshot.status === "ready" ? sumWallets(snapshot.normal, currency) : null;
				const bonusAmount = snapshot.status === "ready" ? sumWallets(snapshot.bonus, currency) : null;
				const total = snapshot.status === "ready" ? (rechargeAmount || 0) + (bonusAmount || 0) : null;
				const availableCurrencies = snapshot.status === "ready" ? currenciesOf(snapshot) : [];
				const statusText =
					snapshot.status === "ready"
						? translate("total") + ": " + formatTotal(total, currency)
						: snapshot.status === "signed-out"
							? translate("signedOut")
							: snapshot.status === "error"
								? translate("errorHint")
								: reading
									? translate("loading")
									: "\u2014";

				return h(
					"div",
					{ className: "bm-section", style: { display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" } },
					h("div", { className: "bm-muted" }, statusText),
					h(
						"label",
						{ className: "bm-check" },
						h("input", {
							type: "checkbox",
							checked: settings.enabled,
							onChange: function (event) {
								store.update({ enabled: event.target.checked });
							}
						}),
						translate("enabled")
					),
					h(
						"div",
						{ className: "bm-field" },
						h("span", { className: "bm-row-label" }, translate("threshold")),
						h(
							"span",
							{ style: { display: "inline-flex", alignItems: "center", gap: "4px" } },
							availableCurrencies.length > 1 || availableCurrencies.indexOf(currency) < 0
								? h(
										"select",
										{
											className: "bm-select",
											value: currency,
											onChange: function (event) {
												store.update({ currency: event.target.value });
											}
										},
										(availableCurrencies.length > 0 ? availableCurrencies : [currency]).map(function (code) {
											return h("option", { key: code, value: code }, code);
										})
									)
								: h("span", { className: "bm-muted" }, SYMBOLS[currency] || currency),
							h("input", {
								type: "text",
								inputMode: "decimal",
								className: "bm-input",
								value: thresholdDraft,
								onChange: function (event) {
									setThresholdDraft(event.target.value);
								},
								onBlur: commitThreshold,
								onKeyDown: function (event) {
									if (event.key === "Enter") commitThreshold();
								}
							})
						)
					),
					h(
						"div",
						{ className: "bm-field" },
						h("span", { className: "bm-row-label" }, translate("interval")),
						h(
							"select",
							{
								className: "bm-select",
								value: String(settings.intervalSec),
								onChange: function (event) {
									store.update({ intervalSec: Number(event.target.value) });
								}
							},
							[
								[30, translate("seconds", { n: 30 })],
								[60, translate("minute")],
								[300, translate("minutes", { n: 5 })],
								[600, translate("minutes", { n: 10 })]
							].map(function (entry) {
								return h("option", { key: String(entry[0]), value: String(entry[0]) }, entry[1]);
							})
						)
					),
					h(
						"label",
						{ className: "bm-check" },
						h("input", {
							type: "checkbox",
							checked: settings.toast,
							onChange: function (event) {
								store.update({ toast: event.target.checked });
							}
						}),
						translate("toast")
					),
					h(
						"label",
						{ className: "bm-check" },
						h("input", {
							type: "checkbox",
							checked: settings.desktop,
							onChange: function (event) {
								toggleDesktop(event.target.checked);
							}
						}),
						translate("desktop")
					),
					h("div", { className: "bm-note" }, translate("note"))
				);
			}

			ctx.remoteAccess.whenAccess("account/watch", function () {
				const offBar = ctx.slots.inject("shell.bottom", function () {
					return ctx.slots.register(
						{
							name: "shell.bottom",
							id: "balance-monitor.bar",
							order: 100,
							locale: "balanceMonitor"
						},
						BalanceBar
					);
				});
				const offSettings = ctx.slots.inject("settings.section", function () {
					return ctx.slots.register(
						{
							name: "settings.section",
							id: "balance-monitor.settings",
							order: 20,
							label: function () {
								return t("nav");
							},
							locale: "balanceMonitor"
						},
						BalanceSettings
					);
				});
				return function () {
					try {
						if (typeof offBar === "function") offBar();
					} catch (error) {
						/* already disposed */
					}
					try {
						if (typeof offSettings === "function") offSettings();
					} catch (error) {
						/* already disposed */
					}
				};
			});

			// eslint-disable-next-line no-console
			console.log("[dsh-balance-monitor] client applied");
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
