import React from 'react'
import { NavLink, NavLinkProps } from 'react-router-dom'

export const NavLinkWithQuery = ({ to, ...rest }: NavLinkProps) => (
  <NavLink to={to + window.location.search} {...rest}></NavLink>
)
