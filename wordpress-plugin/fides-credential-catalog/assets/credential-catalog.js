(function () {
  "use strict";

  const config = window.fidesCredentialCatalog || {};
  const root = document.getElementById("fides-credential-catalog-root");
  if (!root) return;

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
    subjectDocument: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9z"></path><path d="M14 3v6h6"></path><path d="M10 13h6"></path><path d="M10 17h6"></path></svg>'
  };

  root.setAttribute("data-theme", settings.theme);

  let credentials = [];
  let rpUsageMap = new Map();
  let selectedCredential = null;
  let sortBy = "lastUpdated";

  const filters = {
    search: "",
    vcFormat: [],
    subjectType: [],
    authority: [],
    schemaType: [],
    hasSchemaUrl: null,
    usedByRPsOnly: false,
    addedLast30Days: false,
    updatedLast30Days: false
  };
  const filterGroupState = {
    vcFormat: true,
    subjectType: true,
    authority: true,
    schemaType: true
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
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
    const sources = [
      config.githubDataUrl,
      `${config.pluginUrl || ""}data/aggregated.json`
    ].filter(Boolean);

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
    if (!config.rpAggregatedUrl) return;
    try {
      const data = await loadJson(config.rpAggregatedUrl);
      const relyingParties = Array.isArray(data.relyingParties) ? data.relyingParties : [];
      const credentialLookup = buildCredentialLookupMap();
      const map = new Map();
      for (const rp of relyingParties) {
        const refs = extractCredentialRefs(rp, credentialLookup);
        for (const credentialId of refs) {
          const existing = map.get(credentialId) || [];
          existing.push({
            id: rp.id,
            name: rp.name || rp.id
          });
          map.set(credentialId, existing);
        }
      }
      rpUsageMap = map;
    } catch (_) {
      rpUsageMap = new Map();
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
      hasSchemaUrl: 0,
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
      if (credential.schemaUrl) facets.hasSchemaUrl += 1;
      if ((rpUsageMap.get(credential.id) || []).length > 0) facets.usedByRPsOnly += 1;
      if (isWithinLastDays(credential.firstSeenAt, 30)) facets.addedLast30Days += 1;
      if (isWithinLastDays(credential.updatedAt, 30)) facets.updatedLast30Days += 1;
    }

    return facets;
  }

  function getFilteredCredentials() {
    let list = credentials.filter((credential) => {
      const searchTarget = [
        credential.displayName,
        credential.shortDescription,
        credential.nativeIdentifier,
        credential.authority?.name,
        ...(credential.tags || [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (filters.search && !searchTarget.includes(filters.search.toLowerCase())) return false;
      if (filters.vcFormat.length > 0 && !filters.vcFormat.includes(credential.vcFormat)) return false;
      if (filters.subjectType.length > 0 && !filters.subjectType.includes(credential.subjectType)) return false;
      if (filters.authority.length > 0 && !filters.authority.includes(credential.authority?.name || "")) return false;
      if (filters.schemaType.length > 0 && !filters.schemaType.includes(credential.schemaType)) return false;
      if (filters.hasSchemaUrl === true && !credential.schemaUrl) return false;
      if (filters.usedByRPsOnly && !(rpUsageMap.get(credential.id) || []).length) return false;
      if (filters.addedLast30Days && !isWithinLastDays(credential.firstSeenAt, 30)) return false;
      if (filters.updatedLast30Days && !isWithinLastDays(credential.updatedAt, 30)) return false;
      return true;
    });

    if (sortBy === "name") {
      list = list.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
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
    let newLast30Days = 0;
    let updatedLast30Days = 0;
    let usedByRPs = 0;
    for (const credential of credentials) {
      if (isWithinLastDays(credential.firstSeenAt, 30)) newLast30Days += 1;
      if (isWithinLastDays(credential.updatedAt, 30)) updatedLast30Days += 1;
      if ((rpUsageMap.get(credential.id) || []).length > 0) usedByRPs += 1;
    }
    return { total, newLast30Days, updatedLast30Days, usedByRPs };
  }

  function renderKpiCards(metrics) {
    return `
      <div class="fides-kpi-row">
        <button class="fides-kpi-card" data-kpi-action="reset">
          <span class="fides-kpi-value">${metrics.total}</span>
          <span class="fides-kpi-label">Credentials</span>
        </button>
        <button class="fides-kpi-card ${filters.addedLast30Days ? "active" : ""}" data-kpi-action="toggle-added">
          <span class="fides-kpi-value">${metrics.newLast30Days}</span>
          <span class="fides-kpi-label">New last 30 days</span>
        </button>
        <button class="fides-kpi-card ${filters.updatedLast30Days ? "active" : ""}" data-kpi-action="toggle-updated">
          <span class="fides-kpi-value">${metrics.updatedLast30Days}</span>
          <span class="fides-kpi-label">Updated last 30 days</span>
        </button>
        <button class="fides-kpi-card ${filters.usedByRPsOnly ? "active" : ""}" data-kpi-action="toggle-used">
          <span class="fides-kpi-value">${metrics.usedByRPs}</span>
          <span class="fides-kpi-label">Used by relying parties</span>
        </button>
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
                <span>${escapeHtml(option)}<span class="fides-filter-option-count">(${facets?.[key]?.[option] || 0})</span></span>
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
        ${
          settings.showSearch
            ? `<div class="fides-sidebar-search">
                <div class="fides-search-wrapper">
                  <span class="fides-search-icon">${icons.search}</span>
                  <input id="fides-search-input" class="fides-search-input" type="text" placeholder="Search..." value="${escapeHtml(filters.search)}">
                  <button class="fides-search-clear ${filters.search ? "" : "hidden"}" id="fides-search-clear" type="button" aria-label="Clear search">${icons.xSmall}</button>
                </div>
              </div>`
            : ""
        }
        <div class="fides-quick-filters">
          <span class="fides-quick-filters-title">Quick filters</span>
          <label class="fides-filter-checkbox">
            <input type="checkbox" id="fides-added-last-30" ${filters.addedLast30Days ? "checked" : ""}>
            <span>Added last 30 days<span class="fides-filter-option-count">(${filterFacets.addedLast30Days})</span></span>
          </label>
          <label class="fides-filter-checkbox">
            <input type="checkbox" id="fides-updated-last-30" ${filters.updatedLast30Days ? "checked" : ""}>
            <span>Updated last 30 days<span class="fides-filter-option-count">(${filterFacets.updatedLast30Days})</span></span>
          </label>
          <label class="fides-filter-checkbox">
            <input type="checkbox" id="fides-has-schema-url" ${filters.hasSchemaUrl ? "checked" : ""}>
            <span>Has schema URL<span class="fides-filter-option-count">(${filterFacets.hasSchemaUrl})</span></span>
          </label>
          <label class="fides-filter-checkbox">
            <input type="checkbox" id="fides-used-by-rps" ${filters.usedByRPsOnly ? "checked" : ""}>
            <span>Used by relying parties<span class="fides-filter-option-count">(${filterFacets.usedByRPsOnly})</span></span>
          </label>
        </div>
        ${renderCheckboxGroup("VC format", "vcFormat", formatOptions, filterFacets)}
        ${renderCheckboxGroup("Subject type", "subjectType", subjectOptions, filterFacets)}
        ${renderCheckboxGroup("Authority", "authority", authorityOptions, filterFacets)}
        ${renderCheckboxGroup("Schema type", "schemaType", schemaTypeOptions, filterFacets)}
        </div>
      </aside>
    `;
  }

  function renderCredentialCard(credential) {
    const rpItems = rpUsageMap.get(credential.id) || [];
    const rpLinks = rpItems.slice(0, 3);
    const hiddenRpCount = Math.max(0, rpItems.length - rpLinks.length);
    const activityLabel = isWithinLastDays(credential.firstSeenAt, 30)
      ? formatDateLabel(credential.firstSeenAt, "Added")
      : formatDateLabel(credential.updatedAt, "Updated");

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
            <p class="fides-credential-identifier" title="Identifier: ${escapeHtml(credential.nativeIdentifier || credential.id)}">${escapeHtml(credential.nativeIdentifier || credential.id)}</p>
          </div>
        </header>
        <div class="fides-credential-body">
          ${activityLabel ? `<p class="fides-credential-updated">${escapeHtml(activityLabel)}</p>` : ""}
          ${credential.shortDescription ? `<p class="fides-credential-description">${escapeHtml(credential.shortDescription)}</p>` : ""}
          <div class="fides-credential-section">
            <h4>CREDENTIAL PROFILE</h4>
            <div class="fides-tags">
              <span class="fides-tag">${escapeHtml(credential.vcFormat)}</span>
            </div>
          </div>
          <div class="fides-credential-section">
            <h4>USED BY RELYING PARTIES</h4>
            <div class="fides-tags">
              ${rpLinks.map((rp) => {
                const separator = (config.rpCatalogUrl || "").includes("?") ? "&" : "?";
                const href = `${config.rpCatalogUrl || "#"}${separator}rp=${encodeURIComponent(rp.id)}`;
                return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener" class="fides-tag wallet-link" onclick="event.stopPropagation();">${escapeHtml(rp.name)} ${icons.externalLinkSmall}</a>`;
              }).join("")}
              ${hiddenRpCount > 0 ? `<span class="fides-tag">+${hiddenRpCount}</span>` : ""}
            </div>
          </div>
        </div>
        <footer class="fides-credential-footer">
          <div class="fides-credential-links">
            ${credential.schemaUrl ? `<a href="${escapeHtml(credential.schemaUrl)}" target="_blank" rel="noopener noreferrer" class="fides-credential-link">Open schema</a>` : ""}
          </div>
          <span class="fides-view-details">${icons.eye} View details</span>
        </footer>
      </article>
    `;
  }

  function renderModal() {
    if (!selectedCredential) return "";
    const rpLinks = rpUsageMap.get(selectedCredential.id) || [];
    const attributes = Array.isArray(selectedCredential.attributes) ? selectedCredential.attributes : [];
    const currentTheme = root.getAttribute("data-theme") || "dark";

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
                <p class="fides-modal-identifier" title="${escapeHtml(selectedCredential.nativeIdentifier || selectedCredential.id)}">${escapeHtml(selectedCredential.nativeIdentifier || selectedCredential.id)}</p>
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
            ${selectedCredential.shortDescription ? `<div class="fides-modal-section fides-modal-section-first"><p class="fides-modal-description">${escapeHtml(selectedCredential.shortDescription)}</p></div>` : ""}
            <div class="fides-modal-info-blocks">
              <div class="fides-modal-info-block">
                <h4 class="fides-modal-section-title">${icons.fileCheck} Credential details</h4>
                  <dl class="fides-modal-details">
                    <div class="fides-modal-detail-row">
                      <dt>Subject Type</dt>
                      <dd><span class="fides-tag">${escapeHtml(selectedCredential.subjectType)}</span></dd>
                    </div>
                    <div class="fides-modal-detail-row">
                      <dt>VC Format</dt>
                      <dd><span class="fides-tag">${escapeHtml(selectedCredential.vcFormat)}</span></dd>
                    </div>
                    ${selectedCredential.schemaType ? `<div class="fides-modal-detail-row">
                      <dt>Schema Type</dt>
                      <dd><span class="fides-tag">${escapeHtml(selectedCredential.schemaType)}</span></dd>
                    </div>` : ""}
                    <div class="fides-modal-detail-row">
                      <dt>Version</dt>
                      <dd>${escapeHtml(selectedCredential.version || "n/a")}</dd>
                    </div>
                    <div class="fides-modal-detail-row">
                      <dt>Updated</dt>
                      <dd>${escapeHtml(formatDateLabel(selectedCredential.updatedAt, "").trim() || "-")}</dd>
                    </div>
                  </dl>
              </div>

              <div class="fides-modal-info-block">
                <h4 class="fides-modal-section-title">${icons.building} Used by relying parties</h4>
                ${
                  rpLinks.length > 0
                    ? `<div class="fides-tags">${rpLinks
                        .map((rp) => {
                          const separator = (config.rpCatalogUrl || "").includes("?") ? "&" : "?";
                          const href = `${config.rpCatalogUrl || "#"}${separator}rp=${encodeURIComponent(rp.id)}`;
                          return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener" class="fides-tag wallet-link">${escapeHtml(rp.name)} ${icons.externalLinkSmall}</a>`;
                        })
                        .join(" ")}</div>`
                    : `<p class="fides-modal-empty">No relying party references found.</p>`
                }
              </div>
            </div>

            <div class="fides-modal-section">
              <h4 class="fides-modal-section-title">${icons.shield} Schema links</h4>
              <div class="fides-modal-links">
                ${selectedCredential.schemaUrl ? `<a href="${escapeHtml(selectedCredential.schemaUrl)}" target="_blank" rel="noopener" class="fides-modal-link primary">${icons.fileCheck} Schema URL</a>` : ""}
                ${selectedCredential.rulebookUrl ? `<a href="${escapeHtml(selectedCredential.rulebookUrl)}" target="_blank" rel="noopener" class="fides-modal-link">${icons.shield} Rulebook URL</a>` : ""}
              </div>
            </div>

            <div class="fides-modal-info-block fides-modal-info-block-full">
              <h4 class="fides-modal-section-title">${icons.fileCheck} Attributes (enriched from linked schema)</h4>
              ${
                attributes.length > 0
                  ? `<table class="fides-attributes-table">
                      <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
                      <tbody>
                        ${attributes
                          .map(
                            (attr) => `<tr>
                              <td>${escapeHtml(attr.name)}</td>
                              <td>${escapeHtml(attr.type)}</td>
                              <td>${attr.required ? "Yes" : "No"}</td>
                              <td>${escapeHtml(attr.description || "")}</td>
                            </tr>`
                          )
                          .join("")}
                      </tbody>
                    </table>`
                  : `<p class="fides-modal-empty">No attributes available from linked schema.</p>`
              }
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
            ${settings.showSearch ? `
              <div class="fides-mobile-search">
                <div class="fides-search-wrapper">
                  <span class="fides-search-icon">${icons.search}</span>
                  <input id="fides-mobile-search-input" class="fides-search-input fides-mobile-search-input" type="text" placeholder="Search..." value="${escapeHtml(filters.search)}">
                  <button class="fides-search-clear ${filters.search ? "" : "hidden"}" id="fides-mobile-search-clear" type="button" aria-label="Clear search">${icons.xSmall}</button>
                </div>
              </div>
            ` : ""}
            <div class="fides-results-bar">
              <label class="fides-sort-label" for="fides-sort-select">
                <span class="fides-sort-text">Sort by:</span>
                <select id="fides-sort-select" class="fides-sort-select">
                  <option value="lastUpdated" ${sortBy === "lastUpdated" ? "selected" : ""}>Last updated</option>
                  <option value="name" ${sortBy === "name" ? "selected" : ""}>Name</option>
                </select>
              </label>
              ${settings.showFilters ? `
                <button class="fides-mobile-filter-toggle" id="fides-mobile-filter-toggle">
                  ${icons.filter}
                  <span>Filters</span>
                  <span class="fides-filter-count ${getActiveFilterCount() > 0 ? "" : "hidden"}">${getActiveFilterCount() || 0}</span>
                </button>
              ` : ""}
            </div>
            ${renderKpiCards(metrics)}
            <div class="fides-results">
            <div class="fides-credential-grid" data-columns="${escapeHtml(settings.columns)}">
              ${filtered.length > 0 ? filtered.map(renderCredentialCard).join("") : '<p class="fides-empty">No credentials found.</p>'}
            </div>
            </div>
          </section>
        </div>
      </div>
      ${renderModal()}
    `;

    bindEvents();
  }

  function renderCredentialGridOnly() {
    const grid = root.querySelector(".fides-credential-grid");
    if (!grid) return;
    const filtered = getFilteredCredentials();
    grid.innerHTML = filtered.length > 0
      ? filtered.map(renderCredentialCard).join("")
      : '<p class="fides-empty">No credentials found.</p>';
    bindCredentialCardEvents();
  }

  function clearQuickFilters() {
    filters.addedLast30Days = false;
    filters.updatedLast30Days = false;
    filters.usedByRPsOnly = false;
  }

  function getActiveFilterCount() {
    let count = 0;
    count += filters.vcFormat.length;
    count += filters.subjectType.length;
    count += filters.authority.length;
    count += filters.schemaType.length;
    if (filters.hasSchemaUrl) count += 1;
    if (filters.usedByRPsOnly) count += 1;
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
        sortBy = event.target.value === "name" ? "name" : "lastUpdated";
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

    const hasSchemaUrlInput = root.querySelector("#fides-has-schema-url");
    if (hasSchemaUrlInput) {
      hasSchemaUrlInput.addEventListener("change", (event) => {
        filters.hasSchemaUrl = event.target.checked;
        render();
      });
    }

    const usedByRpsInput = root.querySelector("#fides-used-by-rps");
    if (usedByRpsInput) {
      usedByRpsInput.addEventListener("change", (event) => {
        filters.usedByRPsOnly = event.target.checked;
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

    const updatedLast30Input = root.querySelector("#fides-updated-last-30");
    if (updatedLast30Input) {
      updatedLast30Input.addEventListener("change", (event) => {
        filters.updatedLast30Days = event.target.checked;
        render();
      });
    }

    root.querySelectorAll(".fides-kpi-card").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.kpiAction;
        if (action === "reset") {
          clearQuickFilters();
          sortBy = "lastUpdated";
        } else if (action === "toggle-added") {
          filters.addedLast30Days = !filters.addedLast30Days;
        } else if (action === "toggle-updated") {
          filters.updatedLast30Days = !filters.updatedLast30Days;
        } else if (action === "toggle-used") {
          filters.usedByRPsOnly = !filters.usedByRPsOnly;
        }
        render();
      });
    });

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

    bindCredentialCardEvents();

    const closeButton = root.querySelector("#fides-modal-close");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        selectedCredential = null;
        const url = new URL(window.location.href);
        url.searchParams.delete("credential");
        window.history.replaceState({}, "", url.toString());
        render();
      });
    }

    const copyLinkButton = root.querySelector("#fides-modal-copy-link");
    if (copyLinkButton && selectedCredential) {
      copyLinkButton.addEventListener("click", (e) => {
        e.stopPropagation();
        copyCredentialLink();
      });
    }

    const modalOverlay = root.querySelector("#fides-modal-overlay");
    if (modalOverlay) {
      modalOverlay.addEventListener("click", (event) => {
        if (event.target.id === "fides-modal-overlay") {
          selectedCredential = null;
          render();
        }
      });
    }
  }

  function bindCredentialCardEvents() {
    root.querySelectorAll(".fides-credential-card").forEach((card) => {
      const open = () => {
        const id = card.dataset.credentialId;
        selectedCredential = credentials.find((item) => item.id === id) || null;
        const url = new URL(window.location.href);
        url.searchParams.set("credential", id || "");
        window.history.replaceState({}, "", url.toString());
        render();
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
    if (!credentialId) return;
    selectedCredential = credentials.find((credential) => credential.id === credentialId) || null;
  }

  async function init() {
    await loadCredentials();
    await loadRPUsage();
    openFromQueryParam();
    render();
  }

  init();
})();
