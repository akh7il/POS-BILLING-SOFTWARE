import React, { useState } from 'react'
import { createPurchase } from '../../../services/purchaseService'
import './PurchaseBilling.css'

export default function PurchaseBilling() {

    const [purchase, setPurchase] = useState({
        invoiceNumber: '',
        invoiceDate: '',
        supplierCode: ''
    })

    const [product, setProduct] = useState({
        barcode: '',
        name: '',
        categoryCode: '',
        stock: 0,
        landingPrice: '',
        mrp: ''
    })

    const [purchaseProducts, setPurchaseProducts] = useState([])

    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})
    const [success, setSuccess] = useState(null)

    const clearError = (field) => {
        setErrors((previous) => {
            const next = { ...previous }
            delete next[field]
            delete next.general
            return next
        })
    }

    const handlePurchaseChange = (e) => {
        const { name, value } = e.target

        setPurchase({ ...purchase, [name]: value })
        clearError(name)
    }

    const handleSupplierCode = (e) => {
        setPurchase({
            ...purchase,
            supplierCode: e.target.value.toUpperCase()
        })
        clearError('supplierCode')
    }

    const handleProductChange = (e) => {
        const { name, value } = e.target
        let cleaned = value

        if (name === 'stock') {
            cleaned = value.replace(/\D/g, '')
        } else if (name === 'landingPrice' || name === 'mrp') {
            cleaned = value.replace(/[^0-9.]/g, '')
            const parts = cleaned.split('.')
            if (parts.length > 2) {
                cleaned = parts[0] + '.' + parts.slice(1).join('')
            }
        } else if (name === 'categoryCode') {
            cleaned = value.toUpperCase()
        }

        setProduct({ ...product, [name]: cleaned })
        clearError(name)
    }

    const validateProduct = () => {
        const itemErrors = {}

        if (!product.barcode.trim()) {
            itemErrors.barcode = 'barcode is required'
        }

        if (!product.name.trim()) {
            itemErrors.name = 'product name is required'
        }

        if (!product.categoryCode.trim()) {
            itemErrors.categoryCode = 'category code is required'
        }

        if (
            !product.stock ||
            Number(product.stock) <= 0 ||
            !Number.isInteger(Number(product.stock))
        ) {
            itemErrors.stock = 'stock must be a whole number greater than 0'
        }

        if (!product.landingPrice || Number(product.landingPrice) <= 0) {
            itemErrors.landingPrice = 'landing price must be greater than 0'
        }

        if (!product.mrp || Number(product.mrp) <= 0) {
            itemErrors.mrp = 'MRP must be greater than 0'
        }

        if (
            product.landingPrice && product.mrp &&
            Number(product.landingPrice) > Number(product.mrp)
        ) {
            itemErrors.landingPrice = 'landing price cannot exceed MRP'
        }

        const duplicate = purchaseProducts.find(
            item => item.barcode === product.barcode.trim()
        )

        if (duplicate) {
            itemErrors.barcode = 'this barcode is already in the list'
        }

        return itemErrors
    }

    const addProduct = () => {

        const itemErrors = validateProduct()

        if (Object.keys(itemErrors).length > 0) {
            setErrors(itemErrors)
            return
        }

        setPurchaseProducts([
            ...purchaseProducts,
            {
                barcode: product.barcode.trim(),
                name: product.name.trim(),
                categoryCode: product.categoryCode.trim().toUpperCase(),
                stock: Number(product.stock),
                landingPrice: Number(product.landingPrice),
                mrp: Number(product.mrp)
            }
        ])

        setProduct({
            barcode: '',
            name: '',
            categoryCode: '',
            stock: 1,
            landingPrice: '',
            mrp: ''
        })

        setErrors({})
    }

    const removeProduct = (barcode) => {
        setPurchaseProducts(
            purchaseProducts.filter(item => item.barcode !== barcode)
        )
    }

    const totalProducts = purchaseProducts.length

    const totalStock = purchaseProducts.reduce(
        (total, item) => total + item.stock,
        0
    )

    const totalPurchaseAmount = purchaseProducts.reduce(
        (total, item) => total + (item.landingPrice * item.stock),
        0
    )

    const validatePurchase = () => {
        const newErrors = {}

        if (!purchase.invoiceNumber.trim()) {
            newErrors.invoiceNumber = 'invoice number is required'
        }

        if (!purchase.invoiceDate) {
            newErrors.invoiceDate = 'invoice date is required'
        }

        if (!purchase.supplierCode.trim()) {
            newErrors.supplierCode = 'supplier code is required'
        }

        if (purchaseProducts.length === 0) {
            newErrors.general = 'add at least one product'
        }

        return newErrors
    }

    const savePurchase = async (e) => {
        e.preventDefault()

        const purchaseErrors = validatePurchase()

        if (Object.keys(purchaseErrors).length > 0) {
            setErrors(purchaseErrors)
            return
        }

        try {
            setLoading(true)
            setErrors({})

            const payload = {
                invoice_number: purchase.invoiceNumber.trim(),
                invoice_date: purchase.invoiceDate,
                supplier_code: purchase.supplierCode.trim().toUpperCase(),
                items: purchaseProducts.map(item => ({
                    barcode: item.barcode,
                    name: item.name,
                    category_code: item.categoryCode,
                    quantity: item.stock,
                    landing_price: item.landingPrice,
                    mrp: item.mrp
                }))
            }

            const created = await createPurchase(payload)

            setSuccess(created)

            setPurchase({
                invoiceNumber: '',
                invoiceDate: '',
                supplierCode: ''
            })
            setPurchaseProducts([])

        } catch (error) {
            const backend = error.response?.data || {}
            const formatted = {}

            Object.keys(backend).forEach((field) => {
                const mapped =
                    field === 'invoice_number' ? 'invoiceNumber' :
                        field === 'invoice_date' ? 'invoiceDate' :
                            field === 'supplier_code' ? 'supplierCode' :
                                field

                const value = backend[field]

                if (Array.isArray(value)) {
                    if (field === 'items' && typeof value[0] === 'object') {
                        Object.keys(value[0]).forEach((inner) => {
                            const innerValue = value[0][inner]
                            formatted[inner] = Array.isArray(innerValue)
                                ? innerValue[0]
                                : innerValue
                        })
                    } else {
                        formatted[mapped] = value[0]
                    }
                } else if (typeof value === 'string') {
                    formatted[mapped] = value
                }
            })

            if (!error.response) {
                formatted.general = 'cannot reach server'
            } else if (error.response.status === 401) {
                formatted.general = 'session expired — login again'
            } else if (Object.keys(formatted).length === 0) {
                formatted.general =
                    backend.detail ||
                    backend.error ||
                    `error ${error.response.status}`
            }

            setErrors(formatted)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='purchase'>

            <div className='purchase-header'>
                <div>
                    <h1>purchase</h1>
                    <p>record incoming stock purchase</p>
                </div>
            </div>

            {success && (
                <div className='purchase-success'>
                    purchase <strong>{success.invoice_number}</strong> saved — total ₹{success.total_amount}
                    <button onClick={() => setSuccess(null)}>dismiss</button>
                </div>
            )}

            {errors.general && (
                <div className='purchase-error'>
                    {errors.general}
                </div>
            )}

            <div className='purchase-content'>

                <div className='purchase-left'>

                    <div className='purchase-invoice-section'>

                        <h2>purchase details</h2>

                        <div className='purchase-invoice-grid'>

                            <div className='input-group'>
                                <label>invoice number</label>
                                <input
                                    type='text'
                                    name='invoiceNumber'
                                    placeholder={errors.invoiceNumber || 'enter invoice number'}
                                    value={purchase.invoiceNumber}
                                    onChange={handlePurchaseChange}/>
                            </div>

                            <div className='input-group'>
                                <label>invoice date</label>
                                <input
                                    type='date'
                                    name='invoiceDate'
                                    value={purchase.invoiceDate}
                                    onChange={handlePurchaseChange}/>
                            </div>

                            <div className='input-group'>
                                <label>supplier code</label>
                                <input
                                    type='text'
                                    name='supplierCode'
                                    placeholder={errors.supplierCode || 'enter supplier code (e.g. SUP001)'}
                                    value={purchase.supplierCode}
                                    onChange={handleSupplierCode}/>
                            </div>

                        </div>

                    </div>

                    <div className='purchase-products'>

                        <h2>arrived products</h2>

                        <div className='purchase-product-details'>

                            <div className='purchase-product-grid'>

                                <div className='input-group'>
                                    <label>barcode</label>
                                    <input
                                        type='text'
                                        name='barcode'
                                        placeholder={errors.barcode || 'enter barcode'}
                                        value={product.barcode}
                                        onChange={handleProductChange}/>
                                </div>

                                <div className='input-group'>
                                    <label>product name</label>
                                    <input
                                        type='text'
                                        name='name'
                                        placeholder={errors.name || 'enter product name'}
                                        value={product.name}
                                        onChange={handleProductChange}/>
                                </div>

                                <div className='input-group'>
                                    <label>category code</label>
                                    <input
                                        type='text'
                                        name='categoryCode'
                                        placeholder={errors.categoryCode || 'e.g. CAT001'}
                                        value={product.categoryCode}
                                        onChange={handleProductChange}/>
                                </div>

                                <div className='input-group'>
                                    <label>stock</label>
                                    <input
                                        type='text'
                                        inputMode='numeric'
                                        name='stock'
                                        placeholder={errors.stock || 'enter stock'}
                                        value={product.stock}
                                        onChange={handleProductChange}/>
                                </div>

                                <div className='input-group'>
                                    <label>landing price</label>
                                    <input
                                        type='text'
                                        inputMode='decimal'
                                        name='landingPrice'
                                        placeholder={errors.landingPrice || 'enter landing price'}
                                        value={product.landingPrice}
                                        onChange={handleProductChange}/>
                                </div>

                                <div className='input-group'>
                                    <label>mrp</label>
                                    <input
                                        type='text'
                                        inputMode='decimal'
                                        name='mrp'
                                        placeholder={errors.mrp || 'enter mrp'}
                                        value={product.mrp}
                                        onChange={handleProductChange}/>
                                </div>

                            </div>

                            <button
                                type='button'
                                className='add-purchase-product'
                                onClick={addProduct}>
                                add product
                                <i className='fa-solid fa-circle-plus'></i>
                            </button>

                        </div>

                    </div>

                    <div className='purchase-product-table-section'>

                        <h2>purchase products</h2>

                        <div className='purchase-product-table'>

                            <table>

                                <thead>
                                    <tr>
                                        <th>barcode</th>
                                        <th>product</th>
                                        <th>category code</th>
                                        <th>stock</th>
                                        <th>landing price</th>
                                        <th>mrp</th>
                                        <th>option</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {purchaseProducts.length > 0 ? (
                                        purchaseProducts.map(item => (
                                            <tr key={item.barcode}>
                                                <td>{item.barcode}</td>
                                                <td>{item.name}</td>
                                                <td>{item.categoryCode}</td>
                                                <td>{item.stock}</td>
                                                <td>₹{item.landingPrice}</td>
                                                <td>₹{item.mrp}</td>
                                                <td>
                                                    <button
                                                        type='button'
                                                        className='remove-purchase-product'
                                                        onClick={() =>
                                                            removeProduct(item.barcode)
                                                        }
                                                    >
                                                        <i className='fa-solid fa-trash'></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan='7'
                                                className='empty-purchase'
                                            >
                                                no products added
                                            </td>
                                        </tr>
                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>

                <div className='purchase-right'>

                    <div className='purchase-summary'>

                        <h2>purchase summary</h2>

                        <div className='purchase-summary-details'>

                            <div>
                                <span>products</span>
                                <strong>{totalProducts}</strong>
                            </div>

                            <div>
                                <span>total stock</span>
                                <strong>{totalStock}</strong>
                            </div>

                            <div className='purchase-total'>
                                <span>total amount</span>
                                <strong>₹{totalPurchaseAmount}</strong>
                            </div>

                        </div>

                        <button
                            type='button'
                            className='save-purchase'
                            onClick={savePurchase}
                            disabled={loading}
                        >
                            {loading ? 'saving...' : 'save purchase'}
                        </button>

                    </div>

                </div>

            </div>

        </div>
    )
}