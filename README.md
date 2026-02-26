<p align="center">
  <img src="extension/Images/icon128.png" alt="FillMyText Logo" width="100" />
</p>

<h1 align="center">FillMyText: Local Form Filler</h1>

<p align="center">
  <em>Stop retyping. Start applying.</em>
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/kiidpifplbekgeahbfoampkncghgmddf"><img src="https://img.shields.io/badge/Chrome%20Web%20Store-Install%20Now-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Install from Chrome Web Store"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Manifest-V3-blueviolet?style=for-the-badge" alt="Manifest V3">
  <img src="https://img.shields.io/badge/Data-100%25%20Local-orange?style=for-the-badge&logo=shield&logoColor=white" alt="100% Local Data">
</p>

---

## 💡 The Problem

While applying for internships and jobs, I had to visit dozens of company career pages and repeatedly type out the same information — **name, email, phone number, address, LinkedIn, GitHub** — over and over again. It was tedious, time-consuming, and error-prone.

Existing auto-fill tools either required cloud accounts, stored data on external servers, or were overly complex for what should be a simple task.

## 🚀 The Solution

**FillMyText** is a lightweight Chrome extension that stores your frequently used text data **locally in your browser** and auto-fills web forms with a single click. No servers. No databases. No accounts. Just your data, stored safely on your machine.

---

## ✨ Features

| Feature                           | Description                                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------------------------- |
| 🖱️ **One-Click Auto-Fill**        | Fill all matching text fields on any page instantly                                             |
| 💾 **100% Local Storage**         | Data is stored in Chrome's extension storage — never leaves your browser                        |
| 🔒 **Privacy-First**              | No external servers, no cloud sync, no tracking. Chrome protects your data                      |
| 🧩 **Custom Fields**              | Add unlimited custom label-value pairs for any field type (e.g., Company, Age, etc.)            |
| 🌙 **Dark / Light Theme**         | Toggle between dark and light modes to match your preference                                    |
| 📝 **Google Forms Support**       | Automatically detects and fills Google Forms questions                                          |
| ⚛️ **React & Angular Compatible** | Uses native value setters + synthetic events to work with modern SPA frameworks                 |
| 🏷️ **Smart Field Matching**       | Matches fields by name, ID, placeholder, aria-label, autocomplete attributes, and nearby labels |
| 📋 **Profile Preview**            | See your saved name & email at a glance from the popup                                          |

---

## 📸 Screenshots

<p align="center">
  <img src="assets/popup-main.png" alt="FillMyText Main Popup" width="350" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="assets/edit-profile.png" alt="Edit Profile View" width="350" />
</p>
<p align="center">
  <sub><b>Left:</b> Main popup with Quick Actions &nbsp;|&nbsp; <b>Right:</b> Edit Profile with locally saved data</sub>
</p>

---

## 🛠️ Installation

### ⭐ Install from Chrome Web Store (Recommended)

<p align="center">
  <a href="https://chromewebstore.google.com/detail/kiidpifplbekgeahbfoampkncghgmddf">
    <img src="https://img.shields.io/badge/⬇️%20Install%20FillMyText-Chrome%20Web%20Store-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white&labelColor=1a1a2e" alt="Install from Chrome Web Store" />
  </a>
</p>

