import React, { useEffect, useState } from 'react'
import { getProducts, updateProduct, deleteProduct } from '../../../services/productService'
import './Inventory.css'

export default function Inventory() {

    const [inventory, setInventory] = useState([])
    const [editingProduct, setEditingProduct] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})
    const [barcode, setBarcode] = useState('')
    const [name, setName] = useState('')
    const [categoryCode, setCategoryCode] = useState('')
    const [supplierCode, setSupplierCode] = useState('')
    const [mrp, setMrp] = useState('')
    const [landingPrice, setLandingPrice] = useState('')
    const [stock, setStock] = useState('')

    useEffect(() => {
        fetchInventory()
    }, [])

    const fetchInventory = async () => {
        try {
            setLoading(true)

            const data = await getProducts()

            setInventory(data)
        } catch (error) {
            setInventory([])
            setErrors({
                general:
                    error.response?.data?.detail ||
                    error.response?.data?.error ||
                    'unable to fetch inventory'
            })
        } finally {
            setLoading(false)
        }
    }

    const clearError = (field) => {
        setErrors((previousErrors) => {
            const newErrors = { ...previousErrors }
            delete newErrors[field]
            delete newErrors.general
            return newErrors
        })
    }

    const resetForm = () => {
        setBarcode('')
        setName('')
        setCategoryCode('')
        setSupplierCode('')
        setMrp('')
        setLandingPrice('')
        setStock('')
        setErrors({})
        setEditingProduct(false)
        setEditingId(null)
    }

    const handleView = (product) => {
        setBarcode(product.barcode || '')
        setName(product.name || '')
        setCategoryCode(product.category_code || '')
        setSupplierCode(product.supplier_code || '')
        setMrp(product.mrp ?? '')
        setLandingPrice(product.landing_price ?? '')
        setStock(product.stock ?? '')
        setEditingProduct(true)
        setEditingId(product.id)
        setErrors({})
    }

    const handleCancel = () => {
        resetForm()
    }

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this product?'
        )

        if (!confirmed) {
            return
        }

        try {
            await deleteProduct(id)

            setInventory((previous) =>
                previous.filter((product) => product.id !== id)
            )
        } catch (error) {
            const backendErrors = error.response?.data || {}

            setErrors({
                general:
                    backendErrors.error ||
                    backendErrors.detail ||
                    'unable to delete product'
            })
        }
    }

    const validateForm = () => {
        const newErrors = {}

        if (!barcode.trim()) {
            newErrors.barcode = 'barcode is required'
        }

        if (!name.trim()) {
            newErrors.name = 'product name is required'
        }

        if (!categoryCode.trim()) {
            newErrors.categoryCode = 'category code is required'
        }

        if (!supplierCode.trim()) {
            newErrors.supplierCode = 'supplier code is required'
        }

        if (!mrp || Number(mrp) <= 0) {
            newErrors.mrp = 'MRP must be greater than 0'
        }

        if (!landingPrice || Number(landingPrice) <= 0) {
            newErrors.landingPrice = 'landing price must be greater than 0'
        }

        if (
            mrp && landingPrice &&
            Number(landingPrice) > Number(mrp)
        ) {
            newErrors.landingPrice = 'landing price cannot exceed MRP'
        }

        if (
            stock === '' ||
            Number(stock) < 0 ||
            !Number.isInteger(Number(stock))
        ) {
            newErrors.stock = 'stock must be a non-negative whole number'
        }

        setErrors(newErrors)

        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        const productData = {
            barcode: barcode.trim(),
            name: name.trim(),
            category_code: categoryCode.trim().toUpperCase(),
            supplier_code: supplierCode.trim().toUpperCase(),
            mrp: mrp,
            landing_price: landingPrice,
            stock: Number(stock)
        }

        try {
            setLoading(true)
            setErrors({})

            const updated = await updateProduct(editingId, productData)

            setInventory((previous) =>
                previous.map((product) =>
                    product.id === editingId ? updated : product
                )
            )

            resetForm()

        } catch (error) {
            const backendErrors = error.response?.data || {}
            const formattedErrors = {}

            Object.keys(backendErrors).forEach((field) => {
                const mapped =
                    field === 'category_code' ? 'categoryCode' :
                        field === 'supplier_code' ? 'supplierCode' :
                            field === 'landing_price' ? 'landingPrice' :
                                field

                if (Array.isArray(backendErrors[field])) {
                    formattedErrors[mapped] = backendErrors[field][0]
                } else if (typeof backendErrors[field] === 'string') {
                    formattedErrors[mapped] = backendErrors[field]
                }
            })

            if (!error.response) {
                formattedErrors.general = 'cannot reach server'
            } else if (error.response.status === 401) {
                formattedErrors.general = 'session expired — login again'
            } else if (Object.keys(formattedErrors).length === 0) {
                formattedErrors.general =
                    backendErrors.detail ||
                    backendErrors.error ||
                    `error ${error.response.status}`
            }

            setErrors(formattedErrors)
        } finally {
            setLoading(false)
        }
    }

    return (

        <div className='inventory'>

            <div className={`inventory-top ${editingProduct ? 'hide' : ''}`}>

                <h1>inventory</h1>

            </div>

            <div className={`display-inventory ${editingProduct ? 'hide' : ''}`}>

                {errors.general && (
                    <div className='inventory-error'>
                        {errors.general}
                    </div>
                )}

                <table>

                    <thead>
                        <tr>
                            <th>barcode</th>
                            <th>product name</th>
                            <th>category</th>
                            <th>category code</th>
                            <th>stock</th>
                            <th colSpan='2'>options</th>
                        </tr>
                    </thead>

                    <tbody>

                        {loading && inventory.length === 0 ? (
                            <tr>
                                <td colSpan='7'>loading...</td>
                            </tr>
                        ) : inventory.length === 0 ? (
                            <tr>
                                <td colSpan='7'>no products found</td>
                            </tr>
                        ) : (
                            inventory.map((product) => (
                                <tr key={product.id}>

                                    <td>{product.barcode}</td>
                                    <td>{product.name}</td>
                                    <td>{product.category_name}</td>
                                    <td>{product.category_code}</td>
                                    <td>{product.stock}</td>

                                    <td>
                                        <button
                                            type='button'
                                            className='view-inventory'
                                            onClick={() => handleView(product)}
                                        >
                                            <i className='fa-solid fa-eye'></i>
                                        </button>
                                    </td>

                                    <td>
                                        <button
                                            type='button'
                                            className='delete-inventory'
                                            onClick={() => handleDelete(product.id)}
                                        >
                                            <i className='fa-solid fa-trash'></i>
                                        </button>
                                    </td>

                                </tr>
                            ))
                        )}

                    </tbody>

                </table>

            </div>

            {editingProduct && (
                <div className='editinventory'>

                    <h2>edit product</h2>

                    <form onSubmit={handleSubmit}>

                        <input
                            type='text'
                            placeholder={errors.barcode || 'barcode'}
                            value={barcode}
                            onChange={(e) => {
                                setBarcode(e.target.value)
                                clearError('barcode')
                            }} />

                        <input
                            type='text'
                            placeholder={errors.name || 'product name'}
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value)
                                clearError('name')
                            }} />

                        <input
                            type='text'
                            placeholder={errors.categoryCode || 'category code'}
                            value={categoryCode}
                            onChange={(e) => {
                                setCategoryCode(e.target.value.toUpperCase())
                                clearError('categoryCode')
                            }} />

                        <input
                            type='text'
                            placeholder={errors.supplierCode || 'supplier code'}
                            value={supplierCode}
                            onChange={(e) => {
                                setSupplierCode(e.target.value.toUpperCase())
                                clearError('supplierCode')
                            }} />

                        <input
                            type='number'
                            step='0.01'
                            placeholder={errors.mrp || 'MRP'}
                            value={mrp}
                            onChange={(e) => {
                                setMrp(e.target.value)
                                clearError('mrp')
                            }} />

                        <input
                            type='number'
                            step='0.01'
                            placeholder={errors.landingPrice || 'landing price'}
                            value={landingPrice}
                            onChange={(e) => {
                                setLandingPrice(e.target.value)
                                clearError('landingPrice')
                            }} />

                        <input
                            type='number'
                            placeholder={errors.stock || 'stock quantity'}
                            value={stock}
                            onChange={(e) => {
                                const digitsOnly = e.target.value.replace(/\D/g, '')
                                setStock(digitsOnly)
                                clearError('stock')
                            }} />

                        <div className='form-buttons'>

                            <button
                                type='button'
                                className='cancel-button'
                                onClick={handleCancel}>
                                cancel
                            </button>

                            <button
                                type='submit'
                                className='save-button'
                                disabled={loading}>
                                {loading ? 'saving...' : 'save changes'}
                            </button>

                        </div>

                    </form>

                </div>
            )}

        </div>

    )
}