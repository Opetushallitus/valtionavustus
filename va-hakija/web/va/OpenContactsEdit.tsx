import React from 'react'

import LocalizedString from 'soresu-form/web/form/component/LocalizedString'
import { BaseStateLoopState } from 'soresu-form/web/form/types/Form'
import HttpUtil from 'soresu-form/web/HttpUtil'

type OpenContactsEditProps<T extends BaseStateLoopState<T>> = {
  state: T
}

export default class OpenContactsEdit<T extends BaseStateLoopState<T>> extends React.Component<
  OpenContactsEditProps<T>
> {
  constructor(props: OpenContactsEditProps<T>) {
    super(props)
    this.onSubmitClick = this.onSubmitClick.bind(this)
  }

  onSubmitClick() {
    const avustusHakuId = this.props.state.avustushaku?.id
    const hakemusId = this.props.state.saveStatus.hakemusId
    const url = `/api/avustushaku/${avustusHakuId}/hakemus/${hakemusId}/applicant-edit-open`

    HttpUtil.get(url).then(() => {
      if (this.props.state.saveStatus.savedObject) {
        this.props.state.saveStatus.savedObject.version += 1
      }
      location.reload()
    })
  }

  render() {
    const configuration = this.props.state.configuration
    const translations = configuration.translations
    const lang = configuration.lang

    return (
      <section className="container-section">
        <section id="container">
          <div>
            <h3>
              <LocalizedString
                translations={translations.form}
                translationKey="edit-contacts-title"
                lang={lang}
              />
            </h3>

            <button className="soresu-text-button" onClick={this.onSubmitClick}>
              <LocalizedString
                translations={translations.form}
                translationKey="open-edit-contacts-button"
                lang={lang}
              />
            </button>
          </div>
        </section>
      </section>
    )
  }
}
