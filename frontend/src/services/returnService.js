import api from './api'

export const getReturns = async () => {
    const response = await api.get('returns/')
    return response.data
}

export const getReturnsForSale = async (invoiceNo) => {
    const response = await api.get(`returns/sale/${invoiceNo}/`)
    return response.data
}

export const createReturn = async (returnData) => {
    const response = await api.post('returns/', returnData)
    return response.data
}