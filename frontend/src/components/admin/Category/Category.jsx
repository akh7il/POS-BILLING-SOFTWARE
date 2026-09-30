import React, { useEffect, useState } from 'react'
import {getCategories,    createCategory,updateCategory,deleteCategory} from '../../../services/categoryService'
import './Category.css'

export default function Category() {

    const [addCategory, setAddCategory] = useState(false)
    const [categories, setCategories] = useState([])
    const [editingCategory, setEditingCategory] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})
    const [code, setCode] = useState('')
    const [name, setName] = useState('')

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            setLoading(true)

            const data = await getCategories()

            setCategories(data)
        } catch (error) {
            setCategories([])
            setErrors({
                general:
                    error.response?.data?.detail ||
                    error.response?.data?.error ||
                    'unable to fetch categories'
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
        setErrors({})
        setEditingCategory(false)
        setEditingId(null)
    }

    const handleAddCategory = () => {
        resetForm()
        setAddCategory(true)
    }

    const handleCancel = () => {
        resetForm()
        setAddCategory(false)
    }

    const handleView = (category) => {
        setCode(category.code || '')
        setName(category.name || '')
        setEditingCategory(true)
        setEditingId(category.id)
        setErrors({})
        setAddCategory(true)
    }

    const handleDelete = async (id) => {
        
        if (!confirmed) {
            return
        }
        try {
            await deleteCategory(id)

            setCategories((previousCategories) =>
                previousCategories.filter((category) => category.id !== id)
            )
        } catch (error) {
            const backendErrors = error.response?.data || {}
            setErrors({
                general:
                    backendErrors.error ||
                    backendErrors.detail ||
                    'unable to delete category'
            })
        }
    }

    const validateForm = () => {
        const newErrors = {}

        if (!code.trim()) {
            newErrors.code = 'category code is required'
        }
        if (!name.trim()) {
            newErrors.name = 'category name is required'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }
        const categoryData = {
            code: code.trim().toUpperCase(),
            name: name.trim()
        }
        try {
            setLoading(true)
            setErrors({})
            if (editingCategory) {
                const updated = await updateCategory(editingId, categoryData)
                setCategories((previousCategories) =>
                    previousCategories.map((category) =>
                        category.id === editingId ? updated : category
                    )
                )
            } else {
                const created = await createCategory(categoryData)

                setCategories((previousCategories) => [
                    created,
                    ...previousCategories
                ])
            }
            resetForm()
            setAddCategory(false)
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
    return (
        <div className='categories'>
            <div className={`categories-top ${addCategory ? 'hide' : ''}`}>
                <h1>category</h1>
                <button
                    className='add-category'
                    onClick={handleAddCategory}>
                    add category
                    <i className='fa-solid fa-circle-plus plus'></i>
                </button>
            </div>
            <div className={`display-categories ${addCategory ? 'hide' : ''}`}>
                {errors.general && (
                    <div className='category-error'>
                        {errors.general}
                    </div>
                )}
                <table>
                    <thead>
                        <tr>
                            <th>category code</th>
                            <th>category</th>
                            <th colSpan='2'>actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && categories.length === 0 ? (
                            <tr>
                                <td colSpan='4'>loading...</td>
                            </tr>
                        ) : categories.length === 0 ? (
                            <tr>
                                <td colSpan='4'>no categories found</td>
                            </tr>
                        ) : (
                            categories.map((category) => (
                                <tr key={category.id}>
                                    <td>{category.code}</td>
                                    <td>{category.name}</td>
                                    <td>
                                        <button
                                            type='button'
                                            className='view-category'
                                            onClick={() => handleView(category)}>
                                            <i className='fa-solid fa-eye'></i>
                                        </button>
                                    </td>
                                    <td>
                                        <button
                                            type='button'
                                            className='delete-category'
                                            onClick={() => handleDelete(category.id)}>
                                            <i className='fa-solid fa-trash'></i>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {addCategory && (
                <div className='addcategory'>
                    <h2>
                        {editingCategory ? 'edit category' : 'add category'}
                    </h2>
                    <form onSubmit={handleSubmit}>
                        <input
                            type='text'
                            placeholder={errors.code || 'category code'}
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value.toUpperCase())
                                clearError('code')
                            }}/>
                        <input
                            type='text'
                            placeholder={errors.name || 'category'}
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value)
                                clearError('name')
                            }}/>
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
                                    : editingCategory
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