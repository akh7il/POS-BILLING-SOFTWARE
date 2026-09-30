import React from 'react'
import { NavLink } from 'react-router-dom'
import './Sidebar.css'
import '../../../styles/variable.css'

export default function Sidebar() {

    return (
        <div className='sidebar'>

            <div className='sidebar-top'>
                <h1>vastra adminpanel</h1>
            </div>

            <div className='sidebar-bottom'>
                <ul>

                    <NavLink to='/admin/dashboard'>
                        <i className='fa-solid fa-house'></i>
                        <span>dashboard</span>
                    </NavLink>

                    <NavLink to='/admin/products'>
                        <i className='fa-brands fa-product-hunt'></i>
                        <span>products</span>
                    </NavLink>

                    <NavLink to='/admin/categories'>
                        <i className='fa-solid fa-layer-group'></i>
                        <span>category</span>
                    </NavLink>

                    <NavLink to='/admin/staffs'>
                        <i className='fa-solid fa-user-tie'></i>
                        <span>staff</span>
                    </NavLink>

                    <NavLink to='/admin/suppliers'>
                        <i className='fa-solid fa-truck-moving'></i>
                        <span>suppliers</span>
                    </NavLink>

                    <NavLink to='/admin/inventory'>
                        <i className='fa-solid fa-warehouse'></i>
                        <span>inventory</span>
                    </NavLink>

                    <NavLink to='/admin/returns'>
                        <i className='fa-solid fa-circle-left'></i>
                        <span>product return</span>
                    </NavLink>

                    <NavLink to='/admin/sales'>
                        <i className='fa-brands fa-shopify'></i>
                        <span>sales</span>
                    </NavLink>

                    <NavLink to='/admin/ledger'>
                        <i className='fa-solid fa-table-list'></i>
                        <span>ledger</span>
                    </NavLink>

                </ul>
            </div>

        </div>
    )
}