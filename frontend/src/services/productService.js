import api from './api'

export const getProducts = async () => {
    const response = await api.get('products/')
    return response.data
}

export const createProduct = async (productData) => {
    const response = await api.post('products/', productData)
    return response.data
}

export const updateProduct = async (id, productData) => {
    const response = await api.patch(`products/${id}/`, productData)
    return response.data
}

export const deleteProduct = async (id) => {
    await api.delete(`products/${id}/`)
}

export const getProductByBarcode = async (barcode) => {
    const response = await api.get('products/')
    const products = response.data
    return products.find((p) => p.barcode === barcode) || null
}