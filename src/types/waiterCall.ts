import { WaiterCallStatus, WaiterCallType } from "@/model/waiterCall";

export type WaiterCallRecord = {
  _id: string;
  merchantId: string;
  tableName: string;
  type: WaiterCallType;
  status: WaiterCallStatus;
  createdAt: string;
};
