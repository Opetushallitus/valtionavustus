import { dropWhile } from 'lodash'

// This is literally best guess
type FormField = InfoElementField | WrapperElementField | any

type FormText = { fi: string; sv: string }
type InfoElementField = {
  fieldClass: 'infoElement'
  id: string
  fieldType: string
  params?: { preview: boolean }
  text: FormText
}

type WrapperElementField = {
  fieldClass: 'wrapperElement'
  id: string
  fieldType: string
  children: FormField[]
  label: FormText
}

export function dropFirstInfoFields(fields: ReadonlyArray<FormField>): FormField[] {
  return dropWhile(fields, (field) => field.fieldClass === 'infoElement')
}
