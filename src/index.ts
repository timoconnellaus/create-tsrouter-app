#!/usr/bin/env node

import { Command, InvalidArgumentError } from "commander";
import { mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { intro, outro, spinner } from "@clack/prompts";
import { execa } from "execa";
import { render } from "ejs";

import {
  getPackageManager,
  PackageManager,
  SUPPORTED_PACKAGE_MANAGERS,
} from "./utils/getPackageManager.js";

const program = new Command();

interface Options {
  typescript: boolean;
  tailwind: boolean;
  packageManager: PackageManager;
}

async function createApp(projectName: string, options: Required<Options>) {
  const templateDir = fileURLToPath(
    new URL("../project-template", import.meta.url)
  );
  const targetDir = resolve(process.cwd(), projectName);

  async function copyFiles(files: string[]) {
    for (const file of files) {
      const targetFileName = file.replace(".tw", "");
      await copyFile(
        resolve(templateDir, file),
        resolve(targetDir, targetFileName)
      );
    }
  }

  intro(`Creating a new TanStack app in ${targetDir}...`);

  // Make the root directory
  await mkdir(targetDir, { recursive: true });

  // Setup the .vscode directory
  await mkdir(resolve(targetDir, ".vscode"), { recursive: true });
  await copyFile(
    resolve(templateDir, ".vscode/settings.json"),
    resolve(targetDir, ".vscode/settings.json")
  );

  // Fill the public directory
  await mkdir(resolve(targetDir, "public"), { recursive: true });
  copyFiles([
    "./public/robots.txt",
    "./public/favicon.ico",
    "./public/manifest.json",
    "./public/logo192.png",
    "./public/logo512.png",
  ]);

  // Make the src directory
  await mkdir(resolve(targetDir, "src"), { recursive: true });

  // Copy in Vite and Tailwind config and CSS
  if (options.tailwind) {
    await copyFiles(["./vite.config.tw.js", "./src/styles.tw.css"]);
  } else {
    await copyFiles(["./vite.config.js", "./src/styles.css", "./src/App.css"]);
  }

  copyFiles(["./src/logo.svg"]);

  // Setup the app component. There are four variations, typescript/javascript and tailwind/non-tailwind.
  let appComponent = (
    await readFile(
      resolve(
        templateDir,
        options.tailwind ? "./src/App.tw.tsx" : "./src/App.tsx"
      ),
      "utf-8"
    )
  ).toString();
  if (!options.typescript) {
    appComponent = appComponent.replace("App.tsx", "App.jsx");
  }
  await writeFile(
    resolve(targetDir, `./src/App${options.typescript ? ".tsx" : ".jsx"}`),
    appComponent
  );

  // Setup the main, reportWebVitals and index.html files
  if (options.typescript) {
    await copyFiles(["./src/main.tsx", "./src/reportWebVitals.ts"]);
    await copyFile(
      resolve(templateDir, `./index.ts.html`),
      resolve(targetDir, "./index.html")
    );
  } else {
    await copyFiles([
      "./index.html",
      "./src/main.jsx",
      "./src/reportWebVitals.js",
    ]);
  }

  // Setup tsconfig
  if (options.typescript) {
    await copyFiles(["./tsconfig.json", "./tsconfig.dev.json"]);
  }

  // Setup the package.json file, optionally with typescript and tailwind
  let packageJSON = JSON.parse(
    await readFile(resolve(templateDir, "package.json"), "utf8")
  );
  packageJSON.name = projectName;
  if (options.typescript) {
    const tsPackageJSON = JSON.parse(
      await readFile(resolve(templateDir, "package.ts.json"), "utf8")
    );
    packageJSON = {
      ...packageJSON,
      devDependencies: {
        ...packageJSON.devDependencies,
        ...tsPackageJSON.devDependencies,
      },
    };
  }
  if (options.tailwind) {
    const twPackageJSON = JSON.parse(
      await readFile(resolve(templateDir, "package.tw.json"), "utf8")
    );
    packageJSON = {
      ...packageJSON,
      dependencies: {
        ...packageJSON.dependencies,
        ...twPackageJSON.dependencies,
      },
    };
  }
  await writeFile(
    resolve(targetDir, "package.json"),
    JSON.stringify(packageJSON, null, 2)
  );

  // Add .gitignore
  await copyFile(
    resolve(templateDir, "gitignore"),
    resolve(targetDir, ".gitignore")
  );

  // Create the README.md
  const template = await readFile(
    resolve(templateDir, "README.md.ejs"),
    "utf-8"
  );
  const content = render(template, {
    packageManager: options.packageManager,
    projectName: projectName,
    typescript: options.typescript,
    tailwind: options.tailwind,
    js: options.typescript ? "ts" : "js",
    jsx: options.typescript ? "tsx" : "jsx",
  });
  await writeFile(resolve(targetDir, "README.md"), content);

  // Install dependencies
  const s = spinner();
  s.start(`Installing dependencies via ${options.packageManager}`);
  await execa(options.packageManager, ["install"], { cwd: targetDir });
  s.stop(`Installed dependencies`);

  outro(`Created your new TanStack app in ${targetDir}.`);
}

program
  .name("create-tanstack-app")
  .description("CLI to create a new TanStack application")
  .argument("<project-name>", "name of the project")
  .option<"typescript" | "javascript">(
    "--template <type>",
    "project template (typescript/javascript)",
    (value) => {
      if (value !== "typescript" && value !== "javascript") {
        throw new InvalidArgumentError(
          `Invalid template: ${value}. Only the following are allowed: typescript, javascript`
        );
      }
      return value as "typescript" | "javascript";
    },
    "javascript"
  )
  .option<PackageManager>(
    `--package-manager <${SUPPORTED_PACKAGE_MANAGERS.join("|")}>`,
    `Explicitly tell the CLI to use this package manager`,
    (value) => {
      if (!SUPPORTED_PACKAGE_MANAGERS.includes(value as PackageManager)) {
        throw new InvalidArgumentError(
          `Invalid package manager: ${value}. Only the following are allowed: ${SUPPORTED_PACKAGE_MANAGERS.join(
            ", "
          )}`
        );
      }
      return value as PackageManager;
    },
    getPackageManager()
  )
  .option("--tailwind", "add Tailwind CSS", false)
  .action(
    (
      projectName: string,
      options: {
        template: string;
        tailwind: boolean;
        packageManager: PackageManager;
      }
    ) => {
      const typescript = options.template === "typescript";

      createApp(projectName, {
        typescript,
        tailwind: options.tailwind,
        packageManager: options.packageManager,
      });
    }
  );

program.parse();
