"use client"

import React from "react"
import {
  getMessages,
  localeToDateLocale,
  readStoredLocale,
  storeLocale,
} from "@/utils/i18n"
import { Locale } from "@/utils/i18n/types"
import { LocaleContext } from "./useLocale"

type LocaleProviderProps = {
  children: React.ReactNode
}

function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = React.useState<Locale>("mn")
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    setLocaleState(readStoredLocale())
    setReady(true)
  }, [])

  React.useEffect(() => {
    if (!ready) return
    document.documentElement.lang = locale
  }, [locale, ready])

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next)
    storeLocale(next)
  }, [])

  const value = React.useMemo(
    () => ({
      locale,
      setLocale,
      t: getMessages(locale),
      dateLocale: localeToDateLocale(locale),
      ready,
    }),
    [locale, setLocale, ready]
  )

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

export default LocaleProvider
