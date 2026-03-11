export interface YhteishankeOrganizationContact {
  'organization-name'?: string
  'contact-person'?: string
  email?: string
}

type RowAnswerChild = {
  key: string
  value: unknown
}

type RowAnswer = {
  key: string
  value: RowAnswerChild[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const toOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined

const isRowAnswerChild = (value: unknown): value is RowAnswerChild =>
  isRecord(value) &&
  typeof value.key === 'string' &&
  Object.prototype.hasOwnProperty.call(value, 'value')

const isRowAnswer = (value: unknown): value is RowAnswer =>
  isRecord(value) &&
  typeof value.key === 'string' &&
  Array.isArray(value.value) &&
  value.value.every(isRowAnswerChild)

const rowKeyWithIndex = (value: string, indexStartsFromOne: number): string =>
  value.replace(/other-organizations-\d+/g, `other-organizations-${indexStartsFromOne}`)

const mapRowChildrenWithOrganization = (
  rowChildren: RowAnswerChild[],
  organization: YhteishankeOrganizationContact
): RowAnswerChild[] =>
  rowChildren.map((child) => {
    const key = toOptionalString(child.key)
    if (!key) {
      return child
    }

    if (key.endsWith('.name') && organization['organization-name']) {
      return { ...child, value: organization['organization-name'] }
    }
    if (key.endsWith('.contactperson') && organization['contact-person']) {
      return { ...child, value: organization['contact-person'] }
    }
    if (key.endsWith('.email') && organization.email) {
      return { ...child, value: organization.email }
    }
    return child
  })

const blankRowChildren = (rowChildren: RowAnswerChild[]): RowAnswerChild[] =>
  rowChildren.map((child) => {
    const key = toOptionalString(child.key)
    if (!key) {
      return child
    }
    if (key.endsWith('.name') || key.endsWith('.contactperson') || key.endsWith('.email')) {
      // Keep removed rows visible in diff views so old/new values can be shown.
      return { ...child, value: ' ' }
    }
    return child
  })

const createRowFromTemplate = (
  templateRow: RowAnswer,
  organization: YhteishankeOrganizationContact,
  indexStartsFromOne: number
): RowAnswer => ({
  ...templateRow,
  key: rowKeyWithIndex(templateRow.key, indexStartsFromOne),
  value: mapRowChildrenWithOrganization(
    templateRow.value.map((child) => ({
      ...child,
      key: rowKeyWithIndex(child.key, indexStartsFromOne),
    })),
    organization
  ),
})

export const mapOtherOrganizationsAnswerValue = (
  answerValue: unknown,
  organizations: YhteishankeOrganizationContact[]
): unknown => {
  if (!Array.isArray(answerValue)) {
    return answerValue
  }

  const templateRow = answerValue.find(isRowAnswer)
  const mappedLength = Math.max(answerValue.length, organizations.length)

  return Array.from({ length: mappedLength }, (_, index) => {
    const organization = organizations[index]

    if (index >= answerValue.length) {
      if (!organization || !templateRow) {
        return undefined
      }
      return createRowFromTemplate(templateRow, organization, index + 1)
    }

    const row = answerValue[index]
    if (!isRowAnswer(row)) {
      return row
    }

    if (!organization) {
      return { ...row, value: blankRowChildren(row.value) }
    }
    return { ...row, value: mapRowChildrenWithOrganization(row.value, organization) }
  }).filter((row) => row !== undefined)
}
