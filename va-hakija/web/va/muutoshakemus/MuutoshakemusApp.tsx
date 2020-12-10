import React from 'react'
import ReactDOM from 'react-dom'

import { AppProvider } from './store/context'
import { Muutoshakemus } from './Muutoshakemus'
import { Paatos } from './Paatos'

const app = location.pathname.endsWith('/paatos')
  ? <Paatos />
  : <AppProvider>
      <Muutoshakemus />
    </AppProvider>

ReactDOM.render(app, document.getElementById('app'))
