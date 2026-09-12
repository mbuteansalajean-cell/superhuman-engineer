(function () {
  "use strict";

  var MEASUREMENT_ID = "G-VT6PE80XVV";
  var CONSENT_KEY = "she_analytics_consent";
  var analyticsLoaded = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied"
  });

  function storedConsent() {
    try { return window.localStorage.getItem(CONSENT_KEY); }
    catch (error) { return null; }
  }

  function saveConsent(value) {
    try { window.localStorage.setItem(CONSENT_KEY, value); }
    catch (error) { /* The current visit still respects the user's choice. */ }
  }

  function loadAnalytics() {
    if (analyticsLoaded) return;
    analyticsLoaded = true;
    window.gtag("consent", "update", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "granted"
    });
    window.gtag("js", new Date());
    window.gtag("config", MEASUREMENT_ID, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });

    var tag = document.createElement("script");
    tag.async = true;
    tag.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(MEASUREMENT_ID);
    document.head.appendChild(tag);
    trackPurchase();
  }

  function track(name, parameters) {
    if (!analyticsLoaded || storedConsent() !== "accepted") return;
    window.gtag("event", name, parameters || {});
  }

  function trackPurchase() {
    var params = new URLSearchParams(window.location.search);
    var productKey = params.get("product");
    var sessionId = params.get("session_id");
    var products = {
      buddha: { id: "level_1_buddha", name: "Level 1: Buddha", value: 24.99 },
      dharma: { id: "level_2_dharma", name: "Level 2: Dharma", value: 24.99 },
      sangha: { id: "level_3_sangha", name: "Level 3: Sangha", value: 24.99 },
      bundle: { id: "complete_bundle", name: "Complete Super Human Engineer Bundle", value: 59.99 }
    };
    var product = products[productKey];
    if (!product || !sessionId || sessionId.indexOf("cs_") !== 0) return;

    var purchaseKey = "she_purchase_" + sessionId;
    try {
      if (window.localStorage.getItem(purchaseKey)) return;
      window.localStorage.setItem(purchaseKey, "recorded");
    } catch (error) { /* GA also deduplicates repeated transaction IDs. */ }

    track("purchase", {
      transaction_id: sessionId,
      currency: "USD",
      value: product.value,
      items: [{ item_id: product.id, item_name: product.name, price: product.value, quantity: 1 }]
    });
    track("purchase_" + productKey, {
      transaction_id: sessionId,
      currency: "USD",
      value: product.value
    });
  }

  function removeAnalyticsCookies() {
    document.cookie.split(";").forEach(function (cookie) {
      var name = cookie.split("=")[0].trim();
      if (name === "_ga" || name.indexOf("_ga_") === 0) {
        document.cookie = name + "=; Max-Age=0; path=/; SameSite=Lax";
      }
    });
  }

  function setConsent(value) {
    saveConsent(value);
    if (value === "accepted") {
      loadAnalytics();
      track("analytics_consent_granted", { consent_source: "website_banner" });
    } else {
      window.gtag("consent", "update", {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: "denied"
      });
      removeAnalyticsCookies();
    }
    var banner = document.getElementById("she-consent-banner");
    if (banner) banner.remove();
  }

  function showConsentBanner() {
    if (document.getElementById("she-consent-banner")) return;
    var banner = document.createElement("section");
    banner.id = "she-consent-banner";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Analytics preferences");
    banner.innerHTML =
      '<div class="she-consent-copy"><strong>Your privacy, your choice.</strong>' +
      '<span>We use optional Google Analytics cookies to understand visits, purchases, and which buttons help people find what they need. Analytics stays off unless you accept. <a href="privacy-policy.html">Privacy details</a></span></div>' +
      '<div class="she-consent-actions"><button type="button" data-consent="declined">Decline</button><button type="button" class="accept" data-consent="accepted">Accept analytics</button></div>';

    if (!document.getElementById("she-consent-style")) {
      var style = document.createElement("style");
      style.id = "she-consent-style";
      style.textContent =
        '#she-consent-banner{position:fixed;z-index:9999;left:20px;right:20px;bottom:20px;max-width:980px;margin:auto;padding:20px 22px;display:flex;align-items:center;justify-content:space-between;gap:24px;background:#10100f;color:#f5f0e8;border:1px solid #d6ae68;box-shadow:0 16px 48px rgba(0,0,0,.35);font:14px/1.45 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}' +
        '#she-consent-banner strong{display:block;margin-bottom:4px;font-size:16px}' +
        '#she-consent-banner span{color:#c9c2b7}' +
        '#she-consent-banner a{color:#efcc8c}' +
        '.she-consent-actions{display:flex;gap:9px;flex:0 0 auto}' +
        '.she-consent-actions button{min-height:42px;padding:9px 14px;border:1px solid #f5f0e8;background:transparent;color:#f5f0e8;cursor:pointer;font:700 13px Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}' +
        '.she-consent-actions button.accept{background:#d6ae68;border-color:#d6ae68;color:#16120d}' +
        '.she-consent-actions button:focus-visible{outline:3px solid #fff;outline-offset:2px}' +
        '@media(max-width:700px){#she-consent-banner{left:10px;right:10px;bottom:10px;display:block}.she-consent-actions{margin-top:16px}.she-consent-actions button{flex:1}}';
      document.head.appendChild(style);
    }

    document.body.appendChild(banner);
    banner.querySelectorAll("[data-consent]").forEach(function (button) {
      button.addEventListener("click", function () { setConsent(button.getAttribute("data-consent")); });
    });
  }

  function bindTracking() {
    document.addEventListener("click", function (event) {
      var link = event.target.closest("[data-analytics-event]");
      if (!link) return;
      var eventName = link.getAttribute("data-analytics-event");
      var details = {
        cta_name: (link.textContent || "").trim(),
        cta_location: link.getAttribute("data-analytics-location") || "unspecified",
        link_url: link.href || link.getAttribute("href") || ""
      };
      track(eventName, details);
      track("cta_click", Object.assign({ cta_event: eventName }, details));

      var itemId = link.getAttribute("data-checkout-item-id");
      if (itemId) {
        var value = Number(link.getAttribute("data-checkout-value"));
        track("begin_checkout", {
          currency: "USD",
          value: value,
          items: [{ item_id: itemId, item_name: link.getAttribute("data-checkout-item-name"), price: value, quantity: 1 }]
        });
      }
    });

    document.querySelectorAll("[data-consent-settings]").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        try { window.localStorage.removeItem(CONSENT_KEY); } catch (error) {}
        showConsentBanner();
      });
    });
  }

  if (storedConsent() === "accepted") loadAnalytics();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      bindTracking();
      if (!storedConsent()) showConsentBanner();
    });
  } else {
    bindTracking();
    if (!storedConsent()) showConsentBanner();
  }
}());
