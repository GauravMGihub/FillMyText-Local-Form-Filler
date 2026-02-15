document.addEventListener('DOMContentLoaded', () => {
    const mainView = document.getElementById('mainView');
    const editView = document.getElementById('editView');
    const statusBanner = document.getElementById('statusBanner');
    const fields = ['fullName', 'firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zip', 'country', 'linkedin', 'github'];

    // --- Theme toggle ---
    chrome.storage.local.get(['theme'], (result) => {
        if (result.theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    });

    document.getElementById('themeToggle').addEventListener('click', () => {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        const newTheme = isLight ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        chrome.storage.local.set({ theme: newTheme });
    });

    // --- Custom fields state ---
    let customFields = []; // Array of { label, value, id }

    // --- Load profile preview ---
    function loadPreview() {
        chrome.storage.local.get(['profile'], (result) => {
            const preview = document.getElementById('profilePreview');
            if (result.profile && result.profile.firstName) {
                const p = result.profile;
                const initials = (p.firstName[0] || '') + (p.lastName?.[0] || '');
                preview.innerHTML = `
                    <div class="avatar">${initials.toUpperCase()}</div>
                    <div class="profile-info">
                        <div class="name">${p.firstName} ${p.lastName || ''}</div>
                        <div class="email">${p.email || 'No email saved'}</div>
                    </div>
                `;
            }
        });
    }
    loadPreview();

    // --- Load form fields ---
    function loadForm() {
        chrome.storage.local.get(['profile', 'customFields'], (result) => {
            if (result.profile) {
                fields.forEach(id => {
                    const el = document.getElementById(id);
                    if (el && result.profile[id]) el.value = result.profile[id];
                });
            }
            // Load custom fields
            customFields = result.customFields || [];
            renderCustomFields();
        });
    }

    // --- Render custom fields list ---
    function renderCustomFields() {
        const container = document.getElementById('customFieldsList');
        const countBadge = document.getElementById('customFieldCount');
        container.innerHTML = '';
        countBadge.textContent = customFields.length;

        customFields.forEach((field, index) => {
            const row = document.createElement('div');
            row.className = 'custom-field-row';
            row.innerHTML = `
                <div class="form-group custom-field-label">
                    <label>Field Name</label>
                    <input type="text" class="cf-label" data-index="${index}" value="${escapeHtml(field.label)}" placeholder="e.g. Age, Company...">
                </div>
                <div class="form-group custom-field-value">
                    <label>Value</label>
                    <input type="text" class="cf-value" data-index="${index}" value="${escapeHtml(field.value)}" placeholder="Enter value">
                </div>
                <button class="btn-remove-field" data-index="${index}" title="Remove this field">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
            `;
            container.appendChild(row);
        });

        // Add event listeners for live editing
        container.querySelectorAll('.cf-label').forEach(input => {
            input.addEventListener('input', (e) => {
                customFields[e.target.dataset.index].label = e.target.value;
            });
        });
        container.querySelectorAll('.cf-value').forEach(input => {
            input.addEventListener('input', (e) => {
                customFields[e.target.dataset.index].value = e.target.value;
            });
        });

        // Remove buttons
        container.querySelectorAll('.btn-remove-field').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index);
                customFields.splice(idx, 1);
                renderCustomFields();
            });
        });
    }

    // --- Add new custom field ---
    document.getElementById('addFieldBtn').addEventListener('click', () => {
        customFields.push({ label: '', value: '' });
        renderCustomFields();
        // Focus the new label input
        const lastLabel = document.querySelector('.custom-field-row:last-child .cf-label');
        if (lastLabel) lastLabel.focus();
    });

    // --- Escape HTML ---
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // --- Show status ---
    function showStatus(message, type) {
        statusBanner.textContent = message;
        statusBanner.className = 'status-banner ' + type;
        setTimeout(() => { statusBanner.className = 'status-banner'; }, 3000);
    }

    // --- Switch views ---
    function showMain() {
        editView.classList.remove('active');
        mainView.classList.add('active');
        loadPreview();
    }

    function showEdit() {
        mainView.classList.remove('active');
        editView.classList.add('active');
        loadForm();
    }

    // --- Close ---
    document.getElementById('closeBtn').addEventListener('click', () => window.close());

    // --- Edit Profile ---
    document.getElementById('settingsBtn').addEventListener('click', showEdit);

    // --- Back ---
    document.getElementById('backBtn').addEventListener('click', showMain);

    // --- Save ---
    document.getElementById('saveBtn').addEventListener('click', () => {
        const profile = {};
        fields.forEach(id => {
            profile[id] = document.getElementById(id).value;
        });

        // Filter out empty custom fields
        const validCustomFields = customFields.filter(f => f.label.trim() !== '');

        chrome.storage.local.set({ profile, customFields: validCustomFields }, () => {
            showMain();
            showStatus("Profile saved!", "success");
        });
    });

    // --- Auto-Fill ---
    document.getElementById('fillBtn').addEventListener('click', async () => {
        chrome.storage.local.get(['profile', 'customFields'], async (result) => {
            const data = result.profile;
            if (!data || !data.firstName) {
                showStatus("No profile saved - Edit Profile first", "error");
                return;
            }
            const cFields = result.customFields || [];
            let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: autoFillScript,
                args: [data, cFields]
            });
            showStatus("Auto-fill injected successfully!", "success");
        });
    });
});

