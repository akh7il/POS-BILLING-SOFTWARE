import api from './api'

export const getDashboardSummary = async () => {
    const response = await api.get('sales/dashboard/summary/')
    return response.data
}