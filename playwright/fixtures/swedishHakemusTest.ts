import { budjettimuutoshakemusTest } from './budjettimuutoshakemusTest'
import { Answers } from '../utils/types'
import { Budget } from '../utils/budget'

export const svAnswers: Answers = {
  contactPersonEmail: 'erik.eksampletten@example.com',
  contactPersonName: 'Erik Eksampletten',
  contactPersonPhoneNumber: '555',
  projectName: 'Badet pengaren i Ankdammen',
  lang: 'sv',
}

export const svBudget: Budget = {
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

type SVBudjettimuutoshakemusFixtures = {
  answers: Answers
  budget: Budget
}

export const svBudjettimuutoshakemusTest =
  budjettimuutoshakemusTest.extend<SVBudjettimuutoshakemusFixtures>({
    budget: svBudget,
    answers: svAnswers,
  })