// --- THE INJECTED SCRIPT (React/Angular/Google Forms compatible) ---
function autoFillScript(profile, customFields) {
    console.log("GhostWriter running...", profile, "Custom fields:", customFields);
    let filledCount = 0;
    const isGoogleForms = window.location.hostname.includes('docs.google.com') && window.location.pathname.includes('/forms/');

    console.log("GhostWriter: Google Forms detected =", isGoogleForms);

    // ===== VALUE SETTER (React/Angular/Google Forms compatible) =====
    const fillField = (input, value) => {
        if (!value) return;

        const tagName = input.tagName.toLowerCase();

        // Use native setter to bypass React/Angular state management
        if (tagName === 'input' || tagName === 'textarea') {
            const proto = tagName === 'textarea' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
            const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
            if (nativeSetter) {
                nativeSetter.call(input, value);
            } else {
                input.value = value;
            }
        } else {
            input.value = value;
        }

        // Dispatch all events frameworks listen for
        input.dispatchEvent(new Event('focus', { bubbles: true }));
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true }));

        // React 16+ synthetic events
        const reactEvent = new Event('input', { bubbles: true });
        Object.defineProperty(reactEvent, 'target', { value: input });
        input.dispatchEvent(reactEvent);

        input.style.backgroundColor = "#e6f7ff";
        input.style.border = "2px solid #007bff";
        filledCount++;
    };

    // ===== BUILD FIELD MAPPING (profile + custom fields merged) =====
    const allFieldMappings = [
        // Name fields — order matters: specific before generic
        { keywords: ['first', 'fname', 'given name'], value: profile.firstName },
        { keywords: ['last', 'lname', 'surname', 'family name'], value: profile.lastName },
        { keywords: ['full name', 'fullname', 'your name'], value: profile.fullName || `${profile.firstName} ${profile.lastName}` },
        // Contact
        { keywords: ['email', 'e-mail'], value: profile.email },
        { keywords: ['phone', 'mobile', 'contact number', 'whatsapp'], value: profile.phone },
        // Address
        { keywords: ['address', 'street'], value: profile.address },
        { keywords: ['city', 'town'], value: profile.city },
        { keywords: ['state', 'province', 'region'], value: profile.state },
        { keywords: ['zip', 'postal', 'pincode', 'pin code'], value: profile.zip },
        { keywords: ['country', 'nation'], value: profile.country },
        // Links
        { keywords: ['linkedin'], value: profile.linkedin },
        { keywords: ['github', 'portfolio', 'website'], value: profile.github },
    ];

    // Add custom fields to mappings
    if (customFields && customFields.length > 0) {
        customFields.forEach(cf => {
            if (cf.label && cf.value) {
                allFieldMappings.push({
                    keywords: [cf.label.toLowerCase().trim()],
                    value: cf.value
                });
            }
        });
    }

    // ===== FIND MATCHING VALUE for a given text signature =====
    function findMatchingValue(sig, inputType) {
        // For password fields: ONLY allow custom field matches, skip all default mappings
        if (inputType === 'password') {
            if (customFields && customFields.length > 0) {
                for (const cf of customFields) {
                    if (!cf.label || !cf.value) continue;
                    const keyword = cf.label.toLowerCase().trim();
                    if (sig.includes(keyword)) {
                        return cf.value;
                    }
                }
            }
            return null;
        }

        // 1. Check SPECIFIC fields first (email, phone — these are unambiguous)
        if (sig.includes('email') || sig.includes('e-mail') || sig.includes('email id') || inputType === 'email') {
            return profile.email;
        }
        if (sig.includes('phone') || sig.includes('mobile') || sig.includes('contact number') || sig.includes('whatsapp') || inputType === 'tel') {
            return profile.phone;
        }

        // 2. Name fields — check specific before generic
        if (sig.includes('first') || sig.includes('fname') || sig.includes('given name')) {
            return profile.firstName;
        }
        if (sig.includes('last') || sig.includes('lname') || sig.includes('surname') || sig.includes('family name')) {
            return profile.lastName;
        }
        if (sig.includes('full name') || sig.includes('fullname') || sig.includes('your name')) {
            return profile.fullName || `${profile.firstName} ${profile.lastName}`;
        }

        // 3. Address fields
        if (sig.includes('address') || sig.includes('street')) return profile.address;
        if (sig.includes('city') || sig.includes('town')) return profile.city;
        if (sig.includes('state') || sig.includes('province') || sig.includes('region')) return profile.state;
        if (sig.includes('zip') || sig.includes('postal') || sig.includes('pincode') || sig.includes('pin code')) return profile.zip;
        if (sig.includes('country') || sig.includes('nation')) return profile.country;

        // 4. Links
        if (sig.includes('linkedin')) return profile.linkedin;
        if (sig.includes('github') || sig.includes('portfolio') || sig.includes('website')) return profile.github;

        // 5. Generic "name" — only match if nothing more specific matched above
        if (sig.includes('name')) {
            return profile.fullName || `${profile.firstName} ${profile.lastName}`;
        }

        // 6. Custom fields (last priority)
        if (customFields && customFields.length > 0) {
            for (const cf of customFields) {
                if (!cf.label || !cf.value) continue;
                const keyword = cf.label.toLowerCase().trim();
                if (sig.includes(keyword)) {
                    return cf.value;
                }
            }
        }

        return null;
    }

    // ===== GET FIELD'S OWN DIRECT ATTRIBUTES =====
    function getDirectSignature(input) {
        const parts = [];
        parts.push(input.name || '');
        parts.push(input.id || '');
        parts.push(input.placeholder || '');
        parts.push(input.getAttribute('aria-label') || '');
        parts.push(input.getAttribute('data-label') || '');
        parts.push(input.getAttribute('autocomplete') || '');
        parts.push(input.type || '');
        return parts.join(' ').toLowerCase();
    }

    // ===== GET NEARBY LABEL TEXT (scoped to this field's container) =====
    function getNearbyLabel(input) {
        const parts = [];

        // Check <label> elements
        if (input.labels && input.labels.length > 0) {
            input.labels.forEach(l => parts.push(l.innerText || ''));
        }

        // Check for label by "for" attribute
        if (input.id) {
            const labelFor = document.querySelector(`label[for="${input.id}"]`);
            if (labelFor) parts.push(labelFor.innerText || '');
        }

        // Walk up but STOP at the nearest form-group boundary
        // This prevents picking up text from sibling fields
        let el = input;
        for (let i = 0; i < 4; i++) {
            el = el.parentElement;
            if (!el) break;

            // Check direct children text elements ONLY (not deep descendants)
            // This avoids picking up text from other nested form groups
            for (const child of el.children) {
                if (['LABEL', 'SPAN', 'P', 'DIV'].includes(child.tagName)) {
                    // Skip if this child contains another input (it's a sibling field's label)
                    if (child.querySelector('input, textarea, select')) continue;
                    const text = (child.innerText || '').trim();
                    if (text && text.length < 60) {
                        parts.push(text);
                    }
                }
            }

            // Stop at common form-group boundaries
            const cls = (el.className || '').toLowerCase();
            if (cls.includes('form-group') || cls.includes('field') || cls.includes('form-row')
                || cls.includes('form-control') || cls.includes('input-group')
                || el.tagName === 'FORM' || el.tagName === 'BODY'
                || el.tagName === 'FIELDSET' || el.tagName === 'TR') {
                break;
            }
        }

        return parts.join(' ').toLowerCase();
    }

    // ===================================================================
    // ===== GOOGLE FORMS HANDLER =====
    // ===================================================================
    if (isGoogleForms) {
        console.log("GhostWriter: Running Google Forms mode...");

        // Google Forms wraps each question in a container with data-params
        // The question title is inside nested divs/spans
        // Inputs are <input> or <textarea> inside the same container
        const questionBlocks = document.querySelectorAll('div[data-params]');
        console.log(`GhostWriter: Found ${questionBlocks.length} Google Forms question blocks`);

        questionBlocks.forEach(block => {
            // Get the question title text
            // Google Forms question titles are typically the first visible heading-like text
            const titleEl = block.querySelector('div[role="heading"] span, div[role="heading"], span[class]');
            let titleText = '';
            if (titleEl) {
                titleText = titleEl.innerText || titleEl.textContent || '';
            }
            // Fallback: grab the first significant text node
            if (!titleText) {
                const allSpans = block.querySelectorAll('span');
                for (const span of allSpans) {
                    const txt = (span.innerText || '').trim();
                    if (txt.length > 1 && txt.length < 200) {
                        titleText = txt;
                        break;
                    }
                }
            }

            if (!titleText) return;
            const sig = titleText.toLowerCase();
            console.log(`GhostWriter: Question found: "${titleText}"`);

            const matchedValue = findMatchingValue(sig, '');
            if (!matchedValue) return;

            // --- Fill short answer / paragraph ---
            const textInput = block.querySelector('input[type="text"], input:not([type]), textarea');
            if (textInput) {
                fillField(textInput, matchedValue);
                console.log(`GhostWriter: Filled "${titleText}" with "${matchedValue}"`);
                return;
            }

            // --- Fill dropdown (Google Forms uses custom dropdowns) ---
            const dropdown = block.querySelector('div[role="listbox"]');
            if (dropdown) {
                // Click to open the dropdown
                dropdown.click();
                setTimeout(() => {
                    // Find matching option
                    const options = document.querySelectorAll('div[role="option"], div[data-value]');
                    for (const opt of options) {
                        const optText = (opt.innerText || opt.textContent || '').trim().toLowerCase();
                        if (optText === matchedValue.toLowerCase() || optText.includes(matchedValue.toLowerCase())) {
                            opt.click();
                            filledCount++;
                            console.log(`GhostWriter: Selected dropdown "${titleText}" → "${matchedValue}"`);
                            break;
                        }
                    }
                }, 300);
                return;
            }

            // --- Fill radio buttons / checkboxes ---
            const radioOptions = block.querySelectorAll('div[role="radio"], label[role="radio"]');
            if (radioOptions.length > 0) {
                for (const radio of radioOptions) {
                    const radioText = (radio.innerText || radio.textContent || '').trim().toLowerCase();
                    if (radioText === matchedValue.toLowerCase() || radioText.includes(matchedValue.toLowerCase())) {
                        radio.click();
                        filledCount++;
                        console.log(`GhostWriter: Selected radio "${titleText}" → "${matchedValue}"`);
                        break;
                    }
                }
                return;
            }

            const checkboxOptions = block.querySelectorAll('div[role="checkbox"], label[role="checkbox"]');
            if (checkboxOptions.length > 0) {
                // For checkboxes, the value might be comma-separated
                const valuesToCheck = matchedValue.toLowerCase().split(',').map(v => v.trim());
                for (const cb of checkboxOptions) {
                    const cbText = (cb.innerText || cb.textContent || '').trim().toLowerCase();
                    if (valuesToCheck.some(v => cbText === v || cbText.includes(v))) {
                        if (cb.getAttribute('aria-checked') !== 'true') {
                            cb.click();
                            filledCount++;
                            console.log(`GhostWriter: Checked "${titleText}" → "${cbText}"`);
                        }
                    }
                }
                return;
            }
        });

        // Also try filling the email field at the top (if Google Forms collects email)
        const emailInputs = document.querySelectorAll('input[type="email"], input[name="emailAddress"]');
        emailInputs.forEach(input => {
            if (profile.email && !input.value) {
                fillField(input, profile.email);
            }
        });
    }
    // ===================================================================
    // ===== STANDARD WEBSITE HANDLER =====
    // ===================================================================
    else {
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            // Skip hidden, submit, button, file inputs (password allowed via custom fields)
            const skipTypes = ['hidden', 'submit', 'button', 'file', 'image', 'reset'];
            if (skipTypes.includes(input.type)) return;

            // TIER 1: Check the field's own direct attributes first
            const directSig = getDirectSignature(input);
            let matchedValue = findMatchingValue(directSig, input.type);

            // TIER 2: If no match, check nearby label text
            if (!matchedValue) {
                const labelSig = directSig + ' ' + getNearbyLabel(input);
                matchedValue = findMatchingValue(labelSig, input.type);
            }

            if (matchedValue) {
                fillField(input, matchedValue);
            }
        });
    }

    console.log(`GhostWriter filled ${filledCount} fields`);
}