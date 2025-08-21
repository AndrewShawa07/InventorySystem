import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaArrowLeft } from 'react-icons/fa';
import { useContext } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SidebarContext } from '../context/SidebarContext';

const AddAdjustmentTransaction = () => {
  const { isSidebarOpen, isCollapsed } = useContext(SidebarContext);
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    remarks: '',

  });
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
  
        // Fetch products
        const productsResponse = await axios.get('http://localhost:8080/products-dropdown', {
          headers: { Authorization: `Bearer ${token}` }
        });
  
        const productsData = productsResponse.data;
        console.log("Fetched products:", productsData);
  
        if (Array.isArray(productsData)) {
          setProducts(productsData);
          setFilteredProducts(productsData);
        } else {
          console.warn("Products response is not an array:", productsData);
          setProducts([]);
        }
  
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    fetchData();
  }, []);

  // Filter products based on search
  useEffect(() => {
    if (!Array.isArray(products)) {
      setFilteredProducts([]);
      return;
    }
    const searchTerm = productSearch || '';
    const filtered = products
      .filter(product =>
        product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );

    setFilteredProducts(filtered);
  }, [productSearch, products]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const selectProduct = (product) => {
    setFormData(prev => ({
      ...prev,
      product_id: product.id
    }));
    setProductSearch(product.name);
    setShowProductDropdown(false);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.product_id) newErrors.product_id = 'Product is required';
    if (!formData.quantity || formData.quantity == 0) {
      newErrors.quantity = 'Valid quantity is required (positive or negative)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!user || !user.id) {
        throw new Error('User information not found');
      }
      
      // Preparing transaction data for adjustment
      const transactionData = {
        product_id: formData.product_id,
        quantity: formData.quantity, // Can be positive or negative
        remarks: formData.remarks,
        transaction_type: 'adjustment',
        performed_by: user.id
      };
      
      // Creating the adjustment transaction
      await axios.post('http://localhost:8080/stock-transactions', transactionData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Adjustment transaction added successfully!');
      navigate('/adjustments');
    } catch (error) {
      console.error('Error adding adjustment transaction:', error);
      toast.error('Failed to add adjustment transaction. Please try again.');
      if (error.response && error.response.status === 401) {
        navigate('/login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 pt-16 pb-8 px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
      isSidebarOpen ? (isCollapsed ? 'ml-16' : 'ml-64') : 'ml-0'
    }`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Add Stock Adjustment</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit}>
            {/* Product Selection */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Product *
              </label>
              <div className="relative">
                <div className="flex items-center border border-gray-300 rounded-md">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    className="flex-1 pl-3 pr-10 py-2 text-sm focus:outline-none rounded-md"
                  />
                  <FaSearch className="text-gray-400 mr-3" />
                </div>
                {errors.product_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.product_id}</p>
                )}
                
                {/* Product Dropdown */}
                {showProductDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map(product => (
                        <div
                          key={product.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => selectProduct(product)}
                        >
                          {product.name} (Current: {product.current_quantity || 0})
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500">
                        No products found matching "{productSearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quantity - Can be positive or negative */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Adjustment Quantity *
                <span className="text-gray-500 ml-2">(Positive to add, negative to remove)</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., 5 to add or -3 to remove"
              />
              {errors.quantity && (
                <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
              )}
            </div>

            {/* Remarks */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Reason for Adjustment *
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Explain why you're making this adjustment (e.g., damaged items, found stock, etc.)"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 disabled:bg-green-400"
              >
                {isSubmitting ? 'Processing...' : 'Record Adjustment'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AddAdjustmentTransaction;
