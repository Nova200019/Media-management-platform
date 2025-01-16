import React from 'react';
import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true)
        }
        else{
            setIsAuthenticated(false)
        }
          setIsLoading(false)  
            
            
            
            
            
            
            
            
            
            
        /*
            {
            console.log("AuthCon: Token detected")
            var validToken = false
            fetch('http://localhost:3000/self', {
                headers: { authorization: `bearer ${token}` }
            })
                .then((res) => {
                    if(res.status==200){
                        setIsAuthenticated(true)
                        validToken = true;
                        console.log("IsAuth sollte true sein: Real: "+ isAuthenticated + "Token sollte true sein: " +validToken)
                    }else{
                        setIsAuthenticated(false)
                        console.log("status nicht 200 l Real: " +isAuthenticated)
                    }
                    console.log("Authentication Status AuthCon: "+ isAuthenticated)
                    console.log(res.status == 200)
                    console.log(res.status === 200)
                    console.log(res.status)
                })
                .catch(() =>{ setIsAuthenticated(false)
                    console.log("Catch triggered")
                    validToken = false
        })
                .finally(()=>{
                    console.log("Auth state :" +isAuthenticated)
                    setIsLoading(false)
                    console.log(isAuthenticated)});
        }
*/
    }, []);



    return (
        <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
