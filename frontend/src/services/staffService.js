import api from './api'

export const getStaffs = async () => {
    const response = await api.get('accounts/staff/')
    return response.data
}

export const createStaff = async (staffData) => {
    const response = await api.post('accounts/staff/', staffData)
    return response.data
}

export const updateStaff = async (id, staffData) => {
    const response = await api.patch(`accounts/staff/${id}/`, staffData)
    return response.data
}

export const deleteStaff = async (id) => {
    await api.delete(`accounts/staff/${id}/`)
}