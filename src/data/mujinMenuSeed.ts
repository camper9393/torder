import type { IMenu } from "@/types/menu"

export type MujinMenuCategory =
  | "Soups"
  | "Stews"
  | "Main dishes"
  | "Rice / Bibimbap"
  | "Gimbap"
  | "Drinks"
  | "Alcohol"

export type MujinMenuSize = {
  labelMn: string
  labelEn: string
  price: number
  /** Legacy */
  label?: string
}

export type MujinMenuSeedItem = {
  nameMongolian: string
  nameEnglish: string
  descriptionMongolian?: string
  descriptionEnglish?: string
  category: MujinMenuCategory
  spicy: boolean
  sizes?: MujinMenuSize[]
  /** Single price when no sizes */
  price?: number
}

/** Placeholder until item photos are uploaded in admin */
export const MUJIN_MENU_PLACEHOLDER_IMAGE =
  "https://res.cloudinary.com/dcyn3ewpv/image/upload/v1768743883/images_qcf1fn.jpg"

export function buildMenuTitle(item: MujinMenuSeedItem): string {
  if (item.nameEnglish.trim()) {
    return `${item.nameMongolian} (${item.nameEnglish})`
  }
  return item.nameMongolian
}

function toDbSize(s: MujinMenuSize) {
  const labelMn = s.labelMn || s.label || ""
  const labelEn = s.labelEn || ""
  return {
    labelMn,
    labelEn,
    label: labelMn || labelEn,
    price: s.price,
  }
}

export function resolveMenuPrice(item: MujinMenuSeedItem): number {
  if (item.sizes?.length) {
    return Math.min(...item.sizes.map((s) => s.price))
  }
  return item.price ?? 0
}

export function buildMenuDescription(item: MujinMenuSeedItem): string | undefined {
  const parts = [item.descriptionMongolian, item.descriptionEnglish].filter(
    (p): p is string => Boolean(p?.trim())
  )
  if (parts.length === 0) return undefined
  return parts.join(" — ")
}

/** Menu fields for insert (merchantId set separately on the route). */
export function toMenuDocument(
  item: MujinMenuSeedItem
): Omit<IMenu, "_id" | "merchantId" | "createdAt" | "updatedAt"> {
  return {
    image: MUJIN_MENU_PLACEHOLDER_IMAGE,
    title: buildMenuTitle(item),
    description: buildMenuDescription(item),
    nameMn: item.nameMongolian,
    nameEn: item.nameEnglish,
    nameMongolian: item.nameMongolian,
    nameEnglish: item.nameEnglish,
    descriptionMn: item.descriptionMongolian,
    descriptionEn: item.descriptionEnglish,
    descriptionMongolian: item.descriptionMongolian,
    descriptionEnglish: item.descriptionEnglish,
    section: item.category,
    price: resolveMenuPrice(item),
    sizes: item.sizes?.map(toDbSize),
    quantity: 0,
    spicy: item.spicy,
    spicyLevel: item.spicy ? 2 : 0,
    available: true,
  }
}

const s1 = (price: number): MujinMenuSize[] => [
  { labelMn: "1 хүн", labelEn: "1 person", price },
]
const s2 = (price: number): MujinMenuSize[] => [
  { labelMn: "2 хүн", labelEn: "2 people", price },
]
const s12 = (price: number): MujinMenuSize[] => [
  { labelMn: "1-2 хүн", labelEn: "1-2 people", price },
]
const sDual = (p1: number, p2: number): MujinMenuSize[] => [
  { labelMn: "1 хүн", labelEn: "1 person", price: p1 },
  { labelMn: "2 хүн", labelEn: "2 people", price: p2 },
]

