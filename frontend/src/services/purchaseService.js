import api from './api'

export const getPurchases = async () => {
    const response = await api.get('purchases/')
    return response.data
}

export const getPurchase = async (id) => {
    const response = await api.get(`purchases/${id}/`)
    return response.data
}

export const createPurchase = async (purchaseData) => {
    const response = await api.post('purchases/', purchaseData)
    return response.data
}

export const deletePurchase = async (id) => {
    await api.delete(`purchases/${id}/`)
}