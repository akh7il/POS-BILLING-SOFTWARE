import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from '../layouts/admin/AdminLayout'
import Dashboard from '../components/admin/Dashboard/Dashboard'
import Product from '../components/admin/Products/Product'
import Category from '../components/admin/Category/Category'
import Inventory from '../components/admin/Inventory/Inventory'
import Staff from '../components/admin/Staff/Staff'
import Supplier from '../components/admin/Supplier/Supplier'
import Sales from '../components/admin/Sales/Sales'
import Return from '../components/admin/Return/Return'
import Ledger from '../components/admin/Ledger/Ledger'
import Login from '../pages/auth/Login'
import StaffLayout from '../layouts/staff/StaffLayout'
import PurchaseBilling from '../components/staff/PurchaseBilling/PurchaseBilling'
import SalesBilling from '../components/staff/SalesBilling/SalesBilling'

export default function AppRoutes() {

    return (

        <BrowserRouter>

            <Routes>

                <Route path='/' element={<Navigate to='/login' />} />

                <Route path='/login' element={<Login />} />

                <Route path='/admin' element={<AdminLayout />}>

                    <Route path='dashboard' element={<Dashboard />} />

                    <Route path='products' element={<Product />} />

                    <Route path='categories' element={<Category />} />

                    <Route path='inventory' element={<Inventory />} />

                    <Route path='staffs' element={<Staff />} />

                    <Route path='suppliers' element={<Supplier />} />

                    <Route path='sales' element={<Sales />} />

                    <Route path='returns' element={<Return />} />

                    <Route path='ledger' element={<Ledger />} />

                    <Route
                        index
                        element={<Navigate to='/admin/dashboard' replace />}
                    />

                </Route>

                <Route path='/staff' element={<StaffLayout />}>

                    <Route path='sales' element={<SalesBilling />} />

                    <Route path='returns' element={<Return />} />

                    <Route path='purchase' element={<PurchaseBilling />} />

                    <Route path='ledger' element={<Ledger />} />

                    <Route
                        index
                        element={<Navigate to='/staff/sales' replace />}
                    />

                </Route>

            </Routes>

        </BrowserRouter>

    )
}