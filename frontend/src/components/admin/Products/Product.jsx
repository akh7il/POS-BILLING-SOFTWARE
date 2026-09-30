import React, { useEffect, useState } from 'react'
import {getProducts,createProduct,updateProduct,deleteProduct} from '../../../services/productService'
import './Product.css'

export default function Product() {
    const [addProducts, setAddProducts] = useState(false)
    const [products, setProducts] = useState([])
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
        fetchProducts()
    }, [])
    const fetchProducts = async () => {
        try {
            setLoading(true)
            const data = await getProducts()
            setProducts(data)
        } catch (error) {
            setProducts([])
            setErrors({
                general:
                    error.response?.data?.detail ||
                    error.response?.data?.error ||
                    'unable to fetch products'
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

    const handleAddProduct = () => {
        resetForm()
        setAddProducts(true)
    }

    const handleCancel = () => {
        resetForm()
        setAddProducts(false)
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
        setAddProducts(true)
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

            setProducts((previousProducts) =>
                previousProducts.filter((product) => product.id !== id)
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

            if (editingProduct) {
                const updated = await updateProduct(editingId, productData)

                setProducts((previousProducts) =>
                    previousProducts.map((product) =>
                        product.id === editingId ? updated : product
                    )
                )
            } else {
                const created = await createProduct(productData)

                setProducts((previousProducts) => [
                    created,
                    ...previousProducts
                ])
            }

            resetForm()
            setAddProducts(false)

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
        <div className='products'>

            <div className={`products-top ${addProducts ? 'hide' : ''}`}>

                <h1>products</h1>

                <button
                    className='add-products'
                    onClick={handleAddProduct}
                >
                    add products
                    <i className='fa-solid fa-circle-plus plus'></i>
                </button>

            </div>

            <div className={`display-products ${addProducts ? 'hide' : ''}`}>

                {errors.general && (
                    <div className='product-error'>
                        {errors.general}
                    </div>
                )}

                <table>

                    <thead>
                        <tr>
                            <th>barcode</th>
                            <th>name</th>
                            <th>category</th>
                            <th>supplier</th>
                            <th>MRP</th>
                            <th>landing price</th>
                            <th>stock</th>
                            <th colSpan='2'>actions</th>
                        </tr>
                    </thead>

                    <tbody>

                        {loading && products.length === 0 ? (
                            <tr>
                                <td colSpan='9'>loading...</td>
                            </tr>
                        ) : products.length === 0 ? (
                            <tr>
                                <td colSpan='9'>no products found</td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id}>
                                    <td>{product.barcode}</td>
                                    <td>{product.name}</td>
                                    <td>{product.category_name}</td>
                                    <td>{product.supplier_name}</td>
                                    <td>{product.mrp}</td>
                                    <td>{product.landing_price}</td>
                                    <td>{product.stock}</td>
                                    <td>
                                        <button
                                            type='button'
                                            className='view-product'
                                            onClick={() => handleView(product)}
                                        >
                                            <i className='fa-solid fa-eye'></i>
                                        </button>
                                    </td>
                                    <td>
                                        <button
                                            type='button'
                                            className='delete-product'
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
            {addProducts && (
                <div className='addproducts'>
                    <h2>
                        {editingProduct ? 'edit product' : 'add products'}
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <input
                            type='text'
                            placeholder={errors.barcode || 'barcode'}
                            value={barcode}
                            onChange={(e) => {
                                setBarcode(e.target.value)
                                clearError('barcode')
                            }}
                        />
                        <input
                            type='text'
                            placeholder={errors.name || 'product name'}
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value)
                                clearError('name')
                            }}
                        />
                        <input
                            type='text'
                            placeholder={errors.categoryCode || 'category code'}
                            value={categoryCode}
                            onChange={(e) => {
                                setCategoryCode(e.target.value.toUpperCase())
                                clearError('categoryCode')
                            }}
                        />
                        <input
                            type='text'
                            placeholder={errors.supplierCode || 'supplier code'}
                            value={supplierCode}
                            onChange={(e) => {
                                setSupplierCode(e.target.value.toUpperCase())
                                clearError('supplierCode')
                            }}
                        />
                        <input
                            type='number'
                            step='0.01'
                            placeholder={errors.mrp || 'MRP'}
                            value={mrp}
                            onChange={(e) => {
                                setMrp(e.target.value)
                                clearError('mrp')
                            }}
                        />
                        <input
                            type='number'
                            step='0.01'
                            placeholder={errors.landingPrice || 'landing price'}
                            value={landingPrice}
                            onChange={(e) => {
                                setLandingPrice(e.target.value)
                                clearError('landingPrice')
                            }}
                        />
                        <input
                            type='number'
                            placeholder={errors.stock || 'stock quantity'}
                            value={stock}
                            onChange={(e) => {
                                const digitsOnly = e.target.value.replace(/\D/g, '')
                                setStock(digitsOnly)
                                clearError('stock')
                            }}
                        />
                        <div className='form-buttons'>

                            <button
                                type='button'
                                className='cancel-button'
                                onClick={handleCancel}
                            >
                                cancel
                            </button>
                            <button
                                type='submit'
                                className='save-button'
                                disabled={loading}
                            >
                                {loading
                                    ? 'saving...'
                                    : editingProduct
                                        ? 'save changes'
                                        : 'save'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}