/** Mujin Korean Restaurant — full menu from printed pages */
export const MUJIN_MENU_ITEMS: MujinMenuSeedItem[] = [
  // Page 1 — soups & stews
  {
    nameMongolian: "КАЛБИТАН",
    nameEnglish: "Galbi-tang",
    descriptionMongolian: "Үхрийн хавирга, пүнтүүзтэй ясны шөл",
    descriptionEnglish: "Short beef rib soup",
    category: "Soups",
    spicy: false,
    sizes: s1(28900),
  },
  {
    nameMongolian: "ГУМТАН",
    nameEnglish: "Gom-tang",
    descriptionMongolian: "Үхрийн мах, пүнтүүз, өндөгтэй ясны шөл",
    descriptionEnglish: "Sliced beef with egg soup",
    category: "Soups",
    spicy: false,
    sizes: s1(28900),
  },
  {
    nameMongolian: "ДУГАНИТАН",
    nameEnglish: "Dogani-tang",
    descriptionMongolian: "Үхрийн тойгны шөл",
    descriptionEnglish: "Ox-knee soup",
    category: "Soups",
    spicy: false,
    sizes: s1(29900),
  },
  {
    nameMongolian: "КИМЧИЖИГЭ",
    nameEnglish: "Kimchi-jjigae",
    descriptionMongolian: "Дүпү, гахайн мах, кимчитэй шөл",
    descriptionEnglish:
      "A spicy stew made with sour kimchi, fatty pork, green onion and tofu",
    category: "Stews",
    spicy: true,
    sizes: s1(26900),
  },
  {
    nameMongolian: "ТАКТУРИТАН",
    nameEnglish: "Dakdoritang",
    descriptionMongolian: "Төмс, лууван, хулуу, тахианы мөчтэй халуун ногоотой шөл",
    descriptionEnglish: "A thick spicy soup with chicken leg and potatoes",
    category: "Stews",
    spicy: true,
    sizes: s2(46900),
  },
  {
    nameMongolian: "ДҮГБЭГИ БҮЛГҮГИ",
    nameEnglish: "Ddukbaegi Bulgogi",
    descriptionMongolian: "Үхрийн мах, пүнтүүз, нарийн мөөгтэй чихэрлэг амттай шөл",
    descriptionEnglish: "Thinly sliced beef with a sweet and savory soup",
    category: "Soups",
    spicy: false,
    sizes: s1(29900),
  },
  // Page 2
  {
    nameMongolian: "ТЭНЖАНЖИГЭ",
    nameEnglish: "Doenjang Jjigae",
    descriptionMongolian: "Үхрийн мах, дүпү, хулуу, шар буурцагны шөл",
    descriptionEnglish: "Soy bean paste soup",
    category: "Stews",
    spicy: true,
    sizes: s1(26900),
  },
  {
    nameMongolian: "ЮГГЭЖАН",
    nameEnglish: "Yukgaejang",
    descriptionMongolian: "Үхрийн мах, гусари, шар буурцаг халуун ногоотой шөл",
    descriptionEnglish:
      "Beef soup made of red chili peppers for a spicy flavor",
    category: "Soups",
    spicy: true,
    sizes: s1(29900),
  },
  {
    nameMongolian: "ПҮДЭЖИГЭ",
    nameEnglish: "Budae jjigae",
    descriptionMongolian: "Гоймон болон олон төрлийн орц найрлагатай халуун ногоотой шөл",
    descriptionEnglish:
      "Army base stew loaded with kimchi, sausage, ramen noodles and much more",
    category: "Stews",
    spicy: true,
    sizes: s2(46900),
  },
  {
    nameMongolian: "БҮЛГҮГИ",
    nameEnglish: "Bulgogi",
    descriptionMongolian: "Чихэрлэг соустай амталсан үхрийн махтай хуурга",
    descriptionEnglish: "Thinly sliced beef with a sweet savory sauce",
    category: "Main dishes",
    spicy: false,
    sizes: sDual(36900, 60900),
  },
  {
    nameMongolian: "ЖЭЮГБУГГЫМ",
    nameEnglish: "Jeyuk-bokkeum",
    descriptionMongolian: "Халуун ногоогоор амталсан гахайн мах",
    descriptionEnglish:
      "Thinly sliced pork marinated in spicy gochujang sauce and stir fried with onions, carrots, cabbage",
    category: "Main dishes",
    spicy: true,
    sizes: sDual(32900, 53900),
  },
  {
    nameMongolian: "КАЛБИЖИМ",
    nameEnglish: "Galbijjim",
    descriptionMongolian: "Цуугаар амталж жигнэсэн үхрийн хавирга",
    descriptionEnglish:
      "Braised short beef rib with potato, carrots and soy sauce",
    category: "Main dishes",
    spicy: false,
    sizes: sDual(36900, 60900),
  },
  // Page 3
  {
    nameMongolian: "ТАККАЛБИ",
    nameEnglish: "Dalk-galbi",
    descriptionMongolian: "Бяслагтай, халуун ногоогоор амталсан тахиан мах",
    descriptionEnglish: "Chicken ribs with cheese and variety of banchans",
    category: "Main dishes",
    spicy: true,
    sizes: sDual(36900, 53900),
  },
  {
    nameMongolian: "ЧИЙЗ ЖЭЮГ",
    nameEnglish: "Cheese Jeyuk",
    descriptionMongolian: "Бяслагтай, халуун ногоогоор амталсан гахайн мах",
    descriptionEnglish: "Stir-fried spicy pork with cheese",
    category: "Main dishes",
    spicy: true,
    sizes: sDual(36900, 55900),
  },
  {
    nameMongolian: "ЧИЙЗ КАЛБИЖИМ",
    nameEnglish: "Cheese Galbijjim",
    descriptionMongolian: "Бяслагтай, халуун ногоотой үхрийн хавирга",
    descriptionEnglish: "Braised short beef rib with cheese and spicy sauce",
    category: "Main dishes",
    spicy: true,
    sizes: s2(62900),
  },
  {
    nameMongolian: "КИМЧИ БҮЛГҮГИ БОККУМБАБ",
    nameEnglish: "Kimchi Bulgogi Bokkeumbap",
    descriptionMongolian: "Ширмэн тогоотой нимгэн зорсон үхрийн мах, өндөг кимчитэй хуурга",
    descriptionEnglish: "Stir-fried rice with kimchi and bulgogi",
    category: "Rice / Bibimbap",
    spicy: false,
    sizes: s2(50900),
  },
  {
    nameMongolian: "ДУЛСУТ БИБИМБАБ",
    nameEnglish: "Dolsot bibimbab",
    descriptionMongolian: "Үхрийн мах, будаа, өндөг, төрөл бүрийн ногоотой холимог хуурга",
    descriptionEnglish:
      "Hot stone bowl mixed rice with vegetables, egg, and meat",
    category: "Rice / Bibimbap",
    spicy: false,
    sizes: s1(24900),
  },
  {
    nameMongolian: "РАБОККИ",
    nameEnglish: "Rabokki",
    descriptionMongolian: "Бяслаг, зайдас, гоймон, догтой халуун ногоотой хуурга",
    descriptionEnglish: "Spicy Korean rice cake and ramen noodles with cheese",
    category: "Main dishes",
    spicy: true,
    sizes: s12(29900),
  },
  // Page 4
  {
    nameMongolian: "ДОГ БУГГИ",
    nameEnglish: "Tteokbokki",
    descriptionMongolian: "Халуун ногоотой соусаар амталсан өндөг, үдэн, дог",
    descriptionEnglish: "Spicy Korean rice cake",
    category: "Main dishes",
    spicy: true,
    sizes: s12(20900),
  },
  {
    nameMongolian: "КРИСПИ ЧИКЕН",
    nameEnglish: "Crispy chicken",
    descriptionMongolian: "Шаржигнуур тахиа, шарсан төмстэй",
    descriptionEnglish: "Crispy chicken with French fries and dipping sauce",
    category: "Main dishes",
    spicy: false,
    sizes: s2(41900),
  },
  {
    nameMongolian: "ЯННЁМ ЧИКЭН",
    nameEnglish: "Yangnyeom Chicken",
    descriptionMongolian: "Халуун ногоотой соусаар амталсан шаржигнуур тахиа, шарсан төмстэй",
    descriptionEnglish: "Sweet spicy chicken with French fries and dipping sauce",
    category: "Main dishes",
    spicy: true,
    sizes: s2(43900),
  },
  {
    nameMongolian: "САМГЁБСАЛ",
    nameEnglish: "Samgyeopsal",
    descriptionMongolian: "Гахайн шардаг мах, шар буурцагны шөл",
    descriptionEnglish: "Grilled pork belly",
    category: "Main dishes",
    spicy: false,
    sizes: s2(61900),
  },
  {
    nameMongolian: "БУСАМ",
    nameEnglish: "Bossam",
    descriptionMongolian:
      "Чанаж болгосон гахайн махыг нимгэн хэрчиж байцаа, кимчи зэрэгтэй хамт идэх хоол",
    descriptionEnglish:
      "Korean boiled pork wrap. Boiled pork belly wrapped with cabbage leaves and served with dipping sauce",
    category: "Main dishes",
    spicy: false,
    sizes: s2(63900),
  },
  {
    nameMongolian: "ЧИЙЗ ТЭЖИ БУЛГОГИ",
    nameEnglish: "Cheese Daejibulgoji",
    descriptionMongolian: "Бяслагтай, чихэрлэг соустай амталсан гахайн махтай хуурга",
    descriptionEnglish: "Stir-fried pork bulgogi with cheese",
    category: "Main dishes",
    spicy: false,
    sizes: s2(63900),
  },
  // Page 5
  {
    nameMongolian: "ЯНТАН",
    nameEnglish: "Yang-tang",
    descriptionMongolian: "Хонины зорсон мах хонины тойгтой ядаргаа тайлах шөл",
    descriptionEnglish: "Soup with sliced mutton and sheep leg",
    category: "Soups",
    spicy: false,
    sizes: s1(29900),
  },
  {
    nameMongolian: "ГУНЧИ КИМЧИЖИГЭ",
    nameEnglish: "Kkongchi kimchi-jjigae",
    descriptionMongolian: "Загасны махтай кимчижигэ",
    descriptionEnglish:
      "A spicy stew made with sour kimchi, kkongchi fish, green onion and tofu",
    category: "Stews",
    spicy: true,
    sizes: s1(29900),
  },
  {
    nameMongolian: "БИОХЭЖАНГҮГ",
    nameEnglish: "Ppyeo Haejangguk",
    descriptionMongolian: "Гахайн нурууны ястай халуун ногоотой шөл",
    descriptionEnglish: "Korean pork backbone soup",
    category: "Soups",
    spicy: true,
    sizes: s1(31900),
  },
  {
    nameMongolian: "КАМЖАТАН",
    nameEnglish: "Gamja-tang",
    descriptionEnglish: "Thick soup made of pork backbones with various vegetables",
    category: "Soups",
    spicy: true,
    sizes: s2(61900),
  },
  {
    nameMongolian: "ЧИЙЗ ТЭЖИ КАЛБИ",
    nameEnglish: "Cheese Dwaeji galbi",
    descriptionMongolian: "Бяслагатай халуун ногоотой гахайн хавирга",
    descriptionEnglish: "Braised pork ribs with cheese and spicy flavor",
    category: "Main dishes",
    spicy: true,
    sizes: s2(61900),
  },
  {
    nameMongolian: "ЖАЖАМЁН",
    nameEnglish: "Jajangmyeon",
    descriptionMongolian: "Амтат хар соустай гоймон",
    descriptionEnglish: "Savory black bean noodles",
    category: "Main dishes",
    spicy: false,
    sizes: s1(16900),
  },
  // Page 6 — gimbap & omelettes
  {
    nameMongolian: "КИМБАБ",
    nameEnglish: "Gimbap",
    category: "Gimbap",
    spicy: false,
    price: 11900,
  },
  {
    nameMongolian: "ЧИЙЗ КИМБАБ",
    nameEnglish: "Cheese gimbap",
    category: "Gimbap",
    spicy: false,
    price: 12900,
  },
  {
    nameMongolian: "КИМЧИ САМГЁБСАЛТАЙ КИМБАБ",
    nameEnglish: "Kimchi gimbap",
    descriptionEnglish: "Gimbap with kimchi and fried pork belly",
    category: "Gimbap",
    spicy: false,
    price: 15900,
  },
  {
    nameMongolian: "ЖЭЮГ КИМБАБ",
    nameEnglish: "Jeyuk gimbap",
    category: "Gimbap",
    spicy: false,
    price: 15900,
  },
  {
    nameMongolian: "КЕРАНМАРИ",
    nameEnglish: "Gyeranmari",
    category: "Main dishes",
    spicy: false,
    price: 11900,
  },
  {
    nameMongolian: "ЧИЙЗ КЕРАНМАРИ",
    nameEnglish: "Cheese gyeranmari",
    descriptionEnglish: "Korean rolled omelette with cheese",
    category: "Main dishes",
    spicy: false,
    price: 15900,
  },
  // Drinks
  {
    nameMongolian: "Bonaqua 0.5l",
    nameEnglish: "Bonaqua 0.5l",
    category: "Drinks",
    spicy: false,
    price: 2000,
  },
  {
    nameMongolian: "Coca cola 0.33l",
    nameEnglish: "Coca cola 0.33l",
    category: "Drinks",
    spicy: false,
    price: 6000,
  },
  {
    nameMongolian: "Sprite 0.33l",
    nameEnglish: "Sprite 0.33l",
    category: "Drinks",
    spicy: false,
    price: 6000,
  },
  {
    nameMongolian: "Fanta 0.33l",
    nameEnglish: "Fanta 0.33l",
    category: "Drinks",
    spicy: false,
    price: 6000,
  },
  {
    nameMongolian: "Chilsung 0.33l",
    nameEnglish: "Chilsung 0.33l",
    category: "Drinks",
    spicy: false,
    price: 5000,
  },
  {
    nameMongolian: "Tymbark 0.25l",
    nameEnglish: "Tymbark 0.25l",
    category: "Drinks",
    spicy: false,
    price: 6000,
  },
  {
    nameMongolian: "Calpis 0.33L",
    nameEnglish: "Calpis 0.33L",
    category: "Drinks",
    spicy: false,
    price: 7000,
  },
  // Alcohol
  {
    nameMongolian: "Cass 0.5l",
    nameEnglish: "Cass 0.5l",
    category: "Alcohol",
    spicy: false,
    price: 8500,
  },
  {
    nameMongolian: "Terra 0.5l",
    nameEnglish: "Terra 0.5l",
    category: "Alcohol",
    spicy: false,
    price: 8000,
  },
  {
    nameMongolian: "Krush",
    nameEnglish: "Krush",
    category: "Alcohol",
    spicy: false,
    price: 8000,
  },
  {
    nameMongolian: "Soju",
    nameEnglish: "Soju",
    category: "Alcohol",
    spicy: false,
    price: 16000,
  },
  {
    nameMongolian: "Kindzmarauli",
    nameEnglish: "Kindzmarauli (semi sweet)",
    descriptionEnglish: "Red wine — semi sweet",
    category: "Alcohol",
    spicy: false,
    price: 75000,
  },
]

export const MUJIN_MENU_SECTIONS: MujinMenuCategory[] = [
  "Soups",
  "Stews",
  "Main dishes",
  "Rice / Bibimbap",
  "Gimbap",
  "Drinks",
  "Alcohol",
]
