import { getDocument } from 'pdfjs-dist'
import type { Blob } from 'node:buffer'

export const getPdfFirstPageTextContent = async (pdfBlob: Blob) => {
  const data = await pdfBlob.arrayBuffer()
  const pdf = await getDocument({ data }).promise
  const firstPage = await pdf.getPage(1)
  const allTextContent = await firstPage.getTextContent({
    includeMarkedContent: false,
  })
  return allTextContent.items
    .flatMap((item) => {
      if ('str' in item) {
        return item.str
      }
      return []
    })
    .join()
}
