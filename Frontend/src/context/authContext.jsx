import { createContext, useState, useEffect } from "react";
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem("token");
    try {
      const parsedToken = storedToken ? JSON.parse(storedToken) : null;
      if (parsedToken) {
        const { exp } = jwtDecode(parsedToken);
        if (Date.now() >= exp * 1000) {
          // Token expired
          return null;
        }
      }
      return parsedToken;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", JSON.stringify(token));
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};
