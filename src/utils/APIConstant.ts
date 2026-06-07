// user

export const SESSION: string = "/auth/session"
export const MERCHANT_SIGNIN: string = "/auth/signin"
export const LOGIN: string = "/auth/signup"
export const LOGOUT: string = "/auth/logout"

// Menu
export const MENUBUILDER_LISTS: string = "/menu/lists"
export const REMOVE_SECTION: string = "/menu"
export const ADD_MENU_ITEM: string = "/menu/upload"
export const POST_MENU_SEED_MUJIN: string = "/menu/seed-mujin"
export const REMOVE_ITEM: string = "/menu/item"
export const UPDATE_MENU_ITEM: string = "/menu/item"
export const MENU_ITEM_BY_ID = (id: string) => `/menu/${id}`
export const CONSUMER_MENU: string = "/menu/consumer"
export const MENU_ORDER: string = "/menu/order"

// qr
export const GET_QR: string = "/menu/qr"
export const POST_QR: string = "/menu/qr/new"
export const REMOVE_QR: string = "/menu/qr/remove"

// cart
export const GET_CART: string = "/cart"
export const POST_ITEM_CART: string = "/cart"

// tablet orders
export const POST_PLACE_ORDER: string = "/orders/place"
export const GET_KITCHEN_ORDERS: string = "/kitchen/orders"
export const PATCH_KITCHEN_ORDER: string = "/kitchen/orders"
export const GET_COMPLETED_ORDER_HISTORY: string = "/kitchen/history"

// table management
export const GET_TABLES: string = "/tables"
export const GET_TABLE_DETAIL: string = "/tables"
export const POST_CLOSE_TABLE: string = "/tables/close"
export const POST_TABLE_MANUAL_ORDER: string = "/tables/order"
export const GET_TABLES_LAYOUT: string = "/tables/layout"
export const PUT_TABLES_LAYOUT: string = "/tables/layout"
export const POST_TABLE_LAYOUT_TABLE: string = "/tables/layout/table"
export const POST_TABLE_HALL: string = "/tables/layout/hall"
export const DELETE_TABLE_HALL: string = "/tables/layout/hall"
export const DELETE_TABLE_LAYOUT_TABLE: string = "/tables/layout/table"

// waiter call
export const POST_WAITER_CALL: string = "/waiter-call"
export const GET_WAITER_CALL: string = "/waiter-call"
export const PATCH_WAITER_CALL: string = "/waiter-call"

// admin dashboard
export const GET_ADMIN_DASHBOARD: string = "/admin/dashboard"

// dashboard
export const GET_DASHBOARD_MATRICES: string = "/dashboard/matrices"
export const GET_MOST_ORDERED_ITEMS: string = "/dashboard/popular-item"
export const GET_ORDER_TRENS: string = "/dashboard/order-trend"

// order history
export const GET_ORDER_HISTORY: string = "/orders"
export const GET_ALL_ORDER_HISTORY: string = "/orders/all"

export const GET_TRANSACTION_HISTORY: string = "/payment/history"