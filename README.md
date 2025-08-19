# Stratamu Monorepo

Stratamu is the ultimate online text-based game engine, designed to support MUD, MUSH, MUCK, and MOO game types. This monorepo provides a modular, extensible foundation for building multiplayer worlds, with a core engine and a collection of interfaces and plugins for customization.

## Project Vision

Stratamu aims to unify the common functionality of classic multiplayer text games, while allowing for easy extension and specialization. The core engine provides:
- User/session management
- World and object modeling
- Command parsing and execution
- Permissions and roles
- Messaging and communication
- Persistence and event systems

Interfaces define the requirements for each game type (MUD, MUSH, etc.), and plugins enable features like database access or external integrations.

## Monorepo Structure

- `packages/core-engine`: Main game logic and state management engine.
- `packages/constants`: Shared constants and types for the project.
- `packages/interfaces`: TypeScript interfaces for MUD, MUSH, MUCK, and MOO game types.
- `packages/plugins`: Plugins for database access and external integrations.

## Getting Started

1. **Install dependencies:**
	```sh
	bun install
	```
2. **Build all packages:**
	```sh
	bun run build:packages
	```
3. **Start development server for core-engine:**
	```sh
	bun run dev
	```

## TypeScript Configuration

All packages inherit shared configuration from the root `tsconfig.json` and related files. Project references ensure type safety and fast builds across the monorepo.

## Extending Stratamu

- Implement interfaces in `packages/interfaces` to support new game types.
- Add plugins in `packages/plugins` for database or external service integration.

## Scripts

See each package's `package.json` for available scripts for building, testing, and development.

## License

MIT