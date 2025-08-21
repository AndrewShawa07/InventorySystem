import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaArrowLeft } from 'react-icons/fa';
import { useContext } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SidebarContext } from '../context/SidebarContext';

const AddOutboundTransaction = () => {
  const { isSidebarOpen, isCollapsed } = useContext(SidebarContext);
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    remarks: '',
    collected_by: '',
    department_id: ''
  });
  const [products, setProducts] = useState([]);
  const [departments, setDepartments] = useState([]);
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
  
        // Fetch departments
        const departmentsResponse = await axios.get('http://localhost:8080/departments', {
          headers: { Authorization: `Bearer ${token}` }
        });
  
        const departmentsData = departmentsResponse.data;
        console.log("Fetched departments:", departmentsData);
  
        if (Array.isArray(departmentsData)) {
          setDepartments(departmentsData);
        } else {
          console.warn("Departments response is not an array:", departmentsData);
          setDepartments([]);
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
    )
    .filter(product => product.current_quantity > 0); // Only show products with stock

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
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = 'Valid quantity is required';
    if (!formData.collected_by) newErrors.collected_by = 'Collector name is required';
    if (!formData.department_id) newErrors.department_id = 'Department is required';
    
    // Check if quantity exceeds available stock
    const selectedProduct = products.find(p => p.id === formData.product_id);
    if (selectedProduct && formData.quantity > selectedProduct.current_quantity) {
      newErrors.quantity = `Quantity exceeds available stock (${selectedProduct.current_quantity})`;
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
      
      // Prepare transaction data
      const transactionData = {
        product_id: formData.product_id,
        quantity: formData.quantity,
        remarks: formData.remarks,
        transaction_type: 'outbound',
        performed_by: user.id,
        collected_by: formData.collected_by,
        department_id: formData.department_id
      };
      
      // Create the outbound transaction
      await axios.post('http://localhost:8080/stock-transactions', transactionData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Outbound transaction added successfully!');
      navigate('/outbound-stock');
    } catch (error) {
      console.error('Error adding outbound transaction:', error);
      toast.error('Failed to add outbound transaction. Please try again.');
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
          <h1 className="text-2xl font-bold text-gray-800">Add Outbound Stock Transaction</h1>
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
                        No products found matching "{productSearch}" or no stock available
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {errors.quantity && (
                <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
              )}
            </div>

            {/* Collected By */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Collected By *
              </label>
              <input
                type="text"
                name="collected_by"
                value={formData.collected_by}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter name of person collecting"
              />
              {errors.collected_by && (
                <p className="text-red-500 text-xs mt-1">{errors.collected_by}</p>
              )}
            </div>

            {/* Department */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Department *
              </label>
              <select
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select a department</option>
                {departments.map(department => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              {errors.department_id && (
                <p className="text-red-500 text-xs mt-1">{errors.department_id}</p>
              )}
            </div>

            {/* Remarks */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Optional notes about this transaction"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 disabled:bg-green-400"
              >
                {isSubmitting ? 'Processing...' : 'Add Outbound Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AddOutboundTransaction;