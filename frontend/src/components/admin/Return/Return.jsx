import React, { useState } from 'react'
import {getReturnsForSale,createReturn} from '../../../services/returnService'
import './Return.css'

export default function Return() {

    const [invoiceNumber, setInvoiceNumber] = useState('')
    const [invoice, setInvoice] = useState(null)
    const [searched, setSearched] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})
    const [success, setSuccess] = useState(null)

    const handleSearch = async () => {
        const invoice = invoiceNumber.trim()

        if (!invoice) {
            setErrors({ search: 'invoice number is required' })
            return
        }

        try {
            setLoading(true)
            setErrors({})
            setSuccess(null)

            const data = await getReturnsForSale(invoice)

            setInvoice(data)
            setSearched(true)

        } catch (error) {
            setInvoice(null)
            setSearched(true)

            if (!error.response) {
                setErrors({ search: 'cannot reach server' })
            } else if (error.response.status === 404) {
                setErrors({ search: 'no invoice found' })
            } else {
                setErrors({
                    search:
                        error.response.data?.error ||
                        `error ${error.response.status}`
                })
            }
        } finally {
            setLoading(false)
        }
    }

    const handleReturn = async (item) => {
        if (item.remaining <= 0) {
            setErrors({ return: 'all units already returned' })
            return
        }

        try {
            setLoading(true)
            setErrors({})
            setSuccess(null)

            const record = await createReturn({
                invoice_no: invoice.invoice_no,
                barcode: item.barcode
            })

            setSuccess(record)

            const refreshed = await getReturnsForSale(invoice.invoice_no)
            setInvoice(refreshed)

        } catch (error) {
            const backend = error.response?.data || {}
            const formatted = {}

            Object.keys(backend).forEach((field) => {
                const value = backend[field]
                if (Array.isArray(value)) {
                    formatted.return = value[0]
                } else if (typeof value === 'string') {
                    formatted.return = value
                }
            })

            if (!error.response) {
                formatted.return = 'cannot reach server'
            } else if (Object.keys(formatted).length === 0) {
                formatted.return = 'unable to process return'
            }

            setErrors(formatted)
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

    return (

        <div className='returns'>

            <div className='returns-top'>

                <h1>returns</h1>

                <div className='return-search'>

                    <input
                        type='text'
                        placeholder={errors.search || 'invoice number'}
                        value={invoiceNumber}
                        onChange={(e) => {
                            setInvoiceNumber(e.target.value)
                            setErrors({})
                            setSuccess(null)
                        }}/>

                    <button
                        className='search-invoice'
                        onClick={handleSearch}
                        disabled={loading}>
                        {loading ? 'searching...' : 'search'}
                    </button>

                </div>

            </div>

            {errors.return && (
                <div className='return-error'>{errors.return}</div>
            )}

            {searched && invoice && (

                <div className='invoice-details'>

                    <div className='invoice-information'>

                        <h2>invoice details</h2>

                        <div className='invoice-info-grid'>

                            <div>
                                <span>invoice number</span>
                                <p>{invoice.invoice_no}</p>
                            </div>

                            <div>
                                <span>purchase date</span>
                                <p>{formatDate(invoice.created_at)}</p>
                            </div>

                            <div>
                                <span>purchase time</span>
                                <p>{formatTime(invoice.created_at)}</p>
                            </div>

                        </div>

                    </div>

                    <div className='customer-information'>

                        <h2>customer details</h2>

                        <div className='customer-info-grid'>

                            <div>
                                <span>phone</span>
                                <p>{invoice.customer_phone || '—'}</p>
                            </div>

                            <div>
                                <span>email</span>
                                <p>{invoice.customer_email || '—'}</p>
                            </div>

                            <div>
                                <span>address</span>
                                <p>{invoice.customer_address || '—'}</p>
                            </div>

                        </div>

                    </div>

                    <div className='purchased-products'>

                        <h2>purchased products</h2>

                        <div className='purchased-products-table'>

                            <table>

                                <thead>
                                    <tr>
                                        <th>barcode</th>
                                        <th>product name</th>
                                        <th>quantity</th>
                                        <th>returned</th>
                                        <th>remaining</th>
                                        <th>mrp</th>
                                        <th>option</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {invoice.items.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.barcode}</td>
                                            <td>{item.name}</td>
                                            <td>{item.quantity}</td>
                                            <td>{item.returned}</td>
                                            <td>{item.remaining}</td>
                                            <td>₹{item.mrp}</td>
                                            <td>
                                                <button
                                                    type='button'
                                                    className='return-button'
                                                    onClick={() => handleReturn(item)}
                                                    disabled={
                                                        item.remaining <= 0 || loading
                                                    }
                                                >
                                                    return
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>

            )}

            {searched && !invoice && !errors.search && (

                <div className='no-order-found'>

                    <i className='fa-solid fa-circle-exclamation'></i>

                    <h2>no order found</h2>

                    <p>
                        No invoice was found with the entered invoice number.
                    </p>

                </div>

            )}

        </div>
    )
}