import {budjettimuutoshakemusTest} from "./budjettimuutoshakemusTest";
import {Answers} from "../utils/types";
import {Budget} from "../utils/budget";

export const answers: Answers = {
  contactPersonEmail: "erik.eksampletten@example.com",
  contactPersonName: "Erik Eksampletten",
  contactPersonPhoneNumber: "555",
  projectName: "Badet pengaren i Ankdammen",
  lang: 'sv'
}

export const budget: Budget = {
  amount: {
    personnel: '300',
    material: '420',
    equipment: '1337',
    'service-purchase': '5318008',
    rent: '69',
    steamship: '0',
    other: '9000',
  },
  description: {
    personnel: 'tjänare',
    material: 'båterna',
    equipment: 'champagne visp',
    'service-purchase': 'servitörena',
    rent: 'villa',
    steamship: 'ånga',
    other: 'Kalle Anka',
  },
  selfFinancing: '1',
}

export const svBudjettimuutoshakemusTest = budjettimuutoshakemusTest.extend({
  budget: async ({}, use) => {
    await use(budget)
  },
  answers: async ({}, use) => {
    await use(answers)
  }
})
