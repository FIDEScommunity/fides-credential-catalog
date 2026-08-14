(function () {
  "use strict";

  const config = window.FIDES_CREDENTIAL_FORM_CONFIG || {};
  const mode = config.mode === "update" ? "update" : "create";
  const root =
    document.getElementById(
      mode === "update" ? "fides-credential-update-form-root" : "fides-credential-submit-form-root"
    ) || document.querySelector(".fides-credential-submission-root");
  if (!root) return;

  const apiBase = String(config.apiBase || "").replace(/\/$/, "");
  const nonce = String(config.restNonce || "");
  const contactEmail = String(config.contactEmail || "");
  let selectedCredentialId = mode === "update" ? String(config.preselectCredentialId || "") : "";
  let selectedOrg = null;
  let extendedCredentials = [];
  let vocabularies = [];

  const FALLBACKS = {
    subjectTypes: ["Person", "Organization", "Product", "Dataset", "Software", "Document"],
    vcFormats: [
      "sd_jwt_vc",
      "mdoc",
      "jwt_vc",
      "vcdm_1_1",
      "vcdm_2_0",
      "anoncreds",
      "idemix",
      "apple_wallet_pass",
      "google_wallet_pass",
      "acdc",
    ],
    nativeIdentifierTypes: ["vct", "docType", "type", "schema_said", "other"],
    schemaTypes: ["JSON Schema", "JSON-LD Context", "ISO Data Model", "ACDC Schema", "Other"],
    sectors: [
      "public_sector", "finance", "trade", "supply_chain", "manufacturing", "energy", "agriculture",
      "food", "retail", "healthcare", "education", "construction", "mobility", "digital",
    ],
    ecosystems: ["eudi_wallet", "uncefact", "gaia_x", "open_badges", "iso_mdl", "india_stack", "swiyu", "vlei", "verana"],
    themes: [
      "person_identity", "organizational_identity", "payments", "compliance_reporting", "trade_documents",
      "education", "digital_product_passports", "dataspaces", "agentic_ai",
    ],
    categories: ["identity", "business", "finance", "health", "travel", "professional", "compliance", "trade"],
  };

  const VALUE_LABELS = {
    sd_jwt_vc: "SD-JWT VC",
    mdoc: "ISO mDoc",
    jwt_vc: "JWT VC",
    vcdm_1_1: "W3C VCDM 1.1",
    vcdm_2_0: "W3C VCDM 2.0",
    anoncreds: "AnonCreds",
    idemix: "Idemix",
    apple_wallet_pass: "Apple Wallet Pass",
    google_wallet_pass: "Google Wallet Pass",
    acdc: "ACDC",
    eudi_wallet: "EUDI Wallet",
    uncefact: "UN/CEFACT",
    gaia_x: "Gaia-X",
    open_badges: "Open Badges",
    iso_mdl: "ISO mDL",
    india_stack: "India Stack",
    swiyu: "Swiyu",
    vlei: "vLEI",
    verana: "Verana",
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  function configuredValues(name) {
    return Array.isArray(config[name]) && config[name].length ? config[name] : FALLBACKS[name];
  }

  function optionValue(item) {
    return typeof item === "object" && item !== null ? String(item.value ?? item.code ?? item.id ?? "") : String(item);
  }

  function optionLabel(item) {
    if (typeof item === "object" && item !== null) return String(item.label ?? item.name ?? optionValue(item));
    if (VALUE_LABELS[item]) return VALUE_LABELS[item];
    return String(item)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function options(values, selected = "", includeEmpty = false) {
    const first = includeEmpty ? '<option value="">Select…</option>' : "";
    return first + configuredValues(values)
      .map((item) => {
        const value = optionValue(item);
        return `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(optionLabel(item))}</option>`;
      })
      .join("");
  }

  function checkboxOptions(name, group) {
    return configuredValues(name)
      .map((item) => {
        const value = optionValue(item);
        return `<label class="fides-form-choice"><input type="checkbox" name="${group}" value="${escapeHtml(value)}" /> <span>${escapeHtml(optionLabel(item))}</span></label>`;
      })
      .join("");
  }

  root.innerHTML = `
    <section class="fides-use-case-card">
      <form id="fides-credential-form" class="fides-use-case-form fides-credential-form" novalidate>
        <section class="fides-form-section fides-form-section-first" aria-labelledby="fides-credential-form-title">
          <h3 id="fides-credential-form-title" class="fides-form-section-title">${mode === "update" ? "Suggest a credential update" : "Submit a credential"}</h3>
          <p class="fides-form-section-intro">${mode === "update"
            ? "Find the credential you want to update. You can review its current catalog information before submitting your proposal."
            : "First select the organization responsible for this credential. You can then add the credential details."}</p>

          <div class="fides-form-section-body fides-credential-picker-body">
            <div class="fides-linked-field fides-lookup-field" id="fides-credential-primary-lookup">
              <label for="fides-credential-primary-search">${mode === "update" ? "Find credential" : "Organization"} *</label>
              <p class="fides-help">${mode === "update" ? "Search by credential name or stable credential ID." : "Start typing the organization name or ID."}</p>
              <input id="fides-credential-primary-search" type="search" autocomplete="off"
                placeholder="${mode === "update" ? "Start typing credential name or ID…" : "Start typing organization name…"}" />
              <p class="fides-lookup-hint" hidden></p>
              <ul class="fides-lookup-results" role="listbox" aria-label="Search results"></ul>
            </div>
            <div id="fides-credential-selection" class="fides-update-banner-row" hidden>
              <div class="fides-update-banner">
                <span>${mode === "update" ? "Updating:" : "Organization:"}</span>
                <strong id="fides-credential-selection-label"></strong>
              </div>
              <button type="button" class="fides-secondary-btn" id="fides-credential-change">Choose different</button>
            </div>
          </div>

          <div id="fides-credential-fields" class="fides-form-section-body fides-credential-fields" hidden>
            <div class="fides-form-row">
              <label for="fides-credential-display-name">Display name *</label>
              <p class="fides-help">The clear, human-readable catalog name. The stable credential key is generated automatically from this name.</p>
              <input id="fides-credential-display-name" required maxlength="200" placeholder="Name shown in the catalog" />
            </div>
            <input id="fides-credential-key" type="hidden" />
            <input id="fides-credential-id" type="hidden" />
            <input id="fides-credential-slug" type="hidden" />
            <div class="fides-form-row">
              <label for="fides-credential-description">Short description</label>
              <p class="fides-help">Briefly explain what this credential represents and where it is used.</p>
              <textarea id="fides-credential-description" rows="4" maxlength="2000"></textarea>
              <div class="fides-field-meta">
                <p class="fides-description-counter" id="fides-credential-description-counter" aria-live="polite"></p>
              </div>
            </div>
            <div class="fides-form-row">
              <label for="fides-credential-contact">Contact email</label>
              <p class="fides-help">Taken from your account for review purposes. It will not be published.</p>
              <input id="fides-credential-contact" class="fides-input-locked" type="email" value="${escapeHtml(contactEmail)}"
                readonly aria-readonly="true" tabindex="-1" />
            </div>
          </div>
        </section>

        <div id="fides-credential-additional-sections" class="fides-credential-additional-sections" hidden>
          <section class="fides-form-section" aria-labelledby="fides-credential-authority-title">
            <h3 id="fides-credential-authority-title" class="fides-form-section-title">Authority and schema</h3>
            <p class="fides-form-section-intro">Describe the authority, credential format, native identifier, and schema.</p>
            <div class="fides-form-section-body">
              <div class="fides-form-grid fides-form-grid-pair">
                <div class="fides-form-row">
                  <label for="fides-credential-authority-name">Authority name *</label>
                  <p class="fides-help">The organization, body, or standardization authority responsible for this credential.${mode === "update"
                    ? " Updating this name does not change the stable credential ID."
                    : ""}</p>
                  <input id="fides-credential-authority-name" required maxlength="200" />
                </div>
                <div class="fides-form-row">
                  <label for="fides-credential-authority-url">Authority URL</label>
                  <p class="fides-help">The official website of the organization, body, or standardization authority responsible for this credential.</p>
                  <input id="fides-credential-authority-url" type="url" placeholder="https://…" />
                </div>
              </div>
              <div class="fides-form-grid fides-form-grid-pair">
                <div class="fides-form-row">
                  <label for="fides-credential-subject-type">Subject type *</label>
                  <p class="fides-help">The kind of entity or object described by this credential.</p>
                  <select id="fides-credential-subject-type" required>${options("subjectTypes", "", true)}</select>
                </div>
                <div class="fides-form-row">
                  <label for="fides-credential-vc-format">VC format *</label>
                  <p class="fides-help">${mode === "update"
                    ? "The format is part of the credential ID and cannot be changed in an update."
                    : "The credential representation format."}</p>
                  <select id="fides-credential-vc-format" required ${mode === "update" ? 'disabled aria-disabled="true"' : ""}>
                    ${options("vcFormats", "", true)}
                  </select>
                </div>
              </div>
              <div class="fides-form-grid fides-form-grid-pair">
                <div class="fides-form-row">
                  <label for="fides-credential-native-identifier">Native identifier</label>
                  <p class="fides-help">The format-native identifier, such as a VCT, document type, or schema SAID.</p>
                  <input id="fides-credential-native-identifier" maxlength="500" placeholder="Credential-native identifier" />
                </div>
                <div class="fides-form-row" id="fides-credential-native-type-row">
                  <label for="fides-credential-native-identifier-type">Native identifier type</label>
                  <p class="fides-help">Select how the native identifier is expressed by the credential format.</p>
                  <select id="fides-credential-native-identifier-type">${options("nativeIdentifierTypes", "", true)}</select>
                </div>
              </div>
              <div class="fides-form-grid fides-form-grid-pair">
                <div class="fides-form-row">
                  <label for="fides-credential-schema-url">Schema URL *</label>
                  <p class="fides-help">A public URL where the machine-readable credential schema can be retrieved.</p>
                  <input id="fides-credential-schema-url" type="url" required placeholder="https://…" />
                </div>
                <div class="fides-form-row">
                  <label for="fides-credential-schema-type">Schema type *</label>
                  <p class="fides-help">The specification or data-model family used by the linked schema.</p>
                  <select id="fides-credential-schema-type" required>${options("schemaTypes", "", true)}</select>
                </div>
              </div>
              <div class="fides-form-grid fides-form-grid-pair">
                <div class="fides-form-row">
                  <label for="fides-credential-version">Version *</label>
                  <p class="fides-help">The version assigned to this credential definition or schema.</p>
                  <input id="fides-credential-version" required maxlength="80" placeholder="1.0" />
                </div>
                <div class="fides-form-row">
                  <label for="fides-credential-rulebook-url">Rulebook URL</label>
                  <p class="fides-help">A public link to the governance, policy, or rulebook for this credential.</p>
                  <input id="fides-credential-rulebook-url" type="url" placeholder="https://…" />
                </div>
              </div>
            </div>
            <p class="fides-form-note"><strong>Coming soon:</strong> support for submitting ARF TS11 conformance metadata.</p>
          </section>

          <section class="fides-form-section" aria-labelledby="fides-credential-classification-title">
            <h3 id="fides-credential-classification-title" class="fides-form-section-title">Classification</h3>
            <p class="fides-form-section-intro">Classify the credential so people can find it by sector, ecosystem, theme, and category.</p>
            <div class="fides-form-section-body">
              <div class="fides-form-row fides-checkbox-field" id="fides-credential-sectors-row">
                <span class="fides-form-label" id="fides-credential-sectors-label">Sectors *</span>
                <p class="fides-help">Select only the sectors that directly apply. Keep the selection as narrow as possible.</p>
                <div class="fides-form-choices" role="group" aria-labelledby="fides-credential-sectors-label">${checkboxOptions("sectors", "sectors")}</div>
              </div>
              <div class="fides-form-row fides-checkbox-field" id="fides-credential-ecosystems-row">
                <span class="fides-form-label" id="fides-credential-ecosystems-label">Ecosystems *</span>
                <p class="fides-help">Select only the ecosystems this credential is genuinely part of. Keep the selection as narrow as possible.</p>
                <div class="fides-form-choices" role="group" aria-labelledby="fides-credential-ecosystems-label">${checkboxOptions("ecosystems", "ecosystems")}</div>
              </div>
              <div class="fides-form-row fides-checkbox-field">
                <span class="fides-form-label" id="fides-credential-themes-label">Themes</span>
                <p class="fides-help">Select only directly relevant cross-sector themes. Keep the optional selection as narrow as possible.</p>
                <div class="fides-form-choices" role="group" aria-labelledby="fides-credential-themes-label">${checkboxOptions("themes", "themes")}</div>
              </div>
              <div class="fides-form-grid fides-form-grid-pair">
                <div class="fides-form-row">
                  <label for="fides-credential-category">Category</label>
                  <p class="fides-help">Choose the primary catalog category that best describes this credential.</p>
                  <select id="fides-credential-category">${options("categories", "", true)}</select>
                </div>
                <div class="fides-form-row">
                  <label for="fides-credential-tags">Tags</label>
                  <p class="fides-help">Separate tags with commas.</p>
                  <input id="fides-credential-tags" maxlength="500" placeholder="identity, public sector" />
                </div>
              </div>
            </div>
          </section>

          <details class="fides-form-section fides-form-accordion">
            <summary class="fides-form-accordion-summary">
              <span class="fides-form-accordion-heading">
                <span class="fides-form-section-title">Relationships</span>
                <span class="fides-form-accordion-badge">Optional</span>
              </span>
              <span class="fides-form-accordion-chevron" aria-hidden="true"></span>
            </summary>
            <div class="fides-form-accordion-panel">
              <p class="fides-form-section-intro">Link credentials this credential extends and add the vocabularies it uses.</p>
              <div class="fides-form-section-body">
                <div class="fides-form-row fides-reference-picker" id="fides-credential-extends-picker">
                  <label for="fides-credential-extends-search">Extends</label>
                  <p class="fides-help">Search and select credentials extended by this credential.</p>
                  <input id="fides-credential-extends-search" type="search" autocomplete="off" placeholder="Start typing credential name or ID…" />
                  <p class="fides-lookup-hint" hidden></p>
                  <ul class="fides-lookup-results" role="listbox" aria-label="Credential search results"></ul>
                  <div id="fides-credential-extends-chips" class="fides-reference-chips"></div>
                </div>
                <div class="fides-form-row">
                  <div class="fides-repeatable-heading">
                    <div>
                      <label>Vocabularies</label>
                      <p class="fides-help">Add a vocabulary name and URL, with optional authority details.</p>
                    </div>
                    <button type="button" class="fides-secondary-btn" id="fides-credential-add-vocabulary">Add vocabulary</button>
                  </div>
                  <div id="fides-credential-vocabularies" class="fides-repeatable-list"></div>
                </div>
              </div>
            </div>
          </details>
        </div>

        <div id="fides-credential-submit-block" class="fides-org-submit-block" hidden>
          <div class="fides-consent">
            <label><input type="checkbox" id="fides-credential-consent" required /> I confirm this information may be published *</label>
          </div>
          <div class="fides-form-actions">
            <button type="submit">${mode === "update" ? "Submit update proposal" : "Submit credential"}</button>
          </div>
        </div>
        <p id="fides-credential-message" class="fides-form-message" aria-live="polite"></p>
      </form>
    </section>`;

  const form = root.querySelector("#fides-credential-form");
  const fields = root.querySelector("#fides-credential-fields");
  const additionalSections = root.querySelector("#fides-credential-additional-sections");
  const selection = root.querySelector("#fides-credential-selection");
  const selectionLabel = root.querySelector("#fides-credential-selection-label");
  const primary = root.querySelector("#fides-credential-primary-lookup");
  const primarySearch = root.querySelector("#fides-credential-primary-search");
  const credentialKey = root.querySelector("#fides-credential-key");
  const credentialId = root.querySelector("#fides-credential-id");
  const credentialSlug = root.querySelector("#fides-credential-slug");
  const displayName = root.querySelector("#fides-credential-display-name");
  const authorityName = root.querySelector("#fides-credential-authority-name");
  const vcFormat = root.querySelector("#fides-credential-vc-format");
  const description = root.querySelector("#fides-credential-description");
  const descriptionCounter = root.querySelector("#fides-credential-description-counter");
  const message = root.querySelector("#fides-credential-message");
  const submitBlock = root.querySelector("#fides-credential-submit-block");
  const submitButton = form.querySelector('button[type="submit"]');

  function setMessage(text, type = "") {
    message.textContent = text || "";
    message.className = `fides-form-message${type ? ` is-${type}` : ""}`;
  }

  function clearValidation() {
    root.querySelectorAll(".fides-form-row--invalid").forEach((row) => row.classList.remove("fides-form-row--invalid"));
    root.querySelectorAll(".fides-consent--invalid").forEach((row) => row.classList.remove("fides-consent--invalid"));
    root.querySelectorAll(".fides-form-field-invalid").forEach((control) => {
      control.classList.remove("fides-form-field-invalid");
      control.removeAttribute("aria-invalid");
    });
  }

  function highlightInvalid(control) {
    if (!control) return;
    const accordion = control.closest("details.fides-form-accordion");
    if (accordion) accordion.open = true;
    control.classList.add("fides-form-field-invalid");
    control.setAttribute("aria-invalid", "true");
    const row = control.closest(".fides-form-row, .fides-consent");
    if (row) row.classList.add(row.classList.contains("fides-consent") ? "fides-consent--invalid" : "fides-form-row--invalid");
  }

  function headers(json = false) {
    const value = {};
    if (nonce) value["X-WP-Nonce"] = nonce;
    if (json) value["Content-Type"] = "application/json";
    return value;
  }

  /** WP REST item_id route allows [a-zA-Z0-9:._-]+; encoded colons do not match that route. */
  function itemIdPathSegment(itemId) {
    const id = String(itemId || "").trim();
    return /^cred:[a-z0-9]+:[a-z0-9-]+:[a-z0-9-]+$/.test(id) ? id : "";
  }

  function submissionItemUrl(itemId) {
    const segment = itemIdPathSegment(itemId);
    return segment ? `${apiBase}/submissions/credential/${segment}` : "";
  }

  async function fetchLookup(type, query) {
    const response = await fetch(`${apiBase}/lookups/${type}?q=${encodeURIComponent(query)}`, {
      credentials: "same-origin",
      headers: headers(),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.message || "Lookup failed.");
    return Array.isArray(json.content) ? json.content : [];
  }

  function renderLookupResults(list, results, onSelect) {
    results.innerHTML = list
      .map((item, index) => `
        <li><button type="button" data-index="${index}" class="fides-lookup-option">
          <span class="fides-lookup-option-main"><strong>${escapeHtml(item.label || item.id)}</strong>${item.subtitle ? `<small>${escapeHtml(item.subtitle)}</small>` : ""}</span>
          <span class="fides-lookup-option-action">Select</span>
        </button></li>`)
      .join("");
    results.querySelectorAll("[data-index]").forEach((button) => {
      button.addEventListener("click", () => onSelect(list[Number(button.dataset.index)]));
    });
  }

  function wireLookup(input, type, onSelect) {
    const row = input.closest(".fides-lookup-field, .fides-reference-picker");
    const results = row.querySelector(".fides-lookup-results");
    const hint = row.querySelector(".fides-lookup-hint");
    let timer;
    input.addEventListener("input", () => {
      clearTimeout(timer);
      const query = input.value.trim();
      results.innerHTML = "";
      hint.hidden = true;
      if (query.length < 2) return;
      timer = setTimeout(async () => {
        try {
          const items = await fetchLookup(type, query);
          hint.hidden = false;
          hint.textContent = items.length ? `${items.length} match${items.length === 1 ? "" : "es"} — click to select` : "No matches.";
          renderLookupResults(items, results, (item) => {
            results.innerHTML = "";
            hint.hidden = true;
            input.value = "";
            onSelect(item);
          });
        } catch (error) {
          hint.hidden = false;
          hint.textContent = error.message || "Lookup failed.";
        }
      }, 250);
    });
  }

  function normalizeAuthority(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

  function normalizeKey(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function slugify(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function updateGeneratedFields() {
    if (mode === "update") return;
    credentialSlug.value = slugify(displayName.value);
    const key = normalizeKey(displayName.value);
    credentialKey.value = key;
    const authority = normalizeAuthority(authorityName.value);
    const format = String(vcFormat.value || "").replaceAll("_", "-");
    credentialId.value = authority && key && format ? `cred:${authority}:${key}:${format}` : "";
  }

  function updateDescriptionCounter() {
    const maxLength = Number(description.maxLength) || 2000;
    descriptionCounter.textContent =
      `${String(description.value || "").length.toLocaleString("en-US")} / ${maxLength.toLocaleString("en-US")} characters`;
  }

  function updateNativeIdentifierUi() {
    const nativeIdentifier = root.querySelector("#fides-credential-native-identifier");
    const nativeType = root.querySelector("#fides-credential-native-identifier-type");
    nativeType.required = Boolean(nativeIdentifier.value.trim());
  }

  function renderExtendedCredentials() {
    const mount = root.querySelector("#fides-credential-extends-chips");
    mount.innerHTML = extendedCredentials
      .map((item) => `<span class="fides-reference-chip">${escapeHtml(item.displayName || item.id)}
        <button type="button" data-ref-id="${escapeHtml(item.id)}" aria-label="Remove ${escapeHtml(item.displayName || item.id)}">×</button>
      </span>`)
      .join("");
    mount.querySelectorAll("[data-ref-id]").forEach((button) => {
      button.addEventListener("click", () => {
        extendedCredentials = extendedCredentials.filter((item) => item.id !== button.dataset.refId);
        renderExtendedCredentials();
      });
    });
  }

  function addExtendedCredential(item) {
    const ref = { id: String(item.id || "").trim() };
    if (!itemIdPathSegment(ref.id) || ref.id === credentialId.value) return;
    const label = String(item.label || "").trim();
    if (label && label !== ref.id) ref.displayName = label;
    if (!extendedCredentials.some((value) => value.id === ref.id)) extendedCredentials.push(ref);
    renderExtendedCredentials();
  }

  function renderVocabularies() {
    const mount = root.querySelector("#fides-credential-vocabularies");
    mount.innerHTML = vocabularies
      .map((vocabulary, index) => `
        <div class="fides-repeatable-item" data-vocabulary-index="${index}">
          <div class="fides-repeatable-item-heading">
            <strong>Vocabulary ${index + 1}</strong>
            <button type="button" class="fides-repeatable-remove" data-remove-vocabulary="${index}">Remove</button>
          </div>
          <div class="fides-form-grid fides-form-grid-pair">
            <div class="fides-form-row">
              <label for="fides-vocabulary-name-${index}">Name *</label>
              <p class="fides-help">The recognizable name of the vocabulary or data model.</p>
              <input id="fides-vocabulary-name-${index}" data-vocabulary-field="name" required maxlength="200" value="${escapeHtml(vocabulary.name || "")}" />
            </div>
            <div class="fides-form-row">
              <label for="fides-vocabulary-url-${index}">URL</label>
              <p class="fides-help">A public link to the vocabulary or its documentation.</p>
              <input id="fides-vocabulary-url-${index}" data-vocabulary-field="url" type="url" value="${escapeHtml(vocabulary.url || "")}" placeholder="https://…" />
            </div>
          </div>
          <div class="fides-form-grid fides-form-grid-pair">
            <div class="fides-form-row">
              <label for="fides-vocabulary-authority-name-${index}">Authority name</label>
              <p class="fides-help">The organization or standards body maintaining this vocabulary.</p>
              <input id="fides-vocabulary-authority-name-${index}" data-vocabulary-field="authorityName" maxlength="200" value="${escapeHtml(vocabulary.authority?.name || "")}" />
            </div>
            <div class="fides-form-row">
              <label for="fides-vocabulary-authority-url-${index}">Authority URL</label>
              <p class="fides-help">The official website of the vocabulary authority.</p>
              <input id="fides-vocabulary-authority-url-${index}" data-vocabulary-field="authorityUrl" type="url" value="${escapeHtml(vocabulary.authority?.url || "")}" placeholder="https://…" />
            </div>
          </div>
        </div>`)
      .join("");
    mount.querySelectorAll("[data-remove-vocabulary]").forEach((button) => {
      button.addEventListener("click", () => {
        collectVocabularies();
        vocabularies.splice(Number(button.dataset.removeVocabulary), 1);
        renderVocabularies();
      });
    });
  }

  function collectVocabularies() {
    vocabularies = Array.from(root.querySelectorAll("[data-vocabulary-index]")).map((item) => {
      const value = (field) => item.querySelector(`[data-vocabulary-field="${field}"]`).value.trim();
      const authority = {};
      if (value("authorityName")) authority.name = value("authorityName");
      if (value("authorityUrl")) authority.url = value("authorityUrl");
      return {
        name: value("name"),
        ...(value("url") ? { url: value("url") } : {}),
        ...(Object.keys(authority).length ? { authority } : {}),
      };
    });
  }

  async function prefillAuthorityFromOrganization(item) {
    authorityName.value = String(item.label || item.id || "");
    root.querySelector("#fides-credential-authority-url").value = "";
    updateGeneratedFields();
    const orgId = String(item.id || "").trim();
    if (!/^org:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(orgId)) return;
    try {
      const response = await fetch(`${apiBase}/submissions/organization/${orgId}`, {
        credentials: "same-origin",
        headers: headers(),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) return;
      const payload = json.payload || {};
      authorityName.value = String(payload.name || payload.legalName || item.label || item.id || "");
      root.querySelector("#fides-credential-authority-url").value = String(payload.website || "");
      updateGeneratedFields();
    } catch (_error) {
      // The selected organization label remains a valid authority default.
    }
  }

  function selectedValues(name) {
    return Array.from(root.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
  }

  function setSelectedValues(name, values) {
    const selected = new Set(Array.isArray(values) ? values.map(String) : []);
    root.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
      input.checked = selected.has(input.value);
    });
  }

  function showSelection(label) {
    selection.hidden = false;
    primary.hidden = true;
    fields.hidden = false;
    additionalSections.hidden = false;
    submitBlock.hidden = false;
    selectionLabel.textContent = label;
  }

  function fill(payload) {
    selectedOrg = { id: String(payload.orgId || ""), label: String(payload.orgId || "") };
    credentialId.value = String(payload.id || selectedCredentialId);
    const parts = credentialId.value.split(":");
    credentialKey.value = parts[2] || "";
    displayName.value = payload.displayName || "";
    credentialSlug.value = payload.slug || slugify(displayName.value);
    description.value = payload.shortDescription || "";
    authorityName.value = payload.authority?.name || "";
    root.querySelector("#fides-credential-authority-url").value = payload.authority?.url || "";
    root.querySelector("#fides-credential-subject-type").value = payload.subjectType || "";
    vcFormat.value = payload.vcFormat || (parts[3] || "").replaceAll("-", "_");
    root.querySelector("#fides-credential-version").value = payload.version || "";
    root.querySelector("#fides-credential-native-identifier").value = payload.nativeIdentifier || "";
    root.querySelector("#fides-credential-native-identifier-type").value = payload.nativeIdentifierType || "";
    root.querySelector("#fides-credential-schema-url").value = payload.schemaUrl || "";
    root.querySelector("#fides-credential-schema-type").value = payload.schemaType || "";
    root.querySelector("#fides-credential-rulebook-url").value = payload.rulebookUrl || "";
    root.querySelector("#fides-credential-category").value = payload.category || "";
    root.querySelector("#fides-credential-tags").value = Array.isArray(payload.tags) ? payload.tags.join(", ") : "";
    setSelectedValues("sectors", payload.sectors);
    setSelectedValues("ecosystems", payload.ecosystems);
    setSelectedValues("themes", payload.themes);
    extendedCredentials = Array.isArray(payload.extends) ? payload.extends : [];
    vocabularies = Array.isArray(payload.vocabularies) ? payload.vocabularies : [];
    renderExtendedCredentials();
    renderVocabularies();
    updateDescriptionCounter();
    updateNativeIdentifierUi();
  }

  async function loadCredential(id) {
    setMessage("Loading credential details…");
    const url = submissionItemUrl(id);
    if (!url) throw new Error("The selected credential has an invalid ID.");
    const response = await fetch(url, { credentials: "same-origin", headers: headers() });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.message || "Could not load credential details.");
    fill(json.payload || {});
    showSelection(`${json.payload?.displayName || id} (${id})`);
    setMessage("");
  }

  function buildPayload() {
    collectVocabularies();
    const authority = { name: authorityName.value.trim() };
    const authorityUrl = root.querySelector("#fides-credential-authority-url").value.trim();
    if (authorityUrl) authority.url = authorityUrl;
    const tags = root.querySelector("#fides-credential-tags").value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag, index, all) => tag && all.indexOf(tag) === index);
    return {
      orgId: String(selectedOrg?.id || ""),
      id: credentialId.value.trim(),
      slug: credentialSlug.value.trim(),
      displayName: displayName.value.trim(),
      shortDescription: description.value.trim(),
      authority,
      subjectType: root.querySelector("#fides-credential-subject-type").value,
      vcFormat: vcFormat.value,
      version: root.querySelector("#fides-credential-version").value.trim(),
      nativeIdentifier: root.querySelector("#fides-credential-native-identifier").value.trim(),
      nativeIdentifierType: root.querySelector("#fides-credential-native-identifier-type").value,
      schemaUrl: root.querySelector("#fides-credential-schema-url").value.trim(),
      schemaType: root.querySelector("#fides-credential-schema-type").value,
      rulebookUrl: root.querySelector("#fides-credential-rulebook-url").value.trim(),
      sectors: selectedValues("sectors"),
      ecosystems: selectedValues("ecosystems"),
      themes: selectedValues("themes"),
      category: root.querySelector("#fides-credential-category").value,
      tags,
      extends: extendedCredentials,
      vocabularies,
    };
  }

  wireLookup(primarySearch, mode === "update" ? "credential" : "organization", async (item) => {
    if (mode === "create") {
      selectedOrg = { id: String(item.id || ""), label: String(item.label || item.id || "") };
      showSelection(`${selectedOrg.label} (${selectedOrg.id})`);
      await prefillAuthorityFromOrganization(item);
    } else {
      selectedCredentialId = String(item.id || "");
      try {
        await loadCredential(selectedCredentialId);
      } catch (error) {
        setMessage(error.message, "error");
      }
    }
  });
  wireLookup(root.querySelector("#fides-credential-extends-search"), "credential", addExtendedCredential);

  root.querySelector("#fides-credential-add-vocabulary").addEventListener("click", () => {
    collectVocabularies();
    vocabularies.push({ name: "", url: "" });
    renderVocabularies();
    root.querySelector("[data-vocabulary-index]:last-child input")?.focus();
  });

  root.querySelector("#fides-credential-change").addEventListener("click", () => {
    selectedCredentialId = "";
    selectedOrg = null;
    extendedCredentials = [];
    vocabularies = [];
    form.reset();
    credentialId.value = "";
    credentialSlug.value = "";
    renderExtendedCredentials();
    renderVocabularies();
    updateDescriptionCounter();
    selection.hidden = true;
    primary.hidden = false;
    fields.hidden = true;
    additionalSections.hidden = true;
    submitBlock.hidden = true;
    primarySearch.focus();
    setMessage("");
  });

  displayName.addEventListener("input", updateGeneratedFields);
  authorityName.addEventListener("input", updateGeneratedFields);
  vcFormat.addEventListener("change", updateGeneratedFields);
  description.addEventListener("input", updateDescriptionCounter);
  root.querySelector("#fides-credential-native-identifier").addEventListener("input", updateNativeIdentifierUi);
  form.addEventListener("input", (event) => {
    const control = event.target;
    if (!(control instanceof HTMLElement)) return;
    control.classList.remove("fides-form-field-invalid");
    control.removeAttribute("aria-invalid");
    const row = control.closest(".fides-form-row, .fides-consent");
    if (row) row.classList.remove("fides-form-row--invalid", "fides-consent--invalid");
  });
  updateDescriptionCounter();
  updateNativeIdentifierUi();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearValidation();
    setMessage("");
    updateGeneratedFields();
    updateNativeIdentifierUi();
    if (!form.checkValidity()) {
      const invalid = form.querySelector(":invalid");
      highlightInvalid(invalid);
      setMessage("Please complete all required fields.", "error");
      invalid?.focus();
      form.reportValidity();
      return;
    }
    if (!contactEmail) {
      setMessage("Your account needs a valid email address.", "error");
      return;
    }
    if (!selectedValues("sectors").length) {
      const firstSector = root.querySelector('input[name="sectors"]');
      highlightInvalid(firstSector);
      setMessage("Select at least one sector.", "error");
      firstSector?.focus();
      return;
    }
    if (!selectedValues("ecosystems").length) {
      const firstEcosystem = root.querySelector('input[name="ecosystems"]');
      highlightInvalid(firstEcosystem);
      setMessage("Select at least one ecosystem.", "error");
      firstEcosystem?.focus();
      return;
    }
    const payload = buildPayload();
    if (!payload.orgId || !itemIdPathSegment(payload.id)) {
      setMessage("Select an organization and enter valid credential identity fields.", "error");
      return;
    }
    if (!payload.slug) {
      setMessage("Enter a display name that can be used as a slug.", "error");
      highlightInvalid(displayName);
      displayName.focus();
      return;
    }
    const incompleteVocabularyAuthority = Array.from(root.querySelectorAll("[data-vocabulary-index]")).find((item) => {
      const name = item.querySelector('[data-vocabulary-field="authorityName"]')?.value.trim();
      const url = item.querySelector('[data-vocabulary-field="authorityUrl"]')?.value.trim();
      return url && !name;
    });
    if (incompleteVocabularyAuthority) {
      const control = incompleteVocabularyAuthority.querySelector('[data-vocabulary-field="authorityName"]');
      highlightInvalid(control);
      setMessage("Enter an authority name when an authority URL is provided.", "error");
      control?.focus();
      return;
    }
    const url = mode === "update" ? submissionItemUrl(selectedCredentialId) : `${apiBase}/submissions/credential`;
    if (!url) {
      setMessage("Select a valid credential before submitting the update.", "error");
      return;
    }
    setMessage("Submitting…");
    submitButton.disabled = true;
    form.setAttribute("aria-busy", "true");
    try {
      const response = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: headers(true),
        body: JSON.stringify(payload),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.message || "Submission failed.");
      setMessage(
        mode === "update"
          ? "Update proposal received. It will be reviewed before publication."
          : "Submission received. It will be reviewed before publication.",
        "success"
      );
      fields.hidden = true;
      additionalSections.hidden = true;
      selection.hidden = true;
      submitBlock.hidden = true;
    } catch (error) {
      setMessage(error.message || "Submission failed due to a network error.", "error");
    } finally {
      submitButton.disabled = false;
      form.removeAttribute("aria-busy");
    }
  });

  if (mode === "update" && selectedCredentialId) {
    loadCredential(selectedCredentialId).catch((error) => setMessage(error.message, "error"));
  }
})();
