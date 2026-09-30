import api from './api'

export const getSuppliers = async () => {
    const response = await api.get('suppliers/')
    return response.data
}

export const createSupplier = async (supplierData) => {
    const response = await api.post('suppliers/', supplierData)
    return response.data
}

export const updateSupplier = async (id, supplierData) => {
    const response = await api.patch(`suppliers/${id}/`, supplierData)
    return response.data
}

export const deleteSupplier = async (id) => {
    await api.delete(`suppliers/${id}/`)
}