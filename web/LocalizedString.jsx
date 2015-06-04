import React from 'react'

export default class LocalizedString extends React.Component {
  constructor(props) {
    super(props)
  }
  render() {
    var value = this.props.data[this.props.lang]
    if(!value) {
      console.error("No translation found: " + JSON.stringify(this.props))
      for (var i=0; i < this.props.data.length; i++) {
        if(this.props.data[i]) {
          value = this.props.data[i];
          break;
        }
      }
    }
    return (<span>{value}</span>)
  }
}
