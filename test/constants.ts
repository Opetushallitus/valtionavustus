import {Budget} from "./test-util"

export const answers = {
  contactPersonEmail: "erkki.esimerkki@example.com",
  contactPersonName: "Erkki Esimerkki",
  contactPersonPhoneNumber: "666",
  projectName: "Rahassa kylpijät Ky Ay Oy",
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
    personnel: 'One euro for each of our Spartan workers',
    material: 'Generic materials for innovation',
    equipment: 'We need elite level equipment',
    'service-purchase': 'We need some afterwork fun',
    rent: 'More afterwork fun',
    steamship: 'No need for steamship, we have our own yacht',
    other: 'For power ups',
  },
  selfFinancing: '1',
}
