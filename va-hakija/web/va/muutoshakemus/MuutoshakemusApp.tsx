import React from 'react'
import ReactDOM from 'react-dom'

import { MuutoshakemusComponent } from './Muutoshakemus'
import { Paatos } from './Paatos'

const app = location.pathname.endsWith('/paatos')
  ? <Paatos />
  : <MuutoshakemusComponent />

ReactDOM.render(app, document.getElementById('app'))
