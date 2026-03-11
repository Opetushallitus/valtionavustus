import { expect, test } from '@playwright/test'
import { mergeYhteishankkeenOsapuolimuutoksetWithUpdatedContacts } from 'va-hakija/web/va/muutoshakemus/client'
import type { YhteishankeOrganization } from 'soresu-form/web/va/types/muutoshakemus'

test.describe('mergeYhteishankkeenOsapuolimuutoksetWithUpdatedContacts', () => {
  test('maps updated contacts by source index when organization names are duplicated', () => {
    const updatedOrganizations: YhteishankeOrganization[] = [
      {
        organizationName: 'Duplicate Org Oy',
        contactPerson: 'First Contact Updated',
        email: 'first-updated@example.com',
        sourceIndex: 0,
      },
      {
        organizationName: 'Duplicate Org Oy',
        contactPerson: 'Second Contact Updated',
        email: 'second-updated@example.com',
        sourceIndex: 1,
      },
    ]

    const organizationChanges: YhteishankeOrganization[] = [
      {
        organizationName: 'Duplicate Org Oy',
        contactPerson: 'Old Contact 1',
        email: 'old-1@example.com',
        sourceIndex: 0,
      },
      {
        organizationName: 'Duplicate Org Oy',
        contactPerson: 'Old Contact 2',
        email: 'old-2@example.com',
        sourceIndex: 1,
      },
    ]

    const merged = mergeYhteishankkeenOsapuolimuutoksetWithUpdatedContacts(
      organizationChanges,
      updatedOrganizations
    )

    expect(merged[0]).toEqual({
      organizationName: 'Duplicate Org Oy',
      contactPerson: 'First Contact Updated',
      email: 'first-updated@example.com',
    })
    expect(merged[1]).toEqual({
      organizationName: 'Duplicate Org Oy',
      contactPerson: 'Second Contact Updated',
      email: 'second-updated@example.com',
    })
  })

  test('keeps source-index mapping stable after removing middle organization and adding a new row', () => {
    const updatedOrganizations: YhteishankeOrganization[] = [
      {
        organizationName: 'Org A',
        contactPerson: 'Contact A Updated',
        email: 'a-updated@example.com',
        sourceIndex: 0,
      },
      {
        organizationName: 'Org B',
        contactPerson: 'Contact B Updated',
        email: 'b-updated@example.com',
        sourceIndex: 1,
      },
      {
        organizationName: 'Org C',
        contactPerson: 'Contact C Updated',
        email: 'c-updated@example.com',
        sourceIndex: 2,
      },
    ]

    const organizationChanges: YhteishankeOrganization[] = [
      {
        organizationName: 'Org A',
        contactPerson: 'Old A',
        email: 'old-a@example.com',
        sourceIndex: 0,
      },
      {
        organizationName: 'Org C',
        contactPerson: 'Old C',
        email: 'old-c@example.com',
        sourceIndex: 2,
      },
      {
        organizationName: 'Org D',
        contactPerson: 'New Contact',
        email: 'new@example.com',
        isNew: true,
      },
    ]

    const merged = mergeYhteishankkeenOsapuolimuutoksetWithUpdatedContacts(
      organizationChanges,
      updatedOrganizations
    )

    expect(merged).toEqual([
      {
        organizationName: 'Org A',
        contactPerson: 'Contact A Updated',
        email: 'a-updated@example.com',
      },
      {
        organizationName: 'Org C',
        contactPerson: 'Contact C Updated',
        email: 'c-updated@example.com',
      },
      {
        organizationName: 'Org D',
        contactPerson: 'New Contact',
        email: 'new@example.com',
      },
    ])
  })
})
