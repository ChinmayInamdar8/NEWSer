# 📰 Daily Corner

**Daily Corner** is a modern social media platform focused on news. It allows users to discover, share, discuss, and engage with news from around the world in a clean, fast, and community-driven environment.

> **Status:** 🚧 Under Development

---

## 📚 Documentation

Before contributing to the project, please read the following documentation:

* **Project Setup:** [docs/setup.md](docs/setup.md)
* **Google OAuth & sessions:** [docs/auth-google-oauth.md](docs/auth-google-oauth.md)
* **Development & Pull Request Guidelines:** [docs/instructions.md](docs/instructions.md)

---

## ✨ Features

* 🔐 User Authentication
* 📰 Create and Share News Posts
* ❤️ Like and React to Posts
* 💬 Comment on News
* 🔄 Share Posts
* 👤 User Profiles
* 🔍 Search News and Users
* 📌 Personalized News Feed
* 📱 Responsive Design

---

## 🏗️ Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui

### Backend

* Node.js
* NestJS
* Prisma ORM

### Database

* PostgreSQL

### Authentication

* Passport.js + Google OAuth (NestJS)

### Development Tools

* Turborepo
* pnpm
* ESLint
* Prettier
* GitHub Actions (Planned)

---

## 📁 Project Structure

```text
Daily Corner/
├── apps/
│   ├── admin/        # Admin Dashboard
│   ├── web/          # User-facing application
│   └── server/       # Backend API
│
├── packages/
│   ├── auth/         # Shared authentication
│   ├── database/     # Prisma schema & database client
│   ├── ui/           # Shared UI components
│   ├── types/        # Shared TypeScript types
│   ├── utils/        # Shared utility functions
│   ├── eslint-config/
│   └── typescript-config/
│
├── docs/
│   ├── setup.md          # Project setup guide
│   └── instructions.md   # Development & PR guidelines
│
└── README.md
```

---

## 🚀 Quick Start

```bash
git clone <repository-url>

cd NEWSer

pnpm install

pnpm dev
```

For detailed installation instructions, environment setup, and project configuration, see **[docs/setup.md](docs/setup.md)**.

---

## 📌 Roadmap

* [ ] User Authentication
* [ ] News Feed
* [ ] User Profiles
* [ ] Follow System
* [ ] Comments
* [ ] Reactions
* [ ] Notifications
* [ ] Search
* [ ] Admin Dashboard
* [ ] Media Uploads
* [ ] Real-time Updates
* [ ] Mobile Optimization

---

## 🤝 Contributing

We welcome contributions from everyone!

Before opening a Pull Request, please read **[docs/instructions.md](docs/instructions.md)** for:

* Development workflow
* Branch naming conventions
* Commit message guidelines
* Pull Request checklist
* Code review expectations

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Authors

Developed with ❤️ by the **Daily Corner Team**.
