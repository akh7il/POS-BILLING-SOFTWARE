import React from 'react'
import { NavLink } from 'react-router-dom'
import './Options.css'

export default function Options() {
    return (
        <div className='staff-options'>

            <NavLink to='/staff/sales'>
                <i className='fa-brands fa-shopify staff-options-icon'></i>
                <span>sales</span>
            </NavLink>

            <NavLink to='/staff/purchase'>
                <i className='fa-solid fa-truck-moving staff-options-icon'></i>
                <span>purchase</span>
            </NavLink>

            <NavLink to='/staff/return'>
                <i className='fa-solid fa-circle-left staff-options-icon'></i>
                <span>return</span>
            </NavLink>

            <NavLink to='/staff/ledger'>
                <i className='fa-solid fa-table-list staff-options-icon'></i>
                <span>ledger</span>
            </NavLink>
        </div>
    )
}