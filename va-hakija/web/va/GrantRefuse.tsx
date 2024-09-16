import React from 'react'

import LocalizedString from 'soresu-form/web/form/component/LocalizedString'
import DateUtil from 'soresu-form/web/DateUtil'
import { BaseStateLoopState } from 'soresu-form/web/form/types/Form'

type GrantRefuseProps<T extends BaseStateLoopState<T>> = {
  state: T
  isTokenValid: boolean
  onSubmit: (comment: string) => void
}

type GrantRefuseState = {
  isChecked: boolean
  comment: string
}

export default class GrantRefuse<T extends BaseStateLoopState<T>> extends React.Component<
  GrantRefuseProps<T>,
  GrantRefuseState
> {
  constructor(props: GrantRefuseProps<T>) {
    super(props)
    const refused = this.props.state.saveStatus.savedObject?.refused || false
    const initialComment = refused
      ? (props.state.saveStatus.savedObject?.['refused-comment'] ?? '')
      : ''
    this.state = { isChecked: false, comment: initialComment }
    this.onCheckedChange = this.onCheckedChange.bind(this)
    this.onCommentChange = this.onCommentChange.bind(this)
    this.onSubmitClicked = this.onSubmitClicked.bind(this)
  }

  onCheckedChange() {
    this.setState({ isChecked: !this.state.isChecked })
  }

  onCommentChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    this.setState({ comment: e.target.value })
  }

  onSubmitClicked() {
    this.props.onSubmit(this.state.comment)
  }

  render() {
    const configuration = this.props.state.configuration
    const translations = configuration.translations
    const lang = configuration.lang
    const refused = this.props.state.saveStatus.savedObject?.refused || false
    const refusedAt = this.props.state.saveStatus.savedObject?.['refused-at']
    const isTokenValid = this.props.isTokenValid

    return (
      <section className="container-section">
        <div>
          <h3>
            <LocalizedString
              translations={translations.form}
              translationKey="grant-refuse-title"
              lang={lang}
            />
          </h3>
          {refused && (
            <div>
              <LocalizedString
                translations={translations.form}
                translationKey="grant-refuse-sent"
                lang={lang}
              />
              <span> {DateUtil.asDateTimeString(refusedAt)}</span>
            </div>
          )}
          <div className={refused || !this.props.isTokenValid ? 'disabled' : undefined}>
            <p>
              <LocalizedString
                translations={translations.form}
                translationKey="grant-refuse-info"
                lang={lang}
              />
            </p>
            <div className="soresu-form">
              <div className="refuse-comment soresu-text-area">
                <label>
                  <span className="required soresu-key">Perustelut</span>
                </label>
                <textarea onChange={this.onCommentChange} value={this.state.comment} />
              </div>
              <div>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={this.state.isChecked}
                    onChange={this.onCheckedChange}
                  />
                  <LocalizedString
                    translations={translations.form}
                    translationKey="grant-refuse-accept"
                    lang={lang}
                  />
                </label>
              </div>
              <button
                className="soresu-text-button"
                disabled={!this.state.isChecked || this.state.comment.length === 0}
                onClick={this.onSubmitClicked}
              >
                <LocalizedString
                  translations={translations.form}
                  translationKey="grant-refuse-send"
                  lang={lang}
                />
              </button>
            </div>
          </div>
          {!isTokenValid && !refused ? (
            <div>
              <LocalizedString
                translations={translations.form}
                translationKey="grant-refuse-token-invalid"
                lang={lang}
              />
            </div>
          ) : null}
        </div>
      </section>
    )
  }
}
