import React, {Component} from 'react'
import _ from 'lodash'
import SelvitysPreview from './SelvitysPreview.jsx'
import SelvitysNotFilled from './SelvitysNotFilled.jsx'
import SelvitysLink from './SelvitysLink.jsx'
import SelvitysEmail from './SelvitysEmail.jsx'
import PresenterComment from './PresenterComment.jsx'

const localeString = (num) =>
      (typeof Number.prototype.toLocaleString === "function") ?
      num.toLocaleString() : num.toString()

const renderPayment = (p, i) =>
      <tr key={i}>
        <td>{i + 1}. erä</td>
        <td className="payment-money-column">
          {localeString(p["payment-sum"])} €
        </td>
      </tr>

export default class Selvitys extends Component {
  render() {
    const {controller, hakemus, avustushaku, translations, selvitysType,
           userInfo} = this.props
    const payments = this.props.payments || []
    const hasSelvitys = _.has(hakemus,`selvitys.${selvitysType}.answers`)
    const preview = _.eq(selvitysType, 'valiselvitys')
    const selvitysHakemus = _.get(hakemus,`selvitys.${selvitysType}`)
    const form = _.get(hakemus,`selvitys.${selvitysType}Form`)
    return(
      <div>
        <PresenterComment controller={controller} hakemus={hakemus}/>
        {!hasSelvitys && <SelvitysNotFilled avustushaku={avustushaku} selvitysType={selvitysType}/>}
        {hasSelvitys && <SelvitysPreview hakemus={hakemus}
                                         avustushaku={avustushaku}
                                         translations={translations}
                                         selvitysType={selvitysType}
                                         selvitysHakemus={selvitysHakemus}
                                         form={form}

        />}
        <div>
          <h3>Maksuerät</h3>
          <div>
            Rahoitettavaa yhteensä {localeString(hakemus["budget-total"])} €
          </div>
          <div className="payment-info-columns">
            <table className="payment-info-column">
              <tbody>
                <tr>
                  <td>Omarahoitus</td>
                  <td className="payment-money-column">
                    {localeString(
                      hakemus["budget-total"] - hakemus["budget-oph-share"])} €
                  </td>
                </tr>
                <tr>
                  <td>OPH:n avustus</td>
                  <td className="payment-money-column">
                    {localeString(hakemus["budget-oph-share"])} €
                  </td>
                </tr>
                {payments.map(renderPayment)}
                <tr>
                  <td>{payments.length + 1}. erä</td>
                  <td className="payment-money-column">
                    <input/> €</td>
                </tr>
              </tbody>
            </table>
            <table className="payment-info-column">
              <tbody>
                <tr>
                  <td>Omarahoitus-%</td>
                  <td className="payment-money-column">
                    {avustushaku.content["self-financing-percentage"]}%
                  </td>
                </tr>
                <tr>
                  <td>OPH:n rahoitus-%</td>
                  <td className="payment-money-column">
                    {100 - avustushaku.content["self-financing-percentage"]}%
                  </td>
                </tr>
                <tr>
                  <td>1. erä OPH:n avustussummasta</td>
                  <td className="payment-money-column">
                    {avustushaku.content["payment-min-first-batch"]}%
                  </td>
                </tr>
                <tr>
                  <td>2. erä OPH:n avustussummasta</td>
                  <td className="payment-money-column">
                    {100 - avustushaku.content["payment-min-first-batch"]}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <button>Lisää 2.erä maksatuslistaan</button>
        </div>
        <SelvitysLink avustushaku={avustushaku} hakemus={hakemus} selvitysType={selvitysType} preview={preview} label="Linkki lomakkeelle"/>
        {hasSelvitys && <SelvitysEmail controller={controller}
                                       selvitysType={selvitysType}
                                       hakemus={hakemus}
                                       avustushaku={avustushaku}
                                       selvitysHakemus={selvitysHakemus}
                                       userInfo={userInfo}
                                       lang={selvitysHakemus.language}
                                       translations={translations["selvitys-email"]}/>}
      </div>
    )
  }
}
