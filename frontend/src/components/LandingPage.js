import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center">
            {/* Green Background Section with Logo */}
            <div className="w-full bg-gradient-to-br from-green-600 to-green-800 py-8 flex items-center justify-center">
                {/* Card-like container for logo, welcome message, and login button */}
                <div className="container mx-auto flex flex-col md:flex-row items-center justify-between backdrop-blur-sm rounded-lg shadow-lg p-4 md:p-6 w-full max-w-4xl">
                    {/* Logo */}
                    <img 
                        src="/logo.jpg" 
                        alt="EIZ Logo" 
                        className="h-16 w-16 md:h-20 md:w-20 mb-4 md:mb-0 md:mr-6"
                    />

                    {/* Welcome Message */}
                    <div className="flex-1 text-center mb-4 md:mb-0">
                        <h1 className="text-xl md:text-3xl font-extrabold text-white mb-2 md:mb-4">
                            Welcome to the EIZ Inventory Management System
                        </h1>
                        <p className="text-sm md:text-lg text-green-100 mb-4">
                            Existing user? Login to access your account.
                        </p>
                    </div>

                    {/* Login Button */}
                    <button 
                        className="bg-green-700 text-white font-semibold px-6 py-2 md:px-8 md:py-3 rounded-full shadow-lg hover:bg-green-600 transition duration-300 transform hover:scale-105"
                        onClick={() => navigate('/login')}
                    >
                        Login
                    </button>
                </div>
            </div>

            {/* Background Image Section */}
            <div 
                className="flex flex-col justify-center items-center w-full flex-grow bg-cover bg-center py-12 md:py-24" 
                style={{ backgroundImage: "url('/logo1.jpeg')" }}
            >
                {/* Optional: Add content here */}
            </div>
        </div>
    );
};

export default LandingPage;