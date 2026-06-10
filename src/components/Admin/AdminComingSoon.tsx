type AdminComingSoonProps = {
  title: string
  message: string
}

export default function AdminComingSoon({ title, message }: AdminComingSoonProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="font-serif text-2xl font-bold text-slate-950">{title}</h1>
      <p className="max-w-md text-base text-slate-600">{message}</p>
    </div>
  )
}
