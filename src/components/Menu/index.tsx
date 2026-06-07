"use client"

import React from "react"
import MenuBuilder from "./MenuBuilder"
import SidebarMenuToggle from "@/components/layout/SidebarMenuToggle"

const MenuBuilderPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
        <div className="mb-4">
          <SidebarMenuToggle />
        </div>
        <MenuBuilder />
      </div>
    </div>
  )
}

export default MenuBuilderPage
