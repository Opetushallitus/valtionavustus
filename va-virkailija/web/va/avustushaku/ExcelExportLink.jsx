import React, { Component } from 'react'

export default class ExcelExportLink extends Component {
  render() {
    const url = "/api/avustushaku/" + this.props.avustushaku.id + "/export.xslx"
    return <a className="excel-export" href={url} target="_">Lataa Excel</a>
  }
}
