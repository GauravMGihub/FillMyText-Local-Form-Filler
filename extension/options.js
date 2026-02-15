document.addEventListener('DOMContentLoaded', () => {
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
    let customFields = [];

    // --- Escape HTML ---
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // --- Render custom fields ---
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
                <button type="button" class="btn-remove-field" data-index="${index}" title="Remove this field">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
            `;
            container.appendChild(row);
        });

        // Live editing listeners
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

    // --- Add field button ---
    document.getElementById('addFieldBtn').addEventListener('click', () => {
        customFields.push({ label: '', value: '' });
        renderCustomFields();
        const lastLabel = document.querySelector('.custom-field-row:last-child .cf-label');
        if (lastLabel) lastLabel.focus();
    });

    // 1. Load saved data when the page opens
    chrome.storage.local.get(['profile', 'customFields'], (result) => {
        if (result.profile) {
            fields.forEach(id => {
                const el = document.getElementById(id);
                if (el && result.profile[id]) el.value = result.profile[id];
            });
        }
        customFields = result.customFields || [];
        renderCustomFields();
    });

    // 2. Save data when button is clicked
    document.getElementById('saveBtn').addEventListener('click', () => {
        const profile = {};
        fields.forEach(id => {
            profile[id] = document.getElementById(id).value;
        });

        // Filter out empty custom fields
        const validCustomFields = customFields.filter(f => f.label.trim() !== '');

        chrome.storage.local.set({ profile, customFields: validCustomFields }, () => {
            const status = document.getElementById('status');
            status.textContent = `Profile saved with ${validCustomFields.length} custom field(s)!`;
            status.className = 'success';
            setTimeout(() => {
                status.textContent = '';
                status.className = '';
            }, 2500);
        });
    });

    // 3. Go Back button - navigate back to the previous website tab
    document.getElementById('gobackBtn').addEventListener('click', () => {
        chrome.tabs.query({}, (tabs) => {
            const extensionUrl = chrome.runtime.getURL('');
            const siteTabs = tabs.filter(t => !t.url.startsWith(extensionUrl) && !t.url.startsWith('chrome://'));
            if (siteTabs.length > 0) {
                const targetTab = siteTabs.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))[0];
                chrome.tabs.update(targetTab.id, { active: true });
                chrome.windows.update(targetTab.windowId, { focused: true });
                chrome.tabs.getCurrent((currentTab) => {
                    if (currentTab) chrome.tabs.remove(currentTab.id);
                });
            } else {
                chrome.tabs.getCurrent((currentTab) => {
                    if (currentTab) chrome.tabs.remove(currentTab.id);
                });
            }
        });
    });
});