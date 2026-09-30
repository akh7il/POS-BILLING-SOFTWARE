import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../styles/global.css'
import '../../styles/variable.css'
import '../../styles/fonts.css'
import './Login.css'

import { loginUser } from '../../services/authService'

export default function Login() {

    const navigate = useNavigate()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [usernameError, setUsernameError] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e) => {
        e.preventDefault()

        setUsernameError('')
        setPasswordError('')

        if (!username && !password) {
            setUsernameError('username is required')
            setPasswordError('password is required')
            return
        }

        if (!username) {
            setUsernameError('username is required')
            return
        }

        if (!password) {
            setPasswordError('password is required')
            return
        }

        try {
            setLoading(true)

            const data = await loginUser(username, password)

            if (data.user.role === 'ADMIN') {
                navigate('/admin/dashboard')
            } else if (data.user.role === 'STAFF') {
                navigate('/staff/sales')
            }

        } catch (error) {
            if (!error.response) {
                setUsernameError('cannot reach server')
            } else if (error.response.status === 400) {
                setUsernameError('invalid username or password')
            } else if (error.response.status === 401) {
                setUsernameError('unauthorized')
            } else {
                setUsernameError(`error ${error.response.status}`)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='login-page'>

            <div className='login-card'>

                <div className='login-card-left'></div>

                <div className='login-card-right'>

                    <div className='login-card-right-top'>

                        <h1 className='login-card-right-head'>
                            vastra
                        </h1>

                        <p className='login-card-right-subhead'>
                            welcome back
                        </p>

                        <span>
                            please login to your account
                        </span>

                    </div>

                    <form
                        className='login-form'
                        onSubmit={handleLogin}
                    >

                        <input
                            type='text'
                            placeholder={usernameError || 'username'}
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value)
                                setUsernameError('')
                            }}
                        />

                        <input
                            type='password'
                            placeholder={passwordError || 'password'}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value)
                                setPasswordError('')
                            }}
                        />

                        <button
                            type='submit'
                            className='login-btn'
                            disabled={loading}
                        >
                            {loading ? 'logging in...' : 'login'}
                        </button>

                    </form>

                </div>

            </div>

        </div>
    )
}