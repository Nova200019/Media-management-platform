import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import './Login.css';

const Login = () => {
    const { setIsAuthenticated } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        const username = e.target.username.value;
        const password = e.target.password.value;
        // Send a POST request to the server with the login credentials
        const res = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (res.status === 200) {
            // If login is successful, store the token in local storage, set the isAuthenticated state to true, and navigate to the home page
            const { token } = await res.json();
            localStorage.setItem('token', token);
            setIsAuthenticated(true);
            navigate('/');
        } else {
            // If login is unsuccessful, display an error message
            const data = await res.json();
            setError(data.message || 'Invalid credentials.');
        }
    };

    const goToRegister = () => {
        navigate('/register'); // Navigate to the register page
    };

    return (
    <div className="login-page">
        <div className="login-container">
            <form onSubmit={handleLogin}>
                <h1>Login</h1>
                <div>
                    <label>Username:</label>
                    <input type="text" name="username" required />
                </div>
                <div>
                    <label>Password:</label>
                    <input type="password" name="password" required />
                </div>
                <p className="error-message">{error}</p>
                <button type="submit" id="login">Login</button>
                <button type="button" onClick={goToRegister}>
                    Register
                </button>
            </form>
        </div>
    </div>
    );
};

export default Login;
