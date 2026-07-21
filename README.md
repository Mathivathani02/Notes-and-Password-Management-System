# 🛡️ Aegis Vault — Notes & Password Management System

A secure, self-hosted vault for managing passwords and project notes, with built-in encryption, a password strength generator, and a real-time security audit dashboard.

## ✨ Features

- 🔐 **AES-256 Encrypted Password Vault** — store credentials for work, DevOps, databases, and design tools, organized by category.
- 📝 **Project Notes** — Markdown & code block support for technical docs and architecture notes, with tag-based quick navigation.
- ⚡ **High-Entropy Password Generator** — customizable length (8–64 characters), toggle rules for uppercase/lowercase/numbers/symbols, real-time strength calculation, and instant copy.
- 🛡️ **Security Audit Dashboard** — vault health score (0–100), detection of weak or reused credentials, and real-time recommendations with an audit log timeline.
- 🔎 **Quick Search** — find passwords, notes, tags, or domains instantly (Ctrl+K).

## 🧱 Tech Stack

- **Backend:** Node.js, Express
- **Encryption:** Node `crypto` module (AES-256)
- **Frontend:** HTML, CSS, vanilla JS (modular structure)

## 📂 Project Structure

├── public/
│ ├── index.html
│ ├── styles.css
│ ├── app.js
│ └── js/modules/
│ ├── auth.js
│ ├── passwords.js
│ ├── notes.js
│ ├── generator.js
│ └── audit.js
├── routes/
│ ├── authRoutes.js
│ ├── passwordsRoutes.js
│ ├── notesRoutes.js
│ └── auditRoutes.js
├── services/
│ ├── cryptoService.js
│ └── storageService.js
├── server.js
└── package.json


## 🚀 Getting Started

1. Clone the repository
```bash
   git clone https://github.com/Mathivathani02/Notes-and-Password-Management-System.git
   cd Notes-and-Password-Management-System
```

2. Install dependencies
```bash
   npm install
```

3. Start the server
```bash
   node server.js
```

4. Open your browser at

http://localhost:3000


## 🔒 Security Note

This project stores sensitive credential data. Do not commit real passwords, API keys, or `.env` files with production secrets to this repository. For real-world use, review the encryption implementation and add proper environment-based secret management before deploying publicly.

## 👤 Author

Built by [Mathivathani02](https://github.com/Mathivathani02)
