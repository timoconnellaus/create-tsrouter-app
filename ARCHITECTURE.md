## Nomenclature

- `cta` - Create Tanstack Application
- CTA Framework - A framework that supports the creation of a TanStack Application using a specific technology (e.g. React, Solid, Vue, etc.)
- `code-router` - One of two _modes_ of TanStack Application. The other is `file-router`. The code router is when the applications routes are defined in code.
- `file-router` - One of two _modes_ of TanStack Application. The other is `code-router`. The file router is when the applications routes are defined in files (usually in the `src/routes` directory).
- `add-on` - A plugin that extends the capabilities of a TanStack Application (e.g. the `tanstack-query` add-on integrates TanStack Query into the application).
- custom `add-on` - An externalized `add-on` contained in a single JSON file that can integate technologies that aren't covered with the built-in add-ons.
- `starter` - An application template that is constructed from an existing CTA created application that has been modified to the customers needs. The advantage of a starter over a cloneable git repo is that when a starter is used the add-ons and project will be created using the latest version of the CTA framework and the add-ons. This reduces the versioning burden on the customer. This does come with a risk of potential breaking changes.

## CLI applications

- `create-tanstack` - The CLI application for creating a TanStack Application.
- `create-start-app` - The CLI application for creating a TanStack Start Application.
- `create-tsrouter-app` - The CLI application for creating a TanStack Router Application.

## Packages

- `@tanstack/cta-cli` - The command line interface for TanStack CTA.
- `@tanstack/cta-engine` - The core engine that powers TanStack CTA.
- `@tanstack/cta-ui` - The UI components for TanStack CTA.

## Frameworks

- `@tanstack/cta-frameworks-react-cra` - The React (Create React App) framework for TanStack CTA.
- `@tanstack/cta-frameworks-solid` - The Solid framework for TanStack CTA.
