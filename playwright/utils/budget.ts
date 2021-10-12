export const defaultBudget = {
  amount: {
    personnel: "200000",
    material: "3000",
    equipment: "10000",
    'service-purchase': "100",
    rent: "161616",
    steamship: "100",
    other: "10000000",
  },
  description: {
    personnel: "Tarvitsemme ihmisiä aaltoihin.",
    material: "Jari Sarasvuon aalto-VHS-kasetteja.",
    equipment: "Hankimme aaltokoneen toimistolle.",
    'service-purchase': "Ostamme alihankkijoita jatkamaan aaltojamme.",
    rent: "Vuokraamme Aalto-yliopistolta seminaaritiloja.",
    steamship: "Taksikyydit Otaniemeen.",
    other: "Vähän ylimääräistä pahan päivän varalle.",
  },
  selfFinancing: "1",
}

export type BudgetAmount = typeof defaultBudget.amount

export interface Budget {
  amount: BudgetAmount
  description: { [k in keyof BudgetAmount]: string }
  selfFinancing: string
}

export type AcceptedBudget = string | Budget

export type TalousarvioFormTable = Array<{ description: string, amount: string }>

export const sortedFormTable = (budgetList: TalousarvioFormTable) => [...budgetList].sort((a, b) => a.description < b.description ? 1 : -1)
