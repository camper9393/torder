/** Full-height content area for the tables floor plan (counteracts merchant shell padding). */
export default function AdminTablesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-[calc(100svh-3rem)] flex-col overflow-hidden md:h-[calc(100svh)] -m-4 md:-m-6">
      {children}
    </div>
  )
}
