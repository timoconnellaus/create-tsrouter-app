export { createApp } from './create-app.js'
export { addToApp } from './add-to-app.js'

export { finalizeAddOns, getAllAddOns } from './add-ons.js'

export { loadRemoteAddOn } from './custom-add-ons/add-on.js'
export { loadStarter } from './custom-add-ons/starter.js'

export {
  createMemoryEnvironment,
  createDefaultEnvironment,
} from './environment.js'

export { CODE_ROUTER, CONFIG_FILE, FILE_ROUTER } from './constants.js'

export {
  DEFAULT_PACKAGE_MANAGER,
  SUPPORTED_PACKAGE_MANAGERS,
  getPackageManager,
} from './package-manager.js'

export {
  registerFramework,
  getFrameworkById,
  getFrameworkByName,
  getFrameworks,
} from './frameworks.js'

export { writeConfigFile, readConfigFile } from './config-file.js'

export { readFileHelper, getBinaryFile, relativePath } from './file-helpers.js'

export { formatCommand } from './utils.js'

export { initStarter, compileStarter } from './custom-add-ons/starter.js'
export { initAddOn, compileAddOn } from './custom-add-ons/add-on.js'
export {
  createAppOptionsFromPersisted,
  recursivelyGatherFiles,
} from './custom-add-ons/shared.js'

export type {
  AddOn,
  Environment,
  FileBundleHandler,
  Framework,
  FrameworkDefinition,
  Mode,
  Options,
  SerializedOptions,
  StarterCompiled,
} from './types.js'
export type { PersistedOptions } from './config-file.js'
export type { PackageManager } from './package-manager.js'
