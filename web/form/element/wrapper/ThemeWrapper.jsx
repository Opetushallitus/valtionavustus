import React from 'react'
import LocalizedString from '../LocalizedString.jsx'

export default class ThemeWrapper extends React.Component {
  render() {
    const field = this.props.field
    const lang = this.props.lang
    const children = this.props.children
    const htmlId = this.props.htmlId
    return (
      <section className="soresu-theme" id={htmlId}>
        <h2><LocalizedString translations={field} translationKey="label" lang={lang}/></h2>
        {children}
      </section>
    )
  }
}