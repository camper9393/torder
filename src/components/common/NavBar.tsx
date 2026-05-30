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

function NavBar() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = React.useState(false)
  const user = useAppSelector(state => state.merchant).merchant

  React.useEffect(() => setMounted(true), [])

  const links = [
    { name: "Home", href: "/" },
    { name: "Kitchen", href: "/kitchen" },
    { name: "Contact", href: "/" }
  ]

  const handleLogOut = async () => {
    if (typeof window === "undefined") return;
    await postApi({
      url: LOGOUT
    })
    window.location.href = "/"
  }

  return (
    <header className="fixed top-0 z-50 w-full border-b bg-white/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-[#A18D6D]">QR</span>Menu
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {links.map(link => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
              >
                {link.name}
              </Link>
            ))}

            {mounted && user && user.role === "MERCHANT" &&
              <Link
                href={`/dashboard/${user._id}?uid=${user.uid}`}
                className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
              >
                Dashboard
              </Link>}

              {mounted && user && user.role === "CONSUMER" &&
              <Link
                href={`/detail/${user._id}`}
                className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
              >
                Transections
              </Link>}

              {mounted && user && (
                <button onClick={handleLogOut} className="text-sm cursor-pointer font-medium text-gray-600 hover:text-black transition-colors">
                  LogOut
                </button>
              )}

          </nav>

          <div className="flex items-center gap-4">

            <Avatar className="h-9 w-9 cursor-pointer">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>TR</AvatarFallback>
            </Avatar>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300",
          open ? "max-h-60 border-t" : "max-h-0"
        )}
      >
        <nav className="flex flex-col px-4 py-4 gap-3 bg-white">
          {links.map(link => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-gray-700 hover:text-black"
            >
              {link.name}
            </Link>
          ))}
          {mounted && user && user.role === IROLE.MERCHANT &&
            <Link
              href={`/dashboard/${user._id}?uid=${user.uid}`}
              className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              Dashboard
            </Link>}

            {mounted && user && user.role === "CONSUMER" &&
              <Link
                href={`/detail/${user._id}`}
                className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
              >
                Transections
              </Link>}
              {mounted && user && (
                <button onClick={handleLogOut} className="text-sm cursor-pointer font-medium text-gray-600 hover:text-black transition-colors">
                  LogOut
                </button>
              )}
              
        </nav>
      </div>
    </header>
  )
}

export default NavBar
