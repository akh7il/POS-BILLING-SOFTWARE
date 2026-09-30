import React, { useEffect, useState } from 'react'
import {getSales,deleteSale} from '../../../services/saleService'
import './Sales.css'

export default function Sales() {

    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})
    const [selectedSale, setSelectedSale] = useState(null)

    useEffect(() => {
        fetchSales()
    }, [])

    const fetchSales = async () => {
        try {
            setLoading(true)

            const data = await getSales()

            setSales(data)
        } catch (error) {
            setSales([])
            setErrors({
                general:
                    error.response?.data?.detail ||
                    error.response?.data?.error ||
                    'unable to fetch sales'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleView = (sale) => {
        setSelectedSale(sale)
    }

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this invoice?'
        )

        if (!confirmed) {
            return
        }

        try {
            await deleteSale(id)

            setSales((previous) =>
                previous.filter((sale) => sale.id !== id)
            )
        } catch (error) {
            const backendErrors = error.response?.data || {}

            setErrors({
                general:
                    backendErrors.error ||
                    backendErrors.detail ||
                    'unable to delete sale'
            })
        }
    }

    const formatDate = (iso) => {
        if (!iso) return '—'
        const d = new Date(iso)
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const year = d.getFullYear()
        return `${day}-${month}-${year}`
    }

    const formatTime = (iso) => {
        if (!iso) return '—'
        const d = new Date(iso)
        return d.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatMoney = (value) => {
        const n = Number(value)
        if (isNaN(n)) return '0.00'
        return n.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })
    }

    return (

        <div className='sales'>

            <div className='sales-top'>

                <h1>sales</h1>

            </div>

            {errors.general && (
                <div className='sales-error'>
                    {errors.general}
                </div>
            )}

            <div className='display-sales'>

                <table>

                    <thead>
                        <tr>
                            <th>invoice number</th>
                            <th>date</th>
                            <th>time</th>
                            <th>amount</th>
                            <th>payment type</th>
                            <th colSpan='2'>options</th>
                        </tr>
                    </thead>

                    <tbody>

                        {loading && sales.length === 0 ? (
                            <tr>
                                <td colSpan='7'>loading...</td>
                            </tr>
                        ) : sales.length === 0 ? (
                            <tr>
                                <td colSpan='7'>no sales found</td>
                            </tr>
                        ) : (
                            sales.map((sale) => (
                                <tr key={sale.id}>

                                    <td>{sale.invoice_no}</td>
                                    <td>{formatDate(sale.created_at)}</td>
                                    <td>{formatTime(sale.created_at)}</td>
                                    <td>₹{formatMoney(sale.total_payable)}</td>
                                    <td>{sale.payment_type?.toLowerCase()}</td>

                                    <td>
                                        <button
                                            type='button'
                                            className='edit-sale'
                                            onClick={() => handleView(sale)}>
                                            <i className='fa-solid fa-eye'></i>
                                        </button>
                                    </td>

                                    <td>
                                        <button
                                            type='button'
                                            className='delete-sale'
                                            onClick={() => handleDelete(sale.id)}>
                                            <i className='fa-solid fa-trash'></i>
                                        </button>
                                    </td>

                                </tr>
                            ))
                        )}

                    </tbody>

                </table>

            </div>

            {selectedSale && (
                <div className='sale-detail-overlay'>
                    <div className='sale-detail'>

                        <div className='sale-detail-header'>
                            <h2>invoice {selectedSale.invoice_no}</h2>
                            <button
                                type='button'
                                className='close-sale-detail'
                                onClick={() => setSelectedSale(null)}>
                                <i className='fa-solid fa-xmark'></i>
                            </button>
                        </div>

                        <div className='sale-detail-meta'>
                            <div>
                                <span>date</span>
                                <strong>{formatDate(selectedSale.created_at)}</strong>
                            </div>
                            <div>
                                <span>time</span>
                                <strong>{formatTime(selectedSale.created_at)}</strong>
                            </div>
                            <div>
                                <span>staff</span>
                                <strong>{selectedSale.staff_name}</strong>
                            </div>
                            <div>
                                <span>payment</span>
                                <strong>{selectedSale.payment_type?.toLowerCase()}</strong>
                            </div>
                        </div>

                        <div className='sale-detail-customer'>
                            <h3>customer</h3>
                            <div>
                                <span>phone</span>
                                <strong>{selectedSale.customer_phone || '—'}</strong>
                            </div>
                            <div>
                                <span>email</span>
                                <strong>{selectedSale.customer_email || '—'}</strong>
                            </div>
                            <div>
                                <span>address</span>
                                <strong>{selectedSale.customer_address || '—'}</strong>
                            </div>
                        </div>

                        <div className='sale-detail-items'>
                            <h3>items</h3>

                            <table>
                                <thead>
                                    <tr>
                                        <th>barcode</th>
                                        <th>name</th>
                                        <th>qty</th>
                                        <th>mrp</th>
                                        <th>discount</th>
                                        <th>payable</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSale.items?.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.barcode}</td>
                                            <td>{item.name}</td>
                                            <td>{item.quantity}</td>
                                            <td>₹{formatMoney(item.mrp)}</td>
                                            <td>₹{formatMoney(item.discount)}</td>
                                            <td>₹{formatMoney(item.payable)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className='sale-detail-totals'>
                            <div>
                                <span>subtotal</span>
                                <strong>₹{formatMoney(selectedSale.subtotal)}</strong>
                            </div>
                            <div>
                                <span>discount</span>
                                <strong>₹{formatMoney(selectedSale.total_discount)}</strong>
                            </div>
                            <div className='grand-total'>
                                <span>payable</span>
                                <strong>₹{formatMoney(selectedSale.total_payable)}</strong>
                            </div>
                        </div>

                    </div>
                </div>
            )}

        </div>

    )
}