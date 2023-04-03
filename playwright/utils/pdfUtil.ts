import { getDocument } from 'pdfjs-dist'

export const getPdfFirstPageTextContent = async (pdfData: Buffer) => {
  const pdf = await getDocument({ data: pdfData }).promise
  const firstPage = await pdf.getPage(1)
  const allTextContent = await firstPage.getTextContent({
    disableCombineTextItems: false,
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
