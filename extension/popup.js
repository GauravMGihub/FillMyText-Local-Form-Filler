// It fetches your data and injects a script into the current tab.

document.getElementById('fillBtn').addEventListener('click', async () => {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = "Fetching data...";

    try {
        // 1. Get data from your Localhost Backend
        const response = await fetch('http://localhost:5000/api/profile');
        const data = await response.json();

        // 2. Find the current active tab in Chrome
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // 3. Inject the "filler script" into that tab
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: autoFillScript,   // The function below to run inside the page
            args: [data]            // Pass the DB data to that function
        });

        statusDiv.textContent = "✅ Injected!";
    } catch (error) {
        statusDiv.textContent = "❌ Error: Could not connect to backend.";
        console.error(error);
    }
});


// --- THIS FUNCTION RUNS INSIDE THE WEBPAGE (NAUKRI, GOOGLE FORMS, ETC) ---


function autoFillScript(profile) {
    console.log("👻 GhostWriter is scanning the page...");

    // Helper to fill a single field safely
    const fillField = (input, value) => {
        if (!value) return;
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.style.backgroundColor = "#e6f7ff"; // Light Blue
        input.style.border = "2px solid #007bff";
    };

    // Find all inputs and textareas
    const inputs = document.querySelectorAll('input, textarea');

    inputs.forEach(input => {
        // Get the input's "fingerprint" (id, name, placeholder, label)
        const name = (input.name || '').toLowerCase();
        const id = (input.id || '').toLowerCase();
        const placeholder = (input.placeholder || '').toLowerCase();
        const type = (input.type || '').toLowerCase();

        // Try to find an associated label
        let label = '';
        if (input.id) {
            const labelEl = document.querySelector(`label[for="${input.id}"]`);
            if (labelEl) label = labelEl.textContent.toLowerCase();
        }

        // Skip hidden fields or checkboxes
        if (type === 'hidden' || type === 'checkbox' || type === 'radio') return;

        // Combine all attributes into one string to search easily
        const attributes = `${name} ${id} ${placeholder} ${label}`;

        // 1. Check for "First Name" specific fields
        if (attributes.includes('first') || attributes.includes('fname') || attributes.includes('given')) {
            fillField(input, profile.firstName);
            return;
        }

        // 2. Check for "Last Name" specific fields
        if (attributes.includes('last') || attributes.includes('lname') || attributes.includes('surname') || attributes.includes('family')) {
            fillField(input, profile.lastName);
            return;
        }

        // 3. Check for "Full Name"
        if (attributes.includes('fullname') || attributes.includes('full name') || name === 'name') {
            fillField(input, `${profile.firstName} ${profile.lastName}`);
            return;
        }

        // 4. Email
        if (attributes.includes('email') || attributes.includes('mail')) {
            fillField(input, profile.email);
            return;
        }

        // 5. Phone
        if (attributes.includes('phone') || attributes.includes('mobile') || attributes.includes('contact') || type === 'tel') {
            fillField(input, profile.phone);
            return;
        }

        // 6. Links (LinkedIn/GitHub)
        if (attributes.includes('linkedin')) fillField(input, profile.linkedin);
        if (attributes.includes('github') || attributes.includes('portfolio')) fillField(input, profile.github);
    });

    alert("👻 GhostWriter finished!");
}

