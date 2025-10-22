# 📑 Documentation Index

**Last Updated**: 2025-01-19

## 📂 Quick Navigation

### 🏠 Project Basics
- [README](./README.md) - Documentation hub overview
- [PROJECT_OVERVIEW](./PROJECT_OVERVIEW.md) - ⭐ START HERE - Tổng quan dự án
- [TECH_STACK](./TECH_STACK.md) - Technologies và tools
- [ARCHITECTURE](./ARCHITECTURE.md) - TODO: System architecture

### ✨ Features
- [API_AUTO_FEATURE](./features/API_AUTO_FEATURE.md) - API Automation workflows
- [API_RUNNER](./features/API_RUNNER.md) - TODO: API testing tool
- [TICKET_MANAGEMENT](./features/TICKET_MANAGEMENT.md) - TODO: Ticket system

### 🐛 Fixes & Solutions
- [FIX_LOGIN_ISSUE](./fixes/FIX_LOGIN_ISSUE.md) - Login và session issues (CRITICAL)
- [FIX_MIDDLEWARE_ERROR](./fixes/FIX_MIDDLEWARE_ERROR.md) - Middleware TypeError fix
- [FIX_REVOKE_SESSIONS_FAILED](./fixes/FIX_REVOKE_SESSIONS_FAILED.md) - Session revocation issues

### 📖 Guides
- [FORCE_LOGOUT_GUIDE](./guides/FORCE_LOGOUT_GUIDE.md) - Force logout tools
- [DEVELOPMENT_SETUP](./guides/DEVELOPMENT_SETUP.md) - TODO: Setup guide
- [DEPLOYMENT](./guides/DEPLOYMENT.md) - TODO: Deploy guide

### 🔌 API Documentation
- [AUTHENTICATION](./api/AUTHENTICATION.md) - TODO: Auth endpoints
- [TICKETS_API](./api/TICKETS_API.md) - TODO: Tickets endpoints
- [TOOLS_API](./api/TOOLS_API.md) - TODO: Developer tools API

---

## 🎯 For AI/LLM - Quick Start

**New session checklist:**
1. ✅ Read [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)
2. ✅ Check [TECH_STACK.md](./TECH_STACK.md)
3. ✅ Scan [fixes/](./fixes/) for known issues
4. Task-specific: Read relevant feature/guide

**Common tasks:**
- **Login issues?** → `fixes/FIX_LOGIN_ISSUE.md`
- **Adding feature?** → Check `features/` for patterns
- **Setup dev?** → `guides/DEVELOPMENT_SETUP.md`
- **API work?** → `api/` docs

---

## 📊 Documentation Status

### ✅ Complete (5)
- [x] README.md
- [x] PROJECT_OVERVIEW.md
- [x] TECH_STACK.md
- [x] features/API_AUTO_FEATURE.md
- [x] INDEX.md (this file)

### 📝 In Progress (3)
- [x] fixes/FIX_LOGIN_ISSUE.md - Being created
- [x] fixes/FIX_MIDDLEWARE_ERROR.md - Being created
- [x] fixes/FIX_REVOKE_SESSIONS_FAILED.md - Being created

### 🚧 TODO (10)
- [ ] ARCHITECTURE.md
- [ ] features/API_RUNNER.md
- [ ] features/TICKET_MANAGEMENT.md
- [ ] guides/FORCE_LOGOUT_GUIDE.md
- [ ] guides/DEVELOPMENT_SETUP.md
- [ ] guides/DEPLOYMENT.md
- [ ] api/AUTHENTICATION.md
- [ ] api/TICKETS_API.md
- [ ] api/TOOLS_API.md
- [ ] DATABASE_SCHEMA.md

---

## 🔍 Search Tips

```bash
# Find docs about a topic
grep -r "authentication" docs-ai/

# List all fixes
ls docs-ai/fixes/

# Search for specific error
grep -r "refresh_token_not_found" docs-ai/

# Find TODO items
grep -r "TODO" docs-ai/
```

---

**Note**: Docs are continuously updated. Check git history for changes.
