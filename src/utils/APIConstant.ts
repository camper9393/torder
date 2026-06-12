// user

export const SESSION: string = "/auth/session"
export const MERCHANT_SIGNIN: string = "/auth/signin"
export const LOGIN: string = "/auth/signup"
export const LOGOUT: string = "/auth/logout"
export const USER_LOGIN: string = "/auth/login"
export const USER_ME: string = "/auth/me"
export const GET_AUTH_PROFILE: string = "/auth/profile"
export const PATCH_AUTH_PROFILE: string = "/auth/profile"
export const POST_AUTH_CHANGE_PASSWORD: string = "/auth/change-password"

// admin staff
export const GET_ADMIN_STAFF: string = "/admin/staff"
export const POST_ADMIN_STAFF: string = "/admin/staff"
export const PATCH_ADMIN_STAFF = (id: string) => `/admin/staff/${id}`
export const POST_ADMIN_STAFF_RESET_PASSWORD = (id: string) =>
  `/admin/staff/${id}/reset-password`

// platform restaurants
export const GET_PLATFORM_RESTAURANTS: string = "/platform/restaurants"
export const POST_PLATFORM_RESTAURANT: string = "/platform/restaurants"
export const platformRestaurantById = (id: string) => `/platform/restaurants/${id}`
export const PATCH_PLATFORM_RESTAURANT = (id: string) => `/platform/restaurants/${id}`
export const POST_PLATFORM_RESTAURANT_ACTIVATE = (id: string) =>
  `/platform/restaurants/${id}/activate`
export const POST_PLATFORM_RESTAURANT_DEACTIVATE = (id: string) =>
  `/platform/restaurants/${id}/deactivate`
export const POST_PLATFORM_MIGRATE_RESTAURANT: string =
  "/platform/migrate/restaurant"

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

// refunds
export const POST_REFUND: string = "/refunds"
export const GET_REFUNDS: string = "/refunds"
export const GET_REFUND_ELIGIBILITY = (orderId: string) =>
  `/refunds/eligibility/${orderId}`

// admin reports
export const GET_ADMIN_REPORTS_SALES: string = "/admin/reports/sales"
export const GET_ADMIN_REPORTS_SUMMARY: string = "/admin/reports/summary"
export const GET_ADMIN_REPORTS_ORDER_HISTORY: string =
  "/admin/reports/order-history"
export const GET_ADMIN_REPORTS_REFUNDS: string = "/admin/reports/refunds"
export const GET_ADMIN_REPORTS_PRODUCTS: string = "/admin/reports/products"
export const GET_ADMIN_REPORTS_TRANSACTIONS: string =
  "/admin/reports/transactions"
export const GET_ADMIN_REPORTS_KITCHEN: string = "/admin/reports/kitchen"
export const GET_ADMIN_REPORTS_WAITERS: string = "/admin/reports/waiters"
export const GET_ADMIN_REPORTS_VAT: string = "/admin/reports/vat"

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

// database backup
export const GET_DATABASE_BACKUP: string = "/backup"

// inventory
export const GET_INVENTORY_DASHBOARD: string = "/inventory/dashboard"
export const GET_INVENTORY_ITEMS: string = "/inventory/items"
export const POST_INVENTORY_ITEM: string = "/inventory/items"
export const PATCH_INVENTORY_ITEM = (id: string) => `/inventory/items/${id}`
export const DELETE_INVENTORY_ITEM = (id: string) => `/inventory/items/${id}`
export const POST_INVENTORY_STOCK_IN: string = "/inventory/stock-in"
export const GET_INVENTORY_TRANSACTIONS: string = "/inventory/transactions"
export const GET_INVENTORY_RECIPES: string = "/inventory/recipes"
export const PUT_INVENTORY_RECIPE = (menuItemId: string) =>
  `/inventory/recipes/${menuItemId}`
export const DELETE_INVENTORY_RECIPE = (menuItemId: string) =>
  `/inventory/recipes/${menuItemId}`
export const GET_INVENTORY_REPORTS: string = "/inventory/reports"

// dashboard
export const GET_DASHBOARD_MATRICES: string = "/dashboard/matrices"
export const GET_MOST_ORDERED_ITEMS: string = "/dashboard/popular-item"
export const GET_ORDER_TRENS: string = "/dashboard/order-trend"

// order history
export const GET_ORDER_HISTORY: string = "/orders"
export const GET_ALL_ORDER_HISTORY: string = "/orders/all"

export const GET_TRANSACTION_HISTORY: string = "/payment/history"