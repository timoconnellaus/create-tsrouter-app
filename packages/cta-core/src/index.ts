export { finalizeAddOns, getAllAddOns, loadRemoteAddOn } from './add-ons.js'
export {
  createMemoryEnvironment,
  createDefaultEnvironment,
} from './environment.js'
export { CODE_ROUTER, CONFIG_FILE, FILE_ROUTER } from './constants.js'
export {
  DEFAULT_PACKAGE_MANAGER,
  SUPPORTED_PACKAGE_MANAGERS,
  getPackageManager,
  getPackageManagerInstallCommand,
  getPackageManagerExecuteCommand,
  getPackageManagerScriptCommand,
  packageManagerInstall,
  packageManagerExecute,
} from './package-manager.js'
export {
  registerFramework,
  getFrameworkById,
  getFrameworkByName,
  getFrameworks,
} from './frameworks.js'
export { formatCommand, jsSafeName, sortObject } from './utils.js'
export { writeConfigFile, readConfigFile } from './config-file.js'
export { readFileHelper, getBinaryFile, relativePath } from './file-helpers.js'

export type {
  AddOn,
  Environment,
  FileBundleHandler,
  FrameworkDefinition,
  Mode,
  Options,
  Starter,
  TemplateOptions,
  Variable,
} from './types.js'
export type { PersistedOptions } from './config-file.js'
export type { PackageManager } from './package-manager.js'
