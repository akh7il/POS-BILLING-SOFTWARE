import React, { useEffect, useState } from 'react'
import {getStaffs,createStaff,updateStaff,deleteStaff} from '../../../services/staffService'
import './Staff.css'

export default function Staff() {

    const [addStaff, setAddStaff] = useState(false)
    const [staffs, setStaffs] = useState([])
    const [editingStaff, setEditingStaff] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})
    const [username, setUsername] = useState('')
    const [role, setRole] = useState('')
    const [password, setPassword] = useState('')
    const [firstName, setFirstName] = useState('')
    const [secondName, setSecondName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')

    useEffect(() => {
        fetchStaffs()
    }, [])

    const fetchStaffs = async () => {
        try {
            setLoading(true)

            const data = await getStaffs()

            setStaffs(data)
        } catch (error) {
            setStaffs([])
            setErrors({
                general:
                    error.response?.data?.detail ||
                    error.response?.data?.error ||
                    'unable to fetch users'
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
        setUsername('')
        setRole('')
        setPassword('')
        setFirstName('')
        setSecondName('')
        setEmail('')
        setPhone('')
        setAddress('')
        setErrors({})
        setEditingStaff(false)
        setEditingId(null)
    }

    const handleAddStaff = () => {
        resetForm()
        setAddStaff(true)
    }

    const handleCancel = () => {
        resetForm()
        setAddStaff(false)
    }

    const handleView = (staff) => {
        setUsername(staff.username || '')
        setRole(staff.role || '')
        setPassword('')
        setFirstName(staff.first_name || '')
        setSecondName(staff.last_name || '')
        setEmail(staff.email || '')
        setPhone(staff.phone || '')
        setAddress(staff.address || '')
        setEditingStaff(true)
        setEditingId(staff.id)
        setErrors({})
        setAddStaff(true)
    }

    const handleDelete = async (id) => {
        if (!confirmed) {
            return
        }

        try {
            await deleteStaff(id)

            setStaffs((previousStaffs) =>
                previousStaffs.filter((staff) => staff.id !== id)
            )
        } catch (error) {
            const backendErrors = error.response?.data || {}

            setErrors({
                general:
                    backendErrors.error ||
                    backendErrors.detail ||
                    'unable to delete user'
            })
        }
    }

    const validateForm = () => {
        const newErrors = {}

        if (!username.trim()) {
            newErrors.username = 'staff username is required'
        }

        if (!role) {
            newErrors.role = 'select role'
        }

        if (!editingStaff && !password.trim()) {
            newErrors.password = 'password is required'
        }

        if (password && password.length < 8) {
            newErrors.password = 'password must be at least 8 characters'
        }

        if (!firstName.trim()) {
            newErrors.firstName = 'first name is required'
        }

        if (!secondName.trim()) {
            newErrors.secondName = 'second name is required'
        }

        if (!email.trim()) {
            newErrors.email = 'email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'invalid email'
        }

        if (!phone.trim()) {
            newErrors.phone = 'phone number is required'
        } else if (!/^[0-9]{10}$/.test(phone)) {
            newErrors.phone = 'phone must contain 10 digits'
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

        const userData = {
            username: username.trim(),
            first_name: firstName.trim(),
            last_name: secondName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            address: address.trim(),
            role
        }

        if (password.trim()) {
            userData.password = password
        }

        try {
            setLoading(true)
            setErrors({})

            if (editingStaff) {
                const updatedUser = await updateStaff(editingId, userData)

                setStaffs((previousStaffs) =>
                    previousStaffs.map((staff) =>
                        staff.id === editingId ? updatedUser : staff
                    )
                )
            } else {
                const newUser = await createStaff(userData)

                setStaffs((previousStaffs) => [newUser, ...previousStaffs])
            }

            resetForm()
            setAddStaff(false)

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
            } else if (error.response.status === 403) {
                formattedErrors.general = 'admin access required'
            } else if (
                Object.keys(formattedErrors).length === 0
            ) {
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
        <div className='staffs'>

            <div className={`staffs-top ${addStaff ? 'hide' : ''}`}>

                <h1>staffs</h1>

                <button
                    className='add-staff'
                    onClick={handleAddStaff}
                >
                    add staff
                    <i className='fa-solid fa-circle-plus plus'></i>
                </button>

            </div>

            <div className={`display-staffs ${addStaff ? 'hide' : ''}`}>

                {errors.general && (
                    <div className='staff-error'>
                        {errors.general}
                    </div>
                )}

                <table>

                    <thead>
                        <tr>
                            <th>username</th>
                            <th>staff name</th>
                            <th>role</th>
                            <th>status</th>
                            <th colSpan='2'>options</th>
                        </tr>
                    </thead>

                    <tbody>

                        {loading && staffs.length === 0 ? (
                            <tr>
                                <td colSpan='6'>loading...</td>
                            </tr>
                        ) : staffs.length === 0 ? (
                            <tr>
                                <td colSpan='6'>no users found</td>
                            </tr>
                        ) : (
                            staffs.map((staff) => (
                                <tr key={staff.id}>

                                    <td>{staff.username}</td>

                                    <td>
                                        {`${staff.first_name || ''} ${staff.last_name || ''}`.trim()}
                                    </td>

                                    <td>{staff.role?.toLowerCase()}</td>

                                    <td>
                                        {staff.is_active ? 'active' : 'inactive'}
                                    </td>

                                    <td>
                                        <button
                                            type='button'
                                            className='view-staff'
                                            onClick={() => handleView(staff)}>
                                            <i className='fa-solid fa-eye'></i>
                                        </button>
                                    </td>
                                    <td>
                                        <button
                                            type='button'
                                            className='delete-staff'
                                            onClick={() => handleDelete(staff.id)}>
                                            <i className='fa-solid fa-trash'></i>
                                        </button>
                                    </td>

                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {addStaff && (
                <div className='addstaff'>
                    <h2>
                        {editingStaff ? 'edit user' : 'add user'}
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <div className='staff-account-information'>
                            <h3>account information</h3>
                            <input
                                type='text'
                                placeholder={errors.username || 'staff username'}
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value)
                                    clearError('username')
                                }}/>
                            <select
                                className='select-role'
                                value={role}
                                onChange={(e) => {
                                    setRole(e.target.value)
                                    clearError('role')
                                }}>
                                <option value=''>
                                    {errors.role || 'select role'}
                                </option>

                                <option value='STAFF'>staff</option>

                                <option value='ADMIN'>admin</option>

                            </select>

                            <input
                                type='password'
                                placeholder={
                                    errors.password ||
                                    (editingStaff ? 'new password' : 'password')
                                }
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    clearError('password')
                                }}
                            />

                        </div>

                        <div className='staff-personal-information'>

                            <h3>personal information</h3>

                            <input
                                type='text'
                                placeholder={errors.firstName || 'first name'}
                                value={firstName}
                                onChange={(e) => {
                                    setFirstName(e.target.value)
                                    clearError('firstName')
                                }}/>
                            <input
                                type='text'
                                placeholder={errors.secondName || 'second name'}
                                value={secondName}
                                onChange={(e) => {
                                    setSecondName(e.target.value)
                                    clearError('secondName')
                                }}/>
                            <input
                                type='email'
                                placeholder={errors.email || 'email'}
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value)
                                    clearError('email')
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
                            <textarea
                                placeholder={errors.address || 'address'}
                                value={address}
                                onChange={(e) => {
                                    setAddress(e.target.value)
                                    clearError('address')
                                }}>
                            </textarea>
                        </div>
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
                                    : editingStaff
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