import React from 'react'
import Sidebar from '../../components/admin/Sidebar/Sidebar'
import Navbar from '../../components/admin/Navbar/Navbar'
import './AdminLayout.css'
import { Outlet } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div className='admin-layout'>
      <Sidebar />
      <div className='admin-main'>
        <Navbar />
        <main>
          <Outlet/>
        </main>
      </div>
    </div>
  )
}