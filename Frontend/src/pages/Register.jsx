import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import CircularProgress from "@mui/material/CircularProgress";
import { ThemeContext } from "../context/themeContext";
import { DarkMode, LightMode } from '@mui/icons-material';
import logo from '../assets/logo.png';

const Register = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const { theme, changeTheme } = useContext(ThemeContext);
  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  const registerUser = async (userCredentials) => {
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/register`, userCredentials);
      toast.success("Account created successfully!", { theme });
      navigate("/login");
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setUsernameError(error.response.data.message);
      } else {
        toast.error("Registration failed. Please try again.", { theme });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords don't match!");
      return;
    }
    registerUser({
      fullname: formData.fullname,
      username: formData.username,
      password: formData.password
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({...formData, [name]: value});
    if (name === "password" || name === "confirmPassword") setPasswordError("");
    if (name === "username") setUsernameError("");
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-amber-50 to-amber-100'}`}>
      <div className={`relative max-w-md w-full rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 transform hover:scale-[1.01] ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Decorative elements */}
        <div className={`absolute top-0 left-0 w-full h-2 ${theme === 'dark' ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gradient-to-r from-amber-400 to-amber-500'}`}></div>
        
        <div className="p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src={logo} 
              alt="Connectify Logo" 
              className="h-16 w-auto transition-transform duration-300 hover:scale-110" 
            />
          </div>

          <h2 className={`text-3xl font-bold text-center mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Join Connectify
          </h2>
          <p className={`text-center mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Create your account to get started
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label htmlFor="fullname" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullname"
                  name="fullname"
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all duration-200 ${
                    theme === 'dark' ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200 bg-gray-50'
                  }`}
                  placeholder="Your full name"
                  onChange={handleChange}
                  value={formData.fullname}
                  required
                />
              </div>

              <div>
                <label htmlFor="username" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all duration-200 ${
                    usernameError ? 'border-red-500' : theme === 'dark' ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200 bg-gray-50'
                  }`}
                  placeholder="Choose a username"
                  onChange={handleChange}
                  value={formData.username}
                  required
                />
                {usernameError && <p className="mt-1 text-sm text-red-500 animate-shake">{usernameError}</p>}
              </div>

              <div>
                <label htmlFor="password" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all duration-200 ${
                    theme === 'dark' ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200 bg-gray-50'
                  }`}
                  placeholder="Create a password (min 6 chars)"
                  onChange={handleChange}
                  value={formData.password}
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all duration-200 ${
                    passwordError ? 'border-red-500' : theme === 'dark' ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200 bg-gray-50'
                  }`}
                  placeholder="Re-enter your password"
                  onChange={handleChange}
                  value={formData.confirmPassword}
                  required
                />
                {passwordError && <p className="mt-1 text-sm text-red-500 animate-shake">{passwordError}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-all duration-300 shadow-lg ${
                isLoading ? 'bg-amber-400' : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
              } flex items-center justify-center`}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={20} color="inherit" className="mr-2" />
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-amber-600 hover:text-amber-700 transition-colors duration-200"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Theme toggle button */}
      <button 
        onClick={changeTheme} 
        className={`fixed bottom-6 right-6 p-3 rounded-full shadow-lg transition-all duration-300 ${
          theme === 'dark' ? 'bg-gray-700 text-amber-400 hover:bg-gray-600' : 'bg-white text-amber-600 hover:bg-amber-50'
        }`}
      >
        {theme === 'light' ? (
          <DarkMode sx={{ fontSize: 28 }} />
        ) : (
          <LightMode sx={{ fontSize: 28 }} />
        )}
      </button>
    </div>
  );
};

export default Register;