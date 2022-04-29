import React from "react";
import LocalizedString from "soresu-form/web/form/component/LocalizedString.tsx";
import HttpUtil from "soresu-form/web/HttpUtil";

export default class OpenContactsEdit extends React.Component {
  constructor(props) {
    super(props);
    this.onSubmitClick = this.onSubmitClick.bind(this);
  }

  onSubmitClick() {
    const avustusHakuId = this.props.state.avustushaku.id;
    const hakemusId = this.props.state.saveStatus.hakemusId;
    const url = `/api/avustushaku/${avustusHakuId}/hakemus/${hakemusId}/applicant-edit-open`;

    HttpUtil.get(url).then(() => {
      this.props.state.saveStatus.savedObject.version += 1;
      location.reload();
    });
  }

  render() {
    const configuration = this.props.state.configuration;
    const translations = configuration.translations;
    const lang = configuration.lang;

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

            <button
              className="soresu-text-button"
              disabled={this.opened}
              onClick={this.onSubmitClick}
            >
              <LocalizedString
                translations={translations.form}
                translationKey="open-edit-contacts-button"
                lang={lang}
              />
            </button>
          </div>
        </section>
      </section>
    );
  }
}
