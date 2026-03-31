import moment from 'moment'

import { FormValues } from 'soresu-form/web/va/types/muutoshakemus'
import { isoFormat } from 'soresu-form/web/va/i18n/dateformat'

const timeout = 10000 // 10 seconds

type MuutoshakemusProps = {
  userKey: string
  values: FormValues
}

type YhteishankeOrganizationPayload = {
  organizationName: string
  contactPerson: string
  email: string
}

const mapOrganizationForPayload = ({
  organizationName,
  contactPerson,
  email,
}: FormValues['yhteishankkeenOsapuolet'][number]): YhteishankeOrganizationPayload => ({
  organizationName,
  contactPerson,
  email,
})

const mapOrganizationsForPayload = (
  organizations: FormValues['yhteishankkeenOsapuolet']
): YhteishankeOrganizationPayload[] => organizations.map(mapOrganizationForPayload)

export const mergeYhteishankkeenOsapuolimuutoksetWithUpdatedContacts = (
  organizationChanges: FormValues['yhteishankkeenOsapuolimuutokset'],
  updatedOrganizations: FormValues['yhteishankkeenOsapuolet'] | undefined
): YhteishankeOrganizationPayload[] => {
  const updatedContactDetailsBySourceIndex = new Map(
    (updatedOrganizations ?? []).map((organization, sourceIndex) => [
      sourceIndex,
      {
        contactPerson: organization.contactPerson,
        email: organization.email,
      },
    ])
  )

  return organizationChanges.map((organizationChange) => {
    const payloadOrganization = mapOrganizationForPayload(organizationChange)
    if (typeof organizationChange.sourceIndex !== 'number') {
      return payloadOrganization
    }

    const updatedDetails = updatedContactDetailsBySourceIndex.get(organizationChange.sourceIndex)
    if (!updatedDetails) {
      return payloadOrganization
    }

    return {
      ...payloadOrganization,
      contactPerson: updatedDetails.contactPerson,
      email: updatedDetails.email,
    }
  })
}

export async function postMuutoshakemus(props: MuutoshakemusProps) {
  const { userKey, values } = props
  const url = `/api/muutoshakemus/${userKey}`

  const jatkoaika = values.haenKayttoajanPidennysta && {
    jatkoaika: {
      haenKayttoajanPidennysta: true,
      haettuKayttoajanPaattymispaiva: moment(values.haettuKayttoajanPaattymispaiva).format(
        isoFormat
      ),
      kayttoajanPidennysPerustelut: values.kayttoajanPidennysPerustelut,
    },
  }

  const talousarvio = values.haenMuutostaTaloudenKayttosuunnitelmaan && {
    talousarvio: {
      ...values.talousarvio,
      currentSum: undefined,
      originalSum: undefined,
    },
    talousarvioPerustelut: values.taloudenKayttosuunnitelmanPerustelut,
  }

  const hasSisaltomuutos = values.haenSisaltomuutosta || values.haenYhteishankkeenOsapuolimuutosta
  const sisaltomuutos = hasSisaltomuutos && {
    sisaltomuutos: {
      haenSisaltomuutosta: true,
      sisaltomuutosPerustelut: values.sisaltomuutosPerustelut,
    },
  }

  const yhteishankkeenOsapuolet = values.paivitanYhteishankkeenOsapuoltenYhteystietoja
    ? mapOrganizationsForPayload(values.yhteishankkeenOsapuolet)
    : undefined

  const yhteishankkeenOsapuolimuutokset = values.haenYhteishankkeenOsapuolimuutosta
    ? mergeYhteishankkeenOsapuolimuutoksetWithUpdatedContacts(
        values.yhteishankkeenOsapuolimuutokset,
        yhteishankkeenOsapuolet
      )
    : undefined

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...jatkoaika,
        ...talousarvio,
        ...sisaltomuutos,
        yhteishankkeenOsapuolet,
        yhteishankkeenOsapuolimuutokset,
        yhteyshenkilo: {
          name: values.name,
          email: values.email,
          phone: values.phone,
        },
        varayhteyshenkilo: values.hasTrustedContact
          ? {
              name: values.trustedContactName,
              email: values.trustedContactEmail,
              phone: values.trustedContactPhone,
            }
          : undefined,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    return response
  } finally {
    clearTimeout(timeoutId)
  }
}
