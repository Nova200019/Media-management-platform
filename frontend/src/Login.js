import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import './Login.css';

const Login = () => {
    const { setIsAuthenticated } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;
        console.log("Here1")
        const res = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (res.status === 200) {
            console.log("here2")
            const { token } = await res.json();
            localStorage.setItem('token', token);
            setIsAuthenticated(true);
            navigate('/');
        } else {
            alert('Invalid credentials.');
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
