import organizationsFormJson from './avustushaku-with-organizations.json'

type FormNode = { id?: string; children?: FormNode[] }

const findById = (nodes: FormNode[], id: string): FormNode | undefined => {
  for (const node of nodes) {
    if (node.id === id) {
      return node
    }
    const found = node.children ? findById(node.children, id) : undefined
    if (found) {
      return found
    }
  }
  return undefined
}

export const roleField = {
  label: { fi: 'Rooli hankkeessa', sv: 'Roll i projektet' },
  fieldClass: 'formField',
  helpText: { fi: '', sv: '' },
  id: 'other-organizations.other-organizations-1.role',
  params: { size: 'small', maxlength: 600 },
  required: true,
  fieldType: 'textField',
}

export const avustushakuWithOrganizationRoleHakulomake = (): string => {
  const form = JSON.parse(JSON.stringify(organizationsFormJson)) as { content: FormNode[] }
  const fieldset = findById(form.content, 'other-organizations')
  const templateRow = fieldset?.children?.[0]
  if (!templateRow?.children) {
    throw new Error('other-organizations template row not found in fixture form')
  }
  templateRow.children.push(roleField)
  return JSON.stringify(form)
}
