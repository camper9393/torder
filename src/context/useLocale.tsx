"use client"

import React from "react"
import {
  getMessages,
  localeToDateLocale,
  readStoredLocale,
} from "@/utils/i18n"
import { Locale, Messages } from "@/utils/i18n/types"

export type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Messages
  dateLocale: string
  ready: boolean
}

export const LocaleContext = React.createContext<LocaleContextValue | null>(null)

export function useLocale() {
  const ctx = React.useContext(LocaleContext)
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider")
  }
  return ctx
}

/** @deprecated use useLocale().t */
export function useTranslation() {
  const { locale, setLocale, t, dateLocale, ready } = useLocale()
  return { locale, setLocale, t, dateLocale, ready }
}

export function useOptionalLocale(): LocaleContextValue | null {
  return React.useContext(LocaleContext)
}

export function readLocaleFromStorage(): Locale {
  return readStoredLocale()
}
