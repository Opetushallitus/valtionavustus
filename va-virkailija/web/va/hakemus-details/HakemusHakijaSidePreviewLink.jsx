import React, { Component } from "react";

export default class HakemusHakijaSidePreviewLink extends Component {
  render() {
    const hakemus = this.props.hakemus;
    const avustushaku = this.props.avustushaku;
    const avustushakuId = avustushaku.id;
    const previewUrl = hakemus
      ? "/hakemus-preview/" + avustushakuId + "/" + hakemus["user-key"]
      : undefined;

    return hakemus && hakemus["user-key"] ? (
      <span className="preview-links">
        <span className="preview-links">Hakemus:</span>
        <a
          href={previewUrl}
          className="preview-links"
          target="_blank"
          rel="noopener noreferrer"
          data-test-id="hakemus-printable-link"
        >
          Tulostusversio
        </a>
        |
        <a
          href={previewUrl + "?decision-version=true"}
          className="preview-links"
          target="_blank"
          rel="noopener noreferrer"
        >
          Alkuperäinen
        </a>
      </span>
    ) : (
      <span />
    );
  }
}
