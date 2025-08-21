import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Validation Patterns
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordPattern = /^.{6,}$/; // Minimum 6 characters

    // Validate Inputs
    const validateInputs = () => {
        let valid = true;
        let newErrors = { email: "", password: "" };

        if (!emailPattern.test(email)) {
            newErrors.email = "Invalid email format!";
            valid = false;
        }

        if (!passwordPattern.test(password)) {
            newErrors.password = "Password must be at least 6 characters long!";
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };
    

    // Handle Form Submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateInputs()) return;
    
        setLoading(true);
        setErrors({ email: "", password: "" }); // Reset errors before request
    
        try {
            const response = await axios.post("http://localhost:8080/auth/login", { email, password });

    
            if (response.status === 200) {
                 // Store both token and user data in localStorage
            const { token, user } = response.data; // Get token and user data from response
            localStorage.setItem("id", user.id);
            localStorage.setItem("token", token);  // Store the token
            localStorage.setItem("role", user.role); // Store the user's role
            localStorage.setItem("user", JSON.stringify(user));  // Store the user object (including name)
            console.log(user); //
                navigate("/stock-manager");
            }
        } catch (error) {
            if (error.response && error.response.data) {
                const message = error.response.data.message;
                if (message.includes("Email not found")) {
                    setErrors((prev) => ({ ...prev, email: "Email does not exist!" }));
                } else if (message.includes("Incorrect password")) {
                    setErrors((prev) => ({ ...prev, password: "Incorrect password!" }));
                } else {
                    setErrors((prev) => ({ ...prev, password: "Invalid credentials!" }));
                }
            } else {
                setErrors((prev) => ({ ...prev, password: "Something went wrong. Try again!" }));
            }
        } finally {
            setLoading(false);
        }
    };
    

    return (
        </* This part of the code is responsible for creating the initial layout of the login page.
        Let's break it down: */
        div className="min-h-screen flex flex-col items-center bg-gray-100">

            {/* Green Background Section with Logo */}
            {/* Background Image Section */}
            <div 
                className="flex flex-col justify-center items-center w-full flex-grow bg-cover bg-center py-10 px-6">
                {/* Login Form */}
                <div className="w-full max-w-sm px-6 py-8 bg-white shadow-2xl rounded-xl space-y-6">
                    <h2 className="text-2xl font-semibold text-center text-gray-800">Login</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email Input */}
                        <div className="space-y-1">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-600">
                                Email
                            </label>
                            <input
                                id= "email"
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={() => {
                                    if (!emailPattern.test(email)) {
                                        setErrors((prev) => ({ ...prev, email: "Invalid email format!" }));
                                    } else {
                                        setErrors((prev) => ({ ...prev, email: "" }));
                                    }
                                }}
                                required
                                className={`w-full px-4 py-2 border ${
                                    errors.email ? "border-red-500" : "border-gray-200"
                                } rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                            />
                            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                        </div>
                        
                        {/* Password Input */}
                        <div className="space-y-1">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-600">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onBlur={() => {
                                    if (!passwordPattern.test(password)) {
                                        setErrors((prev) => ({ ...prev, password: "Password must be at least 6 characters!" }));
                                    } else {
                                        setErrors((prev) => ({ ...prev, password: "" }));
                                    }
                                }}
                                required
                                className={`w-full px-4 py-2 border ${
                                    errors.password ? "border-red-500" : "border-gray-200"
                                } rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                            />
                            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                        </div>
                        
                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-2 px-4 rounded-md transition ${
                                loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"
                            }`}
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>
                    
                    <div className="text-center">
                        <span className="text-sm text-gray-600">Don't have an account? </span>
                        <Link to='/register' className="text-sm text-blue-600 hover:underline">Sign up</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
