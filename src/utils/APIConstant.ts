// user

export const SESSION: string = "/auth/session"
export const MERCHANT_SIGNIN: string = "/auth/signin"
export const LOGIN: string = "/auth/signup"
export const LOGOUT: string = "/auth/logout"
export const USER_LOGIN: string = "/auth/login"
export const USER_PASSCODE_LOGIN: string = "/auth/passcode-login"
export const USER_PASSCODE: string = "/auth/passcode"
export const USER_PASSCODE_SETUP: string = "/auth/passcode/setup"
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
export const DELETE_PLATFORM_RESTAURANT = (id: string) => `/platform/restaurants/${id}`
export const POST_PLATFORM_RESTAURANT_ACTIVATE = (id: string) =>
  `/platform/restaurants/${id}/activate`
export const POST_PLATFORM_RESTAURANT_DEACTIVATE = (id: string) =>
  `/platform/restaurants/${id}/deactivate`
export const POST_PLATFORM_MIGRATE_RESTAURANT: string =
  "/platform/migrate/restaurant"
export const GET_PLATFORM_DASHBOARD: string = "/platform/dashboard"
export const GET_PLATFORM_RESTAURANT_SUMMARY = (id: string) =>
  `/platform/restaurants/${id}/summary`
export const POST_PLATFORM_RESTAURANT_EXTEND = (id: string) =>
  `/platform/restaurants/${id}/extend-subscription`
export const POST_PLATFORM_RESTAURANT_EXTEND_SHORT = (id: string) =>
  `/platform/restaurants/${id}/extend`
export const GET_PLATFORM_RESTAURANT_USERS = (id: string) =>
  `/platform/restaurants/${id}/users`
export const GET_PLATFORM_RESTAURANT_PAYMENTS = (id: string) =>
  `/platform/restaurants/${id}/payments`
export const GET_PLATFORM_RESTAURANT_SUPPORT = (id: string) =>
  `/platform/restaurants/${id}/support`
export const POST_PLATFORM_RESTAURANT_RESET_OWNER_PASSWORD = (id: string) =>
  `/platform/restaurants/${id}/reset-owner-password`
export const POST_PLATFORM_RESTAURANT_ENTER_SYSTEM = (id: string) =>
  `/platform/restaurants/${id}/enter-system`
export const POST_PLATFORM_RESTAURANT_EXIT_SYSTEM =
  "/platform/restaurants/exit-system"
export const GET_PLATFORM_USERS: string = "/platform/users"
export const POST_PLATFORM_USER: string = "/platform/users"
export const PATCH_PLATFORM_USER = (id: string) => `/platform/users/${id}`
export const DELETE_PLATFORM_USER = (id: string) => `/platform/users/${id}`
export const POST_PLATFORM_USER_RESET_PASSWORD = (id: string) =>
  `/platform/users/${id}/reset-password`
export const GET_PLATFORM_PAYMENTS: string = "/platform/payments"
export const POST_PLATFORM_PAYMENT: string = "/platform/payments"
export const PATCH_PLATFORM_PAYMENT = (id: string) => `/platform/payments/${id}`
export const GET_PLATFORM_SUPPORT: string = "/platform/support"
export const POST_PLATFORM_SUPPORT: string = "/platform/support"
export const PATCH_PLATFORM_SUPPORT = (id: string) => `/platform/support/${id}`
export const GET_PLATFORM_SUPPORT_DETAIL = (id: string) => `/platform/support/${id}`
export const POST_PLATFORM_SUPPORT_MESSAGE = (id: string) =>
  `/platform/support/${id}/messages`
export const GET_PLATFORM_ERRORS: string = "/platform/errors"
export const PATCH_PLATFORM_ERROR = (id: string) => `/platform/errors/${id}`
export const GET_PLATFORM_REPORTS: string = "/platform/reports"
export const GET_PLATFORM_SETTINGS: string = "/platform/settings"
export const PATCH_PLATFORM_SETTINGS: string = "/platform/settings"
export const GET_PLATFORM_ACTIVITY: string = "/platform/activity"

// merchant support & notifications
export const GET_SUPPORT: string = "/support"
export const POST_SUPPORT: string = "/support"
export const POST_SUPPORT_UPLOAD: string = "/support/upload"
export const GET_SUPPORT_DETAIL = (id: string) => `/support/${id}`
export const POST_SUPPORT_MESSAGE = (id: string) => `/support/${id}/messages`
export const GET_NOTIFICATIONS: string = "/notifications"
export const PATCH_NOTIFICATION_READ = (id: string) => `/notifications/${id}`
export const POST_NOTIFICATIONS_READ_ALL: string = "/notifications"

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
export const POST_TABLE_PAY: string = "/tables/pay"
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

// admin settings
export const GET_ADMIN_SETTINGS_COMPANY: string = "/admin/settings/company"
export const PATCH_ADMIN_SETTINGS_COMPANY: string = "/admin/settings/company"
export const GET_ADMIN_SETTINGS_BRANCHES: string = "/admin/settings/branches"
export const POST_ADMIN_SETTINGS_BRANCH: string = "/admin/settings/branches"
export const PATCH_ADMIN_SETTINGS_BRANCH = (id: string) =>
  `/admin/settings/branches/${id}`
export const DELETE_ADMIN_SETTINGS_BRANCH = (id: string) =>
  `/admin/settings/branches/${id}`
export const GET_ADMIN_SETTINGS_PAYMENTS: string = "/admin/settings/payments"
export const PATCH_ADMIN_SETTINGS_PAYMENTS: string = "/admin/settings/payments"
export const GET_ADMIN_SETTINGS_RECEIPT: string = "/admin/settings/receipt"
export const PATCH_ADMIN_SETTINGS_RECEIPT: string = "/admin/settings/receipt"
export const GET_RECEIPT_CONTEXT: string = "/receipt/context"
export const GET_PAYMENT_METHODS: string = "/payment/methods"
export const GET_ADMIN_SETTINGS_VAT: string = "/admin/settings/vat"
export const PATCH_ADMIN_SETTINGS_VAT: string = "/admin/settings/vat"
export const GET_ADMIN_SETTINGS_SUBSCRIPTION: string =
  "/admin/settings/subscription"
export const GET_ADMIN_SETTINGS_AUDIT: string = "/admin/settings/audit"
export const GET_ADMIN_SETTINGS_AUDIT_EXPORT: string =
  "/admin/settings/audit/export"

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