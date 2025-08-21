import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Box, Tag, Save } from "lucide-react";
import { FaArrowLeft } from "react-icons/fa";
import { SidebarContext } from '../context/SidebarContext';

function EditProduct() {
  const { isSidebarOpen, isCollapsed } = useContext(SidebarContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    unit_price: "",
    initial_quantity: "",
    current_quantity: ""
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // Fetch product and categories data in parallel
        const [productRes, categoriesRes] = await Promise.all([
          axios.get(`http://localhost:8080/products/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:8080/categories`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const product = productRes.data;
        
        setFormData({
          name: product.name,
          category_id: product.category_id,
          unit_price: product.unit_price,
          initial_quantity: product.initial_quantity,
          current_quantity: product.current_quantity
        });

        setCategories(categoriesRes.data);

      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.response?.status === 401) {
          navigate("/login");
        } else {
          setErrors({ fetch: "Failed to load product data. Please try again." });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Validate form
    const validationErrors = {};
    if (!formData.name.trim()) validationErrors.name = "Product name is required";
    if (!formData.category_id) validationErrors.category_id = "Category is required";
    if (isNaN(formData.unit_price)) validationErrors.unit_price = "Unit price must be a number";
    if (isNaN(formData.current_quantity)) validationErrors.current_quantity = "Quantity must be a number";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const payload = {
        name: formData.name,
        category_id: formData.category_id,
        unit_price: parseFloat(formData.unit_price),
        current_quantity: parseInt(formData.current_quantity),
        initial_quantity: parseInt(formData.initial_quantity)
      };

      await axios.patch(`http://localhost:8080/products/${id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      navigate(`/view-product/${id}`, { 
        state: { success: "Product updated successfully!" } 
      });

    } catch (error) {
      console.error("Error updating product:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        setErrors({ 
          submit: error.response?.data?.message || "Failed to update product. Please try again." 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 pt-16 pb-8 px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
      isSidebarOpen ? (isCollapsed ? 'ml-16' : 'ml-64') : 'ml-0'
    }`}>
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Edit Product</h1>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 md:p-8">
            {errors.fetch && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                {errors.fetch}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-2 border ${errors.category_id ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition`}
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
                  )}
                </div>

                {/* Unit Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price (K)
                  </label>
                  <input
                    type="number"
                    name="unit_price"
                    value={formData.unit_price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                    className={`w-full px-4 py-2 border ${errors.unit_price ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition`}
                  />
                  {errors.unit_price && (
                    <p className="mt-1 text-sm text-red-600">{errors.unit_price}</p>
                  )}
                </div>

                {/* Initial Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Quantity
                  </label>
                  <input
                    type="number"
                    name="initial_quantity"
                    value={formData.initial_quantity}
                    onChange={handleChange}
                    min="0"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                  />
                </div>

                {/* Current Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Quantity
                  </label>
                  <input
                    type="number"
                    name="current_quantity"
                    value={formData.current_quantity}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-2 border ${errors.current_quantity ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition`}
                  />
                  {errors.current_quantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.current_quantity}</p>
                  )}
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
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Update Product
                    </>
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

export default EditProduct;