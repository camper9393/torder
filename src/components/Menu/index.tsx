"use client"

import React from "react"
import MenuBuilder from "./MenuBuilder"

const MenuBuilderPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
        <MenuBuilder />
      </div>
    </div>
  )
}

export default MenuBuilderPage
