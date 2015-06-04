import React from 'react'

export default class LocalizedString extends React.Component {
  constructor(props) {
    super(props)
  }
  render() {
    var value = this.props.data[this.props.lang]
    if(!value) {
      console.error("No translation found: " + JSON.stringify(this.props))
      for (var key in this.props.data) {
        if (this.props.data[key]) {
          value = this.props.data[key]
          break;
        }
      }
    }
    return (<span>{value}</span>)
  }
}
