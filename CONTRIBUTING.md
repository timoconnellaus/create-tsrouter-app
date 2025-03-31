# Contributing

- Clone the repo
  - `gh repo clone TanStack/create-tsrouter-app`
- Ensure `node` is installed
  - https://nodejs.org/en/
- Ensure `pnpm` is installed
  - https://pnpm.io/installation
  - Why? We use `pnpm` to manage workspace dependencies. It's easily the best monorepo/workspace experience available as of when this was written.
- Install dependencies
  - `pnpm install`
  - This installs dependencies for all of the packages in the monorepo, even examples!
  - Dependencies inside of the packages and examples are automatically linked together as local/dynamic dependencies.
- Run the build
  - `pnpm build`
- Build an example app with the builder. This is actually a little trick because if you build an app in the monorepo it will inherit the monorepo setup and won't work. So you need to have a temporary directory outside of the monorepo to create apps. An example test command command is below. The `-C` flag is used to the working directory of PNPM to the root of the CLI code, and the `--target-dir` flag is used to specify to the CLI the directory to create the app in.
  - `pnpm -C [root of the monorepo]/cli/create-tsrouter-app start --target-dir [temporary directory path]/app-js app-js`
- Since you will probably be working on `./packages/cta-engine` a lot, you can run the following command to start the CLI in watch mode. After you have built the code at the root with `pnpm build`, you can run the following command to start the CLI in watch mode.
  - `cd ./packages/cta-engine && pnpm dev`
- Run the `app-js` app just to make sure it works
- Make changes to the code
  - Re-run `pnpm build` and `pnpm start` (in all its configurations) to make sure the changes work
- Check your work and PR

# Testing combinations

These must all product running applications that can be built (`pnpm build`) and tested (`pnpm test`).

| Command                                                  | Description                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------------ |
| `pnpm start app-js`                                      | Creates a JavaScript app                                           |
| `pnpm start app-ts --template typescript`                | Creates a TypeScript app                                           |
| `pnpm start app-js-tw --tailwind`                        | Creates a JavaScript app with Tailwind CSS                         |
| `pnpm start app-ts-tw --template typescript --tailwind`  | Creates a TypeScript app with Tailwind CSS                         |
| `pnpm start app-fr --template file-router`               | Creates a TypeScript app with File Based Routing                   |
| `pnpm start app-fr-tw --template file-router --tailwind` | Creates a TypeScript app with File Based Routing with Tailwind CSS |
