# Create React App for TanStack Router

This CLI applications builds Tanstack Start applications that are the functional equivalent of [Create React App](https://create-react-app.dev/).

# Development

```bash
pnpm i
```

# Manual testing

| Command                                            | Description                                |
| -------------------------------------------------- | ------------------------------------------ |
| `npx . app-js`                                     | Creates a JavaScript app                   |
| `npx . app-ts --template typescript`               | Creates a TypeScript app                   |
| `npx . app-js-tw --tailwind`                       | Creates a JavaScript app with Tailwind CSS |
| `npx . app-ts-tw --template typescript --tailwind` | Creates a TypeScript app with Tailwind CSS |

You can also add `--tailwind` to the command to automatically add Tailwind CSS to the app.

There is also `--package-manager pnpm` that will use [pnpm](https://pnpm.io/) as the package manager (this supports `yarn`, `bun`, and `npm` as well).
