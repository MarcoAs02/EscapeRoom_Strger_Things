# Overview

This is a Stranger Things-themed escape room browser game called "Escape The Upside Down." Players progress through 5 levels of increasing difficulty, each with unique gameplay mechanics ranging from puzzle-solving to arcade-style games. The game features time-based challenges, a scoring system, and thematic elements from the Stranger Things universe.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**Rationale**: React provides a component-based architecture ideal for managing complex game states and UI interactions. TypeScript adds type safety for game logic. Vite offers fast HMR (Hot Module Replacement) for rapid development.

**UI Components**: The project uses Radix UI primitives for accessible, unstyled components combined with Tailwind CSS for styling.

**Rationale**: Radix UI provides robust, accessible component primitives that can be styled with Tailwind, allowing for rapid UI development while maintaining accessibility standards.

**3D Graphics**: React Three Fiber (@react-three/fiber) with supporting libraries (drei, postprocessing) for WebGL-based 3D rendering.

**Rationale**: Enables sophisticated 3D visualizations and effects within the React ecosystem, useful for immersive game elements.

**Animations**: Framer Motion for declarative animations and transitions.

**Rationale**: Provides smooth, performant animations with a simple API that integrates well with React components.

**State Management**: Zustand for global state with middleware support.

**Rationale**: Lightweight alternative to Redux with a simpler API. The `subscribeWithSelector` middleware enables fine-grained reactivity for game state changes.

**Client Routing**: Single-page application without explicit routing library; phase-based rendering handles navigation.

**Rationale**: The game uses a state machine approach (menu → playing → jumpscare → retry/victory) rather than URL-based navigation, simplifying the architecture for a game context.

## Backend Architecture

**Server Framework**: Express.js running on Node.js with TypeScript.

**Rationale**: Express provides a minimal, flexible framework for building the API layer. Currently, the backend serves as a static file server and API placeholder, allowing for future expansion.

**Development Mode**: In development, Vite's middleware mode is used to serve the frontend with HMR support, integrated directly into the Express server.

**Rationale**: This eliminates the need for separate frontend and backend servers during development, simplifying the developer experience.

**Production Build**: Client is built to static files and served via Express static middleware.

**Rationale**: Simple deployment model where a single Node process serves both API and static assets.

**Logging**: Custom request logging middleware captures API calls with timing and response data.

**Rationale**: Provides visibility into backend operations without heavy dependencies like Winston or Morgan.

## Data Storage

**ORM**: Drizzle ORM configured for PostgreSQL with schema definitions in TypeScript.

**Rationale**: Type-safe database queries with a lightweight footprint. Drizzle generates SQL that's easy to understand and optimize.

**Database**: Configured for PostgreSQL via Neon Database serverless driver (@neondatabase/serverless).

**Rationale**: Serverless PostgreSQL allows for edge deployment and automatic scaling without managing database infrastructure.

**Schema Location**: Shared schema definitions in `/shared/schema.ts` accessible to both client and server.

**Rationale**: Sharing types between frontend and backend eliminates duplication and ensures consistency in data structures.

**In-Memory Fallback**: A MemStorage class implements the storage interface for development without requiring database setup.

**Rationale**: Enables rapid prototyping and testing without database dependencies. Easily swappable with actual database implementation.

**Current Schema**: Basic user table with username and password fields. The storage interface is designed to be extended with game-specific tables (high scores, progress tracking, etc.).

## External Dependencies

**Neon Database**: Serverless PostgreSQL database provider.

**Purpose**: Persistent data storage for user accounts and potentially game state/leaderboards.

**TailwindCSS**: Utility-first CSS framework with PostCSS processing.

**Purpose**: Rapid styling with design tokens defined in the theme configuration. Custom theme includes Stranger Things-inspired color palette (reds, purples, dark backgrounds).

**Radix UI Components**: Comprehensive set of accessible component primitives.

**Purpose**: Provides foundational UI components (dialogs, tooltips, dropdowns, etc.) without imposing visual styles.

**Fontsource**: Self-hosted font delivery for Inter font family.

**Purpose**: Ensures consistent typography without relying on external CDNs. The game also uses Courier New for retro/terminal aesthetics.

**React Query (@tanstack/react-query)**: Data synchronization library for API calls.

**Purpose**: Manages server state, caching, and request deduplication for any future API integrations.

**Framer Motion**: Animation library for React.

**Purpose**: Powers game transitions, UI animations, particle effects, and screen transitions.

**React Three Fiber Ecosystem**: WebGL rendering in React.

**Purpose**: Enables 3D graphics capabilities, though currently not heavily utilized in the visible codebase. Configured for potential 3D enhancements.

**GLSL Shader Support**: Via vite-plugin-glsl.

**Purpose**: Allows importing shader files for custom WebGL effects.

**Audio Files**: Support for MP3, OGG, WAV formats.

**Purpose**: Background music, sound effects (hit sounds, success sounds, jump scares) enhance the atmospheric experience.

**Asset Pipeline**: Vite configured to handle GLTF/GLB 3D models and various audio formats.

**Purpose**: Supports rich media assets for immersive gameplay.

## Game Architecture

**State Machine**: The game uses a phase-based state machine (menu, playing, jumpscare, retry, victory) managed via Zustand store.

**Rationale**: Clear separation of game states prevents invalid transitions and simplifies UI rendering logic.

**Level System**: Five distinct levels with unique mechanics (Christmas lights puzzle, memory cards, trivia, Pac-Man clone, Space Invaders clone).

**Rationale**: Variety keeps players engaged. Each level introduces different interaction patterns and difficulty curves.

**Timer System**: Global countdown timer with pause/resume capabilities and level-specific time limits.

**Rationale**: Creates urgency and replayability. Time pressure increases difficulty and encourages optimization.

**Scoring System**: Point-based rewards for successful actions, with penalties for mistakes.

**Rationale**: Provides feedback and enables leaderboard functionality if implemented in the future.

**Audio Management**: Centralized audio state with mute toggle and separate playback for background music and sound effects.

**Rationale**: Gives players control over audio while maintaining consistent sound design. Prevents audio overlap issues.