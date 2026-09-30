import React from 'react'
import './Navbar.css'

export default function Navbar() {
    return (
        <div className='navbar'>
            <div className='navbar-left'>
                <h3>
                    welcome back <span className='admin-name'>akhil</span>
                </h3>
            </div>
            <div className='navbar-middle'>
                <h1>vastra adminpanel</h1>
            </div>
            <div className='navbar-right'>
                <i class="fa-solid fa-user profile"></i>
            </div>
        </div>
    )
}