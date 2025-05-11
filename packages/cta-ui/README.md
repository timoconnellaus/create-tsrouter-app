# Create TanStack App - User Interface

This is an odd package because it's both a library that runs a web server, as well as a React SPA app that builds using Vite.

## Script Commands

| Command              | Description                                    |
| -------------------- | ---------------------------------------------- |
| `pnpm build`         | Builds **both** the library and the React app  |
| `pnpm build:ui`      | Builds the React app only                      |
| `pnpm build:lib`     | Builds just the `lib` directory                |
| `pnpm dev:ui`        | Uses Vite to run the React app in dev mode     |
| `pnpm dev`           | Builds the `lib` directory in watch mode       |
| `pnpm test`          | Runs the tests                                 |
| `pnpm test:watch`    | Runs the tests in watch mode                   |
| `pnpm test:coverage` | Runs the tests and generates a coverage report |

## Dev vs Prod Mode

The only difference between dev and prod mode (outside of the usual minification and tree-shaking that goes into prod builds) is that in development mode the `src/lib/api.ts` uses a base URL of `http://localhost:8080` to point at the CLI running in API mode.
