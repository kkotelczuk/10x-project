# Technology Stack & Implementation Guidelines

## 1. Frontend Core

- **Framework**: Astro 5
  - **Approach**: Server Islands / Hybrid rendering
  - **Routing**: File-based routing (Astro standard)
- **Interactive UI**: React 19
  - **State Management**: React Hooks, Nano Stores (for cross-component state if needed)
  - **Language**: TypeScript 5
    - Strict mode enabled
    - Explicit return types preferred

## 2. UI & Styling

- **Styling Engine**: Tailwind CSS 4
  - **Configuration**: Native CSS configuration (no `tailwind.config.js` if possible, utilizing v4 features)
- **Component Library**: shadcn/ui
  - **Icon Set**: Lucide React
- **Conventions**:
  - **Mobile-first responsive design**
  - **Dark mode support** (system/user toggle)

## 3. Backend & Services (BaaS)

- **Platform**: Supabase
- **Database**: PostgreSQL
  - **Security**: Row Level Security (RLS) enabled for all tables
- **Authentication**: Supabase Auth
  - Methods: Email/Password, Google OAuth
- **API Communication**:
  - Supabase JS Client for client-side interactions (where safe)
  - Astro API Endpoints for sensitive operations (AI proxying)

## 4. AI Integration

- **Provider**: OpenRouter.ai
- **Implementation**:
  - Server-side calls only (via Astro Endpoints/Server Actions) to protect API keys.
  - Streaming responses to frontend where applicable.

## 5. Infrastructure & DevOps

- **Hosting**: DigitalOcean (Droplet)
- **Containerization**: Docker
- **CI/CD**: GitHub Actions
  - Build & Push Docker image
  - Deploy to DigitalOcean

## 6. Testing

- **Unit & Integration**: Vitest
  - **Component Testing**: React Testing Library
  - **Scope**: Services, Hooks, Utilities, Component logic
- **End-to-End (E2E)**: Playwright
  - **Scope**: Critical user flows (Auth, Onboarding, Recipe Generation)
- **Quality Assurance**:
  - **AI Verification**: Structured JSON validation + Manual review
  - **Lighthouse**: Performance and Accessibility checks

## 7. Coding Standards for AI

When generating code, adhere to the following:

- **Component Structure**: Functional components with strict typing.
- **Imports**: Use absolute imports or aliased paths (e.g., `@/components`, `@/lib`) if configured.
- **Error Handling**: Graceful degradation, try-catch blocks in async operations, user-friendly toast notifications for errors.
- **Performance**: Use Astro's `client:*` directives judiciously (e.g., `client:load`, `client:idle`) only when interactivity is required.
