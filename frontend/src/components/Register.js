import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [values, setValues] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({ firstname: '', lastname: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Validation Patterns
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordPattern = /^.{6,}$/; // Minimum 6 characters

  // Validate Inputs
  const validateInputs = () => {
    let valid = true;
    let newErrors = { firstname: '', lastname: '', email: '', password: '' };

    if (values.firstname.trim() === '') {
      newErrors.firstname = 'First name is required!';
      valid = false;
    }
    
    if (values.lastname.trim() === '') {
      newErrors.lastname = 'Last name is required!';
      valid = false;
    }

    if (!emailPattern.test(values.email)) {
      newErrors.email = 'Invalid email format!';
      valid = false;
    }

    if (!passwordPattern.test(values.password)) {
      newErrors.password = 'Password must be at least 6 characters long!';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // Handle Input Changes
  const handleChanges = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);
    setErrors({ firstname: '', lastname: '', email: '', password: '' });
    
    try {
      const response = await axios.post('http://localhost:8080/auth/register', values);
      if (response.status === 201) {
        navigate('/login');
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, email: 'Email already in use or registration failed!' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100">
      
      <div className="flex flex-col justify-center items-center w-full flex-grow bg-cover bg-center">
        <div className="w-full max-w-sm px-6 py-8 bg-white shadow-2xl rounded-xl space-y-6">
          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Register</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {['firstname', 'lastname', 'email', 'password'].map((field) => (
              <div key={field} className="space-y-1">
                <label htmlFor={field} className="block text-sm font-medium text-gray-600 capitalize">{field.replace('name', ' Name')}</label>
                <input
                  type={field === 'password' ? 'password' : 'text'}
                  placeholder={`Enter ${field.replace('name', ' Name')}`}
                  name={field}
                  value={values[field]}
                  onChange={handleChanges}
                  onBlur={() => validateInputs()}
                  className={`w-full px-4 py-2 border ${errors[field] ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {errors[field] && <p className="text-red-500 text-sm">{errors[field]}</p>}
              </div>
            ))}
            <button type="submit" disabled={loading} className={`w-full py-2 px-4 rounded-md transition ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
          <div className="text-center mt-4">
            <span className="text-sm text-gray-600">Already have an account? </span>
            <Link to='/login' className="text-sm text-blue-600 hover:underline">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
