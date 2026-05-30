export const TABLET_BLUE = "#1E5EFF"
export const TABLET_BLUE_DARK = "#1548D4"
export const TABLET_BG = "#E8EDF5"

export type TabletLocale = "en" | "ko"

export const tabletCopy = {
  en: {
    notice: "Notice",
    orderHistory: "Order History",
    callStaff: "Call Staff",
    servingRobot: "Serving Robot",
    cart: "Cart",
    orderNo: "ORDER",
    language: "EN",
    sortDefault: "Recommended",
    sortPriceAsc: "Price: Low to High",
    sortPriceDesc: "Price: High to Low",
    sortName: "Name: A–Z",
    add: "Add",
    placeOrder: "Place Order",
    checkout: "Checkout",
    emptyCart: "Your cart is empty",
    backToMenu: "Back to Menu",
    noticeMsg: "Welcome! Please order from the menu. Ask staff for allergens.",
    staffCalled: "Staff has been notified — please wait",
    staffCallFailed: "Could not reach staff. Try again.",
    robotMsg: "Serving robot request sent",
    historyMsg: "Order history is available after your first order",
  },
  ko: {
    notice: "공지",
    orderHistory: "주문내역",
    callStaff: "직원호출",
    servingRobot: "서빙로봇",
    cart: "장바구니",
    orderNo: "주문",
    language: "한국어",
    sortDefault: "추천순",
    sortPriceAsc: "가격 낮은순",
    sortPriceDesc: "가격 높은순",
    sortName: "이름순",
    add: "담기",
    placeOrder: "주문하기",
    checkout: "주문서",
    emptyCart: "장바구니가 비어 있습니다",
    backToMenu: "메뉴로 돌아가기",
    noticeMsg: "환영합니다! 메뉴에서 주문해 주세요. 알레르기 문의는 직원에게 말씀해 주세요.",
    staffCalled: "직원에게 알렸습니다 — 잠시만 기다려 주세요",
    staffCallFailed: "직원 호출에 실패했습니다. 다시 시도해 주세요.",
    robotMsg: "서빙 로봇 요청을 보냈습니다",
    historyMsg: "첫 주문 후 주문 내역을 확인할 수 있습니다",
  },
} as const

export type SortOption = "default" | "price-asc" | "price-desc" | "name"

export function sectionDescription(section: string, locale: TabletLocale): string {
  const en = `Fresh ${section.toLowerCase()} selections prepared to order.`
  const ko = `신선한 ${section} 메뉴를 주문 즉시 준비합니다.`
  return locale === "ko" ? ko : en
}

export function sortMenuItems<T extends { title: string; price: number; createdAt?: Date | string }>(
  items: T[],
  sort: SortOption
): T[] {
  const list = [...items]
  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => a.price - b.price)
    case "price-desc":
      return list.sort((a, b) => b.price - a.price)
    case "name":
      return list.sort((a, b) => a.title.localeCompare(b.title))
    default:
      return list
  }
}
