# 📚 Docs AI - Documentation Hub

Thư mục này chứa toàn bộ documentation về dự án TicketLMS, được tổ chức để AI có thể đọc và hiểu context nhanh chóng mà không cần phải đọc code.

## 📋 Mục đích

- **Quick Context**: AI có thể đọc docs này thay vì phải traverse toàn bộ codebase
- **Centralized Knowledge**: Tất cả thông tin về project, architecture, issues, fixes đều ở đây
- **Version History**: Track changes và decisions qua thời gian
- **Onboarding**: New developers hoặc AI sessions mới có thể hiểu project nhanh

## 📂 Cấu trúc

```
docs-ai/
├── README.md                           # File này
├── PROJECT_OVERVIEW.md                 # Tổng quan project
├── ARCHITECTURE.md                     # System architecture
├── TECH_STACK.md                       # Technologies used
│
├── features/                           # Features documentation
│   ├── API_AUTO_FEATURE.md            # API Automation feature
│   ├── API_RUNNER.md                  # API Runner tool
│   └── TICKET_MANAGEMENT.md           # Ticket system
│
├── fixes/                             # Bug fixes & solutions
│   ├── FIX_LOGIN_ISSUE.md             # Login/session issues
│   ├── FIX_MIDDLEWARE_ERROR.md        # Middleware errors
│   └── FIX_REVOKE_SESSIONS_FAILED.md  # Session revocation
│
├── guides/                            # How-to guides
│   ├── FORCE_LOGOUT_GUIDE.md          # Force logout tools
│   ├── DEVELOPMENT_SETUP.md           # Dev environment setup
│   └── DEPLOYMENT.md                  # Deployment guide
│
└── api/                               # API documentation
    ├── AUTHENTICATION.md              # Auth endpoints
    ├── TICKETS_API.md                 # Tickets API
    └── TOOLS_API.md                   # Tools API
```

## 🎯 Cách sử dụng

### Cho AI/LLM

Khi bắt đầu session mới hoặc cần context:

```
1. Đọc PROJECT_OVERVIEW.md - Hiểu project là gì
2. Đọc ARCHITECTURE.md - Hiểu cấu trúc
3. Đọc TECH_STACK.md - Biết công nghệ đang dùng
4. Đọc docs cụ thể theo task:
   - Làm feature → đọc features/
   - Fix bug → đọc fixes/
   - Setup → đọc guides/
```

### Cho Developers

```bash
# Đọc overview
cat docs-ai/PROJECT_OVERVIEW.md

# Tìm docs về một topic
grep -r "authentication" docs-ai/

# Xem tất cả fixes
ls docs-ai/fixes/
```

## 📝 Conventions

### Naming

- `PROJECT_*` - Project-level documentation
- `FIX_*` - Bug fixes và solutions
- `GUIDE_*` hoặc `*_GUIDE` - How-to guides
- Uppercase với underscores - dễ scan

### Structure

Mỗi doc nên có:
```markdown
# Title

## Vấn đề / Overview
Brief description

## Nguyên nhân / Context
Root cause or background

## Giải pháp / Implementation
How it was solved

## Cách sử dụng / Usage
How to use

## Related
Links to related docs
```

### Updates

- Khi có feature mới → Tạo doc trong `features/`
- Khi fix bug → Tạo doc trong `fixes/`
- Khi có breaking change → Update ARCHITECTURE.md
- Khi thay đổi tech stack → Update TECH_STACK.md

## 🔗 Related Files

- `.gitignore` - Docs AI không nên ignore
- `README.md` (root) - Project README chính
- `package.json` - Project metadata

## 📊 Current Docs

### ✅ Completed

- [x] API_AUTO_FEATURE.md - API automation documentation
- [x] FIX_LOGIN_ISSUE.md - Login/session fixes
- [x] FIX_MIDDLEWARE_ERROR.md - Middleware error fixes
- [x] FIX_REVOKE_SESSIONS_FAILED.md - Session revocation
- [x] FORCE_LOGOUT_GUIDE.md - Force logout guide

### 🚧 TODO

- [ ] PROJECT_OVERVIEW.md - Overall project description
- [ ] ARCHITECTURE.md - System architecture diagram & explanation
- [ ] TECH_STACK.md - Full tech stack documentation
- [ ] DEVELOPMENT_SETUP.md - Dev environment setup
- [ ] DEPLOYMENT.md - Production deployment guide
- [ ] AUTHENTICATION.md - Auth system documentation
- [ ] DATABASE_SCHEMA.md - Database structure
- [ ] API_ENDPOINTS.md - Complete API reference

## 💡 Best Practices

1. **Keep docs updated**: Update docs when code changes
2. **Be concise**: Focus on "why" và "how", không "what" (code đã nói)
3. **Use examples**: Code snippets, screenshots khi cần
4. **Cross-reference**: Link to related docs
5. **Version info**: Note khi docs relate to specific versions

## 🤖 For AI Assistants

**Quick start checklist:**
```
□ Read PROJECT_OVERVIEW.md first
□ Check ARCHITECTURE.md for structure
□ Look at TECH_STACK.md for technologies
□ Search fixes/ for similar issues
□ Check features/ for existing patterns
```

**When coding:**
```
□ Follow patterns in existing docs
□ Update relevant docs if making changes
□ Create new doc if adding major feature
□ Document breaking changes
```

## 📞 Maintenance

- **Owner**: Development Team
- **Last Updated**: 2025-01-19
- **Review Frequency**: Monthly or after major changes

---

**Note**: Đây là living documentation. Mọi người được khuyến khích contribute và update!
