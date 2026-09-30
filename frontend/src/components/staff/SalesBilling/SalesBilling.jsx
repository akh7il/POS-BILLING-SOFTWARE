import React, { useEffect, useState } from 'react'
import { getProducts } from '../../../services/productService'
import { createSale } from '../../../services/saleService'
import './SalesBilling.css'

export default function SalesBilling() {

    const [customer, setCustomer] = useState({
        phone: '',
        email: '',
        address: ''
    })

    const [barcode, setBarcode] = useState('')
    const [quantity, setQuantity] = useState(1)
    const [discount, setDiscount] = useState(0)
    const [paymentType, setPaymentType] = useState('')

    const [selectedProduct, setSelectedProduct] = useState(null)
    const [saleItems, setSaleItems] = useState([])
    const [products, setProducts] = useState([])

    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})
    const [success, setSuccess] = useState(null)

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        try {
            const data = await getProducts()
            setProducts(data)
        } catch (err) {
            setErrors({
                general: 'unable to load products'
            })
        }
    }

    const clearError = (field) => {
        setErrors((previous) => {
            const next = { ...previous }
            delete next[field]
            delete next.general
            return next
        })
    }

    const handleBarcode = (value) => {
        setBarcode(value)
        clearError('barcode')

        const product = products.find(
            item => item.barcode === value
        )

        setSelectedProduct(product || null)
    }

    const handleQuantity = (value) => {
        const digitsOnly = value.replace(/\D/g, '')
        setQuantity(digitsOnly)
        clearError('quantity')
    }

    const handleDiscount = (value) => {
        const cleaned = value.replace(/[^0-9.]/g, '')
        const parts = cleaned.split('.')
        const safe =
            parts.length > 2
                ? parts[0] + '.' + parts.slice(1).join('')
                : cleaned

        setDiscount(safe)
        clearError('discount')
    }

    const handlePhone = (value) => {
        const digitsOnly = value.replace(/\D/g, '')
        setCustomer({ ...customer, phone: digitsOnly })
        clearError('phone')
    }

    const handleEmail = (value) => {
        setCustomer({ ...customer, email: value })
        clearError('email')
    }

    const handleAddress = (value) => {
        setCustomer({ ...customer, address: value })
        clearError('address')
    }

    const payableAmount = selectedProduct
        ? (Number(selectedProduct.mrp) * Number(quantity)) - Number(discount || 0)
        : 0

    const validateItem = () => {
        const itemErrors = {}

        if (!barcode.trim()) {
            itemErrors.barcode = 'barcode is required'
        } else if (!selectedProduct) {
            itemErrors.barcode = 'no product found with this barcode'
        }

        if (!quantity || Number(quantity) <= 0) {
            itemErrors.quantity = 'quantity must be at least 1'
        } else if (
            selectedProduct &&
            Number(quantity) > selectedProduct.stock
        ) {
            itemErrors.quantity =
                `only ${selectedProduct.stock} in stock`
        }

        if (discount && Number(discount) < 0) {
            itemErrors.discount = 'discount cannot be negative'
        } else if (
            selectedProduct &&
            Number(discount) >
            (Number(selectedProduct.mrp) * Number(quantity))
        ) {
            itemErrors.discount =
                'discount cannot exceed line total'
        }

        return itemErrors
    }

    const addProduct = () => {

        const itemErrors = validateItem()

        if (Object.keys(itemErrors).length > 0) {
            setErrors(itemErrors)
            return
        }

        const qty = Number(quantity)
        const disc = Number(discount || 0)

        const existingItem = saleItems.find(
            item => item.barcode === selectedProduct.barcode
        )

        if (existingItem) {
            const newQty = existingItem.quantity + qty
            const newDisc = existingItem.discount + disc

            if (newQty > selectedProduct.stock) {
                setErrors({
                    quantity: `only ${selectedProduct.stock} in stock`
                })
                return
            }

            if (
                newDisc >
                (Number(selectedProduct.mrp) * newQty)
            ) {
                setErrors({
                    discount: 'discount cannot exceed line total'
                })
                return
            }

            setSaleItems(
                saleItems.map(item =>
                    item.barcode === selectedProduct.barcode
                        ? {
                            ...item,
                            quantity: newQty,
                            discount: newDisc,
                            payable:
                                (Number(item.mrp) * newQty) - newDisc
                        }
                        : item
                )
            )
        } else {
            setSaleItems([
                ...saleItems,
                {
                    barcode: selectedProduct.barcode,
                    name: selectedProduct.name,
                    category: selectedProduct.category_name,
                    landingPrice: Number(selectedProduct.landing_price),
                    mrp: Number(selectedProduct.mrp),
                    stock: selectedProduct.stock,
                    quantity: qty,
                    discount: disc,
                    payable: payableAmount
                }
            ])
        }

        setBarcode('')
        setQuantity(1)
        setDiscount(0)
        setSelectedProduct(null)
        setErrors({})
    }

    const removeProduct = (barcode) => {
        setSaleItems(
            saleItems.filter(item => item.barcode !== barcode)
        )
    }

    const totalDiscount = saleItems.reduce(
        (total, item) => total + item.discount,
        0
    )

    const totalAmount = saleItems.reduce(
        (total, item) => total + item.payable,
        0
    )

    const validateInvoice = () => {
        const newErrors = {}

        if (saleItems.length === 0) {
            newErrors.general = 'add at least one product'
        }

        if (
            customer.email.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)
        ) {
            newErrors.email = 'invalid email'
        }

        if (!paymentType) {
            newErrors.paymentType = 'select payment type'
        }

        return newErrors
    }

    const handleGenerateInvoice = async () => {

        const invoiceErrors = validateInvoice()

        if (Object.keys(invoiceErrors).length > 0) {
            setErrors(invoiceErrors)
            return
        }

        try {
            setLoading(true)
            setErrors({})

            const payload = {
                customer_phone: customer.phone.trim(),
                customer_email: customer.email.trim(),
                customer_address: customer.address.trim(),
                payment_type: paymentType.toUpperCase(),
                items: saleItems.map(item => ({
                    barcode: item.barcode,
                    quantity: item.quantity,
                    discount: item.discount
                }))
            }

            const sale = await createSale(payload)

            setSuccess(sale)

            setSaleItems([])
            setCustomer({ phone: '', email: '', address: '' })
            setPaymentType('')

            fetchProducts()

        } catch (err) {
            const backend = err.response?.data
            const formatted = {}

            if (!backend) {
                formatted.general = 'cannot reach server'
            } else if (typeof backend === 'object') {
                Object.keys(backend).forEach((field) => {
                    const value = backend[field]

                    if (Array.isArray(value)) {
                        formatted[field] = value[0]
                    } else if (typeof value === 'string') {
                        formatted[field] = value
                    }
                })

                if (Object.keys(formatted).length === 0) {
                    formatted.general = 'failed to create sale'
                }
            } else {
                formatted.general = 'failed to create sale'
            }

            setErrors(formatted)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='sales-billing'>

            <div className='sales-billing-header'>
                <div>
                    <h1>sales</h1>
                    <p>create customer invoice</p>
                </div>
            </div>
            {errors.general && (
                <div className='sale-error'>
                    {errors.general}
                </div>
            )}

            <div className='sales-billing-content'>

                <div className='sales-billing-left'>

                    <div className='customer-section'>

                        <h2>customer details</h2>

                        <div className='customer-grid'>

                            <div className='input-group'>
                                <label>phone number</label>
                                <input
                                    type='text'
                                    inputMode='numeric'
                                    maxLength={10}
                                    placeholder={errors.phone || 'customer phone number'}
                                    value={customer.phone}
                                    onChange={(e) =>
                                        handlePhone(e.target.value)
                                    }
                                />
                            </div>

                            <div className='input-group'>
                                <label>email</label>
                                <input
                                    type='email'
                                    placeholder={errors.email || 'optional'}
                                    value={customer.email}
                                    onChange={(e) =>
                                        handleEmail(e.target.value)
                                    }
                                />
                            </div>

                            <div className='input-group address-input'>
                                <label>address</label>
                                <textarea
                                    placeholder='optional'
                                    value={customer.address}
                                    onChange={(e) =>
                                        handleAddress(e.target.value)
                                    }
                                ></textarea>
                            </div>

                        </div>

                    </div>

                    <div className='product-section'>

                        <h2>add products</h2>

                        <div className='barcode-section'>

                            <div className='input-group barcode-input'>
                                <label>product barcode</label>

                                <input
                                    type='text'
                                    placeholder={errors.barcode || 'enter barcode'}
                                    value={barcode}
                                    onChange={(e) =>
                                        handleBarcode(e.target.value)
                                    }
                                />
                            </div>

                            <div className='input-group quantity-input'>
                                <label>quantity</label>

                                <input
                                    type='number'
                                    min='1'
                                    placeholder={errors.quantity || ''}
                                    value={quantity}
                                    onChange={(e) =>
                                        handleQuantity(e.target.value)
                                    }
                                />
                            </div>

                        </div>

                        {selectedProduct && (
                            <div className='product-details'>

                                <div className='product-detail-top'>
                                    <div>
                                        <span>product</span>
                                        <strong>
                                            {selectedProduct.name}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>category</span>
                                        <strong>
                                            {selectedProduct.category_name}
                                        </strong>
                                    </div>
                                </div>

                                <div className='price-grid'>

                                    <div>
                                        <span>landing price</span>
                                        <strong>
                                            ₹{selectedProduct.landing_price}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>mrp</span>
                                        <strong>
                                            ₹{selectedProduct.mrp}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>stock</span>
                                        <strong>
                                            {selectedProduct.stock}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>discount</span>

                                        <input
                                            type='text'
                                            inputMode='decimal'
                                            placeholder={errors.discount || ''}
                                            value={discount}
                                            onChange={(e) =>
                                                handleDiscount(e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className='payable-box'>
                                        <span>payable amount</span>
                                        <strong>
                                            ₹{payableAmount}
                                        </strong>
                                    </div>

                                </div>

                                {errors.discount && (
                                    <div className='field-error'>
                                        {errors.discount}
                                    </div>
                                )}

                                {errors.quantity && (
                                    <div className='field-error'>
                                        {errors.quantity}
                                    </div>
                                )}

                                <button
                                    className='add-product-button'
                                    onClick={addProduct}
                                >
                                    add product
                                </button>

                            </div>
                        )}

                        {!selectedProduct && barcode && (
                            <div className='product-not-found'>
                                product not found
                            </div>
                        )}

                    </div>

                    <div className='sale-items'>

                        <h2>selected products</h2>

                        <div className='sale-items-table'>

                            <table>

                                <thead>
                                    <tr>
                                        <th>barcode</th>
                                        <th>product</th>
                                        <th>qty</th>
                                        <th>landing price</th>
                                        <th>mrp</th>
                                        <th>discount</th>
                                        <th>payable</th>
                                        <th>option</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {saleItems.length > 0 ? (
                                        saleItems.map(item => (
                                            <tr key={item.barcode}>
                                                <td>{item.barcode}</td>
                                                <td>{item.name}</td>
                                                <td>{item.quantity}</td>
                                                <td>₹{item.landingPrice}</td>
                                                <td>₹{item.mrp}</td>
                                                <td>₹{item.discount}</td>
                                                <td>₹{item.payable}</td>
                                                <td>
                                                    <button
                                                        className='remove-sale-item'
                                                        onClick={() =>
                                                            removeProduct(
                                                                item.barcode
                                                            )
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
                                                colSpan='8'
                                                className='empty-sale'
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

                <div className='sales-billing-right'>

                    <div className='payment-section'>

                        <h2>payment</h2>

                        <div className='payment-summary'>

                            <div>
                                <span>items</span>
                                <strong>{saleItems.length}</strong>
                            </div>

                            <div>
                                <span>discount</span>
                                <strong>₹{totalDiscount}</strong>
                            </div>

                            <div className='final-total'>
                                <span>payable total</span>
                                <strong>₹{totalAmount}</strong>
                            </div>

                        </div>

                        <div className='input-group'>
                            <label>payment type</label>

                            <select
                                value={paymentType}
                                onChange={(e) => {
                                    setPaymentType(e.target.value)
                                    clearError('paymentType')
                                }}
                            >
                                <option value=''>
                                    select payment type
                                </option>
                                <option value='cash'>cash</option>
                                <option value='card'>card</option>
                                <option value='upi'>upi</option>
                            </select>

                            {errors.paymentType && (
                                <div className='field-error'>
                                    {errors.paymentType}
                                </div>
                            )}
                        </div>

                        <button
                            className='generate-invoice'
                            onClick={handleGenerateInvoice}
                            disabled={loading}
                        >
                            {loading ? 'generating...' : 'generate invoice'}
                        </button>

                    </div>

                </div>

            </div>

        </div>
    )
}