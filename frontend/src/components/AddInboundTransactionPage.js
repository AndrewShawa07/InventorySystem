import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaArrowLeft } from 'react-icons/fa';
import { useContext } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SidebarContext } from '../context/SidebarContext';

const AddInboundTransaction = () => {
  const { isSidebarOpen, isCollapsed } = useContext(SidebarContext);
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    remarks: '',
    supplier_id: ''
  });
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category_id: '',
    unit_price: '',
    initial_quantity: 0,
    current_quantity: 0
  });
  const [categories, setCategories] = useState([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: ''
  });
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
          setProducts([]); // fallback
        }
  
        // Fetch suppliers
        const suppliersResponse = await axios.get('http://localhost:8080/suppliers', {
          headers: { Authorization: `Bearer ${token}` }
        });
  
        const suppliersData = suppliersResponse.data;
        console.log("Fetched suppliers:", suppliersData);
  
        if (Array.isArray(suppliersData)) {
          setSuppliers(suppliersData);
          setFilteredSuppliers(suppliersData);
        } else {
          console.warn("Suppliers response is not an array:", suppliersData);
          setSuppliers([]);
        }
  
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
  
    fetchData();
  }, []);
  
  // Add this useEffect to fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8080/categories', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, []);

  // Filter products based on search
  useEffect(() => {
    if (!Array.isArray(products)) {
      // If products is not an array yet, skip filtering
      setFilteredProducts([]);
      return;
    }
    const searchTerm = productSearch || '';
    const filtered = products.filter(product =>
      product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [productSearch, products]);
  

  useEffect(() => {
    const filtered = suppliers.filter(supplier => 
      supplier?.name?.toLowerCase().includes(supplierSearch.toLowerCase())
    );
    setFilteredSuppliers(filtered);
  }, [supplierSearch, suppliers]);
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSupplierChange = (e) => {
    const { name, value } = e.target;
    setNewSupplier(prev => ({
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

  const selectSupplier = (supplier) => {
    setFormData(prev => ({
      ...prev,
      supplier_id: supplier.id
    }));
    setSupplierSearch(supplier.name);
    setShowSupplierDropdown(false);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.product_id) newErrors.product_id = 'Product is required';
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = 'Valid quantity is required';
    if (!formData.supplier_id && !showAddSupplier) newErrors.supplier_id = 'Supplier is required';
    
    if (showAddSupplier) {
      if (!newSupplier.name) newErrors.supplierName = 'Supplier name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addNewSupplier = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:8080/suppliers', newSupplier, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Add the new supplier to the list and select it
      const addedSupplier = response.data;
      setSuppliers(prev => [...prev, addedSupplier]);
      setFormData(prev => ({
        ...prev,
        supplier_id: addedSupplier.id
      }));
      setSupplierSearch(addedSupplier.name);
      setShowAddSupplier(false);
    } catch (error) {
      console.error('Error adding supplier:', error);
      alert('Failed to add supplier. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user')); // Get the user object
      
      if (!user || !user.id) {
        throw new Error('User information not found');
      }
  
      // First add supplier if needed
      if (showAddSupplier) {
        await addNewSupplier();
      }
      
      // Prepare transaction data
      const transactionData = {
        product_id: formData.product_id,
        quantity: formData.quantity,
        remarks: formData.remarks,
        supplier_id: formData.supplier_id,
        transaction_type: 'inbound',
        performed_by: user.id // Use the user's ID from localStorage
      };
      console.log('Transaction Data:', transactionData);
      // Create the inbound transaction
      await axios.post('http://localhost:8080/stock-transactions', transactionData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Inbound transaction added successfully!');
      navigate('/inbound-stock');
    } catch (error) {
      console.error('Error adding inbound transaction:', error);
      toast.error('Failed to add inbound transaction. Please try again.');
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
          <h1 className="text-2xl font-bold text-gray-800">Add Inbound Stock Transaction</h1>
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
                {errors.product_id && !showAddProduct && (
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
                      <>
                        <div className="px-4 py-2 text-gray-500">
                          No products found matching "{productSearch}"
                        </div>
                        <div
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 cursor-pointer flex items-center border-t border-gray-300"
                          onClick={() => {
                            setShowProductDropdown(false);
                            setShowAddProduct(true);
                            setNewProduct(prev => ({ 
                              ...prev, 
                              name: productSearch,
                              initial_quantity: 0,
                              current_quantity: 0
                            }));
                          }}
                        >
                          <FaPlus className="mr-2" /> Add "{productSearch}" as new product
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Add New Product Form (Conditional) */}
            {showAddProduct && (
              <div className="mb-6 p-4 border border-gray-300 rounded-md bg-gray-50">
                <h3 className="text-lg font-medium mb-3">Add New Product</h3>
                
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Category *
                    </label>
                    <select
                      name="category_id"
                      value={newProduct.category_id}
                      onChange={(e) => setNewProduct({...newProduct, category_id: e.target.value})}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Unit Price *
                    </label>
                    <input
                      type="number"
                      name="unit_price"
                      value={newProduct.unit_price}
                      onChange={(e) => setNewProduct({...newProduct, unit_price: e.target.value})}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddProduct(false);
                      setProductSearch('');
                    }}
                    className="px-3 py-1 text-sm bg-gray-300 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                        if (!newProduct.name || !newProduct.category_id || !newProduct.unit_price) {
                          toast.error('Please fill all required fields');
                          return;
                        }
                        try {
                          const token = localStorage.getItem('token');
                          const response = await axios.post('http://localhost:8080/products', newProduct, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          
                          // Add the new product to the list and select it
                          const addedProduct = response.data;
                          setProducts(prev => [...prev, addedProduct]);
                          setFormData(prev => ({
                            ...prev,
                            product_id: addedProduct.id
                          }));
                          setProductSearch(addedProduct.name);
                          setShowAddProduct(false);
                          
                          // Show success toast
                          toast.success('Product added successfully!');
                          
                          // Refresh products list
                          const productsResponse = await axios.get('http://localhost:8080/products', {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          setProducts(productsResponse.data);
                          setFilteredProducts(productsResponse.data);
                        } catch (error) {
                          console.error('Error adding product:', error);
                          toast.error('Failed to add product. Please try again.');
                        }
                      }}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Product Only
                  </button>
                </div>
              </div>
            )}

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

            {/* Supplier Selection */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Supplier *
              </label>
              <div className="relative">
                <div className="flex items-center border border-gray-300 rounded-md">
                  <input
                    type="text"
                    placeholder="Search suppliers..."
                    value={supplierSearch}
                    onChange={(e) => {
                      setSupplierSearch(e.target.value);
                      setShowSupplierDropdown(true);
                    }}
                    onFocus={() => setShowSupplierDropdown(true)}
                    className="flex-1 pl-3 pr-10 py-2 text-sm focus:outline-none rounded-md"
                  />
                  <FaSearch className="text-gray-400 mr-3" />
                </div>
                {errors.supplier_id && !showAddSupplier && (
                  <p className="text-red-500 text-xs mt-1">{errors.supplier_id}</p>
                )}
                
                {/* Supplier Dropdown */}
                {showSupplierDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredSuppliers.length > 0 ? (
                      filteredSuppliers.map(supplier => (
                        <div
                          key={supplier.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => selectSupplier(supplier)}
                        >
                          {supplier.name} ({supplier.contact_person || 'No contact'})
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="px-4 py-2 text-gray-500">
                          No suppliers found matching "{supplierSearch}"
                        </div>
                        <div
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 cursor-pointer flex items-center border-t border-gray-300"
                          onClick={() => {
                            setShowSupplierDropdown(false);
                            setShowAddSupplier(true);
                            setNewSupplier(prev => ({ ...prev, name: supplierSearch }));
                          }}
                        >
                          <FaPlus className="mr-2" /> Add "{supplierSearch}" as new supplier
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Add New Supplier Form (Conditional) */}
            {showAddSupplier && (
              <div className="mb-6 p-4 border border-gray-300 rounded-md bg-gray-50">
                <h3 className="text-lg font-medium mb-3">Add New Supplier</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Supplier Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newSupplier.name}
                      onChange={handleSupplierChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    />
                    {errors.supplierName && (
                      <p className="text-red-500 text-xs mt-1">{errors.supplierName}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      name="contact_person"
                      value={newSupplier.contact_person}
                      onChange={handleSupplierChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={newSupplier.phone}
                      onChange={handleSupplierChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={newSupplier.email}
                      onChange={handleSupplierChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSupplier(false);
                      setSupplierSearch('');
                    }}
                    className="px-3 py-1 text-sm bg-gray-300 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                        if (!newSupplier.name) {
                          toast.error('Supplier name is required');
                          return;
                        }
                        try {
                          const token = localStorage.getItem('token');
                          const response = await axios.post('http://localhost:8080/suppliers', newSupplier, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          
                          // Add the new supplier to the list and select it
                          const addedSupplier = response.data;
                          setSuppliers(prev => [...prev, addedSupplier]);
                          setFormData(prev => ({
                            ...prev,
                            supplier_id: addedSupplier.id
                          }));
                          setSupplierSearch(addedSupplier.name);
                          setShowAddSupplier(false);
                          
                          // Show success toast
                          toast.success('Supplier added successfully!');
                          
                          // Refresh suppliers list
                          const suppliersResponse = await axios.get('http://localhost:8080/suppliers', {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          setSuppliers(suppliersResponse.data);
                          setFilteredSuppliers(suppliersResponse.data);
                        } catch (error) {
                          console.error('Error adding supplier:', error);
                          toast.error('Failed to add supplier. Please try again.');
                        }
                      }}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Supplier Only
                  </button>
                </div>
              </div>
            )}

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
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 disabled:bg-green-400"
              >
                {isSubmitting ? 'Processing...' : 'Add Inbound Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AddInboundTransaction;