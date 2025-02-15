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

const createCopyFile = (templateDir: string, targetDir: string) =>
  async function copyFiles(files: string[]) {
    for (const file of files) {
      const targetFileName = file.replace(".tw", "");
      await copyFile(
        resolve(templateDir, file),
        resolve(targetDir, targetFileName)
      );
    }
  };

const createTemplateFile = (
  projectName: string,
  options: Required<Options>,
  templateDir: string,
  targetDir: string
) =>
  async function templateFile(file: string, targetFileName?: string) {
    const templateValues = {
      packageManager: options.packageManager,
      projectName: projectName,
      typescript: options.typescript,
      tailwind: options.tailwind,
      js: options.typescript ? "ts" : "js",
      jsx: options.typescript ? "tsx" : "jsx",
    };

    const template = await readFile(resolve(templateDir, file), "utf-8");
    const content = render(template, templateValues);
    const target = targetFileName ?? file.replace(".ejs", "");
    await writeFile(resolve(targetDir, target), content);
  };

async function createPackageJSON(
  projectName: string,
  options: Required<Options>,
  templateDir: string,
  targetDir: string
) {
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
}

async function createApp(projectName: string, options: Required<Options>) {
  const templateDir = fileURLToPath(
    new URL("../project-template", import.meta.url)
  );
  const targetDir = resolve(process.cwd(), projectName);

  const copyFiles = createCopyFile(templateDir, targetDir);
  const templateFile = createTemplateFile(
    projectName,
    options,
    templateDir,
    targetDir
  );

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
  if (!options.tailwind) {
    await copyFiles(["./src/App.css"]);
  }
  await templateFile("./vite.config.js.ejs");
  await templateFile("./src/styles.css.ejs");

  copyFiles(["./src/logo.svg"]);

  // Setup the app component. There are four variations, typescript/javascript and tailwind/non-tailwind.
  await templateFile(
    "./src/App.tsx.ejs",
    options.typescript ? undefined : "./src/App.jsx"
  );
  await templateFile(
    "./src/App.test.tsx.ejs",
    options.typescript ? undefined : "./src/App.test.jsx"
  );

  // Setup the main, reportWebVitals and index.html files
  if (options.typescript) {
    await templateFile("./src/main.tsx.ejs");
    await templateFile("./src/reportWebVitals.ts.ejs");
  } else {
    await templateFile("./src/main.tsx.ejs", "./src/main.jsx");
    await templateFile(
      "./src/reportWebVitals.ts.ejs",
      "./src/reportWebVitals.js"
    );
  }
  await templateFile("./index.html.ejs");

  // Setup tsconfig
  if (options.typescript) {
    await copyFiles(["./tsconfig.json", "./tsconfig.dev.json"]);
  }

  // Setup the package.json file, optionally with typescript and tailwind
  await createPackageJSON(projectName, options, templateDir, targetDir);

  // Add .gitignore
  await copyFile(
    resolve(templateDir, "gitignore"),
    resolve(targetDir, ".gitignore")
  );

  // Create the README.md
  await templateFile("README.md.ejs");

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
