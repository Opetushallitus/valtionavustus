import React from 'react'

import { useTranslations } from './i18n/TranslationContext'
import { YhteishankeOrganizationResponse } from './types/muutoshakemus'

type YhteishankeOrganizationsTableProps = {
  organizations: YhteishankeOrganizationResponse[]
}

export const YhteishankeOrganizationsTable = ({
  organizations,
}: YhteishankeOrganizationsTableProps) => {
  const { t } = useTranslations()
  const showRole = organizations.some((org) => !!org.role)
  return (
    <table className="muutoshakemus-yhteishanke-table">
      <thead>
        <tr>
          <th>{t.contactPersonEdit.yhteishankeOrganizationName}</th>
          <th>{t.contactPersonEdit.yhteishankeContactPerson}</th>
          <th>{t.contactPersonEdit.yhteishankeEmail}</th>
          {showRole && <th>{t.contactPersonEdit.yhteishankeRole}</th>}
        </tr>
      </thead>
      <tbody>
        {organizations.map((org, index) => (
          <tr key={index} data-test-id={`yhteishanke-org-${index}`}>
            <td>{org['organization-name']}</td>
            <td>{org['contact-person']}</td>
            <td>{org['email']}</td>
            {showRole && <td data-test-id={`yhteishanke-org-${index}-role`}>{org.role ?? ''}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
