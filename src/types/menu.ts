export type MenuCardBadge = "BEST" | "NEW" | "HOT" | "VEG"

export type MenuSizeOption = {
  labelMn?: string
  labelEn?: string
  /** Legacy */
  label?: string
  price: number
}

export interface IMenu {
  _id: string
  merchantId: string
  image: string
  title: string
  description?: string
  price: number
  quantity: number
  originalPrice?: number
  section: string
  spicy?: boolean
  spicyLevel?: number
  available?: boolean
  nameMn?: string
  nameEn?: string
  descriptionMn?: string
  descriptionEn?: string
  /** Legacy aliases */
  nameMongolian?: string
  nameEnglish?: string
  descriptionMongolian?: string
  descriptionEnglish?: string
  sizes?: MenuSizeOption[]
  /** Optional display badges when present in API payload */
  badges?: MenuCardBadge[]
  createdAt: Date
  updatedAt: Date
}

export type CartLineMeta = {
  cartLineKey?: string
  selectedSizeLabelMn?: string
  selectedSizeLabelEn?: string
}
