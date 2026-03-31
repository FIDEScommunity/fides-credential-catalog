(function () {
  "use strict";

  const config = window.fidesCredentialCatalog || {};
  const root = document.getElementById("fides-credential-catalog-root");
  if (!root) return;

  const VC_FORMAT_LABELS = {
    'sd_jwt_vc': 'SD-JWT VC',
    'vcdm_1_1':  'JWT-VC',
    'vcdm_2_0':  'JSON-LD VC',
    'mdoc':      'mDL/mDoc',
  };

  const CREDENTIAL_FILTER_TO_VOCAB = {
    vcFormat:    'credentialFormat',
    subjectType: 'subjectType',
    authority:   'authority',
    schemaType:  'schemaType',
  };

  const settings = {
    showFilters: root.dataset.showFilters !== "false",
    showSearch: root.dataset.showSearch !== "false",
    columns: root.dataset.columns || "3",
    theme: root.dataset.theme || "fides"
  };
  const icons = {
    search: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>',
    filter: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>',
    x: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
    xSmall: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
    xLarge: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
    chevronDown: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>',
    chevronDoubleDown: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 8 6 6 6-6"></path><path d="m6 14 6 6 6-6"></path></svg>',
    server: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>',
    chevronUp: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"></path></svg>',
    wallet: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>',
    eye: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    share: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>',
    fileCheck: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m9 15 2 2 4-4"/></svg>',
    shield: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
    tag: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>',
    calendar: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    externalLinkSmall: '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" x2="21" y1="14" y2="3"></line></svg>',
    building: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
    subjectPerson: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"></path></svg>',
    subjectOrganization: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>',
    subjectProduct: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 8 4-8 4-8-4 8-4"></path><path d="m4 12 8 4 8-4"></path><path d="m4 17 8 4 8-4"></path></svg>',
    subjectDataset: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3"></ellipse><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"></path><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"></path></svg>',
    subjectSoftware: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"></rect><path d="M8 20h8"></path><path d="M12 17v3"></path></svg>',
    subjectDocument: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9z"></path><path d="M14 3v6h6"></path><path d="M10 13h6"></path><path d="M10 17h6"></path></svg>',
    viewGrid: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    viewList: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'
  };

  root.setAttribute("data-theme", settings.theme);

  function isFidesLocalDevHost() {
    try {
      const h = window.location.hostname || "";
      const href = window.location.href || "";
      return h.includes(".local") || href.includes(".local");
    } catch {
      return false;
    }
  }

  let credentials = [];
  let rpUsageMap = new Map();
  let issuerUsageMap = new Map();
  let walletUsageMap = new Map();
  let selectedCredential = null;
  let sortBy = "lastUpdated";

  /**
   * VIEW TOGGLE STATE
   * "grid" | "list" — persisted in localStorage key "fides-credential-view".
   * - Grid mode: cards rendered by renderCredentialCard().
   * - List mode: compact rows rendered by renderCredentialRow().
   * Toggle is hidden on screens < 1024 px (always grid on mobile/tablet).
   *
   * To reuse this pattern in another catalog:
   *  1. Copy renderViewToggle(), renderListHeader(), renderRow() and their CSS block.
   *  2. Replace the localStorage key and CSS class prefixes.
   *  3. Adjust the grid-template-columns to match your column count.
   */
  let viewMode = localStorage.getItem('fides-credential-view') || 'grid';
  const LIST_BREAKPOINT = 1024;
  function effectiveView() {
    return window.innerWidth < LIST_BREAKPOINT ? 'grid' : viewMode;
  }

  let _lastEffective = effectiveView();
  window.addEventListener('resize', () => {
    const cur = effectiveView();
    if (cur !== _lastEffective) {
      _lastEffective = cur;
      renderCredentialGridOnly();
    }
  });

  let vocabulary = null;

  const filters = {
    search: "",
    vcFormat: [],
    subjectType: [],
    authority: [],
    schemaType: [],
    usedByRPsOnly: false,
    hasIssuersOnly: false,
    addedLast30Days: false,
    updatedLast30Days: false,
    ids: []
  };

  // IDs from ?credentials= URL param; preserved so the filter can be toggled back on
  let originalCredentialIds = [];
  /* Collapsible groups: false = collapsed by default. Order in sidebar: Authority, Subject type, VC Format, Schema type */
  const filterGroupState = {
    authority: true,
    subjectType: true,
    vcFormat: false,
    schemaType: false
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Attribute table label: drop the first path segment so the doc-type object is not repeated
   * (e.g. `eu…/iban` → `/iban`). Top-level fields stay unchanged. Full path remains in data for search.
   */
  function formatAttributeNameForDisplay(name) {
    const s = String(name ?? "");
    const i = s.indexOf("/");
    if (i === -1) return s;
    return `/${s.slice(i + 1)}`;
  }

  /** Trim string; empty string if missing. */
  function trimStr(value) {
    if (value == null) return "";
    const s = String(value).trim();
    return s;
  }

  /** Human-readable VC format label (plain text; use in list/grid rows). */
  function vcFormatDisplayLabel(vcFormat) {
    if (!vcFormat) return "—";
    return VC_FORMAT_LABELS[vcFormat] || vcFormat;
  }

  /** VC format pill HTML (detail modal only). */
  function vcFormatTagHtml(vcFormat) {
    return `<span class="fides-tag credential-format">${escapeHtml(vcFormatDisplayLabel(vcFormat))}</span>`;
  }

  function showToast(message, type, theme) {
    const toast = document.createElement("div");
    toast.className = "fides-toast";
    toast.setAttribute("data-theme", theme || "dark");
    toast.innerHTML =
      `<div class="fides-toast-icon">${type === "success" ? icons.check : icons.x}</div>` +
      `<div class="fides-toast-message">${escapeHtml(message)}</div>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("fides-toast-out");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function copyCredentialLink() {
    const url = new URL(window.location.href);
    url.searchParams.set("credential", selectedCredential.id);
    const text = url.toString();
    const theme = root.getAttribute("data-theme") || "dark";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast("Link copied to clipboard", "success", theme);
      }).catch(() => {
        showToast("Failed to copy link", "error", theme);
      });
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand("copy");
    textarea.remove();
    showToast(success ? "Link copied to clipboard" : "Failed to copy link", success ? "success" : "error", theme);
  }

  function toDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function isWithinLastDays(value, days) {
    const date = toDate(value);
    if (!date) return false;
    const limit = Date.now() - days * 24 * 60 * 60 * 1000;
    return date.getTime() >= limit;
  }

  function formatDateLabel(value, prefix) {
    const date = toDate(value);
    if (!date) return "";
    return `${prefix} ${date.toLocaleDateString("en-US")}`;
  }

  async function loadJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function loadCredentials() {
    const remote = config.githubDataUrl;
    const local = `${config.pluginUrl || ""}data/aggregated.json`;
    const sources = (isFidesLocalDevHost() ? [local, remote] : [remote, local]).filter(Boolean);

    for (const source of sources) {
      try {
        const data = await loadJson(source);
        credentials = Array.isArray(data.credentials) ? data.credentials : [];
        if (credentials.length > 0) return;
      } catch (_) {
        // Try next source.
      }
    }
  }

  function normalizeCredentialKey(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  function extractNativeCredentialKey(nativeIdentifier) {
    const value = String(nativeIdentifier || "").trim();
    if (!value) return "";
    if (value.startsWith("urn:")) {
      const parts = value.split(":");
      return parts.length >= 4 ? parts[3] : "";
    }
    if (value.includes(".")) {
      const parts = value.split(".");
      return parts[parts.length - 1];
    }
    return value;
  }

  function buildCredentialLookupMap() {
    const lookup = new Map();
    for (const credential of credentials) {
      if (!credential || typeof credential.id !== "string") continue;
      const candidateKeys = [
        credential.id.split(":")[2],
        credential.displayName,
        credential.slug,
        extractNativeCredentialKey(credential.nativeIdentifier)
      ];
      for (const candidate of candidateKeys) {
        const key = normalizeCredentialKey(candidate);
        if (key && !lookup.has(key)) {
          lookup.set(key, credential.id);
        }
      }
    }
    return lookup;
  }

  function extractCredentialRefs(rp, credentialLookup) {
    const refs = new Set();
    if (Array.isArray(rp.acceptedCredentialRefs)) {
      for (const ref of rp.acceptedCredentialRefs) {
        if (ref && typeof ref === "object" && typeof ref.credentialCatalogId === "string") {
          refs.add(ref.credentialCatalogId);
        }
      }
    }
    // Backward-compatible fallback for catalogs that still use only acceptedCredentials labels.
    if (Array.isArray(rp.acceptedCredentials)) {
      for (const label of rp.acceptedCredentials) {
        const key = normalizeCredentialKey(label);
        const credentialId = credentialLookup.get(key);
        if (credentialId) {
          refs.add(credentialId);
        }
      }
    }
    return [...refs];
  }

  async function loadRPUsage() {
    const remote = config.rpAggregatedUrl;
    const local = `${config.pluginUrl || ""}data/rp-aggregated.json`;
    const sources = (isFidesLocalDevHost() ? [local, remote] : [remote, local]).filter(Boolean);
    if (!sources.length) return;
    let data = null;
    for (const url of sources) {
      try {
        data = await loadJson(url);
        break;
      } catch (_) {
        /* try next */
      }
    }
    if (!data) return;
    try {
      const relyingParties = Array.isArray(data.relyingParties) ? data.relyingParties : [];
      const credentialLookup = buildCredentialLookupMap();
      const rpMap = new Map();
      // Intermediate map: credentialId -> Map<walletCatalogId, {id, name}> to deduplicate wallets
      const walletMapIntermediate = new Map();
      for (const rp of relyingParties) {
        const refs = extractCredentialRefs(rp, credentialLookup);
        for (const credentialId of refs) {
          // RP usage
          const existingRPs = rpMap.get(credentialId) || [];
          const rpOrg =
            trimStr(rp.organization?.name) ||
            trimStr(rp.provider?.name) ||
            "";
          existingRPs.push({
            id: rp.id,
            name: trimStr(rp.name) || rp.id,
            organization: rpOrg
          });
          rpMap.set(credentialId, existingRPs);
          // Wallet usage: collect unique wallets from this RP for this credential
          if (Array.isArray(rp.supportedWallets)) {
            const walletById = walletMapIntermediate.get(credentialId) || new Map();
            for (const w of rp.supportedWallets) {
              if (w && w.walletCatalogId && !walletById.has(w.walletCatalogId)) {
                walletById.set(w.walletCatalogId, { id: w.walletCatalogId, name: w.name || w.walletCatalogId });
              }
            }
            walletMapIntermediate.set(credentialId, walletById);
          }
        }
      }
      rpUsageMap = rpMap;
      walletUsageMap = new Map(
        Array.from(walletMapIntermediate.entries()).map(([credId, wMap]) => [credId, Array.from(wMap.values())])
      );
    } catch (_) {
      rpUsageMap = new Map();
      walletUsageMap = new Map();
    }
  }

  async function loadIssuerUsage() {
    const remote = config.issuerAggregatedUrl;
    const local = `${config.pluginUrl || ""}data/issuer-aggregated.json`;
    const issuerSources = (isFidesLocalDevHost() ? [local, remote] : [remote, local]).filter(Boolean);

    let data = null;
    for (const source of issuerSources) {
      try {
        data = await loadJson(source);
        if (data?.issuers?.length) break;
      } catch (_) {
        // Try next source.
      }
    }
    if (!data) return;

    try {
      const issuers = Array.isArray(data.issuers) ? data.issuers : [];

      // Build a lookup from nativeIdentifier → credential.id for vct-based fallback matching
      const vctToCredentialId = new Map();
      for (const cred of credentials) {
        if (cred.nativeIdentifier) {
          vctToCredentialId.set(cred.nativeIdentifier, cred.id);
        }
      }

      const map = new Map();
      const addToMap = (credentialId, issuer) => {
        const existing = map.get(credentialId) || [];
        if (!existing.some((e) => e.id === issuer.id)) {
          existing.push({
            id: issuer.id,
            name: trimStr(issuer.displayName) || issuer.id,
            organization: trimStr(issuer.organization?.name)
          });
        }
        map.set(credentialId, existing);
      };

      for (const issuer of issuers) {
        const configs = Array.isArray(issuer.credentialConfigurations) ? issuer.credentialConfigurations : [];
        for (const cc of configs) {
          if (cc.credentialCatalogRef?.id) {
            addToMap(cc.credentialCatalogRef.id, issuer);
          } else if (cc.vct && vctToCredentialId.has(cc.vct)) {
            addToMap(vctToCredentialId.get(cc.vct), issuer);
          }
        }
      }
      issuerUsageMap = map;
    } catch (_) {
      issuerUsageMap = new Map();
    }
  }

  function uniqueValues(items, keyFn) {
    return [...new Set(items.map(keyFn).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
  }

  function getSubjectTypeIcon(subjectType) {
    const key = String(subjectType || "").toLowerCase();
    if (key === "person") return icons.subjectPerson;
    if (key === "organization") return icons.subjectOrganization;
    if (key === "product") return icons.subjectProduct;
    if (key === "dataset") return icons.subjectDataset;
    if (key === "software") return icons.subjectSoftware;
    if (key === "document") return icons.subjectDocument;
    return icons.subjectDocument;
  }

  function computeFilterFacets(items) {
    const facets = {
      vcFormat: {},
      subjectType: {},
      authority: {},
      schemaType: {},
      usedByRPsOnly: 0,
      addedLast30Days: 0,
      updatedLast30Days: 0
    };

    for (const credential of items) {
      facets.vcFormat[credential.vcFormat] = (facets.vcFormat[credential.vcFormat] || 0) + 1;
      facets.subjectType[credential.subjectType] = (facets.subjectType[credential.subjectType] || 0) + 1;
      const authorityName = credential.authority?.name || "Unknown";
      facets.authority[authorityName] = (facets.authority[authorityName] || 0) + 1;
      facets.schemaType[credential.schemaType] = (facets.schemaType[credential.schemaType] || 0) + 1;
      if ((rpUsageMap.get(credential.id) || []).length > 0) facets.usedByRPsOnly += 1;
      if (isWithinLastDays(credential.firstSeenAt, 30)) facets.addedLast30Days += 1;
      if (isWithinLastDays(credential.updatedAt, 30)) facets.updatedLast30Days += 1;
    }

    return facets;
  }

  function credentialIssuerCountForSort(credential) {
    return (issuerUsageMap.get(credential.id) || []).length;
  }

  function credentialRpCountForSort(credential) {
    return (rpUsageMap.get(credential.id) || []).length;
  }

  function compareCredentialDisplayName(a, b) {
    return (a.displayName || "").localeCompare(b.displayName || "");
  }

  function getFilteredCredentials() {
    let list = credentials.filter((credential) => {
      // ID pre-filter (from ?credentials= URL param)
      if (filters.ids.length > 0 && !filters.ids.includes(credential.id)) return false;

      const searchTarget = [
        credential.displayName,
        credential.schemaDescription || credential.shortDescription,
        credential.nativeIdentifier,
        credential.authority?.name,
        ...(credential.tags || []),
        ...(credential.attributes || []).map(a => a.name)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (filters.search && !searchTarget.includes(filters.search.toLowerCase())) return false;
      if (filters.vcFormat.length > 0 && !filters.vcFormat.includes(credential.vcFormat)) return false;
      if (filters.subjectType.length > 0 && !filters.subjectType.includes(credential.subjectType)) return false;
      if (filters.authority.length > 0 && !filters.authority.includes(credential.authority?.name || "")) return false;
      if (filters.schemaType.length > 0 && !filters.schemaType.includes(credential.schemaType)) return false;
      if (filters.usedByRPsOnly && !(rpUsageMap.get(credential.id) || []).length) return false;
      if (filters.hasIssuersOnly && !(issuerUsageMap.get(credential.id) || []).length) return false;
      if (filters.addedLast30Days && !isWithinLastDays(credential.firstSeenAt, 30)) return false;
      if (filters.updatedLast30Days && !isWithinLastDays(credential.updatedAt, 30)) return false;
      return true;
    });

    if (sortBy === "name") {
      list = list.sort((a, b) => compareCredentialDisplayName(a, b));
    } else if (sortBy === "issuers") {
      list = list.sort((a, b) => {
        const ia = credentialIssuerCountForSort(a);
        const ib = credentialIssuerCountForSort(b);
        if (ib !== ia) return ib - ia;
        return compareCredentialDisplayName(a, b);
      });
    } else if (sortBy === "relyingParties") {
      list = list.sort((a, b) => {
        const ra = credentialRpCountForSort(a);
        const rb = credentialRpCountForSort(b);
        if (rb !== ra) return rb - ra;
        return compareCredentialDisplayName(a, b);
      });
    } else {
      list = list.sort((a, b) => {
        const dateA = toDate(a.updatedAt)?.getTime() || 0;
        const dateB = toDate(b.updatedAt)?.getTime() || 0;
        return dateB - dateA;
      });
    }
    return list;
  }

  function computeMetrics() {
    const total = credentials.length;
    let recentActivity = 0;
    let usedByRPs = 0;
    const uniqueIssuerIds = new Set();
    for (const credential of credentials) {
      if (isWithinLastDays(credential.firstSeenAt, 30) || isWithinLastDays(credential.updatedAt, 30)) recentActivity += 1;
      if ((rpUsageMap.get(credential.id) || []).length > 0) usedByRPs += 1;
      for (const issuer of (issuerUsageMap.get(credential.id) || [])) {
        uniqueIssuerIds.add(issuer.id);
      }
    }
    return { total, recentActivity, usedByRPs, issuers: uniqueIssuerIds.size };
  }

  function renderKpiCards(metrics) {
    return `
      <div class="fides-kpi-row" role="group" aria-label="Catalog summary">
        <div class="fides-kpi-card">
          <span class="fides-kpi-value">${metrics.total}</span>
          <span class="fides-kpi-label">Credential types</span>
        </div>
        <div class="fides-kpi-card">
          <span class="fides-kpi-value">${metrics.issuers}</span>
          <span class="fides-kpi-label">Issuers</span>
        </div>
        <div class="fides-kpi-card">
          <span class="fides-kpi-value">${metrics.usedByRPs}</span>
          <span class="fides-kpi-label">Used by relying parties</span>
        </div>
        <div class="fides-kpi-card">
          <span class="fides-kpi-value">${metrics.recentActivity}</span>
          <span class="fides-kpi-label">Updated last 30 days</span>
        </div>
      </div>
    `;
  }

  function renderCheckboxGroup(title, key, options, facets) {
    if (options.length === 0) return "";
    const selected = filters[key] || [];
    const expanded = filterGroupState[key] !== false;
    const groupClass = expanded ? "" : "collapsed";
    const hasActiveClass = selected.length > 0 ? "has-active" : "";
    return `
      <div class="fides-filter-group collapsible ${groupClass} ${hasActiveClass}" data-filter-group="${escapeHtml(key)}">
        <button class="fides-filter-label-toggle" type="button" aria-expanded="${expanded}">
          <span class="fides-filter-label">${escapeHtml(title)}</span>
          <span class="fides-filter-active-indicator"></span>
          ${icons.chevronDown}
        </button>
        <div class="fides-filter-options">
        ${options
          .map(
            (option) => `
              <label class="fides-filter-checkbox">
                <input type="checkbox" data-filter-group="${escapeHtml(key)}" value="${escapeHtml(option)}" ${
                  selected.includes(option) ? "checked" : ""
                }>
                <span>${escapeHtml(VC_FORMAT_LABELS[option] || option)}<span class="fides-filter-option-count">(${facets?.[key]?.[option] || 0})</span></span>
              </label>
            `
          )
          .join("")}
        </div>
      </div>
    `;
  }

  function renderFiltersPanel() {
    if (!settings.showFilters) return "";
    const formatOptions = uniqueValues(credentials, (c) => c.vcFormat);
    const subjectOptions = uniqueValues(credentials, (c) => c.subjectType);
    const authorityOptions = uniqueValues(credentials, (c) => c.authority?.name);
    const schemaTypeOptions = uniqueValues(credentials, (c) => c.schemaType);
    const filterFacets = computeFilterFacets(credentials);
    const activeFilterCount = getActiveFilterCount();

    return `
      <aside class="fides-sidebar">
        <div class="fides-sidebar-header">
          <div class="fides-sidebar-title">
            ${icons.filter}
            <span>Filters</span>
            <span class="fides-filter-count ${activeFilterCount > 0 ? "" : "hidden"}">${activeFilterCount || 0}</span>
          </div>
          <div class="fides-sidebar-actions">
            <button class="fides-clear-all ${activeFilterCount > 0 ? "" : "hidden"}" id="fides-clear" type="button">
              ${icons.x} Clear
            </button>
            <button class="fides-sidebar-close" id="fides-sidebar-close" aria-label="Close filters">
              ${icons.xLarge}
            </button>
          </div>
        </div>
        <div class="fides-sidebar-content">
        <div class="fides-quick-filters">
          <span class="fides-quick-filters-title">Quick filters</span>
          <label class="fides-filter-checkbox">
            <input type="checkbox" id="fides-added-last-30" ${filters.addedLast30Days ? "checked" : ""}>
            <span>Added last 30 days<span class="fides-filter-option-count">(${filterFacets.addedLast30Days})</span></span>
          </label>
          <label class="fides-filter-checkbox">
            <input type="checkbox" id="fides-used-by-rps" ${filters.usedByRPsOnly ? "checked" : ""}>
            <span>Used by relying parties<span class="fides-filter-option-count">(${filterFacets.usedByRPsOnly})</span></span>
          </label>
          ${originalCredentialIds.length > 0 ? `
          <label class="fides-filter-checkbox">
            <input type="checkbox" data-filter="linkedCredentials" ${filters.ids.length > 0 ? "checked" : ""}>
            <span>Linked credentials (${originalCredentialIds.length})</span>
          </label>` : ''}
        </div>
        ${renderCheckboxGroup("Authority", "authority", authorityOptions, filterFacets)}
        ${renderCheckboxGroup("Subject type", "subjectType", subjectOptions, filterFacets)}
        ${renderCheckboxGroup("VC Format", "vcFormat", formatOptions, filterFacets)}
        ${renderCheckboxGroup("Schema type", "schemaType", schemaTypeOptions, filterFacets)}
        </div>
      </aside>
    `;
  }

  /**
   * Shared display data for a credential item.
   * Used by both renderCredentialCard() and renderCredentialRow() so that
   * adding a new computed field only requires one change here.
   */
  function getCredentialDisplayData(credential) {
    const issuerCount = issuerUsageMap.get(credential.id)?.length ?? 0;
    const rpCount = rpUsageMap.get(credential.id)?.length ?? 0;
    const activityLabel = isWithinLastDays(credential.firstSeenAt, 30)
      ? formatDateLabel(credential.firstSeenAt, "Added")
      : formatDateLabel(credential.updatedAt, "Updated");
    return { issuerCount, rpCount, activityLabel };
  }

  /**
   * Renders the sticky column-header row for list view.
   * Column order must stay in sync with the grid-template-columns in:
   *   .fides-credential-grid[data-view="list"] .fides-credential-card  (CSS)
   *   .fides-credential-list-header                                     (CSS)
   */
  function renderCredentialListHeader() {
    return `
      <div class="fides-credential-list-header" aria-hidden="true">
        <div></div>
        <div>Name</div>
        <div>Authority</div>
        <div>VC Format</div>
        <div class="fides-list-col-right" title="Issuers">${icons.building}</div>
        <div class="fides-list-col-right" title="Relying parties">${icons.shield}</div>
        <div style="padding-left:0.75rem">Updated</div>
      </div>
    `;
  }

  /**
   * Renders a compact list-row for a credential (used in list / table view).
   * The outer element is the same .fides-credential-card as in grid mode so
   * that bindCredentialCardEvents() works without any changes.
   *
   * If you add or remove a column, also update:
   *  - renderCredentialListHeader()  — column header labels
   *  - style.css: grid-template-columns in .fides-credential-list-header
   *               and .fides-credential-grid[data-view="list"] .fides-credential-card
   */
  function renderCredentialRow(credential) {
    const { issuerCount, rpCount, activityLabel } = getCredentialDisplayData(credential);
    return `
      <article class="fides-credential-card" data-credential-id="${escapeHtml(credential.id)}" role="button" tabindex="0">
        <div class="fides-row-icon" aria-hidden="true" title="${escapeHtml(credential.subjectType || 'Document')}">
          ${getSubjectTypeIcon(credential.subjectType)}
        </div>
        <div class="fides-row-name">
          <span class="fides-row-name-text" title="${escapeHtml(credential.displayName)}">${escapeHtml(credential.displayName)}</span>
          ${credential.nativeIdentifier
            ? `<span class="fides-row-name-id" title="${escapeHtml(credential.nativeIdentifier)}">${escapeHtml(credential.nativeIdentifier)}</span>`
            : ''}
        </div>
        <div class="fides-row-authority" title="${escapeHtml(credential.authority?.name || '')}">${escapeHtml(credential.authority?.name || '—')}</div>
        <div class="fides-row-format">${escapeHtml(vcFormatDisplayLabel(credential.vcFormat))}</div>
        <div class="fides-row-count" title="${issuerCount} ${issuerCount === 1 ? 'issuer' : 'issuers'}">${issuerCount}</div>
        <div class="fides-row-count" title="${rpCount} ${rpCount === 1 ? 'relying party' : 'relying parties'}">${rpCount}</div>
        <div class="fides-row-updated">${escapeHtml(activityLabel || '—')}</div>
      </article>
    `;
  }

  /**
   * Renders the grid/list toggle buttons for the results bar.
   * Generic: only depends on the module-level `viewMode` variable and `icons`.
   * The active button reflects the current viewMode.
   */
  function renderViewToggle() {
    return `
      <div class="fides-view-toggle" role="group" aria-label="View mode">
        <button class="fides-view-btn${viewMode === 'grid' ? ' active' : ''}" data-view="grid"
                aria-label="Grid view" aria-pressed="${viewMode === 'grid'}" title="Grid view">
          ${icons.viewGrid}
        </button>
        <button class="fides-view-btn${viewMode === 'list' ? ' active' : ''}" data-view="list"
                aria-label="List view" aria-pressed="${viewMode === 'list'}" title="List view">
          ${icons.viewList}
        </button>
      </div>
    `;
  }

  function renderCredentialCard(credential) {
    const { issuerCount, rpCount, activityLabel } = getCredentialDisplayData(credential);

    return `
      <article class="fides-credential-card" data-credential-id="${escapeHtml(credential.id)}" role="button" tabindex="0">
        <header class="fides-credential-header">
          <div class="fides-credential-subject-icon" aria-hidden="true" title="${escapeHtml(credential.subjectType || "Document")}">
            ${getSubjectTypeIcon(credential.subjectType)}
          </div>
          <div class="fides-credential-header-text">
            <h3 class="fides-credential-name" title="${escapeHtml(credential.displayName)}">${escapeHtml(credential.displayName)}</h3>
            <div class="fides-credential-meta-row">
              <p class="fides-credential-provider">${escapeHtml(credential.authority?.name || "Unknown authority")}</p>
            </div>
          </div>
        </header>
        <div class="fides-credential-body">
          <div class="fides-credential-date-id">
            ${activityLabel ? `<p class="fides-credential-updated">${escapeHtml(activityLabel)}</p>` : ""}
            ${credential.nativeIdentifier ? `<p class="fides-credential-card-identifier" title="${escapeHtml(credential.nativeIdentifier)}"><span class="fides-credential-card-identifier-label">ID</span><span class="fides-credential-card-identifier-value">${escapeHtml(credential.nativeIdentifier)}</span></p>` : ""}
          </div>
          <div class="fides-credential-counts">
            <div class="fides-credential-count-item">
              <span class="fides-credential-count-number">${issuerCount}</span>
              <span class="fides-credential-count-label">${issuerCount === 1 ? "Issuer" : "Issuers"}</span>
            </div>
            <div class="fides-credential-count-item">
              <span class="fides-credential-count-number">${rpCount}</span>
              <span class="fides-credential-count-label">${rpCount === 1 ? "Relying party" : "Relying parties"}</span>
            </div>
          </div>
        </div>
        <footer class="fides-credential-footer">
          <span class="fides-view-details">${icons.eye} View details</span>
        </footer>
      </article>
    `;
  }

  function renderModal() {
    if (!selectedCredential) return "";
    const rpItems = rpUsageMap.get(selectedCredential.id) || [];
    const issuerItems = issuerUsageMap.get(selectedCredential.id) || [];
    const walletItems = walletUsageMap.get(selectedCredential.id) || [];
    const attributes = Array.isArray(selectedCredential.attributes) ? selectedCredential.attributes : [];
    const currentTheme = root.getAttribute("data-theme") || "dark";

    const issuerRowsSorted = [...issuerItems].sort((a, b) =>
      String(a.name || a.id).localeCompare(String(b.name || b.id), undefined, { sensitivity: "base" })
    );
    const rpRowsSorted = [...rpItems].sort((a, b) =>
      String(a.name || a.id).localeCompare(String(b.name || b.id), undefined, { sensitivity: "base" })
    );

    const showIssuerOrgCol = issuerRowsSorted.some((i) => trimStr(i.organization));
    const showRpOrgCol = rpRowsSorted.some((rp) => trimStr(rp.organization));

    const issuerCatalogBase = (config.issuerCatalogUrl || "https://fides.community/ecosystem-explorer/issuer-catalog/").replace(/\/$/, "");
    const ecosystemIssuerHref =
      issuerItems.length > 0 && issuerCatalogBase
        ? issuerItems.length === 1
          ? `${issuerCatalogBase}/?issuer=${encodeURIComponent(issuerItems[0].id)}`
          : `${issuerCatalogBase}/?issuers=${issuerItems.map((i) => encodeURIComponent(i.id)).join(",")}`
        : "";

    const rpCatalogBase = (config.rpCatalogUrl || "").replace(/\/$/, "");
    const ecosystemRpHref =
      rpItems.length > 0 && rpCatalogBase
        ? rpItems.length === 1
          ? `${rpCatalogBase}/?rp=${encodeURIComponent(rpItems[0].id)}`
          : `${rpCatalogBase}/?rps=${rpItems.map((rp) => encodeURIComponent(rp.id)).join(",")}`
        : "";

    return `
      <div class="fides-modal-overlay" id="fides-modal-overlay" data-theme="${currentTheme}">
        <div class="fides-modal" role="dialog" aria-modal="true" aria-labelledby="fides-modal-title">

          <div class="fides-modal-header">
            <div class="fides-modal-header-content">
              <div class="fides-modal-logo-placeholder">
                ${getSubjectTypeIcon(selectedCredential.subjectType)}
              </div>
              <div class="fides-modal-title-wrap">
                <h2 class="fides-modal-title" id="fides-modal-title">${escapeHtml(selectedCredential.displayName)}</h2>
                <p class="fides-modal-provider">${icons.building} ${escapeHtml(selectedCredential.authority?.name || "Unknown authority")}</p>
              </div>
            </div>
            <div class="fides-modal-header-actions">
              <button type="button" class="fides-modal-copy-link" id="fides-modal-copy-link" aria-label="Copy link to this credential" title="Copy link to this credential">
                ${icons.share}
              </button>
              <button class="fides-modal-close" id="fides-modal-close" aria-label="Close modal">${icons.xLarge}</button>
            </div>
          </div>

          <div class="fides-modal-body">

            <!-- Intro: description only -->
            ${(selectedCredential.schemaDescription || selectedCredential.shortDescription) ? `<div class="fides-modal-intro"><p class="fides-modal-description">${escapeHtml(selectedCredential.schemaDescription || selectedCredential.shortDescription)}</p></div>` : ""}

            <!-- Ecosystem flow -->
            <div class="fides-accordion fides-modal-section">
              <div class="fides-accordion-header fides-modal-section-header">
                <span class="fides-accordion-title">${icons.wallet} FIDES Ecosystem Model</span>
              </div>
              <div class="fides-accordion-body fides-modal-ecosystem-body">

                <!-- Personal Wallets (top) -->
                <div class="fides-modal-ecosystem">
                  <div class="fides-eco-wallet-row">
                    ${walletItems.length > 0 && config.walletCatalogUrl
                      ? `<a href="${escapeHtml(config.walletCatalogUrl.replace(/\/$/, '') + '/?wallets=' + walletItems.map(w => encodeURIComponent(w.id)).join(','))}" class="fides-eco-wallet-box fides-eco-wallet-box--link" onclick="event.stopPropagation();">
                          <span class="fides-eco-wallet-count">${walletItems.length}</span>
                          <span class="fides-eco-wallet-label">${walletItems.length === 1 ? "Personal Wallet" : "Personal Wallets"}</span>
                        </a>`
                      : `<div class="fides-eco-wallet-box">
                          <span class="fides-eco-wallet-count">—</span>
                          <span class="fides-eco-wallet-label">Personal Wallets</span>
                        </div>`
                    }
                  </div>

                  <div class="fides-eco-wallet-connector">${icons.chevronUp}</div>

                  <!-- Main row: Issuers → Credential → Relying Parties (count + double-chevron; details in accordions below) -->
                  <div class="fides-eco-main-row">
                    <div class="fides-eco-col fides-eco-stat-wrap">
                      <div class="fides-eco-wallet-box fides-eco-stat-box fides-eco-stat-box--green${issuerItems.length > 0 ? "" : " fides-eco-stat-box--static"}"
                        ${issuerItems.length > 0 ? 'data-fides-eco-target="fides-accordion-issuers"' : ""}>
                        <div class="fides-eco-stat-box-main">
                          <span class="fides-eco-wallet-count">${issuerItems.length}</span>
                          <span class="fides-eco-wallet-label">${issuerItems.length === 1 ? "Issuer" : "Issuers"}</span>
                        </div>
                        ${issuerItems.length > 0 ? `<span class="fides-eco-stat-hint" aria-hidden="true">${icons.chevronDoubleDown}</span>` : ""}
                      </div>
                    </div>

                    <div class="fides-eco-arrow">${icons.chevronDown}</div>

                    <div class="fides-eco-col fides-eco-col-center">
                      <div class="fides-eco-center-card">
                        <div class="fides-eco-center-icon">${getSubjectTypeIcon(selectedCredential.subjectType)}</div>
                        <p class="fides-eco-center-name">${escapeHtml(selectedCredential.displayName)}</p>
                        <p class="fides-eco-center-authority">${escapeHtml(selectedCredential.authority?.name || "")}</p>
                      </div>
                    </div>

                    <div class="fides-eco-arrow fides-eco-arrow-right">${icons.chevronDown}</div>

                    <div class="fides-eco-col fides-eco-stat-wrap fides-eco-rp-col">
                      <div class="fides-eco-wallet-box fides-eco-stat-box fides-eco-stat-box--blue${rpItems.length > 0 ? "" : " fides-eco-stat-box--static"}"
                        ${rpItems.length > 0 ? 'data-fides-eco-target="fides-accordion-rps"' : ""}>
                        <div class="fides-eco-stat-box-main">
                          <span class="fides-eco-wallet-count">${rpItems.length}</span>
                          <span class="fides-eco-wallet-label">${rpItems.length === 1 ? "Relying party" : "Relying parties"}</span>
                        </div>
                        ${rpItems.length > 0 ? `<span class="fides-eco-stat-hint" aria-hidden="true">${icons.chevronDoubleDown}</span>` : ""}
                      </div>
                    </div>
                  </div>

                  <div class="fides-eco-wallet-connector">${icons.chevronDown}</div>

                  <!-- Business Wallets (bottom) -->
                  <div class="fides-eco-wallet-row">
                    <div class="fides-eco-wallet-box">
                      <span class="fides-eco-wallet-count">—</span>
                      <span class="fides-eco-wallet-label">Business Wallets</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <!-- Attributes accordion -->
            <div class="fides-accordion" id="fides-accordion-data">
              <div class="fides-accordion-header-bar">
                <button class="fides-accordion-header fides-accordion-toggle" type="button" aria-expanded="false">
                  <span class="fides-accordion-title">${icons.fileCheck} Attributes${attributes.length > 0 ? ` <span class="fides-accordion-count">${attributes.length}</span>` : ""}</span>
                </button>
                <button type="button" class="fides-accordion-chevron-btn fides-accordion-toggle" aria-expanded="false" aria-label="Toggle attributes section">
                  <span class="fides-accordion-chevron">${icons.chevronDown}</span>
                </button>
              </div>
              <div class="fides-accordion-body">
                ${attributes.length > 0
                  ? `<div class="fides-attributes-table-wrap"><table class="fides-attributes-table">
                      <thead><tr><th>Field name</th><th class="fides-col-type">Type</th><th class="fides-col-required" title="Required">✓</th><th>Description</th></tr></thead>
                      <tbody>
                        ${attributes.map((attr) => `<tr>
                          <td class="fides-attr-name-cell" style="padding-left:${(Number(attr.depth) || 0) * 14}px" title="${escapeHtml(attr.name)}"><code>${escapeHtml(formatAttributeNameForDisplay(attr.name))}</code></td>
                          <td class="fides-col-type">${attr.type ? `<span class="fides-attr-type">${escapeHtml(attr.type)}</span>` : "—"}</td>
                          <td class="fides-col-required fides-attr-required">${attr.required ? "✓" : ""}</td>
                          <td>${escapeHtml(attr.description || "")}</td>
                        </tr>`).join("")}
                      </tbody>
                    </table></div>`
                  : `<p class="fides-modal-empty">No attributes available from linked schema.</p>`}
              </div>
            </div>

            <!-- Issuers (from issuer catalog linkage) -->
            <div class="fides-accordion" id="fides-accordion-issuers">
              <div class="fides-accordion-header-bar">
                <button class="fides-accordion-header fides-accordion-toggle" type="button" aria-expanded="false">
                  <span class="fides-accordion-title">${icons.server} Issuers <span class="fides-accordion-count">${issuerItems.length}</span></span>
                </button>
                ${ecosystemIssuerHref
                  ? `<a href="${escapeHtml(ecosystemIssuerHref)}" class="fides-accordion-explore-link" aria-label="Issuer catalog (filtered view)">Open in catalog</a>`
                  : ""}
                <button type="button" class="fides-accordion-chevron-btn fides-accordion-toggle" aria-expanded="false" aria-label="Toggle issuers section">
                  <span class="fides-accordion-chevron">${icons.chevronDown}</span>
                </button>
              </div>
              <div class="fides-accordion-body">
                ${issuerRowsSorted.length > 0
                  ? `<div class="fides-attributes-table-wrap"><table class="fides-attributes-table fides-modal-rp-table fides-modal-entity-table" aria-label="Issuers">
                      <thead><tr><th>Issuer</th>${showIssuerOrgCol ? "<th>Organization</th>" : ""}</tr></thead>
                      <tbody>
                        ${issuerRowsSorted.map((i) => {
                          const href = issuerCatalogBase ? `${issuerCatalogBase}/?issuer=${encodeURIComponent(i.id)}` : "";
                          const label = escapeHtml(i.name || i.id);
                          const orgCell =
                            showIssuerOrgCol
                              ? `<td>${i.organization ? escapeHtml(i.organization) : "—"}</td>`
                              : "";
                          return `<tr><td>${
                            href
                              ? `<a href="${escapeHtml(href)}" class="fides-modal-link-inline" onclick="event.stopPropagation();">${label}</a>`
                              : `<span>${label}</span>`
                          }</td>${orgCell}</tr>`;
                        }).join("")}
                      </tbody>
                    </table></div>`
                  : `<p class="fides-modal-empty">No issuers found in the issuer catalog data for this credential.</p>`}
              </div>
            </div>

            <!-- Relying parties (from RP catalog linkage) -->
            <div class="fides-accordion" id="fides-accordion-rps">
              <div class="fides-accordion-header-bar">
                <button class="fides-accordion-header fides-accordion-toggle" type="button" aria-expanded="false">
                  <span class="fides-accordion-title">${icons.building} Relying parties <span class="fides-accordion-count">${rpItems.length}</span></span>
                </button>
                ${ecosystemRpHref
                  ? `<a href="${escapeHtml(ecosystemRpHref)}" class="fides-accordion-explore-link" aria-label="Relying party catalog (filtered view)">Open in catalog</a>`
                  : ""}
                <button type="button" class="fides-accordion-chevron-btn fides-accordion-toggle" aria-expanded="false" aria-label="Toggle relying parties section">
                  <span class="fides-accordion-chevron">${icons.chevronDown}</span>
                </button>
              </div>
              <div class="fides-accordion-body">
                ${rpRowsSorted.length > 0
                  ? `<div class="fides-attributes-table-wrap"><table class="fides-attributes-table fides-modal-rp-table fides-modal-entity-table" aria-label="Relying parties">
                      <thead><tr><th>Relying party</th>${showRpOrgCol ? "<th>Organization</th>" : ""}</tr></thead>
                      <tbody>
                        ${rpRowsSorted.map((rp) => {
                          const href = rpCatalogBase ? `${rpCatalogBase}/?rp=${encodeURIComponent(rp.id)}` : "";
                          const label = escapeHtml(rp.name || rp.id);
                          const orgCell =
                            showRpOrgCol
                              ? `<td>${rp.organization ? escapeHtml(rp.organization) : "—"}</td>`
                              : "";
                          return `<tr><td>${
                            href
                              ? `<a href="${escapeHtml(href)}" class="fides-modal-link-inline" onclick="event.stopPropagation();">${label}</a>`
                              : `<span>${label}</span>`
                          }</td>${orgCell}</tr>`;
                        }).join("")}
                      </tbody>
                    </table></div>`
                  : `<p class="fides-modal-empty">No relying parties found in the RP catalog data for this credential.</p>`}
              </div>
            </div>

            <!-- Other details accordion (open by default) -->
            <div class="fides-accordion is-open" id="fides-accordion-details">
              <div class="fides-accordion-header-bar">
                <button class="fides-accordion-header fides-accordion-toggle" type="button" aria-expanded="true">
                  <span class="fides-accordion-title">${icons.shield} Other details</span>
                </button>
                <button type="button" class="fides-accordion-chevron-btn fides-accordion-toggle" aria-expanded="true" aria-label="Toggle other details section">
                  <span class="fides-accordion-chevron">${icons.chevronDown}</span>
                </button>
              </div>
              <div class="fides-accordion-body">
                <div class="fides-details-kv">
                  <!-- left col: row 1 -->
                  <div class="fides-kv-row">
                    <span class="fides-kv-key">Credential ID</span>
                    <span class="fides-kv-val fides-modal-identifier" style="font-size:0.8125rem;">${escapeHtml(selectedCredential.nativeIdentifier || selectedCredential.id)}</span>
                  </div>
                  <!-- right col: row 1 -->
                  ${selectedCredential.schemaType ? `<div class="fides-kv-row">
                    <span class="fides-kv-key">Schema type</span>
                    <span class="fides-kv-val">${escapeHtml(selectedCredential.schemaType)}${selectedCredential.schemaUrl ? ` <a href="${escapeHtml(selectedCredential.schemaUrl)}" target="_blank" rel="noopener" class="fides-modal-link-inline" onclick="event.stopPropagation();">${icons.externalLinkSmall} View schema</a>` : ""}</span>
                  </div>` : selectedCredential.schemaUrl ? `<div class="fides-kv-row">
                    <span class="fides-kv-key">Schema</span>
                    <span class="fides-kv-val"><a href="${escapeHtml(selectedCredential.schemaUrl)}" target="_blank" rel="noopener" class="fides-modal-link-inline" onclick="event.stopPropagation();">${icons.externalLinkSmall} View schema</a></span>
                  </div>` : `<div class="fides-kv-row">
                    <span class="fides-kv-key">Schema</span>
                    <span class="fides-kv-val">—</span>
                  </div>`}
                  <!-- left col: row 2 -->
                  <div class="fides-kv-row">
                    <span class="fides-kv-key">VC Format</span>
                    <span class="fides-kv-val fides-kv-tags">${selectedCredential.vcFormat ? vcFormatTagHtml(selectedCredential.vcFormat) : "—"}</span>
                  </div>
                  <!-- right col: row 2 -->
                  <div class="fides-kv-row">
                    <span class="fides-kv-key">Version</span>
                    <span class="fides-kv-val">${escapeHtml(selectedCredential.version || "—")}</span>
                  </div>
                  <!-- left col: row 3 -->
                  <div class="fides-kv-row">
                    <span class="fides-kv-key">Authority</span>
                    <span class="fides-kv-val">${escapeHtml(selectedCredential.authority?.name || "—")}</span>
                  </div>
                  <!-- right col: row 3 -->
                  <div class="fides-kv-row">
                    <span class="fides-kv-key">Last updated</span>
                    <span class="fides-kv-val">${escapeHtml(formatDateLabel(selectedCredential.updatedAt, "").trim() || "—")}</span>
                  </div>
                  ${selectedCredential.rulebookUrl ? `
                  <div class="fides-kv-row fides-kv-row-wide">
                    <span class="fides-kv-key">Rulebook</span>
                    <span class="fides-kv-val"><a href="${escapeHtml(selectedCredential.rulebookUrl)}" target="_blank" rel="noopener" class="fides-modal-link-inline" onclick="event.stopPropagation();">${icons.externalLinkSmall} View rulebook</a></span>
                  </div>` : ""}
                  ${(selectedCredential.vocabularies?.length > 0) ? `
                  <div class="fides-kv-row fides-kv-row-wide">
                    <span class="fides-kv-key">${selectedCredential.vocabularies.length === 1 ? "Vocabulary" : "Vocabularies"}</span>
                    <span class="fides-kv-val-stack">
                      ${selectedCredential.vocabularies.map(v => {
                        const href = v.authority?.url || v.url;
                        return href
                          ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener" class="fides-modal-link-inline" onclick="event.stopPropagation();">${icons.externalLinkSmall} ${escapeHtml(v.name)}</a>`
                          : `<span>${escapeHtml(v.name)}</span>`;
                      }).join("")}
                    </span>
                  </div>` : ""}
                  ${(selectedCredential.extends?.length > 0) ? `
                  <div class="fides-kv-row fides-kv-row-wide">
                    <span class="fides-kv-key">Extends</span>
                    <span class="fides-kv-val">
                      ${selectedCredential.extends.map(ref => `<span class="fides-tag-chip">${escapeHtml(ref.displayName || ref.id)}</span>`).join(" ")}
                    </span>
                  </div>` : ""}
                  ${(selectedCredential.tags?.length > 0) ? `
                  <div class="fides-kv-row fides-kv-row-wide">
                    <span class="fides-kv-key">Tags</span>
                    <span class="fides-kv-val">
                      ${selectedCredential.tags.map(t => `<span class="fides-tag-chip">${escapeHtml(t)}</span>`).join(" ")}
                    </span>
                  </div>` : ""}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;
  }

  function render() {
    const filtered = getFilteredCredentials();
    const metrics = computeMetrics();

    root.innerHTML = `
      <div class="fides-credential-layout">
        <div class="fides-main-layout fides-main ${settings.showFilters ? "" : "no-filters"}">
          ${renderFiltersPanel()}
          <section class="fides-main-content">
            <div class="fides-results-bar">
              ${settings.showSearch ? `
                <div class="fides-topbar-search">
                  <div class="fides-search-wrapper">
                    <span class="fides-search-icon">${icons.search}</span>
                    <input id="fides-search-input" class="fides-search-input" type="text" placeholder="Search..." value="${escapeHtml(filters.search)}" autocomplete="off">
                    <button class="fides-search-clear ${filters.search ? "" : "hidden"}" id="fides-search-clear" type="button" aria-label="Clear search">${icons.xSmall}</button>
                  </div>
                </div>
              ` : ""}
              <label class="fides-sort-label" for="fides-sort-select">
                <span class="fides-sort-text">Sort by:</span>
                <select id="fides-sort-select" class="fides-sort-select">
                  <option value="lastUpdated" ${sortBy === "lastUpdated" ? "selected" : ""}>Last updated</option>
                  <option value="name" ${sortBy === "name" ? "selected" : ""}>Name</option>
                  <option value="issuers" ${sortBy === "issuers" ? "selected" : ""}>Issuers</option>
                  <option value="relyingParties" ${sortBy === "relyingParties" ? "selected" : ""}>Relying parties</option>
                </select>
              </label>
              ${settings.showFilters ? `
                <button class="fides-mobile-filter-toggle" id="fides-mobile-filter-toggle">
                  ${icons.filter}
                  <span>Filters</span>
                  <span class="fides-filter-count ${getActiveFilterCount() > 0 ? "" : "hidden"}">${getActiveFilterCount() || 0}</span>
                </button>
              ` : ""}
              ${renderViewToggle()}
            </div>
            ${renderKpiCards(metrics)}
            <div class="fides-results">
              <div class="fides-credential-grid" data-view="${effectiveView()}" data-columns="${escapeHtml(settings.columns)}">
                ${effectiveView() === 'list' ? renderCredentialListHeader() : ''}
                ${filtered.length > 0
                  ? filtered.map(effectiveView() === 'list' ? renderCredentialRow : renderCredentialCard).join("")
                  : '<p class="fides-empty">No credentials found.</p>'}
              </div>
            </div>
          </section>
        </div>
      </div>
    `;

    bindEvents();

    if (selectedCredential) {
      openModal();
    }
  }

  function openModal() {
    closeModal();
    const html = renderModal();
    if (!html) return;
    document.body.insertAdjacentHTML("beforeend", html);
    document.body.style.overflow = "hidden";
    bindModalBodyEvents();
  }

  function closeModal() {
    const existing = document.getElementById("fides-modal-overlay");
    if (existing) existing.remove();
    document.body.style.overflow = "";
  }

  function renderCredentialGridOnly() {
    const grid = root.querySelector(".fides-credential-grid");
    if (!grid) return;
    const ev = effectiveView();
    grid.setAttribute('data-view', ev);
    const filtered = getFilteredCredentials();
    const header = ev === 'list' ? renderCredentialListHeader() : '';
    const items = filtered.length > 0
      ? filtered.map(ev === 'list' ? renderCredentialRow : renderCredentialCard).join("")
      : '<p class="fides-empty">No credentials found.</p>';
    grid.innerHTML = header + items;
    bindCredentialCardEvents();
  }

  function getActiveFilterCount() {
    let count = 0;
    count += filters.vcFormat.length;
    count += filters.subjectType.length;
    count += filters.authority.length;
    count += filters.schemaType.length;
    count += filters.ids.length;
    if (filters.usedByRPsOnly) count += 1;
    if (filters.hasIssuersOnly) count += 1;
    if (filters.addedLast30Days) count += 1;
    if (filters.updatedLast30Days) count += 1;
    return count;
  }

  function bindEvents() {
    const searchInput = root.querySelector("#fides-search-input");
    const searchClear = root.querySelector("#fides-search-clear");

    const syncMobileSearch = (value) => {
      const mobileInput = root.querySelector("#fides-mobile-search-input");
      const mobileClear = root.querySelector("#fides-mobile-search-clear");
      if (mobileInput) mobileInput.value = value;
      if (mobileClear) mobileClear.classList.toggle("hidden", !value);
    };

    const handleSearchInput = debounce((event) => {
      filters.search = event.target.value || "";
      if (searchClear) searchClear.classList.toggle("hidden", !filters.search);
      syncMobileSearch(filters.search);
      renderCredentialGridOnly();
    }, 300);

    if (searchInput) {
      searchInput.addEventListener("input", handleSearchInput);
    }

    if (searchClear) {
      searchClear.addEventListener("click", () => {
        filters.search = "";
        if (searchInput) searchInput.value = "";
        searchClear.classList.add("hidden");
        syncMobileSearch("");
        renderCredentialGridOnly();
      });
    }

    const sortSelect = root.querySelector("#fides-sort-select");
    if (sortSelect) {
      sortSelect.addEventListener("change", (event) => {
        const v = event.target.value;
        const allowed = new Set(["lastUpdated", "name", "issuers", "relyingParties"]);
        sortBy = allowed.has(v) ? v : "lastUpdated";
        render();
      });
    }

    const clearBtn = root.querySelector("#fides-clear");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        filters.vcFormat = [];
        filters.subjectType = [];
        filters.authority = [];
        filters.schemaType = [];
        filters.hasSchemaUrl = null;
        filters.usedByRPsOnly = false;
        filters.addedLast30Days = false;
        filters.updatedLast30Days = false;
        filters.ids = [];
        originalCredentialIds = [];
        const url = new URL(window.location.href);
        url.searchParams.delete('credentials');
        history.replaceState(null, '', url.toString());
        render();
      });
    }

    root.querySelectorAll("[data-filter-group]").forEach((input) => {
      input.addEventListener("change", (event) => {
        const group = event.target.dataset.filterGroup;
        const value = event.target.value;
        if (!filters[group]) filters[group] = [];
        if (event.target.checked) {
          if (!filters[group].includes(value)) filters[group].push(value);
        } else {
          filters[group] = filters[group].filter((item) => item !== value);
        }
        render();
      });
    });

    const usedByRpsInput = root.querySelector("#fides-used-by-rps");
    if (usedByRpsInput) {
      usedByRpsInput.addEventListener("change", (event) => {
        filters.usedByRPsOnly = event.target.checked;
        render();
      });
    }

    const linkedCredentialsInput = root.querySelector('[data-filter="linkedCredentials"]');
    if (linkedCredentialsInput) {
      linkedCredentialsInput.addEventListener("change", (event) => {
        filters.ids = event.target.checked ? [...originalCredentialIds] : [];
        render();
      });
    }

    const addedLast30Input = root.querySelector("#fides-added-last-30");
    if (addedLast30Input) {
      addedLast30Input.addEventListener("change", (event) => {
        filters.addedLast30Days = event.target.checked;
        render();
      });
    }

    root.querySelectorAll(".fides-filter-label-toggle").forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const group = toggle.closest(".fides-filter-group")?.dataset.filterGroup;
        if (!group || !(group in filterGroupState)) return;
        filterGroupState[group] = !filterGroupState[group];
        render();
      });
    });

    // Mobile filter drawer
    const mobileFilterToggle = root.querySelector("#fides-mobile-filter-toggle");
    const sidebar = root.querySelector(".fides-sidebar");
    if (mobileFilterToggle && sidebar) {
      mobileFilterToggle.addEventListener("click", () => {
        sidebar.classList.add("mobile-open");
        document.body.style.overflow = "hidden";
      });
    }
    const sidebarClose = root.querySelector("#fides-sidebar-close");
    if (sidebarClose && sidebar) {
      sidebarClose.addEventListener("click", () => {
        sidebar.classList.remove("mobile-open");
        document.body.style.overflow = "";
      });
    }
    if (sidebar) {
      sidebar.addEventListener("click", (e) => {
        if (e.target === sidebar && sidebar.classList.contains("mobile-open")) {
          sidebar.classList.remove("mobile-open");
          document.body.style.overflow = "";
        }
      });
    }

    // Mobile search input — synced bidirectionally with sidebar search
    const mobileSearchInput = root.querySelector("#fides-mobile-search-input");
    const mobileSearchClear = root.querySelector("#fides-mobile-search-clear");

    const syncSearchInputs = (value) => {
      const sidebarInput = root.querySelector("#fides-search-input");
      const sidebarClear = root.querySelector("#fides-search-clear");
      if (sidebarInput) sidebarInput.value = value;
      if (sidebarClear) sidebarClear.classList.toggle("hidden", !value);
      if (mobileSearchInput) mobileSearchInput.value = value;
      if (mobileSearchClear) mobileSearchClear.classList.toggle("hidden", !value);
    };

    const handleMobileSearch = debounce((event) => {
      filters.search = event.target.value || "";
      syncSearchInputs(filters.search);
      renderCredentialGridOnly();
    }, 300);
    if (mobileSearchInput) {
      mobileSearchInput.addEventListener("input", handleMobileSearch);
    }
    if (mobileSearchClear) {
      mobileSearchClear.addEventListener("click", () => {
        filters.search = "";
        syncSearchInputs("");
        renderCredentialGridOnly();
      });
    }

    // View toggle — targeted update to avoid rebuilding the full results bar
    root.querySelectorAll('.fides-view-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const newView = btn.getAttribute('data-view') || 'grid';
        if (newView === viewMode) return;
        viewMode = newView;
        localStorage.setItem('fides-credential-view', viewMode);
        root.querySelectorAll('.fides-view-btn').forEach((b) => {
          const active = b.getAttribute('data-view') === viewMode;
          b.classList.toggle('active', active);
          b.setAttribute('aria-pressed', String(active));
        });
        const grid = root.querySelector('.fides-credential-grid');
        if (grid) grid.setAttribute('data-view', viewMode);
        renderCredentialGridOnly();
      });
    });

    bindCredentialCardEvents();
  }

  function bindModalBodyEvents() {
    const closeButton = document.getElementById("fides-modal-close");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        selectedCredential = null;
        const url = new URL(window.location.href);
        url.searchParams.delete("credential");
        window.history.replaceState({}, "", url.toString());
        closeModal();
        render();
      });
    }

    const copyLinkButton = document.getElementById("fides-modal-copy-link");
    if (copyLinkButton && selectedCredential) {
      copyLinkButton.addEventListener("click", (e) => {
        e.stopPropagation();
        copyCredentialLink();
      });
    }

    const modalOverlay = document.getElementById("fides-modal-overlay");
    if (modalOverlay) {
      modalOverlay.addEventListener("click", (event) => {
        if (event.target.id === "fides-modal-overlay") {
          selectedCredential = null;
          const url = new URL(window.location.href);
          url.searchParams.delete("credential");
          window.history.replaceState({}, "", url.toString());
          closeModal();
          render();
        }
      });
    }

    // Ecosystem stat boxes: scroll to matching accordion and open it
    function openEcoTargetAccordionCred(accordionId) {
      const acc = document.getElementById(accordionId);
      if (!acc) return;
      acc.classList.add("is-open");
      acc.querySelectorAll('.fides-accordion-toggle[type="button"]').forEach((b) => {
        b.setAttribute("aria-expanded", "true");
      });
      requestAnimationFrame(() => {
        acc.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    document.querySelectorAll("#fides-modal-overlay [data-fides-eco-target]").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target.closest("a")) return;
        const id = el.getAttribute("data-fides-eco-target");
        if (id) openEcoTargetAccordionCred(id);
      });
    });

    document.querySelectorAll('#fides-modal-overlay .fides-accordion-toggle[type="button"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        const accordion = btn.closest(".fides-accordion");
        if (!accordion) return;
        const isOpen = accordion.classList.toggle("is-open");
        accordion.querySelectorAll('.fides-accordion-toggle[type="button"]').forEach((b) => {
          b.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });
      });
    });

    initVocabularyInfo(root);
  }

  function bindCredentialCardEvents() {
    root.querySelectorAll(".fides-credential-card").forEach((card) => {
      const open = () => {
        const id = card.dataset.credentialId;
        selectedCredential = credentials.find((item) => item.id === id) || null;
        const url = new URL(window.location.href);
        url.searchParams.set("credential", id || "");
        window.history.replaceState({}, "", url.toString());
        openModal();
      };

      card.addEventListener("click", (event) => {
        if (event.target.closest("a")) return;
        open();
      });

      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      });
    });
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function openFromQueryParam() {
    const params = new URLSearchParams(window.location.search);
    const credentialId = params.get("credential");
    if (credentialId) {
      selectedCredential = credentials.find((credential) => credential.id === credentialId) || null;
    }
    const credentialsParam = params.get("credentials");
    if (credentialsParam) {
      const ids = credentialsParam.split(",").map((id) => decodeURIComponent(id.trim())).filter(Boolean);
      originalCredentialIds = ids;
      filters.ids = [...ids];
    }
  }

  async function loadVocabulary(primaryUrl, fallbackUrl) {
    let first = primaryUrl;
    let second = fallbackUrl;
    if (isFidesLocalDevHost() && primaryUrl && fallbackUrl) {
      first = fallbackUrl;
      second = primaryUrl;
    }
    const tryLoad = async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      return data.terms || null;
    };
    if (first) {
      try { return await tryLoad(first); } catch (e) { console.warn('Vocabulary load failed (first):', e.message); }
    }
    if (second) {
      try {
        const terms = await tryLoad(second);
        if (terms) console.log('Vocabulary loaded from second source');
        return terms;
      } catch (e) { console.warn('Vocabulary load failed (second):', e.message); }
    }
    return null;
  }

  function hideVocabularyPopup() {
    const overlay = document.querySelector('.fides-vocab-overlay');
    const popup = document.querySelector('.fides-vocab-popup');
    if (overlay) overlay.remove();
    if (popup) popup.remove();
  }

  function showVocabularyPopup(button, groupEl, vocabKey) {
    hideVocabularyPopup();
    const groupTerm = vocabulary[vocabKey];
    const categoryName = (groupEl.querySelector('.fides-filter-label') || {}).textContent?.trim() || '';
    let html = '';
    if (categoryName) html += '<p class="fides-vocab-popup-title"><strong>' + escapeHtml(categoryName) + '</strong></p>';
    if (groupTerm && groupTerm.description) html += '<p class="fides-vocab-popup-intro">' + escapeHtml(groupTerm.description) + '</p>';
    const optionsEl = groupEl.querySelector('.fides-filter-options');
    if (optionsEl) {
      const labels = optionsEl.querySelectorAll('label.fides-filter-checkbox');
      if (labels.length > 0) {
        const listItems = [];
        labels.forEach((label) => {
          const input = label.querySelector('input');
          const value = input ? (input.dataset.value || input.value) : '';
          const labelText = (label.querySelector('span') || label).textContent.trim();
          const term = vocabulary[value] || null;
          const desc = term && term.description ? escapeHtml(term.description) : '';
          listItems.push({ labelText, desc });
        });
        const hasAnyOptionDesc = listItems.some((item) => item.desc);
        if (hasAnyOptionDesc) {
          html += '<ul class="fides-vocab-popup-list">';
          listItems.forEach((item) => {
            html += '<li><strong>' + escapeHtml(item.labelText) + '</strong>' + (item.desc ? ': ' + item.desc : '') + '</li>';
          });
          html += '</ul>';
        }
      }
    }
    if (!html) html = '<p>No description available.</p>';
    const popup = document.createElement('div');
    popup.className = 'fides-vocab-popup';
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-label', 'Filter explanation');
    popup.innerHTML = html;
    const overlay = document.createElement('div');
    overlay.className = 'fides-vocab-overlay';
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
    const margin = 20;
    const rect = button.getBoundingClientRect();
    const w = window.innerWidth;
    const h = window.innerHeight;
    const pw = popup.offsetWidth;
    const ph = popup.offsetHeight;
    const left = Math.max(margin, Math.min(rect.right + 40, w - pw - margin));
    const top = Math.max(margin, Math.min((h - ph) / 2, h - ph - margin));
    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
    setTimeout(() => { overlay.classList.add('visible'); popup.classList.add('visible'); }, 10);
    const close = (e) => {
      if (e && e.target.closest && e.target.closest('.fides-vocab-popup')) return;
      hideVocabularyPopup();
      document.removeEventListener('click', close, true);
      document.removeEventListener('keydown', onKeydown);
    };
    function onKeydown(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKeydown);
    setTimeout(() => document.addEventListener('click', close, true), 0);
  }

  function initVocabularyInfo(containerEl) {
    if (!vocabulary) return;
    hideVocabularyPopup();
    containerEl.querySelectorAll('.fides-vocab-info').forEach((btn) => btn.remove());
    containerEl.querySelectorAll('.fides-filter-group').forEach((groupEl) => {
      const toggle = groupEl.querySelector('.fides-filter-label-toggle');
      const labelSpan = toggle && toggle.querySelector('.fides-filter-label');
      if (!toggle || !labelSpan) return;
      const filterGroup = groupEl.dataset.filterGroup;
      const vocabKey = CREDENTIAL_FILTER_TO_VOCAB[filterGroup] || filterGroup;
      const infoBtn = document.createElement('button');
      infoBtn.type = 'button';
      infoBtn.className = 'fides-vocab-info';
      infoBtn.dataset.group = vocabKey;
      infoBtn.setAttribute('aria-label', 'Explain filter');
      infoBtn.textContent = 'i';
      infoBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        showVocabularyPopup(e.currentTarget, groupEl, vocabKey);
      });
      const parent = labelSpan.parentNode;
      if (parent.classList && parent.classList.contains('fides-filter-label-with-info')) {
        parent.appendChild(infoBtn);
        return;
      }
      const wrapper = document.createElement('div');
      wrapper.className = 'fides-filter-label-with-info';
      parent.insertBefore(wrapper, labelSpan);
      wrapper.appendChild(labelSpan);
      wrapper.appendChild(infoBtn);
      const spacer = document.createElement('span');
      spacer.className = 'fides-filter-toggle-spacer';
      spacer.setAttribute('aria-hidden', 'true');
      parent.insertBefore(spacer, wrapper.nextSibling);
    });
  }

  async function init() {
    await loadCredentials();
    await Promise.all([loadRPUsage(), loadIssuerUsage()]);
    const primaryVocabUrl = config.vocabularyUrl || 'https://raw.githubusercontent.com/FIDEScommunity/fides-interop-profiles/main/data/vocabulary.json';
    const fallbackVocabUrl = config.vocabularyFallbackUrl || (config.pluginUrl ? config.pluginUrl + 'assets/vocabulary.json' : null);
    vocabulary = await loadVocabulary(primaryVocabUrl, fallbackVocabUrl);
    openFromQueryParam();
    render();
  }

  init();
})();
