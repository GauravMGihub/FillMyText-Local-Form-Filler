document.addEventListener('DOMContentLoaded', () => {
    const mainView = document.getElementById('mainView');
    const editView = document.getElementById('editView');
    const statusBanner = document.getElementById('statusBanner');
    const fields = ['fullName', 'firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zip', 'country', 'linkedin', 'github'];

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
        chrome.storage.local.get(['profile'], (result) => {
            if (result.profile) {
                fields.forEach(id => {
                    const el = document.getElementById(id);
                    if (el && result.profile[id]) el.value = result.profile[id];
                });
            }
        });
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

        chrome.storage.local.set({ profile }, () => {
            showMain();
            showStatus("Profile saved!", "success");
        });
    });

    // --- Auto-Fill ---
    document.getElementById('fillBtn').addEventListener('click', async () => {
        chrome.storage.local.get(['profile'], async (result) => {
            const data = result.profile;
            if (!data || !data.firstName) {
                showStatus("No profile saved - Edit Profile first", "error");
                return;
            }
            let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: autoFillScript,
                args: [data]
            });
            showStatus("Auto-fill injected successfully!", "success");
        });
    });
});

// --- THE INJECTED SCRIPT (React/Angular compatible) ---
function autoFillScript(profile) {
    console.log("GhostWriter running...", profile);
    const inputs = document.querySelectorAll('input, textarea, select');
    let filledCount = 0;

    // React-compatible value setter — bypasses React's controlled component state
    const fillField = (input, value) => {
        if (!value) return;

        // Use native setter to bypass React/Angular state management
        const nativeSetter =
            Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set ||
            Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;

        if (nativeSetter) {
            nativeSetter.call(input, value);
        } else {
            input.value = value;
        }

        // Dispatch all events React/Angular listen for
        input.dispatchEvent(new Event('focus', { bubbles: true }));
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true }));

        // Also trigger React 16+ synthetic events
        const reactEvent = new Event('input', { bubbles: true });
        Object.defineProperty(reactEvent, 'target', { value: input });
        input.dispatchEvent(reactEvent);

        input.style.backgroundColor = "#e6f7ff";
        input.style.border = "2px solid #007bff";
        filledCount++;
    };

    // Gather all possible identifying text for a field
    function getFieldSignature(input) {
        const parts = [];
        parts.push(input.name || '');
        parts.push(input.id || '');
        parts.push(input.placeholder || '');
        parts.push(input.getAttribute('aria-label') || '');
        parts.push(input.getAttribute('data-label') || '');
        parts.push(input.getAttribute('autocomplete') || '');

        // Check <label> elements
        if (input.labels && input.labels.length > 0) {
            input.labels.forEach(l => parts.push(l.innerText || ''));
        }

        // Check for label by "for" attribute
        if (input.id) {
            const labelFor = document.querySelector(`label[for="${input.id}"]`);
            if (labelFor) parts.push(labelFor.innerText || '');
        }

        // Check nearby text (parent/sibling labels, spans, divs)
        const parent = input.closest('div, fieldset, li, td');
        if (parent) {
            const nearby = parent.querySelectorAll('label, span, p, div.label, div[class*="label"]');
            nearby.forEach(el => {
                if (el.innerText && el.innerText.length < 50) {
                    parts.push(el.innerText);
                }
            });
        }

        return parts.join(' ').toLowerCase();
    }

    inputs.forEach(input => {
        const sig = getFieldSignature(input);

        // Name fields — check "first" before generic "name"
        if (sig.includes('first') || sig.includes('fname') || sig.includes('given name')) {
            fillField(input, profile.firstName);
        }
        else if (sig.includes('last') || sig.includes('lname') || sig.includes('surname') || sig.includes('family name')) {
            fillField(input, profile.lastName);
        }
        else if (sig.includes('full name') || sig.includes('fullname') || sig.includes('your name')
                 || input.name === 'name' || input.id === 'name'
                 || input.getAttribute('autocomplete') === 'name') {
            fillField(input, profile.fullName || `${profile.firstName} ${profile.lastName}`);
        }
        // Contact
        else if (sig.includes('email') || sig.includes('e-mail') || input.type === 'email') {
            fillField(input, profile.email);
        }
        else if (sig.includes('phone') || sig.includes('mobile') || sig.includes('contact number') || input.type === 'tel') {
            fillField(input, profile.phone);
        }
        // Address
        else if (sig.includes('address') || sig.includes('street')) {
            fillField(input, profile.address);
        }
        else if (sig.includes('city') || sig.includes('town')) {
            fillField(input, profile.city);
        }
        else if (sig.includes('state') || sig.includes('province') || sig.includes('region')) {
            fillField(input, profile.state);
        }
        else if (sig.includes('zip') || sig.includes('postal') || sig.includes('pincode') || sig.includes('pin code')) {
            fillField(input, profile.zip);
        }
        else if (sig.includes('country') || sig.includes('nation')) {
            fillField(input, profile.country);
        }
        // Links
        else if (sig.includes('linkedin')) {
            fillField(input, profile.linkedin);
        }
        else if (sig.includes('github') || sig.includes('portfolio') || sig.includes('website')) {
            fillField(input, profile.github);
        }
    });

    console.log(`GhostWriter filled ${filledCount} fields`);
}