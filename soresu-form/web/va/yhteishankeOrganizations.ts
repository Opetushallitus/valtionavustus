export interface YhteishankeOrganizationContact {
  'organization-name'?: string
  'contact-person'?: string
  email?: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const toOptionalString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined

export const mapOtherOrganizationsAnswerValue = (
  answerValue: unknown,
  organizations: YhteishankeOrganizationContact[]
): unknown => {
  if (!Array.isArray(answerValue)) {
    return answerValue
  }

  return answerValue.map((row, index) => {
    const organization = organizations[index]
    if (!organization || !isRecord(row) || !Array.isArray(row.value)) {
      return row
    }

    const updatedChildren = row.value.map((child) => {
      if (!isRecord(child)) {
        return child
      }
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

    return { ...row, value: updatedChildren }
  })
}
