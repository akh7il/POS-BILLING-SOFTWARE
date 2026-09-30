import React, { useEffect, useState } from 'react'
import { getSales } from '../../../services/saleService'
import './Ledger.css'

export default function Ledger() {

    const today = new Date().toISOString().slice(0, 10)

    const [selectedDate, setSelectedDate] = useState(today)
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})

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

    const saleDate = (iso) => {
        if (!iso) return ''
        const d = new Date(iso)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const filteredSales = sales.filter(
        sale => saleDate(sale.created_at) === selectedDate
    )

    const filteredTotal = filteredSales.reduce(
        (total, sale) => total + Number(sale.total_payable || 0),
        0
    )

    return (
        <div className='ledger'>

            <div className='ledger-top'>

                <h1>ledger</h1>

                <div className='ledger-filter'>
                    <input
                        type='date'
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />

                    <button
                        className='show-ledger'
                        onClick={fetchSales}
                    >
                        show ledger
                    </button>
                </div>

            </div>

            {errors.general && (
                <div className='ledger-error'>
                    {errors.general}
                </div>
            )}

            <div className='display-ledger'>

                <table>

                    <thead>
                        <tr>
                            <th>date</th>
                            <th>time</th>
                            <th>invoice</th>
                            <th>staff</th>
                            <th>payment</th>
                            <th>items</th>
                            <th>discount</th>
                            <th>total</th>
                        </tr>
                    </thead>

                    <tbody>

                        {loading && sales.length === 0 ? (
                            <tr>
                                <td colSpan='8'>loading...</td>
                            </tr>
                        ) : filteredSales.length === 0 ? (
                            <tr>
                                <td colSpan='8' className='no-ledger'>
                                    no sales found for this date
                                </td>
                            </tr>
                        ) : (
                            filteredSales.map((sale) => (
                                <tr key={sale.id}>
                                    <td>{selectedDate}</td>
                                    <td>{formatTime(sale.created_at)}</td>
                                    <td>{sale.invoice_no}</td>
                                    <td>{sale.staff_name}</td>
                                    <td>{sale.payment_type?.toLowerCase()}</td>
                                    <td>{sale.items?.length || 0}</td>
                                    <td>₹{formatMoney(sale.total_discount)}</td>
                                    <td>₹{formatMoney(sale.total_payable)}</td>
                                </tr>
                            ))
                        )}

                    </tbody>

                    {filteredSales.length > 0 && (
                        <tfoot>
                            <tr>
                                <td colSpan='7' className='ledger-total-label'>
                                    total
                                </td>
                                <td className='ledger-total-amount'>
                                    ₹{formatMoney(filteredTotal)}
                                </td>
                            </tr>
                        </tfoot>
                    )}

                </table>

            </div>

        </div>
    )
}