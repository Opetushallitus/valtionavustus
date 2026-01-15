import React from 'react'

import * as styles from './Switch.module.css'

interface Props {
  onChange: () => void
  checked: boolean
  label: string
}

export function Switch({ checked, onChange, label }: Props) {
  return (
    <label className={styles.switch}>
      <span>{label}</span>
      <input type="checkbox" id={label} onChange={onChange} checked={checked} />
      <i />
    </label>
  )
}
