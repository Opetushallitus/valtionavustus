import React from 'react'
import { Outlet } from 'react-router-dom'

import { Tabs } from './Tabs'

import './Koodienhallinta.less'

export const Koodienhallinta = () => {
  return (
    <div className="koodienhallinta-container">
      <div className="koodienhallinta-body">
        <Tabs />
        <Outlet />
      </div>
    </div>
  )
}
