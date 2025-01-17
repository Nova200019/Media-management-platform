import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import './Register.css';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const { setIsAuthenticated } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError("Passwords don't match!");
            return;
        }

        const response = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.status === 200) {
            setError('');
            const data = await response.json();
            setIsAuthenticated(true);
            localStorage.setItem('token', data.token); // Store the JWT token
            alert('Registration successful!');
            navigate('/'); // Redirect to home page after successful registration
        } else {
            const data = await response.json();
                setError(data.message || 'Registration failed! Please try again.');
        }
    };

    return (
    <div className="register-page">
        <div className="register-container">
            <h1>Register</h1>
            <form onSubmit={handleRegister}>
                <div>
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Confirm Password:</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                <p className="error-message">{error}</p>
                <button type="submit" id="register">Register</button>
            </form>
            <button type="button" onClick={() => navigate('/login')}>
                Back to Login
            </button>
        </div>
    </div>
    );
};

export default Register;
