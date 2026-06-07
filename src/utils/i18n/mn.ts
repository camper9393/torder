/** @deprecated Use getMessages('mn') or useLocale().t */
import { getMessages } from "./catalog"

export const mn = getMessages("mn")

export function sectionDescriptionMn(section: string): string {
  return getMessages("mn").sectionDescription(section)
}
