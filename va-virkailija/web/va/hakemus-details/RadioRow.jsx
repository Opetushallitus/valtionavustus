import React from 'react'

const RadioRow = ({name, value, isSelected, allowEditing, onChange}) => {
  const classes = `radio-row radio-row--${isSelected ? 'selected' : 'unselected'}`

  return (
    <div className={classes}>
      <label>{value}
        <input type="radio"
               name={name}
               value={value}
               disabled={!allowEditing}
               checked={isSelected}
               onChange={onChange}/>
      </label>
    </div>
  )
}

export default RadioRow
