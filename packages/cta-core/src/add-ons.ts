import type { AddOn, Framework } from './types.js'

export function getAllAddOns(
  framework: Framework,
  template: string,
): Array<AddOn> {
  return framework.getAddOns().filter((a) => a.templates.includes(template))
}

// Turn the list of chosen add-on IDs into a final list of add-ons by resolving dependencies
export async function finalizeAddOns(
  framework: Framework,
  template: string,
  chosenAddOnIDs: Array<string>,
): Promise<Array<AddOn>> {
  const finalAddOnIDs = new Set(chosenAddOnIDs)

  const addOns = getAllAddOns(framework, template)

  for (const addOnID of finalAddOnIDs) {
    let addOn: AddOn | undefined
    const localAddOn = addOns.find((a) => a.id === addOnID)
    if (localAddOn) {
      addOn = loadAddOn(localAddOn)
    } else if (addOnID.startsWith('http')) {
      addOn = await loadRemoteAddOn(addOnID)
      addOns.push(addOn)
    } else {
      throw new Error(`Add-on ${addOnID} not found`)
    }

    for (const dependsOn of addOn.dependsOn || []) {
      const dep = addOns.find((a) => a.id === dependsOn)
      if (!dep) {
        throw new Error(`Dependency ${dependsOn} not found`)
      }
      finalAddOnIDs.add(dep.id)
    }
  }

  const finalAddOns = [...finalAddOnIDs].map(
    (id) => addOns.find((a) => a.id === id)!,
  )

  return finalAddOns
}

function loadAddOn(addOn: AddOn): AddOn {
  return addOn
}

export async function loadRemoteAddOn(url: string): Promise<AddOn> {
  const response = await fetch(url)
  const fileContent = await response.json()
  fileContent.id = url
  return {
    ...fileContent,
    getFiles: () => Promise.resolve(Object.keys(fileContent.files)),
    getFileContents: (path: string) => Promise.resolve(fileContent.files[path]),
  }
}
