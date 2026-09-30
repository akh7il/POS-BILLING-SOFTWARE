import api from './api'

export const loginUser = async (username, password) => {
    // Clear any stale session before logging in
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')

    const response = await api.post('accounts/login/', {
        username,
        password,
    })

    const data = response.data

    localStorage.setItem('accessToken', data.access)
    localStorage.setItem('refreshToken', data.refresh)
    localStorage.setItem('user', JSON.stringify(data.user))

    return data
}

export const logoutUser = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
}

export const getCurrentUser = () => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
}