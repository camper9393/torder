import { OrderStatus } from "@/model/order"
import { TableDisplayStatus } from "@/utils/tableManagement"

export type Locale = "mn" | "ko" | "en"

export const LOCALES: Locale[] = ["mn", "ko", "en"]

export const LOCALE_STORAGE_KEY = "torder-locale"

export const LOCALE_LABELS: Record<Locale, string> = {
  mn: "Монгол",
  ko: "한국어",
  en: "English",
}

export type Messages = {
  common: {
    loading: string
    close: string
    print: string
    restaurant: string
    table: string
    tablePrefix: string
    total: string
    subtotal: string
    savings: string
    items: string
    status: string
    time: string
    today: string
    yesterday: string
    all: string
    sold: string
    placed: string
    completed: string
    orderId: string
    date: string
    thankYou: string
    billReceipt: string
    taxInvoiceBill: string
    language: string
  }
  orderStatus: Record<OrderStatus, string>
  tablet: {
    notice: string
    orderHistory: string
    callStaff: string
    servingRobot: string
    cart: string
    orderNo: string
    sortDefault: string
    sortPriceAsc: string
    sortPriceDesc: string
    sortName: string
    sortBy: string
    add: string
    placeOrder: string
    checkout: string
    emptyCart: string
    backToMenu: string
    noticeMsg: string
    staffCalled: string
    staffCallFailed: string
    robotMsg: string
    historyMsg: string
    exploreMenus: string
    menuSubtitle: string
    whatsYourMood: string
    loadingMenu: string
    noCategoryItems: string
    enterFullscreen: string
    exitFullscreen: string
    orderSent: string
    couldNotPlaceOrder: string
    itemForYou: string
    placingOrder: string
    pcWeight: (grams: number) => string
    decreaseQty: string
    increaseQty: string
    addToCart: string
    selectPortion: string
    quantity: string
    orderHistoryTitle: string
    cartTitleWithCount: (count: string) => string
    totalColon: string
    submitOrder: string
    selectedTotal: string
    noPortionSelected: string
    extraOptions: string
    reviewOrderPrompt: string
    totalCountLabel: string
    totalPriceLabel: string
    back: string
    orderSuccessTitle: string
    confirm: string
    tableShort: string
    tableAria: (tableNumber: string) => string
    categoryItemCount: (count: number) => string
    historyEmpty: string
    historyTotalLabel: string
    piecesCount: (count: number) => string
    qtyLabel: string
    recentlyAdded: string
    addedToCart: (itemName: string) => string
    event: string
    removeItem: string
    portionTimesQty: (portionLabel: string, quantity: number) => string
  }
  kitchenTv: {
    title: string
    refreshNote: string
    loading: string
    noActive: string
    orderTime: string
  }
  kitchen: {
    title: string
    history: string
    backToKitchen: string
    enableSound: string
    soundOn: string
    soundOff: string
    refreshNote: string
    loading: string
    noActive: string
    staffCalls: string
    foodOrders: string
    printBill: string
    accept: string
    cooking: string
    done: string
    callingStaff: (table: string) => string
    waiterCallUpdated: (label: string) => string
    couldNotUpdateWaiter: string
    orderMarked: (label: string) => string
    couldNotUpdateOrder: string
    couldNotEnableSound: string
    couldNotInitSound: string
  }
  history: {
    title: string
    subtitle: string
    loading: string
    emptyToday: string
    emptyAll: string
  }
  menu: {
    spicyFieldLabel: string
    spicyNo: string
    spicyYes: string
    spicyBadge: string
  }
  admin: {
    title: string
    subtitle: string
    loading: string
    loadFailed: string
    todayRevenue: string
    todayOrders: string
    activeOrders: string
    completedOrders: string
    ordersSection: string
    revenueByDay: string
    ordersByDay: string
    last7Days: string
    topSelling: string
    noSales: string
    recentOrders: string
    noOrders: string
    revenue: string
  }
  adminNav: {
    dashboard: string
    kitchen: string
    tables: string
    floorLayout: string
  }
  floorLayout: {
    title: string
    subtitle: string
    loading: string
    loadFailed: string
    saveLayout: string
    resetLayout: string
    saved: string
    saveFailed: string
    resetDone: string
    addTable: string
    hallSettings: string
    tableSettings: string
    name: string
    description: string
    size: string
    shape: string
    deleteTable: string
    selectTableHint: string
    shapeRectangle: string
    shapeCircle: string
    hallLabel: string
    addHall: string
    hallAdded: string
    hallRestored: string
    addHallFailed: string
    deleteHall: string
    deleteHallConfirm: string
    hallDeleted: string
    deleteHallFailed: string
    deleteOnlyHallBlocked: string
    emptyHall: string
    backToTables: string
    tableAdded: string
    addFailed: string
    tableDeleted: string
    deleteFailed: string
    nameRequired: string
    duplicateName: string
    discardUnsaved: string
    closeEditor: string
  }
  adminTables: {
    title: string
    subtitle: string
    loading: string
    empty: string
    refreshNote: string
    orderedItems: string
    dishes: string
    noOrder: string
    addOrder: string
    orderCreated: string
    orderLabel: string
    totalLabel: string
    statusLabel: string
    printBill: string
    closeTable: string
    confirmCloseTable: string
    moreOthers: string
    enableSound: string
    resetLayout: string
    layoutSaved: string
    dragHint: string
    editLayoutMode: string
    normalMode: string
    saveLayout: string
    openFloorLayout: string
    headerHelpTooltip: string
    soundToggleTooltip: string
    layoutTooltip: string
    headerHelpLabel: string
    floorPlanHint: string
    floorPlanEditHint: string
    floorPlanItemCount: string
    floorPlanLegend: {
      title: string
      empty: string
      waiter: string
      new: string
      accepted: string
      paid: string
    }
    statusBadgeWaiterCalled: string
    statusBadgePaid: string
    diningZone: string
    takeoutZone: string
    dragTableHandle: string
    resizeTable: string
    acceptOrder: string
    newOrderButton: string
    statusBadgeNew: string
    statusBadgeAccepted: string
    statusBadgeAllDelivered: string
    addFood: string
    removeItem: string
    confirmRemoveItem: string
    confirmZeroQuantity: string
    pickerTitle: string
    searchMenu: string
    allCategories: string
    orderAccepted: string
    waiterCallHandled: string
    updateFailed: string
    noMenuItems: string
    editMenu: string
    addNewMenu: string
    saveChanges: string
    cancelEdit: string
    pickerAddToTable: string
    pickerCancel: string
    pickerSelectedTitle: string
    pickerTotal: (totalPrice: string) => string
    pickerCartEmpty: string
    pickerCartSummary: (lineCount: number, totalQty: number, totalPrice: string) => string
    pickerIncreaseQty: string
    pickerDecreaseQty: string
    changesSaved: string
    markItemServed: string
    itemServedDone: string
    itemServedBadge: string
    cardServedColumn: string
    cardPendingColumn: string
    cardServedBadge: string
    allItemsDelivered: string
    waitingForDelivery: string
    status: Record<TableDisplayStatus, string>
  }
  tables: {
    title: string
    subtitle: string
    loading: string
    empty: string
    activeOrders: string
    latestOrder: string
    orderCount: string
    closeTable: string
    tableClosed: string
    couldNotClose: string
    couldNotLoad: string
    noActiveOrders: string
    refreshNote: string
    status: Record<TableDisplayStatus, string>
  }
  qrManager: {
    title: string
    subtitle: string
    tableNameLabel: string
    tableNamePlaceholder: string
    create: string
    creating: string
    created: string
    createFailed: string
    loading: string
    empty: string
    signInRequired: string
    tableName: string
    menuLink: string
    scanHint: string
    print: string
    download: string
    copyLink: string
    copied: string
    delete: string
    deleting: string
    deleted: string
    deleteFailed: string
    loadFailed: string
    nameRequired: string
  }
  nav: {
    home: string
    qrManager: string
    tables: string
    kitchen: string
    history: string
    contact: string
    dashboard: string
    adminDashboard: string
    orders: string
    menu: string
    qrCodes: string
    logout: string
    transactions: string
  }
  sidebar: {
    core: string
    business: string
  }
  sectionDescription: (section: string) => string
}