👉 **[Click here to install FillMyText from the Chrome Web Store](https://chromewebstore.google.com/detail/kiidpifplbekgeahbfoampkncghgmddf)** — one click and you're ready to go!

---

### From Source (Developer Mode)

1. **Clone** this repository:
   ```bash
   git clone https://github.com/GauravMGihub/FillMyText.git
   ```
2. Open **Chrome** and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **"Load unpacked"**
5. Select the `extension` folder from the cloned repository
6. 🎉 **FillMyText** will appear in your extensions toolbar!

---

## 📖 How to Use

### 1️⃣ Save Your Profile

- Click the **FillMyText** icon in the toolbar
- Click **Edit Profile**
- Fill in your details:
  - **Personal** — Full Name, First Name, Last Name, Email, Phone
  - **Address** — Street, City, State, Pincode, Country
  - **Links** — LinkedIn URL, GitHub URL
  - **Custom Fields** — Add any extra fields you need (e.g., `College`, `Graduation Year`, `Portfolio`)
- Click **Save Profile**

### 2️⃣ Auto-Fill Any Form

- Navigate to any website with a form (job application, registration page, Google Form, etc.)
- Click the **FillMyText** icon
- Hit **Auto-Fill Page**
- ✅ All matching fields get filled instantly!

### 3️⃣ Custom Fields

- Need to fill a field not in the default list? Add a **Custom Field**!
- Set the **Field Name** to a keyword that matches the form field's label (e.g., `college`, `graduation year`)
- The extension will match it against the form and auto-fill the value

---

## 🔍 How Field Matching Works

FillMyText uses a **tiered matching strategy** to identify which form field should get which value:

```
TIER 1 → Field's own attributes (name, id, placeholder, aria-label, autocomplete)
TIER 2 → Nearby label text (scoped to the field's container, not the whole page)
```

The matching priority ensures specific fields (like `email`, `phone`) are matched first, generic ones (like `name`) are matched last, and custom fields act as a flexible catch-all.

### Supported Field Types

| Category    | Recognized Keywords                                                                             |
| ----------- | ----------------------------------------------------------------------------------------------- |
| **Name**    | `first`, `last`, `full name`, `fname`, `lname`, `surname`, `given name`, `family name`          |
| **Contact** | `email`, `e-mail`, `phone`, `mobile`, `contact number`, `whatsapp`                              |
| **Address** | `address`, `street`, `city`, `town`, `state`, `province`, `zip`, `postal`, `pincode`, `country` |
| **Links**   | `linkedin`, `github`, `portfolio`, `website`                                                    |
| **Custom**  | Any keyword you define in Custom Fields                                                         |

---

## 🏗️ Project Structure

```
extension/
├── manifest.json       # Chrome Extension Manifest V3
├── popup.html          # Main popup UI
├── popup.css           # Popup styling (dark/light theme)
├── popup.js            # Popup logic + auto-fill injection script
├── options.html        # Full-page profile editor
├── options.css         # Options page styling
├── options.js          # Options page logic
└── Images/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 🔐 Privacy & Security

- **Zero data collection** — FillMyText does NOT send data anywhere
- **Chrome's local storage** — Data is stored using `chrome.storage.local`, which is sandboxed and protected by Chrome's security model
- **No external requests** — The extension has no network permissions; it physically cannot transmit your data
- **Open source** — Every line of code is auditable in this repository

---

## ⚠️ Known Limitations

- **Multiple fields with the same name** — If a form has two or more fields with identical labels/names (e.g., two "Name" fields), the extension will fill all of them with the same value. This is a known challenge being worked on.
- **Text fields only** — Currently supports `<input>`, `<textarea>`, and `<select>` elements. Dropdowns and radio buttons are supported on Google Forms but may vary on other sites.
- **Page must be loaded** — The extension injects a script into the active tab, so the page must be fully loaded before clicking Auto-Fill.

---

## 🗺️ Roadmap

- [ ] Handle multiple fields with the same field name intelligently
- [ ] Support for file upload fields (resume auto-attach)
- [ ] Multiple profiles (e.g., Work, Personal)
- [ ] Export / Import profile data
- [ ] Firefox & Edge support

---

## 🤝 Contributing

Contributions are welcome! If you have ideas, bug reports, or want to contribute code:

1. **Fork** this repo
2. Create a new branch: `git checkout -b feature/my-feature`
3. Make your changes and commit: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a **Pull Request**

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <b>Built with ❤️ by <a href="https://github.com/GauravMGihub">Gaurav Mohagaonkar</a></b>
</p>
<p align="center">
  <em>Born out of the frustration of filling 100+ internship forms by hand 😅</em>
</p>
