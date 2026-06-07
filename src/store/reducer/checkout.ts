import { ICart, ICartItem } from "@/model/cart";
import { IMenu } from "@/types/menu"
import { ApiResponse } from "@/utils/api";
import { GET_CART, POST_ITEM_CART } from "@/utils/APIConstant";
import { UNKNOWN_TABLE, normalizeTableName } from "@/utils/table";
import { checkoutLineKey } from "@/utils/menuBilingual";
import { getApi, postApi } from "@/utils/common";
import { createAsyncThunk, createSlice, Dispatch, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "@/store/store"

/** Cart line: menu stock `quantity` is omitted; use `itemCount` for cart qty. */
export interface CheckOutItems extends Omit<IMenu, "quantity"> {
  itemCount: number
  cartLineKey: string
  selectedSizeLabelMn?: string
  selectedSizeLabelEn?: string
}

export interface CheckoutState {
  items: CheckOutItems[]
  tableName: string
}

export const syncCartWithDB = createAsyncThunk(
  "checkout/syncCart",
  async ({ itemId, quantity }: { itemId: string, quantity: number }) => {
    const response = await postApi<ApiResponse<ICart>>({
      url: POST_ITEM_CART,
      values: { itemId, quantity }
    });
    if (response?.success) {
      return response?.data;
    }
    return null;
  }
);

export const syncCartToCheckOut = createAsyncThunk(
  "checkout/cart",
  async ({ dispatch }: { dispatch: Dispatch }, { getState }) => {
    const merchant = (getState() as RootState).merchant.merchant;
    if (!merchant?._id) {
      return null;
    }

    const response = await getApi<ApiResponse<CheckOutItems[]>>({
      url: GET_CART,
    });
    if (response?.success) {
      dispatch(setCheckout(response?.data ?? []));
      return response?.data;
    }
    return null;
  }
)

const initialState: CheckoutState = {
  items: [],
  tableName: UNKNOWN_TABLE,
};

const checkOutSlice = createSlice({
  name: "checkout",
  initialState,
  reducers: {
    setTableName: (state, action: PayloadAction<string | null | undefined>) => {
      state.tableName = normalizeTableName(action.payload);
    },

    addCheckOutItem: (state, action: PayloadAction<CheckOutItems>) => {
      const key = checkoutLineKey(action.payload)
      const addQty = Math.max(1, action.payload.itemCount ?? 1)
      const existing = state.items.find((i) => checkoutLineKey(i) === key)

      if (existing) {
        existing.itemCount += addQty
      } else {
        state.items.push({
          ...action.payload,
          cartLineKey: key,
          itemCount: addQty,
        })
      }
    },

    removeCheckItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        (item) => checkoutLineKey(item) !== action.payload
      )
    },

    incrementCheckOutItem: (state, action: PayloadAction<string>) => {
      const item = state.items.find(
        (i) => checkoutLineKey(i) === action.payload
      )
      if (item) {
        item.itemCount += 1
      }
    },

    decrementCheckOutItem: (state, action: PayloadAction<string>) => {
      const item = state.items.find(
        (i) => checkoutLineKey(i) === action.payload
      )
      if (!item) return

      if (item.itemCount > 1) {
        item.itemCount -= 1
      } else {
        state.items = state.items.filter(
          (i) => checkoutLineKey(i) !== action.payload
        )
      }
    },

    updateCheckOutQuantity: (
      state,
      action: PayloadAction<{ cartLineKey: string; quantity: number }>
    ) => {
      const item = state.items.find(
        (i) => checkoutLineKey(i) === action.payload.cartLineKey
      )
      if (item) {
        item.itemCount = action.payload.quantity
      }
    },

    clearCheckout: (state) => {
      state.items = []
    },

    setCheckout: (state, action: PayloadAction<CheckOutItems[]>) => {
      state.items = action.payload.map((item) => ({
        ...item,
        cartLineKey: item.cartLineKey ?? checkoutLineKey(item),
      }))
    },
  },
})

export const {
  addCheckOutItem,
  removeCheckItem,
  incrementCheckOutItem,
  decrementCheckOutItem,
  updateCheckOutQuantity,
  clearCheckout,
  setCheckout,
  setTableName,
} = checkOutSlice.actions

export default checkOutSlice.reducer
