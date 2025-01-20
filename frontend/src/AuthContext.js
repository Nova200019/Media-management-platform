import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        console.log("AuthCon: Token detected");

        // Verify if Token in storage is valid
        fetch('http://localhost:3000/self', {
            headers: { authorization: `bearer ${token}` }
        })
            .then((res) => {
                if (res.status === 200) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            })
            .catch(() => {
                setIsAuthenticated(false);
                console.log("Catch triggered");
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []); // Close the useEffect dependency array here

    return (
        <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
