import React, { useEffect, useState } from 'react'
import moment from 'moment-timezone'
import HttpUtil from 'soresu-form/web/HttpUtil'
import JsUtil from 'soresu-form/web/JsUtil'
import { fiLongDateTimeFormatWithKlo } from 'soresu-form/web/va/i18n/dateformat'
import { Field, Form } from 'soresu-form/web/va/types'
import { VirkailijaAvustushaku } from '../hakuReducer'
import { isFormEdited } from './FormJsonEditor'
import * as styles from './FormVersionBrowsing.module.css'

interface FormVersion {
  index: number
  'saved-at': string
}

interface ShownVersion {
  index: number
  savedAt: string
  restoredFieldIds: string[]
}

export const formatSaveTime = (date: moment.MomentInput) =>
  moment(date).tz('Europe/Helsinki').format(fiLongDateTimeFormatWithKlo)

const findFieldIds = (content: Field[]) =>
  JsUtil.flatFilter<Field>(content, (field) => !!field.id && !!field.fieldClass).map(
    (field) => field.id
  )

export const useFormVersionBrowsing = (
  avustushaku: VirkailijaAvustushaku,
  formDraftJson: string,
  onFormChange: (avustushaku: VirkailijaAvustushaku, newDraft: Form) => void
) => {
  const savedForm = avustushaku.formContent
  const [versions, setVersions] = useState<FormVersion[]>()
  const [shownVersion, setShownVersion] = useState<ShownVersion>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  // Reset on every form save: formContent gets a new identity, updated_at may not change (second resolution)
  useEffect(() => {
    let cancelled = false
    setShownVersion(undefined)
    setVersions(undefined)
    setError(undefined)
    HttpUtil.get<FormVersion[]>(`/api/avustushaku/${avustushaku.id}/form/versions`)
      .then((fetchedVersions) => !cancelled && setVersions(fetchedVersions))
      .catch(() => !cancelled && setError('Aiempien versioiden lataaminen epäonnistui'))
    return () => {
      cancelled = true
    }
  }, [avustushaku.id, savedForm])

  const returnToCurrentVersion = () => {
    if (savedForm) {
      onFormChange(avustushaku, savedForm)
    }
    setShownVersion(undefined)
  }

  const showVersion = async (index: number) => {
    if (!savedForm) {
      return
    }
    if (
      !shownVersion &&
      isFormEdited(formDraftJson, savedForm) &&
      !window.confirm('Lomakkeeseen tehdyt tallentamattomat muutokset menetetään. Jatketaanko?')
    ) {
      return
    }
    setLoading(true)
    setError(undefined)
    let version: Pick<Form, 'content' | 'rules'> & { 'saved-at': string }
    try {
      version = await HttpUtil.get(`/api/avustushaku/${avustushaku.id}/form/versions/${index}`)
    } catch {
      setError('Version lataaminen epäonnistui. Yritä uudelleen.')
      return
    } finally {
      setLoading(false)
    }
    const savedFieldIds = new Set(findFieldIds(savedForm.content))
    onFormChange(avustushaku, { ...savedForm, content: version.content, rules: version.rules })
    setShownVersion({
      index,
      savedAt: version['saved-at'],
      restoredFieldIds: findFieldIds(version.content).filter((id) => !savedFieldIds.has(id)),
    })
  }

  const olderVersion = versions?.[shownVersion ? shownVersion.index + 1 : 0]
  const newerVersion =
    shownVersion && shownVersion.index > 0 ? versions?.[shownVersion.index - 1] : undefined
  const showNewerVersion = () =>
    newerVersion ? showVersion(newerVersion.index) : returnToCurrentVersion()

  const versionButtons = (
    <>
      {error && (
        <span className={styles.error} role="alert" data-test-id="form-version-error">
          {error}
        </span>
      )}
      <VersionButton
        testId="previous-form-version"
        label="↶ Edellinen tallennettu versio"
        detail={
          olderVersion
            ? formatSaveTime(olderVersion['saved-at'])
            : versions
              ? 'Ei vanhempia versioita'
              : error
                ? 'Ei saatavilla'
                : 'Ladataan…'
        }
        disabled={!olderVersion || loading}
        onClick={() => olderVersion && showVersion(olderVersion.index)}
      />
      <VersionButton
        testId="next-form-version"
        label="↷ Seuraava uudempi versio"
        detail={
          shownVersion
            ? formatSaveTime(newerVersion ? newerVersion['saved-at'] : savedForm?.updated_at)
            : 'Nykyinen versio'
        }
        disabled={!shownVersion || loading}
        onClick={showNewerVersion}
      />
    </>
  )

  const banner = shownVersion && (
    <div className={styles.banner} data-test-id="form-version-banner">
      Esikatselet <b>{formatSaveTime(shownVersion.savedAt)}</b> tallennettua versiota. Muutos tulee
      voimaan vasta, kun painat Tallenna.{' '}
      <button
        type="button"
        className={styles.linkButton}
        data-test-id="return-to-current-form-version"
        onClick={returnToCurrentVersion}
      >
        Palaa nykyiseen versioon
      </button>
    </div>
  )

  return { versionButtons, banner, restoredFieldIds: shownVersion?.restoredFieldIds ?? [] }
}

interface VersionButtonProps {
  testId: string
  label: string
  detail: string
  disabled: boolean
  onClick: () => void
}

const VersionButton = ({ testId, label, detail, disabled, onClick }: VersionButtonProps) => (
  <button
    type="button"
    className={`btn-fixed ${styles.versionButton}`}
    data-test-id={testId}
    disabled={disabled}
    onClick={onClick}
  >
    {label}
    <span className={styles.versionButtonDetail}>{detail}</span>
  </button>
)
