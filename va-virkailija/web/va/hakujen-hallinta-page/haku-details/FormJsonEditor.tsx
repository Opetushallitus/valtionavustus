import React from 'react'
import _ from 'lodash'
import { Form } from 'soresu-form/web/va/types'
import { useHakujenHallintaDispatch } from '../hakujenHallintaStore'
import { VirkailijaAvustushaku, formJsonUpdated, formUpdated, saveForm } from '../hakuReducer'

function scrollToTop() {
  window.scrollTo(0, 0)
}

interface FormEditorProps {
  avustushaku: VirkailijaAvustushaku
  formDraftJson: string
}

const FormJsonEditor = ({ avustushaku, formDraftJson }: FormEditorProps) => {
  const dispatch = useHakujenHallintaDispatch()
  const userHasEditPrivilege = avustushaku.privileges && avustushaku.privileges['edit-haku']
  const hakuIsDraft = avustushaku.status === 'draft'
  const avustushakuId = avustushaku.id
  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(formJsonUpdated({ avustushakuId, newFormJson: e.target.value }))
    try {
      const parsedDraft = JSON.parse(e.target.value)
      dispatch(formUpdated({ avustushakuId, newForm: parsedDraft }))
    } catch (e) {}
  }
  const onClick = () => {
    dispatch(saveForm({ avustushakuId, form: JSON.parse(formDraftJson) }))
  }

  let parsedForm: Form | null = null
  let parseError = false
  try {
    parsedForm = JSON.parse(formDraftJson)
  } catch (error: any) {
    parseError = error.toString()
  }
  const saveDisabledError = (() => {
    if (!userHasEditPrivilege) {
      return 'Sinulla ei ole muokkausoikeutta tähän lomakkeeseen'
    }
    if (parseError) {
      return 'Virhe Hakulomakkeen sisältö -kentässä'
    }
    if (!hakuIsDraft) {
      return 'Hakua ei voi muokata koska se ei ole luonnostilassa'
    }
    return null
  })()
  const allowSave = userHasEditPrivilege && !parseError && hakuIsDraft
  const formHasBeenEdited =
    formDraftJson && avustushaku.formContent && !_.isEqual(parsedForm, avustushaku.formContent)
  const disableSave = !allowSave || !formHasBeenEdited

  return (
    <div className="form-json-editor">
      <h3>Hakulomakkeen sisältö</h3>
      <div className="btn-fixed-container">
        {saveDisabledError && <span>{saveDisabledError}</span>}
        <button className="btn-fixed" type="button" onClick={scrollToTop}>
          Takaisin ylös
        </button>
        <button
          id="saveForm"
          className="btn-fixed"
          type="button"
          disabled={disableSave}
          onClick={onClick}
        >
          Tallenna
        </button>
      </div>
      <span className="error" data-test-id="form-error-state">
        {parseError}
      </span>
      <textarea
        onChange={onChange}
        disabled={!userHasEditPrivilege || avustushaku.status === 'published'}
        value={formDraftJson}
      />
    </div>
  )
}

export default FormJsonEditor
