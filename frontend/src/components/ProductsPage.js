import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FaSearch, 
  FaArrowLeft, 
  FaPlus, 
  FaBox, 
  FaMoneyBillWave, 
  FaExclamationTriangle
} from "react-icons/fa";
import { FiTrendingDown, FiTrendingUp } from "react-icons/fi";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { motion } from "framer-motion";
import { useContext } from 'react';
import { SidebarContext } from '../context/SidebarContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF'];

const ProductsPage = () => {
  const { isSidebarOpen, isCollapsed } = useContext(SidebarContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("name-asc");
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStock: 0,
    outOfStock: 0,
    categoryDistribution: [],
    recentProducts: []
  });
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const isAuthenticated = useCallback(() => {
    const token = localStorage.getItem("token");
    return !!token;
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const fetchProducts = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:8080/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setProducts(response.data.products);
      setCategories(response.data.categories);
      
      // Calculate stats
      const totalValue = response.data.products.reduce(
        (sum, product) => sum + (product.current_quantity * product.unit_price), 
        0
      );
      
      const lowStock = response.data.products.filter(
        product => product.current_quantity > 0 && product.current_quantity < 5
      ).length;
      
      const outOfStock = response.data.products.filter(
        product => product.current_quantity === 0
      ).length;
      
      // Calculate category distribution
      const categoryCounts = {};
      response.data.products.forEach(product => {
        const categoryName = response.data.categories[product.category_id] || 'Uncategorized';
        categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
      });
      
      const categoryDistribution = Object.entries(categoryCounts).map(([name, value]) => ({
        name,
        value
      }));

      // Get recent products (sorted by date, newest first)
      const recentProducts = [...response.data.products]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 4);
      
      setStats({
        totalProducts: response.data.products.length,
        totalValue,
        lowStock,
        outOfStock,
        categoryDistribution,
        recentProducts
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      }
    }
  }, [navigate]);

  const handleDelete = useCallback(async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8080/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(prev => prev.filter(product => product.id !== id));
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setShowDeletePopup(false);
    }
  }, [fetchProducts, navigate]);

  const confirmDelete = useCallback((id) => {
    setProductToDelete(id);
    setShowDeletePopup(true);
  }, []);

  const cancelDelete = useCallback(() => {
    setShowDeletePopup(false);
    setProductToDelete(null);
  }, []);

  const handleEdit = useCallback((id, e) => {
    e.stopPropagation();
    navigate(`/edit-product/${id}`);
  }, [navigate]);

  const handleView = useCallback((id) => {
    navigate(`/view-product/${id}`);
  }, [navigate]);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      switch (sortOrder) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "price-asc":
          return a.unit_price - b.unit_price;
        case "price-desc":
          return b.unit_price - a.unit_price;
        case "quantity-asc":
          return a.current_quantity - b.current_quantity;
        case "quantity-desc":
          return b.current_quantity - a.current_quantity;
        case "date-newest":
          return new Date(b.created_at) - new Date(a.created_at);
        case "date-oldest":
          return new Date(a.created_at) - new Date(b.created_at);
        default:
          return 0;
      }
    });
  }, [products, sortOrder]);

  const filteredProducts = useMemo(() => {
    return sortedProducts.filter((product) => {
      const productName = product.name.toLowerCase();
      const categoryName = categories[product.category_id]?.toLowerCase() || '';
      const value = (product.unit_price * product.current_quantity).toFixed(2); // Calculate total value
      const matchesSearch =
        productName.includes(searchQuery.toLowerCase()) ||
        categoryName.includes(searchQuery.toLowerCase()) ||
        product.unit_price.toString().includes(searchQuery) ||
        product.current_quantity.toString().includes(searchQuery) ||
        value.includes(searchQuery) ||
        new Date(product.created_at).toLocaleDateString("en-GB").includes(searchQuery);

      return matchesSearch;
    });
  }, [sortedProducts, searchQuery, categories]);

  useEffect(() => {
    if (isAuthenticated()) {
      fetchProducts();
    }
  }, [isAuthenticated, fetchProducts]);

  const getStockStatusClass = (quantity) => {
    if (quantity === 0) return "bg-red-100 text-red-800";
    if (quantity < 5) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <div className={`min-h-screen bg-gray-50 pt-16 pb-8 px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
      isSidebarOpen ? (isCollapsed ? 'ml-16' : 'ml-64') : 'ml-0'
    }`}>
      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center w-96">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this product?</p>
            <div className="flex justify-center space-x-4 mt-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(productToDelete)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-8xl mx-auto">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Table (70% width) */}
          <div className="lg:w-[70%]">
            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1 min-w-0">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Sort Dropdown */}
                <div className="relative flex-1 sm:flex-none sm:w-48">
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="name-asc">Name: A-Z</option>
                    <option value="name-desc">Name: Z-A</option>
                    <option value="price-asc">Price: Low-High</option>
                    <option value="price-desc">Price: High-Low</option>
                    <option value="quantity-asc">Quantity: Low-High</option>
                    <option value="quantity-desc">Quantity: High-Low</option>
                    <option value="date-newest">Date: Newest</option>
                    <option value="date-oldest">Date: Oldest</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex mb-6">
              <Link
                to="/add-product"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 shadow-sm hover:shadow-md"
              >
                <FaPlus className="w-5 h-5 mr-2" />
                Add New Product
              </Link>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">All Products</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-600 text-sm">
                      <th className="pb-2 font-medium">Product Name</th>
                      <th className="pb-2 font-medium">Category</th>
                      <th className="pb-2 font-medium">Current Stock</th>
                      <th className="pb-2 font-medium">Unit Price</th>
                      <th className="pb-2 font-medium">Total Value</th>
                      <th className="pb-2 font-medium">Date Added</th>
                      {/* {role === "admin" && <th className="pb-2 font-medium">Actions</th>} */}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => {
                        const totalValue = product.current_quantity * product.unit_price;
                        return (
                          <tr 
                            key={product.id} 
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleView(product.id)}
                          >
                            <td className="py-3 font-medium">{product.name}</td>
                            <td className="py-3">{categories[product.category_id] || 'Uncategorized'}</td>
                            <td className="py-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${getStockStatusClass(product.current_quantity)}`}>
                                {product.current_quantity}
                              </span>
                            </td>
                            <td className="py-3">K{Number(product.unit_price || 0).toFixed(2)}</td>
                            <td className="py-3">K{totalValue.toFixed(2)}</td>
                            <td className="py-3">
                              {new Date(product.created_at).toLocaleDateString("en-GB")}
                            </td>
                            {/* {role === "admin" && (
                              <td className="py-3">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={(e) => handleEdit(product.id, e)}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      confirmDelete(product.id);
                                    }}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            )} */}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={role === "admin" ? 7 : 6} className="py-4 text-center text-gray-500">
                          No products found matching your criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Stats and Charts (30% width) */}
          <div className="lg:w-[30%] space-y-6">
            {/* Recent Products and Category Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white p-4 rounded-lg shadow-sm"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Products</h2>
                <h2 className="text-lg font-semibold text-right">Categories</h2>
              </div>

              {/* Content Row */}
              <div className="flex flex-col lg:flex-row">
                {/* Left: Recent Products List */}
                <div className="lg:w-1/2 pr-0 lg:pr-4 border-b lg:border-b-0 lg:border-r border-gray-200">
                  <div className="space-y-3">
                    {stats.recentProducts.map((product) => (
                      <div key={product.id} className="flex items-start">
                        <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                          <FiTrendingUp className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-gray-500">
                            {product.current_quantity} in stock • ${Number(product.unit_price || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Category Distribution Chart */}
                <div className="lg:w-1/2 mt-6 lg:mt-0 pl-0 lg:pl-4">
                  {stats.categoryDistribution.length > 0 ? (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.categoryDistribution}
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            dataKey="value"
                            nameKey="name"
                            labelLine={false}
                            label={false}
                            animationBegin={100}
                            animationDuration={1000}
                            animationEasing="ease-out"
                          >
                            {stats.categoryDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name) => [`${value} products`, name]}
                          />
                         <Legend
                                  verticalAlign="bottom"
                                  height={36}
                                  wrapperStyle={{ fontSize: '12px' }}
                                />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-gray-500">
                      <p>No category data available</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Product Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-indigo-950 p-5 rounded-lg shadow-md text-white"
            >
              <h2 className="text-lg font-semibold mb-4">Product Summary</h2>
              <div className="grid grid-cols-2 gap-3">
                {/* Total Products */}
                <div className="p-3 bg-blue-600 rounded-md">
                  <div className="flex items-center">
                    <FaBox className="w-4 h-4 mr-2 text-blue-800" />
                    <span className="text-sm">Total Products</span>
                  </div>
                  <p className="font-semibold mt-1 text-xl">
                    {stats.totalProducts}
                  </p>
                </div>
                
                {/* Total Value */}
                <div className="p-3 bg-teal-600 rounded-md">
                  <div className="flex items-center">
                    <FaMoneyBillWave className="w-4 h-4 mr-2 text-green-800" />
                    <span className="text-sm">Total Value</span>
                  </div>
                  <p className="font-semibold mt-1 text-xl">
                    K{stats.totalValue.toFixed(2)}
                  </p>
                </div>
                
                {/* Low Stock */}
                <div className="p-3 bg-yellow-500 rounded-md">
                  <div className="flex items-center">
                    <FaExclamationTriangle className="w-4 h-4 mr-2 text-yellow-800" />
                    <span className="text-sm">Low Stock</span>
                  </div>
                  <p className="font-semibold mt-1 text-xl">
                    {stats.lowStock}
                  </p>
                </div>
                
                {/* Out of Stock */}
                <div className="p-3 bg-red-500 rounded-md">
                  <div className="flex items-center">
                    <FiTrendingDown className="w-4 h-4 mr-2 text-red-800" />
                    <span className="text-sm">Out of Stock</span>
                  </div>
                  <p className="font-semibold mt-1 text-xl">
                    {stats.outOfStock}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;