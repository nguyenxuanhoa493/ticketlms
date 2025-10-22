# Tech Stack - TicketLMS

## 🎨 Frontend

### Framework & Core
- **Next.js 15.4.4** - React framework with App Router
  - Server Components by default
  - Client Components khi cần interactivity
  - Built-in optimizations (Image, Font, etc.)
  
- **React 19** - UI library
  - Hooks-based components
  - Server Components support
  
- **TypeScript 5.x** - Type safety
  - Strict mode enabled
  - Full type coverage cho Supabase

### Styling
- **Tailwind CSS 3.x** - Utility-first CSS
  - Custom color palette
  - Responsive design utilities
  - Dark mode support (future)

- **shadcn/ui** - Component library
  - Built on Radix UI primitives
  - Customizable với Tailwind
  - Accessible by default

### UI Components
- **Radix UI** - Headless component primitives
  - Dialog, Dropdown, Select, etc.
  - Full keyboard navigation
  - ARIA compliant

- **Lucide React** - Icon library
  - Tree-shakeable
  - Consistent design
  - Easy to customize

### Forms & Validation
- **React Hook Form** - Form state management
  - Minimal re-renders
  - Built-in validation
  
- **Zod** - Schema validation
  - TypeScript-first
  - Runtime type checking
  - Integration với React Hook Form via @hookform/resolvers

### Rich Text
- **Tiptap** - Rich text editor
  - Based on ProseMirror
  - Extensible with extensions
  - Used in ticket descriptions và comments

## 🗄️ Backend & Database

### BaaS (Backend as a Service)
- **Supabase** - Complete backend platform
  - PostgreSQL database
  - Authentication (JWT-based)
  - Row Level Security (RLS)
  - Storage (S3-compatible)
  - Real-time subscriptions (future)

### Database
- **PostgreSQL 15+** - Relational database
  - Managed by Supabase
  - JSONB support for flexible data
  - Full-text search capabilities
  - Triggers và functions

### ORM & Type Safety
- **@supabase/ssr** - Supabase client for Next.js
  - Cookie-based auth
  - Proper SSR support
  - Type-safe queries
  
- **Auto-generated Types** - From Supabase schema
  - `Database` type
  - Full IntelliSense support

## 🔐 Authentication & Security

### Auth Provider
- **Supabase Auth**
  - Email/Password authentication
  - JWT tokens
  - Refresh token rotation
  - Session management

### Session Storage
- **HTTP-only Cookies**
  - Secure by default
  - SameSite=Lax
  - Auto-managed by Supabase SSR

### Security Features
- **Row Level Security (RLS)** - Database-level
- **Middleware Protection** - Route-level
- **CSRF Protection** - Via SameSite cookies
- **SQL Injection Protection** - Parameterized queries

## 🚀 Deployment & Hosting

### Platform
- **Vercel** - Deployment platform
  - Git-based deployment
  - Auto HTTPS
  - Edge Network CDN
  - Serverless Functions
  - Environment variables

### Database & Storage
- **Supabase Cloud** - Hosted services
  - PostgreSQL database
  - Object storage
  - Auto backups
  - Global CDN

## 📦 Package Management

- **npm** - Package manager
  - `package-lock.json` for lock file
  - Scripts: dev, build, start, lint

## 🛠️ Development Tools

### Code Quality
- **ESLint 9.x** - Linting
  - Next.js recommended config
  - TypeScript rules
  - Custom rules

- **TypeScript Compiler**
  - Strict mode
  - Path aliases (@/)
  - Incremental builds

### API Testing
- **Custom API Runner** - Internal tool
  - Test API endpoints
  - Save request templates
  - Environment switching

### Database Tools
- **Supabase CLI** - Database management
  - Migrations
  - Type generation
  - Local development

## 📊 Monitoring & Analytics

### Current
- **Vercel Analytics** (optional) - Basic analytics
- **Browser Console** - Development logging

### Future
- **Sentry** - Error tracking
- **PostHog** - Product analytics
- **Uptime Monitoring** - Service health

## 🔌 Integrations

### External Services
- **Jira API** - Issue tracking integration
  - REST API v3
  - Webhook support (future)
  - OAuth or API token auth

### APIs
- **RESTful APIs** - Internal API routes
  - `/api/tickets` - Ticket CRUD
  - `/api/users` - User management
  - `/api/tools/*` - Developer tools

## 📱 Browser Support

### Supported Browsers
- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

### Mobile Support
- Responsive design
- Touch-friendly interfaces
- Mobile-optimized layouts

## 🎨 Design System

### Components
- **shadcn/ui components** - Base components
- **Custom components** - Project-specific
- **Consistent patterns** - Reusable across app

### Colors
- Primary: Blue tones
- Success: Green
- Warning: Yellow/Orange
- Error: Red
- Gray scale for UI elements

### Typography
- **System fonts** - Native font stack
- Responsive font sizes
- Consistent hierarchy

## 📦 Key Dependencies

```json
{
  "dependencies": {
    "next": "15.4.4",
    "react": "19.x",
    "react-dom": "19.x",
    "@supabase/ssr": "^0.x",
    "@supabase/supabase-js": "^2.x",
    "tailwindcss": "^3.x",
    "@radix-ui/*": "Latest",
    "lucide-react": "Latest",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "@tiptap/react": "^2.x"
  }
}
```

## 🔄 State Management

### Server State
- **Supabase Client** - Data fetching
- **React Server Components** - Server-side data
- **No external state library needed** - Data fetched on server

### Client State
- **React useState** - Local component state
- **React Context** - Shared state (minimal use)
- **URL Search Params** - Filter/pagination state

### Form State
- **React Hook Form** - Form state management
- **Controlled components** - For complex inputs

## 🧪 Testing (Future)

### Unit Testing
- **Jest** - Test runner
- **React Testing Library** - Component testing

### E2E Testing
- **Playwright** - End-to-end tests
- **Cypress** - Alternative option

### API Testing
- **Postman/Bruno** - Manual testing
- **Custom API Runner** - Internal tool

## 📝 Documentation Tools

### Code Documentation
- **JSDoc comments** - Inline documentation
- **TypeScript types** - Self-documenting
- **README files** - Per-module docs

### Project Documentation
- **Markdown files** - In `docs-ai/`
- **Inline comments** - For complex logic
- **Type definitions** - As documentation

## 🎯 Performance

### Optimization
- **Image Optimization** - Next.js Image component
- **Code Splitting** - Automatic by Next.js
- **Tree Shaking** - Remove unused code
- **Static Generation** - Where possible

### Caching
- **Vercel Edge Cache** - CDN caching
- **Browser Cache** - Static assets
- **Database Indexes** - Query optimization

## 🔮 Future Considerations

### Potential Additions
- [ ] **tRPC** - Type-safe API calls
- [ ] **Tanstack Query** - Better data fetching
- [ ] **Zustand** - If need complex state
- [ ] **Prisma** - If move away from Supabase
- [ ] **WebSockets** - Real-time features
- [ ] **Service Worker** - Offline support

### Performance Improvements
- [ ] **React Server Actions** - Form handling
- [ ] **Partial Prerendering** - Hybrid rendering
- [ ] **Suspense Boundaries** - Better loading states
- [ ] **Incremental Static Regeneration** - Cached pages

---

**Last Updated**: 2025-01-19
**Tech Stack Version**: 1.0
