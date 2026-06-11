import { getCurrentPublicUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const user = await getCurrentPublicUser();

  if (!user) {
    redirect("/login?next=/admin/users");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Хэрэглэгчийн удирдлага</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Энэ хуудас зөвхөн нэвтэрсэн хэрэглэгчдэд нээлттэй.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-zinc-900">Одоогийн хэрэглэгч</h2>
        <dl className="mt-4 grid gap-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
            <dt className="text-zinc-500">Нэр</dt>
            <dd className="font-medium text-zinc-900">{user.name}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
            <dt className="text-zinc-500">Хэрэглэгчийн нэр</dt>
            <dd className="font-medium text-zinc-900">{user.username}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-zinc-100 pb-2">
            <dt className="text-zinc-500">Имэйл</dt>
            <dd className="font-medium text-zinc-900">{user.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Эрх</dt>
            <dd className="font-medium text-zinc-900">{user.role}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
