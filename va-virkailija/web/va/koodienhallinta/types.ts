export const valueTypes = ["project", "operational-unit", "operation"] as const;

export type ValueType = typeof valueTypes[number];

export type KoodienhallintaRoutes = ValueType | "ta-tilit";

export interface CreateTalousarvioTili {
  year: number;
  code: string;
  name: string;
  amount: number;
}

export interface Talousarviotili extends CreateTalousarvioTili {
  id: number;
}
