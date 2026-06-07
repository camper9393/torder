/**

 * UI-only table name labels. Does not change DB or QR link values.

 * Shows the exact stored tableName (no Table → Ширээ translation).

 */

export function formatAdminTableDisplayName(

  tableName: string,

  _tableLabel?: string

): string {

  return tableName.trim()

}



/** Floor layout / table cards — honors duplicate displayLabel suffixes. */

export function formatTableDisplayName(

  tableName: string,

  _tableLabel?: string,

  displayLabel?: string

): string {

  return (displayLabel ?? tableName).trim()

}



export function formatAdminTableItemsLine(

  itemCount: number,

  dishesWord: string

): string {

  return `${itemCount} ${dishesWord}`

}



export function formatAdminMoreOthers(

  template: string,

  count: number

): string {

  return template.replace("{count}", String(count))

}



/** Modal line: "Кимчи жигэ x2" */

export function formatAdminTableItemLine(title: string, quantity: number): string {

  return `${title} x${quantity}`

}


