"use client";

import { ROLE_LABELS_MN, UserRole } from "@/constants/userRoles";
import { Permission, ROLE_PERMISSIONS } from "@/lib/permissions";
import {
  PlatformCard,
  PlatformPageHeader,
} from "@/components/Platform/shared";

const MATRIX_ROWS = [
  { label: "Цэс удирдах", permission: Permission.MENU },
  { label: "Захиалга харах", permission: Permission.ORDERS },
  { label: "Захиалга засах", permission: Permission.ORDERS },
  { label: "Ширээ удирдах", permission: Permission.TABLES },
  { label: "Гал тогоо харах", permission: Permission.KITCHEN },
  { label: "Тайлан харах", permission: Permission.REPORTS },
  { label: "Inventory удирдах", permission: Permission.MENU },
  { label: "Ажилтан удирдах", permission: Permission.STAFF },
  { label: "Тохиргоо өөрчлөх", permission: Permission.SETTINGS },
  { label: "Төлбөр харах", permission: Permission.PAYMENTS },
  { label: "Platform access", permission: Permission.PLATFORM },
] as const;

const ROLES = [
  UserRole.PLATFORM_OWNER,
  UserRole.RESTAURANT_OWNER,
  UserRole.MANAGER,
  UserRole.CASHIER,
  UserRole.WAITER,
  UserRole.KITCHEN,
] as const;

export default function PlatformRolesPage() {
  return (
    <div className="space-y-6">
      <PlatformPageHeader
        title="Роль, эрх"
        description="Одоогийн role-permission матриц (зөвхөн харах горим)"
      />
      <PlatformCard className="overflow-x-auto">
        <p className="mb-4 text-sm text-slate-500">
          Эрхийн матрицыг код түвшинд `permissions.ts` удирддаг. Аюулгүй байдлын
          үүднээс эндээс шууд засвар хийх боломжгүй.
        </p>
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="px-3 py-2">Үйлдэл</th>
              {ROLES.map((role) => (
                <th key={role} className="px-3 py-2 whitespace-nowrap">
                  {ROLE_LABELS_MN[role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-800">{row.label}</td>
                {ROLES.map((role) => {
                  const allowed = ROLE_PERMISSIONS[role]?.includes(row.permission);
                  return (
                    <td key={role} className="px-3 py-2 text-center">
                      {allowed ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </PlatformCard>
    </div>
  );
}
