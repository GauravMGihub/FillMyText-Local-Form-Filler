document.addEventListener('DOMContentLoaded', () => {
    const fields = ['fullName', 'firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zip', 'country', 'linkedin', 'github'];

    // 1. Load saved data when the page opens
    chrome.storage.local.get(['profile'], (result) => {
        if (result.profile) {
            fields.forEach(id => {
                const el = document.getElementById(id);
                if (el && result.profile[id]) el.value = result.profile[id];
            });
        }
    });

    // 2. Save data when button is clicked
    document.getElementById('saveBtn').addEventListener('click', () => {
        const profile = {};
        fields.forEach(id => {
            profile[id] = document.getElementById(id).value;
        });

        chrome.storage.local.set({ profile }, () => {
            const status = document.getElementById('status');
            status.textContent = 'Profile saved successfully!';
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