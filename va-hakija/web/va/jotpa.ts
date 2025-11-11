export function isJotpaAvustushaku(avustushakuOperationalUnitCode: string | undefined) {
  if (!avustushakuOperationalUnitCode) return false

  return avustushakuOperationalUnitCode === '6600105300'
}
