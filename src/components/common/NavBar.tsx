"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAppSelector } from "@/hook/redux"
import { IROLE } from "@/types/role"
import { postApi } from "@/utils/common"
import { LOGOUT } from "@/utils/APIConstant"
import { usePathname } from "next/navigation"
import { hidesSiteNavBar } from "@/utils/routes"
import { useLocale } from "@/context/LocaleContext"
import LanguageSwitcher from "@/components/common/LanguageSwitcher"

function NavBar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = React.useState(false)
  const user = useAppSelector((state) => state.merchant).merchant
  const { t } = useLocale()
  const n = t.nav

  React.useEffect(() => setMounted(true), [])

  if (hidesSiteNavBar(pathname)) {
    return null
  }

  const handleLogOut = async () => {
    if (typeof window === "undefined") return
    await postApi({
      url: LOGOUT,
    })
    window.location.href = "/login"
  }

  return (
    <header className="fixed top-0 z-50 w-full border-b bg-white/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-[#A18D6D]">QR</span>Menu
          </Link>

          <div className="hidden items-center gap-4 md:flex">
            {mounted && user && user.role === IROLE.MERCHANT && (
              <Link
                href={`/dashboard/${user._id}?uid=${user.uid}`}
                className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
              >
                {n.dashboard}
              </Link>
            )}

            {mounted && user && user.role === "CONSUMER" && (
              <Link
                href={`/detail/${user._id}`}
                className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
              >
                {n.transactions}
              </Link>
            )}

            {mounted && user && (
              <button
                type="button"
                onClick={handleLogOut}
                className="cursor-pointer text-sm font-medium text-gray-600 transition-colors hover:text-black"
              >
                {n.logout}
              </button>
            )}

            <LanguageSwitcher compact />
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <LanguageSwitcher compact />
            <Avatar className="h-9 w-9 cursor-pointer">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>TR</AvatarFallback>
            </Avatar>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label="Menu"
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300 md:hidden",
          open ? "max-h-48 border-t" : "max-h-0"
        )}
      >
        <nav className="flex flex-col gap-3 bg-white px-4 py-4">
          {mounted && user && user.role === IROLE.MERCHANT && (
            <Link
              href={`/dashboard/${user._id}?uid=${user.uid}`}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-gray-700 hover:text-black"
            >
              {n.dashboard}
            </Link>
          )}

          {mounted && user && user.role === "CONSUMER" && (
            <Link
              href={`/detail/${user._id}`}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-gray-700 hover:text-black"
            >
              {n.transactions}
            </Link>
          )}

          {mounted && user && (
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                void handleLogOut()
              }}
              className="cursor-pointer text-left text-sm font-medium text-gray-700 hover:text-black"
            >
              {n.logout}
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}

export default NavBar
