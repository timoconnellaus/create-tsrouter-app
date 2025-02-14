#!/usr/bin/env node

import { Command } from "commander";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { intro, outro, spinner } from "@clack/prompts";
import { execa } from "execa";

const program = new Command();

interface Options {
  typescript: boolean;
  tailwind: boolean;
}

async function createApp(projectName: string, options: Required<Options>) {
  const templateDir = fileURLToPath(
    new URL("../project-template", import.meta.url)
  );
  const targetDir = path.join(process.cwd(), projectName);

  async function copyFiles(files: string[]) {
    for (const file of files) {
      const targetFileName = file.replace(".tw", "");
      await fs.copyFile(
        path.join(templateDir, file),
        path.join(targetDir, targetFileName)
      );
    }
  }

  intro(`Creating a new TanStack app in ${targetDir}...`);

  // Make the root directory
  await fs.mkdir(targetDir, { recursive: true });

  // Setup the .vscode directory
  await fs.mkdir(path.join(targetDir, ".vscode"), { recursive: true });
  await fs.copyFile(
    path.join(templateDir, ".vscode/settings.json"),
    path.join(targetDir, ".vscode/settings.json")
  );

  // Fill the public directory
  await fs.mkdir(path.join(targetDir, "public"), { recursive: true });
  copyFiles([
    "./public/robots.txt",
    "./public/favicon.ico",
    "./public/manifest.json",
    "./public/logo192.png",
    "./public/logo512.png",
  ]);

  // Make the src directory
  await fs.mkdir(path.join(targetDir, "src"), { recursive: true });

  // Copy in Vite and Tailwind config and CSS
  if (options.tailwind) {
    await copyFiles(["./vite.config.tw.js", "./src/styles.tw.css"]);
  } else {
    await copyFiles(["./vite.config.js", "./src/styles.css", "./src/App.css"]);
  }

  copyFiles(["./src/logo.svg"]);

  // Setup the app component. There are four variations, typescript/javascript and tailwind/non-tailwind.
  let appComponent = (
    await fs.readFile(
      path.join(
        templateDir,
        options.tailwind ? "./src/App.tw.tsx" : "./src/App.tsx"
      ),
      "utf-8"
    )
  ).toString();
  if (!options.typescript) {
    appComponent = appComponent.replace("App.tsx", "App.jsx");
  }
  await fs.writeFile(
    path.join(targetDir, `./src/App${options.typescript ? ".tsx" : ".jsx"}`),
    appComponent
  );

  // Setup the main, reportWebVitals and index.html files
  if (options.typescript) {
    await copyFiles(["./src/main.tsx", "./src/reportWebVitals.ts"]);
    await fs.copyFile(
      path.join(templateDir, `./index.ts.html`),
      path.join(targetDir, "./index.html")
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
    await fs.readFile(path.join(templateDir, "package.json"), "utf8")
  );
  packageJSON.name = projectName;
  if (options.typescript) {
    const tsPackageJSON = JSON.parse(
      await fs.readFile(path.join(templateDir, "package.ts.json"), "utf8")
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
      await fs.readFile(path.join(templateDir, "package.tw.json"), "utf8")
    );
    packageJSON = {
      ...packageJSON,
      dependencies: {
        ...packageJSON.dependencies,
        ...twPackageJSON.dependencies,
      },
    };
  }
  await fs.writeFile(
    path.join(targetDir, "package.json"),
    JSON.stringify(packageJSON, null, 2)
  );

  // Add .gitignore and README.md
  await fs.copyFile(
    path.join(templateDir, "gitignore"),
    path.join(targetDir, ".gitignore")
  );
  await fs.copyFile(
    path.join(templateDir, "README.md"),
    path.join(targetDir, "README.md")
  );

  // Install dependencies
  const s = spinner();
  s.start("Installing dependencies via npm");
  await execa("npm", ["install"], { cwd: targetDir });
  s.stop("Installed dependencies");

  outro(`Created your new TanStack app in ${targetDir}.`);
}

program
  .name("create-tanstack-app")
  .description("CLI to create a new TanStack application")
  .argument("<project-name>", "name of the project")
  .option(
    "--template <type>",
    "project template (typescript/javascript)",
    "javascript"
  )
  .option("--tailwind", "add Tailwind CSS", false)
  .action(
    (
      projectName: string,
      options: {
        template: string;
        tailwind: boolean;
      }
    ) => {
      const typescript = options.template === "typescript";

      createApp(projectName, {
        typescript,
        tailwind: options.tailwind,
      });
    }
  );

program.parse();
