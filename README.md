# Create React App for TanStack Router

This CLI applications builds Tanstack Start applications that are the functional equivalent of [Create React App](https://create-react-app.dev/).

# Development

```bash
pnpm i
pnpm build
```

# Manual testing

| Command                                                 | Description                                |
| ------------------------------------------------------- | ------------------------------------------ |
| `pnpm start app-js`                                     | Creates a JavaScript app                   |
| `pnpm start app-ts --template typescript`               | Creates a TypeScript app                   |
| `pnpm start app-js-tw --tailwind`                       | Creates a JavaScript app with Tailwind CSS |
| `pnpm start app-ts-tw --template typescript --tailwind` | Creates a TypeScript app with Tailwind CSS |

There is also `--package-manager pnpm` that will use [pnpm](https://pnpm.io/) as the package manager (this supports `yarn`, `bun`, and `npm` as well).
