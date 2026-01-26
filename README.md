# HealthyMeal

**HealthyMeal** is an AI-powered MVP web application designed to solve the problem of adapting cooking recipes to individual dietary needs. It allows users to input any recipe and uses a Large Language Model (LLM) to modify ingredients and instructions based on the user's dietary profile (e.g., allergies, Keto/Vegan diets, or specific product dislikes). GHA test

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Testing Strategy](#testing-strategy)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

Adapting online recipes to specific health requirements is often time-consuming and risky, especially when dealing with severe allergies. HealthyMeal streamlines this process by serving as an intelligent culinary assistant.

### Key Features

- **Personalized Onboarding**: Users define their main diet (e.g., Vegetarian, Keto), strict allergens (e.g., Nuts, Lactose), and disliked products.
- **AI Recipe Modification**: Users can paste text from any recipe (up to 1000 chars), and the system validates, modifies, and restructures it to be safe and compliant with their profile.
- **Dashboard & Library**: A centralized place to manage, search, and filter saved recipes.
- **Security & Limits**: Includes authentication (Email/Google), daily modification limits, and medical disclaimers.

## Tech Stack

This project is built using modern web technologies, focusing on performance and type safety.

| Category           | Technology         | Description                                                            |
| ------------------ | ------------------ | ---------------------------------------------------------------------- |
| **Core Framework** | **Astro 5**        | Utilizing Server Islands and Hybrid rendering for optimal performance. |
| **Interactive UI** | **React 19**       | Used for complex interactive components (Dashboard, Wizards).          |
| **Language**       | **TypeScript 5**   | Strict typing enabled for reliability.                                 |
| **Styling**        | **Tailwind CSS 4** | Next-gen CSS engine with native configuration.                         |
| **Components**     | **Shadcn/ui**      | Accessible component primitives with Lucide React icons.               |
| **Backend / BaaS** | **Supabase**       | PostgreSQL database, Authentication, and Row Level Security (RLS).     |
| **AI Integration** | **OpenRouter.ai**  | Server-side LLM integration via Astro Endpoints.                       |
| **Infrastructure** | **Docker**         | Containerized deployment targeting DigitalOcean.                       |
| **Testing**        | **Vitest**         | Unit and Integration testing for logic and components.                 |
| **E2E Testing**    | **Playwright**     | End-to-End testing for critical user flows (Auth, Onboarding, Gen).    |

## Getting Started Locally

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

- **Node.js**: Version `22.14.0` (as specified in `.nvmrc`).
- **npm** or **pnpm**.

### Installation

1. **Clone this the repository**

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory. You will need credentials for Supabase and OpenRouter.

   ```bash
   # Example .env structure
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

   The app should now be running on `http://localhost:3000`.

## Available Scripts

These scripts are defined in `package.json` for development and maintenance.

| Script     | Command              | Description                                   |
| ---------- | -------------------- | --------------------------------------------- |
| `dev`      | `astro dev`          | Starts the local development server.          |
| `build`    | `astro build`        | Builds the production-ready site.             |
| `preview`  | `astro preview`      | Previews the built application locally.       |
| `lint`     | `eslint .`           | Runs ESLint to check for code quality issues. |
| `lint:fix` | `eslint . --fix`     | Automatically fixes fixable linting errors.   |
| `format`   | `prettier --write .` | Formats code using Prettier.                  |

## Testing Strategy

We employ a comprehensive testing strategy to ensure reliability and safety.

### Unit & Integration Tests (Vitest)
- **Unit Tests**: Focus on isolated business logic in `src/lib/services` (e.g., allergen filtering, diet matching) and custom hooks.
- **Integration Tests**: Verify the interaction between Astro API endpoints and Supabase, as well as React form flows.

### End-to-End Tests (Playwright)
- Cover critical user journeys:
  - User Registration & Onboarding.
  - Recipe Generation flow.
  - Authentication handling.

### AI Verification
- Automated checks for JSON structure validity from AI responses.
- Manual review processes for recipe quality and safety.

## Project Scope

### In Scope (MVP)

- **Responsive Web App (PWA/RWD)**: Optimized for mobile and desktop.
- **Language**: Polish language interface and content generation.
- **Recipe Management**: Create (via AI), Read, Update (Re-generate), Delete.
- **Logic**: Intelligent substitution of ingredients while maintaining culinary logic.

### Out of Scope

- Scraping recipes directly from URLs.
- Image recognition for recipes.
- Generating shopping lists.
- Native mobile applications (iOS/Android).
- Social sharing features.

## Project Status

🚧 **MVP Development**

This project is currently in the Minimum Viable Product (MVP) phase. Core functionalities regarding authentication and AI recipe generation are being implemented.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
