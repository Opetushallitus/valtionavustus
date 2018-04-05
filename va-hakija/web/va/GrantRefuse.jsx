import React from "react"
import LocalizedString from 'soresu-form/web/form/component/LocalizedString.jsx'

export default class FormContainer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {isChecked: false}
    this.onCheckedChange = this.onCheckedChange.bind(this)
  }

  onCheckedChange() {
    this.setState({isChecked: !this.state.isChecked})
  }

  render() {
    const configuration = this.props.state.configuration
    const translations = configuration.translations
    const lang = configuration.lang
    const status = this.props.state.saveStatus.savedObject.status
    return (
      <section className="container-section">
        <div>
          <h3>
            <LocalizedString translations={translations.form}
                             translationKey="grant-refuse-title" lang={lang}/>
          </h3>
          {status === "refused" &&
            <div>
                <LocalizedString translations={translations.form}
                                 translationKey="grant-refuse-sent" lang={lang}/>
            </div>}
          <div className={status === "denied" ? "disabled" : null}>
            <p>
              <LocalizedString translations={translations.form}
                               translationKey="grant-refuse-info" lang={lang}/>
            </p>
            <div>
              <div>
                <label className="checkbox-label">
                  <input type="checkbox"
                         checked={this.state.isChecked}
                         onChange={this.onCheckedChange}/>
                  <LocalizedString translations={translations.form}
                                   translationKey="grant-refuse-accept"
                                   lang={lang}/>
                </label>
              </div>
              <button className="soresu-text-button"
                      disabled={!this.state.isChecked}
                      onClick={this.props.onRefuseClick}>
                <LocalizedString translations={translations.form}
                                 translationKey="grant-refuse-send"
                                 lang={lang}/>
              </button>
            </div>
          </div>
        </div>
      </section>)
  }
}
