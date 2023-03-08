import React from 'react'

type HakemusHakijaSidePreviewLinkProps = {
  avustushakuId: number
  hakemusUserKey: string
}

export const HakemusHakijaSidePreviewLink = ({
  avustushakuId,
  hakemusUserKey,
}: HakemusHakijaSidePreviewLinkProps) => {
  const previewUrl = '/hakemus-preview/' + avustushakuId + '/' + hakemusUserKey

  return (
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
        href={previewUrl + '?decision-version=true'}
        className="preview-links"
        target="_blank"
        rel="noopener noreferrer"
      >
        Alkuperäinen
      </a>
    </span>
  )
}
