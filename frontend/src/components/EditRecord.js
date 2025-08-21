import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../index.css";
import { useContext } from 'react';
import { SidebarContext } from '../context/SidebarContext';

function EditCard() {
  const { isSidebarOpen, isCollapsed } = useContext(SidebarContext);
  const { id } = useParams();
  const navigate = useNavigate();

  // State for form fields
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    nrc: "",
    type: "",
    fieldOfStudy: "",
    status: "Pending"
  });
  // const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fetch card data on component mount
  useEffect(() => {
    const fetchCard = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:8080/cards/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const card = response.data;
        setFormData({
          firstname: card.firstname,
          lastname: card.lastname,
          nrc: card.nrc,
          type: card.type,
          fieldOfStudy: card.field_of_study,
          status: card.status
        });
      } catch (error) {
        console.error("Error fetching card:", error);
        if (error.response?.status === 401) {
          navigate("/login");
        } else {
          setErrors({ fetch: "Failed to load card data. Please try again." });
        }
      }
    };

    fetchCard();
  }, [id, navigate]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      const payload = {
        firstname: formData.firstname,
        lastname: formData.lastname,
        nrc: formData.nrc,
        type: formData.type,
        field_of_study: formData.fieldOfStudy,
        status: formData.status,
      };
      
      await axios.patch(`http://localhost:8080/cards/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      navigate("/record-manager", { state: { success: "Record updated successfully!" } });
    } catch (error) {
      console.error("Error updating card:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        setErrors({ submit: error.response?.data?.message || "Failed to update card. Please try again." });
      }
    } finally {
      // setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
<div className={`min-h-screen bg-gray-50 pt-16 pb-8 px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
      isSidebarOpen ? (isCollapsed ? 'ml-16' : 'ml-64') : 'ml-0'
    }`}>
      <div className="max-w-4xl mx-auto">
        <Link to="/record-manager" className="text-blue-500 hover:underline mb-4 block">
                  &larr; Back to Dashboard
                </Link>
          <h1 className="text-3xl font-bold text-green-700 mb-8 text-center">
          Edit Record
        </h1>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="py-4 px-6">
            
            <p className="text-black-100">Update the details below</p>
          </div>
          
          <div className="p-6 md:p-8">
            {errors.fetch && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                {errors.fetch}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstname"
                    value={formData.firstname}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  />
                </div>
                
                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  />
                </div>
                
                {/* NRC */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">NRC Number</label>
                  <input
                    type="text"
                    name="nrc"
                    value={formData.nrc}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    placeholder="e.g. 12/3456/7890"
                  />
                </div>
                
                {/* Record Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Record Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  >
                    <option value="" disabled>Select Record Type</option>
                    <option value="Card">Card</option>
                    <option value="Certificate">Certificate</option>
                  </select>
                </div>
                
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Collected">Collected</option>
                  </select>
                </div>
                
                {/* Field of Study */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
                  <select
                    name="fieldOfStudy"
                    value={formData.fieldOfStudy}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  >
                    <option value="" disabled>Select Field of Study</option>
                    <option value="AE: Agricultural Engineering">AE: Agricultural Engineering</option>
                    <option value="CE: Civil Engineering">CE: Civil Engineering (Environmental, Roads, Structural, Building, Water and Sanitation)</option>
                    <option value="CHE: Chemical Engineering">CHE: Chemical Engineering</option>
                    <option value="EE: Electrical, Electronic Engineering">EE: Electrical, Electronic Engineering (Telecommunications, Control and Instrumentation)</option>
                    <option value="GG: Geology">GG: Geology</option>
                    <option value="HG: Hydro-Geology Engineering">HG: Hydro-Geology Engineering</option>
                    <option value="LS: Land Surveying">LS: Land Surveying</option>
                    <option value="ME: Mechanical Engineering">ME: Mechanical Engineering (Aeronautical, Aircraft, Automobile, Mechanical, Production)</option>
                    <option value="MED.E: Medical Engineering">MED.E: Medical Engineering</option>
                    <option value="MT: Metallurgical Engineering">MT: Metallurgical Engineering</option>
                    <option value="MG: Mining Engineering">MG: Mining Engineering</option>
                    <option value="PM: Production Management">PM: Production Management</option>
                    <option value="A.PHY: Applied Physics">A.PHY: Applied Physics</option>
                    <option value="GEO: Geomatic Engineering">GEO: Geomatic Engineering</option>
                    <option value="COMP.ENG: Computer Engineering">COMP.ENG: Computer Engineering(Computers and Information Technology)</option>
                  </select>
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition flex items-center justify-center ${
                    isSubmitting 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    "Update Record"
                  )}
                </button>
                {errors.submit && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm">
                    {errors.submit}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditCard;