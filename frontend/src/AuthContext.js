import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        console.log("AuthCon: Token detected");

        fetch('http://localhost:3000/self', {
            headers: { authorization: `bearer ${token}` }
        })
            .then((res) => {
                if (res.status === 200) {
                    setIsAuthenticated(true);
                    console.log("IsAuth should be true: Real: " + isAuthenticated);
                } else {
                    setIsAuthenticated(false);
                    console.log("Status not 200. Real: " + isAuthenticated);
                }
                console.log("Authentication Status AuthCon: " + isAuthenticated);
                console.log(res.status === 200);
            })
            .catch(() => {
                setIsAuthenticated(false);
                console.log("Catch triggered");
            })
            .finally(() => {
                console.log("Auth state: " + isAuthenticated);
                setIsLoading(false);
            });
    }, []); // Close the useEffect dependency array here

    return (
        <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
