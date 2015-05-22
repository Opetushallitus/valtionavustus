import React from 'react'
import Phantom from './phantom'

import Form from './Form.jsx'

React.render(
  <Form url="/api/form" lang="fi" />,
  document.getElementById('container')
)
