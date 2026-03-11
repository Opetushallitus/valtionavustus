import { expect, test } from '@playwright/test'
import { mapOtherOrganizationsAnswerValue } from '../../../soresu-form/web/va/yhteishankeOrganizations'

type ChildAnswer = { key: string; value: string }
type OrganizationRow = { key: string; value: ChildAnswer[] }

const createOrganizationRow = (
  indexStartsFromOne: number,
  values: { name: string; contactPerson: string; email: string; role?: string }
): OrganizationRow => {
  const prefix = `other-organizations.other-organizations-${indexStartsFromOne}`
  return {
    key: `other-organizations-${indexStartsFromOne}`,
    value: [
      { key: `${prefix}.name`, value: values.name },
      { key: `${prefix}.contactperson`, value: values.contactPerson },
      { key: `${prefix}.email`, value: values.email },
      { key: `${prefix}.role`, value: values.role ?? '' },
    ],
  }
}

const valueFor = (
  row: OrganizationRow,
  suffix: '.name' | '.contactperson' | '.email' | '.role'
) => {
  const child = row.value.find((item) => item.key.endsWith(suffix))
  return child?.value
}

test.describe('mapOtherOrganizationsAnswerValue', () => {
  test('adds a new organization row when normalized data has more rows than original answers', () => {
    const answerValue = [
      createOrganizationRow(1, {
        name: 'Ensimmainen Org Oy',
        contactPerson: 'Eka Yhteyshenkilo',
        email: 'eka@org.fi',
      }),
    ]

    const mapped = mapOtherOrganizationsAnswerValue(answerValue, [
      {
        'organization-name': 'Ensimmainen Org Oy',
        'contact-person': 'Eka Paivitetty',
        email: 'eka.paivitetty@org.fi',
      },
      {
        'organization-name': 'Uusi Org Ry',
        'contact-person': 'Uusi Henkilo',
        email: 'uusi@org.fi',
      },
    ]) as OrganizationRow[]

    expect(mapped).toHaveLength(2)
    expect(mapped[1].key).toBe('other-organizations-2')
    expect(valueFor(mapped[1], '.name')).toBe('Uusi Org Ry')
    expect(valueFor(mapped[1], '.contactperson')).toBe('Uusi Henkilo')
    expect(valueFor(mapped[1], '.email')).toBe('uusi@org.fi')
    expect(valueFor(mapped[1], '.role')).toBe('')
  })

  test('keeps removed organization rows visible by blanking synced fields when normalized data has fewer rows', () => {
    const answerValue = [
      createOrganizationRow(1, {
        name: 'Ensimmainen Org Oy',
        contactPerson: 'Eka Yhteyshenkilo',
        email: 'eka@org.fi',
      }),
      createOrganizationRow(2, {
        name: 'Toinen Org Ry',
        contactPerson: 'Toka Yhteyshenkilo',
        email: 'toka@org.fi',
      }),
    ]

    const mapped = mapOtherOrganizationsAnswerValue(answerValue, [
      {
        'organization-name': 'Ensimmainen Org Oy',
        'contact-person': 'Eka Paivitetty',
        email: 'eka.paivitetty@org.fi',
      },
    ]) as OrganizationRow[]

    expect(mapped).toHaveLength(2)
    expect(valueFor(mapped[0], '.contactperson')).toBe('Eka Paivitetty')
    expect(valueFor(mapped[0], '.email')).toBe('eka.paivitetty@org.fi')

    expect(valueFor(mapped[1], '.name')).toBe(' ')
    expect(valueFor(mapped[1], '.contactperson')).toBe(' ')
    expect(valueFor(mapped[1], '.email')).toBe(' ')
    expect(valueFor(mapped[1], '.role')).toBe('')
  })

  test('keeps all original rows visible when normalized organizations become empty', () => {
    const answerValue = [
      createOrganizationRow(1, {
        name: 'Ensimmainen Org Oy',
        contactPerson: 'Eka Yhteyshenkilo',
        email: 'eka@org.fi',
      }),
      createOrganizationRow(2, {
        name: 'Toinen Org Ry',
        contactPerson: 'Toka Yhteyshenkilo',
        email: 'toka@org.fi',
      }),
    ]

    const mapped = mapOtherOrganizationsAnswerValue(answerValue, []) as OrganizationRow[]

    expect(mapped).toHaveLength(2)
    for (const row of mapped) {
      expect(valueFor(row, '.name')).toBe(' ')
      expect(valueFor(row, '.contactperson')).toBe(' ')
      expect(valueFor(row, '.email')).toBe(' ')
      expect(valueFor(row, '.role')).toBe('')
    }
  })
})
