import React from "react";
import styles from "./Pill.module.less";

const pillStyles = {
  green: styles.greenPill,
  red: styles.redPill,
  yellow: styles.yellowPill,
  grey: styles.greyPill,
  blue: styles.bluePill
} as const

interface PillProps {
  color: keyof typeof pillStyles
  text: string
}

export const Pill = ({color, text}: PillProps) =>  (
  <div className={pillStyles[color]}>
    {text}
  </div>
)
