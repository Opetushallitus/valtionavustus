import React from 'react'

const educationLevels = [
  {title: "Yleissivistävä koulutus, ml. varhaiskasvatus",
   blockedBy: ["Varhaiskasvatus",
               "Esiopetus",
               "Perusopetus",
               "Lukiokoulutus",
               "Taiteen perusopetus"]},
  {title: "Varhaiskasvatus",
   isChild: true,
   blockedBy: ["Yleissivistävä koulutus, ml. varhaiskasvatus"]},
  {title: "Esiopetus",
   isChild: true,
   blockedBy: ["Yleissivistävä koulutus, ml. varhaiskasvatus"]},
  {title: "Perusopetus",
   isChild: true,
   blockedBy: ["Yleissivistävä koulutus, ml. varhaiskasvatus"]},
  {title: "Lukiokoulutus",
   isChild: true,
   blockedBy: ["Yleissivistävä koulutus, ml. varhaiskasvatus"]},
  {title: "Taiteen perusopetus",
   isChild: true,
   blockedBy: ["Yleissivistävä koulutus, ml. varhaiskasvatus"]},
  {title: "Ammatillinen koulutus"},
  {title: "Vapaa sivistystyö", isTitle: true},
  {title: "Kansalaisopisto", isChild: true},
  {title: "Kansanopisto", isChild: true},
  {title: "Opintokeskus", isChild: true},
  {title: "Kesäyliopisto", isChild: true},
  {title: "Korkeakoulutus"},
  {title: "Muut hakuryhmät",
   blockedBy: ["Tiedeolympialaistoiminta",
               "Suomi-koulut ja kotiperuskoulut",
               "Muut järjestöt",
               "Kristillisten koulujen kerhotoiminta",
               "Muut"]},
  {title: "Tiedeolympialaistoiminta",
   isChild: true,
   blockedBy: ["Muut hakuryhmät"]},
  {title: "Suomi-koulut ja kotiperuskoulut",
   isChild: true,
   blockedBy: ["Muut hakuryhmät"]},
  {title: "Muut järjestöt", isChild: true, blockedBy: ["Muut hakuryhmät"]},
  {title: "Kristillisten koulujen kerhotoiminta",
   isChild: true,
   blockedBy: ["Muut hakuryhmät"]},
  {title: "Muut", isChild: true, blockedBy: ["Muut hakuryhmät"]}
]

function getId(levelIndex, valueIndex) {
  return `education-level-${levelIndex}-${valueIndex}`
}

function renderItemValues(
  {index, title, values, onChange, isTitle, onAdd, onRemove}) {
  const onAddWithFocusNext = (i) => {
    onAdd()
    setTimeout(() => {
      const next = document.getElementById(getId(index, i + 1))
      if (next) {
        next.focus()
      }
    }, 300)
  }
  return values.map(
    (v, i) => (
      <div key={i}>
        {!isTitle ? (
          <span>
            <input
              id={getId(index, i)}
              value={v}
              onChange={onChange}
              name="education-levels"
              className="education-level-field"
              type="text"
              data-index={i}
              data-title={title}/>
            {v && i === values.length - 1 ?
              <button className="add"
                      onClick={onAddWithFocusNext.bind(null, i)}
                      tabIndex={-1}/> : null}
            {i === values.length > 0 || v ?
              <button className="remove"
                      onClick={onRemove(i)}
                      tabIndex={-1}/> : null}
          </span>
        ): null}
      </div>
    )
  )
}

function renderItem(item) {
  return (
    <tr key={item.index}
        className={item.disabled ? "haku-edit-disabled-form" : null}>
      {item.isChild ? <td/> : null}
      <td>{item.title}</td>
      <td>
        {renderItemValues(item)}
      </td>
      {item.isChild ? null : <td/>}
    </tr>
  )
}

function isBlockedBy(blockers, itemValues) {
  if (blockers) {
    return blockers.find(
      v => itemValues[v] && itemValues[v].find(x => x.length > 0))
  }
  return false
}

export default class EducationLevels extends React.Component {
  render() {
    const {enabled, values, onChange, onAdd, onRemove, grant} = this.props
    const itemValues = (values || []).reduce((a, c) => {
      a[c.rahoitusalue] = c.talousarviotilit
      return a
    }, {})

    return (
      <div className={enabled ? null : "haku-edit-disabled-form"}>
        <h3>Koulutusasteet</h3>
        <table className="education-levels-table">
          <tbody>
            {
              educationLevels.map(
                (el, index) =>
                  renderItem(
                    Object.assign(
                      el,
                      {
                        index: index,
                        values:
                        itemValues[el.title] &&
                          itemValues[el.title].length > 0 ?
                          itemValues[el.title] : [""],
                        onChange: onChange,
                        onAdd: onAdd.bind(null, grant, el.title),
                        onRemove: onRemove.bind(null, grant, el.title),
                        disabled: isBlockedBy(el.blockedBy, itemValues)
                      }
                    )
                  )
              )
            }
          </tbody>
        </table>
      </div>
    )
  }
}
