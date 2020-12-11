import React from 'react'
import ReactDOM from 'react-dom'

import { Muutoshakemus } from './Muutoshakemus'
import { Paatos } from './Paatos'

const app = location.pathname.endsWith('/paatos')
  ? <Paatos />
  : <Muutoshakemus />

ReactDOM.render(app, document.getElementById('app'))
