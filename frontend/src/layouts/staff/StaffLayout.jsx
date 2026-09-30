import React from 'react'
import Navbar from '../../components/staff/Navbar/Navbar'
import Optons from '../../components/staff/Options/Optons'
import './StaffLayout.css'
import { Outlet } from 'react-router-dom'

export default function StaffLayout() {
  return (
    <div className='staff'>
      <Navbar/>
      <Optons/>
      <main>
        <Outlet/>
      </main>
    </div>
  )
}
