export const valueTypes = ["project", "operational-unit", "operation"] as const;

export type ValueType = typeof valueTypes[number];

export type KoodienhallintaRoutes = ValueType | "ta-tilit";

export interface CreateTalousarviotili {
  year: number;
  code: string;
  name: string;
  amount: number;
}

export interface Talousarviotili extends CreateTalousarviotili {
  id: number;
}

interface AvustushakuInfo {
  id: number;
  name: string;
}

export interface TalousarviotiliWithUsageInfo extends Talousarviotili {
  avustushaut: AvustushakuInfo[];
}
