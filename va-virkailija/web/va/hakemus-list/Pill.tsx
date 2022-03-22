import React from "react";
import styles from "./Pill.module.less";

interface PillProps {
  color: 'green' | 'red' | 'yellow' | 'grey'
  text: string
}

const pillStyles = {
  green: styles.greenPill,
  red: styles.redPill,
  yellow: styles.yellowPill,
  grey: styles.greyPill
}

export const Pill = ({color, text}: PillProps) =>  (
  <div className={pillStyles[color]}>
    <span>{text}</span>
  </div>
)
