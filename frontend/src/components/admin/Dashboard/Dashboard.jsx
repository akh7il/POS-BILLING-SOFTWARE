import React, { useEffect, useState } from 'react'
import { getDashboardSummary } from '../../../services/dashboardService'
import './Dashboard.css'

export default function Dashboard() {

    const [summary, setSummary] = useState(null)
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})

    useEffect(() => {
        fetchSummary()
    }, [])

    const fetchSummary = async () => {
        try {
            setLoading(true)

            const data = await getDashboardSummary()

            setSummary(data)
        } catch (error) {
            setErrors({
                general:
                    error.response?.data?.detail ||
                    error.response?.data?.error ||
                    'unable to fetch dashboard'
            })
        } finally {
            setLoading(false)
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

    const s = summary || {}

    return (
        <div className='dashboard'>

            {errors.general && (
                <div className='dashboard-error'>
                    {errors.general}
                </div>
            )}

            <div className='dashboard-top'>
                <div className='dashboard-top-cards'>
                    <p className='dashboard-top-cards-head'>today sales</p>
                    <p className='dashboard-top-cards-value'>
                        {s.today_sales_count ?? 0}
                    </p>
                </div>

                <div className='dashboard-top-cards'>
                    <p className='dashboard-top-cards-head'>today transactions</p>
                    <p className='dashboard-top-cards-value'>
                        {s.today_transactions ?? 0}
                    </p>
                </div>

                <div className='dashboard-top-cards'>
                    <p className='dashboard-top-cards-head'>sold products</p>
                    <p className='dashboard-top-cards-value'>
                        {s.today_sold_products ?? 0}
                    </p>
                </div>

                <div className='dashboard-top-cards'>
                    <p className='dashboard-top-cards-head'>cash</p>
                    <p className='dashboard-top-cards-value'>
                        ₹{formatMoney(s.today_cash)}
                    </p>
                </div>

                <div className='dashboard-top-cards'>
                    <p className='dashboard-top-cards-head'>upi</p>
                    <p className='dashboard-top-cards-value'>
                        ₹{formatMoney(s.today_upi)}
                    </p>
                </div>

                <div className='dashboard-top-cards'>
                    <p className='dashboard-top-cards-head'>returns</p>
                    <p className='dashboard-top-cards-value'>
                        {s.today_returns_count ?? 0}
                    </p>
                </div>

                <div className='dashboard-top-cards'>
                    <p className='dashboard-top-cards-head'>refund</p>
                    <p className='dashboard-top-cards-value'>
                        ₹{formatMoney(s.today_refund)}
                    </p>
                </div>
            </div>

            <div className='dashboard-middle'>
                <h3>recent transactions</h3>
                <div className='dashboard-middle-table'>
                    <table>
                        <thead>
                            <tr>
                                <th>invoice</th>
                                <th>date</th>
                                <th>time</th>
                                <th>customer</th>
                                <th>amount</th>
                                <th>payment</th>
                                <th>status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && !summary ? (
                                <tr>
                                    <td colSpan='7'>loading...</td>
                                </tr>
                            ) : (s.recent_sales || []).length === 0 ? (
                                <tr>
                                    <td colSpan='7'>no transactions yet</td>
                                </tr>
                            ) : (
                                s.recent_sales.map((sale) => (
                                    <tr key={sale.id}>
                                        <td>{sale.invoice_no}</td>
                                        <td>{formatDate(sale.created_at)}</td>
                                        <td>{formatTime(sale.created_at)}</td>
                                        <td>{sale.customer_phone || '—'}</td>
                                        <td>₹{formatMoney(sale.total_payable)}</td>
                                        <td>{sale.payment_type?.toLowerCase()}</td>
                                        <td>{sale.status}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className='dashboard-bottom'>
                <h3>low stocks (less than 10)</h3>
                <div className='dashboard-bottom-table'>
                    <table>
                        <thead>
                            <tr>
                                <th>barcode</th>
                                <th>name</th>
                                <th>category</th>
                                <th>stock</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && !summary ? (
                                <tr>
                                    <td colSpan='4'>loading...</td>
                                </tr>
                            ) : (s.low_stock_products || []).length === 0 ? (
                                <tr>
                                    <td colSpan='4'>no low stock products</td>
                                </tr>
                            ) : (
                                s.low_stock_products.map((product) => (
                                    <tr key={product.id}>
                                        <td>{product.barcode}</td>
                                        <td>{product.name}</td>
                                        <td>{product.category_name}</td>
                                        <td>{product.stock}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}