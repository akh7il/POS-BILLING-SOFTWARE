import React from 'react'
import './Navbar.css'
import '../../../styles/variable.css'

export default function Navbar() {
  return (
    <div className='navbar'>
        <div className='navbar-brand'>
            vastra
        </div>
        <div className='profile'>
            <i className="fa-solid fa-user"></i>
        </div>
    </div>
  )
}