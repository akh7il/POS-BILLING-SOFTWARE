import React, { useEffect, useState } from 'react'
import {getSuppliers,createSupplier,updateSupplier,deleteSupplier} from '../../../services/supplierService'
import './Supplier.css'

export default function Supplier() {

    const [errors, setErrors] = useState({})
    const [code, setCode] = useState('')
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [address, setAddress] = useState('')
    const [addSupplier, setAddSupplier] = useState(false)
    const [suppliers, setSuppliers] = useState([])
    const [editingSupplier, setEditingSupplier] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchSuppliers()
    }, [])

    const fetchSuppliers = async () => {
        try {
            setLoading(true)

            const data = await getSuppliers()

            setSuppliers(data)
        } catch (error) {
            setSuppliers([])
            setErrors({
                general:
                    error.response?.data?.detail ||
                    error.response?.data?.error ||
                    'unable to fetch suppliers'
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
        setCode('')
        setName('')
        setPhone('')
        setEmail('')
        setAddress('')
        setErrors({})
        setEditingSupplier(false)
        setEditingId(null)
    }

    const handleAddSupplier = () => {
        resetForm()
        setAddSupplier(true)
    }

    const handleCancel = () => {
        resetForm()
        setAddSupplier(false)
    }

    const handleView = (supplier) => {
        setCode(supplier.code || '')
        setName(supplier.name || '')
        setPhone(supplier.phone || '')
        setEmail(supplier.email || '')
        setAddress(supplier.address || '')
        setEditingSupplier(true)
        setEditingId(supplier.id)
        setErrors({})
        setAddSupplier(true)
    }

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this supplier?'
        )

        if (!confirmed) {
            return
        }

        try {
            await deleteSupplier(id)

            setSuppliers((previousSuppliers) =>
                previousSuppliers.filter((supplier) => supplier.id !== id)
            )
        } catch (error) {
            const backendErrors = error.response?.data || {}

            setErrors({
                general:
                    backendErrors.error ||
                    backendErrors.detail ||
                    'unable to delete supplier'
            })
        }
    }

    const validateForm = () => {
        const newErrors = {}

        if (!code.trim()) {
            newErrors.code = 'supplier code is required'
        }

        if (!name.trim()) {
            newErrors.name = 'supplier name is required'
        }

        if (!phone.trim()) {
            newErrors.phone = 'phone number is required'
        } else if (!/^[0-9]{10}$/.test(phone)) {
            newErrors.phone = 'phone must contain 10 digits'
        }

        if (!email.trim()) {
            newErrors.email = 'email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'invalid email'
        }

        if (!address.trim()) {
            newErrors.address = 'address is required'
        }

        setErrors(newErrors)

        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        const supplierData = {
            code: code.trim().toUpperCase(),
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            address: address.trim()
        }

        try {
            setLoading(true)
            setErrors({})

            if (editingSupplier) {
                const updated = await updateSupplier(editingId, supplierData)

                setSuppliers((previousSuppliers) =>
                    previousSuppliers.map((supplier) =>
                        supplier.id === editingId ? updated : supplier
                    )
                )
            } else {
                const created = await createSupplier(supplierData)

                setSuppliers((previousSuppliers) => [
                    created,
                    ...previousSuppliers
                ])
            }

            resetForm()
            setAddSupplier(false)

        } catch (error) {
            const backendErrors = error.response?.data || {}
            const formattedErrors = {}

            Object.keys(backendErrors).forEach((field) => {
                if (Array.isArray(backendErrors[field])) {
                    formattedErrors[field] = backendErrors[field][0]
                } else if (typeof backendErrors[field] === 'string') {
                    formattedErrors[field] = backendErrors[field]
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

    const formatMoney = (value) => {
        const n = Number(value)
        if (isNaN(n)) return '0.00'
        return n.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })
    }

    return (

        <div className='suppliers'>

            <div className={`suppliers-top ${addSupplier ? 'hide' : ''}`}>

                <h1>suppliers</h1>

                <button
                    className='add-supplier'
                    onClick={handleAddSupplier}
                >
                    add supplier <i className='fa-solid fa-circle-plus plus'></i>
                </button>

            </div>

            <div className={`display-suppliers ${addSupplier ? 'hide' : ''}`}>

                {errors.general && (
                    <div className='supplier-error'>
                        {errors.general}
                    </div>
                )}

                <table>

                    <thead>
                        <tr>
                            <th>supplier code</th>
                            <th>supplier name</th>
                            <th>phone</th>
                            <th>email</th>
                            <th>address</th>
                            <th>stock</th>
                            <th>total purchase amount</th>
                            <th colSpan='2'>options</th>
                        </tr>
                    </thead>

                    <tbody>

                        {loading && suppliers.length === 0 ? (
                            <tr>
                                <td colSpan='9'>loading...</td>
                            </tr>
                        ) : suppliers.length === 0 ? (
                            <tr>
                                <td colSpan='9'>no suppliers found</td>
                            </tr>
                        ) : (
                            suppliers.map((supplier) => (
                                <tr key={supplier.id}>

                                    <td>{supplier.code}</td>
                                    <td>{supplier.name}</td>
                                    <td>{supplier.phone}</td>
                                    <td>{supplier.email}</td>
                                    <td>{supplier.address}</td>
                                    <td>{supplier.stock}</td>
                                    <td>₹{formatMoney(supplier.total_purchase_amount)}</td>

                                    <td>
                                        <button
                                            type='button'
                                            className='view-supplier'
                                            onClick={() => handleView(supplier)}
                                        >
                                            <i className='fa-solid fa-eye'></i>
                                        </button>
                                    </td>

                                    <td>
                                        <button
                                            type='button'
                                            className='delete-supplier'
                                            onClick={() => handleDelete(supplier.id)}
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

            {addSupplier && (

                <div className='addsupplier'>

                    <h2>
                        {editingSupplier ? 'edit supplier' : 'add supplier'}
                    </h2>

                    <form onSubmit={handleSubmit}>

                        <input
                            type='text'
                            placeholder={errors.code || 'supplier code'}
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value.toUpperCase())
                                clearError('code')
                            }}/>

                        <input
                            type='text'
                            placeholder={errors.name || 'supplier name'}
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value)
                                clearError('name')
                            }}/>

                        <input
                            type='tel'
                            inputMode='numeric'
                            maxLength={10}
                            placeholder={errors.phone || 'phone'}
                            value={phone}
                            onChange={(e) => {
                                const digitsOnly = e.target.value.replace(/\D/g, '')
                                setPhone(digitsOnly)
                                clearError('phone')
                            }}/>

                        <input
                            type='email'
                            placeholder={errors.email || 'email'}
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value)
                                clearError('email')
                            }}/>

                        <textarea
                            placeholder={errors.address || 'address'}
                            value={address}
                            onChange={(e) => {
                                setAddress(e.target.value)
                                clearError('address')
                            }}>                            
                        </textarea>

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
                                {loading
                                    ? 'saving...'
                                    : editingSupplier
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