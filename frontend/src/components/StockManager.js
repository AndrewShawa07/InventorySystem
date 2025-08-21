import React, { useState, useEffect, useCallback, useMemo, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaBoxOpen, FaBox, FaExchangeAlt, FaSearch, FaCubes, FaWarehouse, FaEye, FaChevronLeft, FaChevronRight, FaExclamationTriangle, FaTags } from 'react-icons/fa';
import { motion, AnimatePresence } from "framer-motion";
import { SidebarContext } from '../context/SidebarContext';

function StockManager() {
  const { isSidebarOpen, isCollapsed } = useContext(SidebarContext);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [sortOrder, setSortOrder] = useState("date-newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [transactionCounts, setTransactionCounts] = useState({
    total: 0,
    inbound: 0,
    outbound: 0,
    adjustments: 0,
    total_value: 0
  });
  const [productStats, setProductStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    categoriesCount: 0,
    outOfStockCount: 0
  });
  const [filter, setFilter] = useState("all");
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [activeTable, setActiveTable] = useState('activity');
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

  const fetchTransactions = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:8080/stock-transactions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTransactions(response.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      }
    }
  }, [navigate]);

  const fetchProducts = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:8080/products", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const products = response.data.products;
      const categories = response.data.categories;
      
      // Calculate all product stats
      const totalProducts = products.length;
      const lowStockCount = products.filter(
        product => product.current_quantity < 5 && product.current_quantity > 0
      ).length;
      console.log("Low stock count:", lowStockCount);
      const outOfStockCount = products.filter(
        product => product.current_quantity <= 0
      ).length;
      console.log("Out of stock count:", outOfStockCount);
      const categoriesCount = Object.keys(categories).length;
      const totalValue = products.reduce(
        (sum, product) => sum + (product.current_quantity * product.unit_price), 
        0
      );
      
      setProductStats({
        totalProducts,
        lowStockCount,
        outOfStockCount,
        categoriesCount,
        totalValue
      });
      
      setProducts(products);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  }, []);

  const fetchTransactionCounts = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:8080/stock-transactions/count", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTransactionCounts({
        ...response.data,
        totalValue: response.data.totalValue || 0
      });
    } catch (error) {
      console.error("Error fetching transaction counts:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      }
    }
  }, [navigate]);

  useEffect(() => {
    if (isAuthenticated()) {
      fetchTransactions();
      fetchTransactionCounts();
      fetchProducts();
    }
  }, [isAuthenticated, fetchTransactions, fetchTransactionCounts, fetchProducts]);

  const handleDelete = useCallback(async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8080/stock-transactions/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTransactions(prev => prev.filter(t => t.id !== id));
      fetchTransactionCounts();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setShowDeletePopup(false);
    }
  }, [fetchTransactionCounts, navigate]);

  const confirmDelete = useCallback((id) => {
    setTransactionToDelete(id);
    setShowDeletePopup(true);
  }, []);

  const cancelDelete = useCallback(() => {
    setShowDeletePopup(false);
    setTransactionToDelete(null);
  }, []);

  const handleEdit = useCallback((id, e) => {
    e.stopPropagation();
    navigate(`/edit-stock-transaction/${id}`);
  }, [navigate]);

  const handleView = useCallback((id) => {
    navigate(`/view-stock-transaction/${id}`);
  }, [navigate]);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      
      switch (sortOrder) {
        case "product-asc":
          return (a.product_name || '').localeCompare(b.product_name || '');
        case "product-desc":
          return (b.product_name || '').localeCompare(a.product_name || '');
        case "date-newest":
          return dateB - dateA;
        case "date-oldest":
          return dateA - dateB;
        default:
          return 0;
      }
    });
  }, [transactions, sortOrder]);

  const filteredTransactions = useMemo(() => {
    return sortedTransactions.filter((transaction) => {
      const productName = transaction.product_name || '';
      const productCode = transaction.product_code || '';
      const transactionType = transaction.transaction_type || '';
      const transactionDate = transaction.date 
        ? new Date(transaction.date).toLocaleDateString("en-GB") 
        : '';

      const matchesSearch =
        productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transactionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transactionDate.includes(searchQuery);

      if (filter === "all") return matchesSearch;
      if (filter === "inbound") return matchesSearch && transactionType === "inbound";
      if (filter === "outbound") return matchesSearch && transactionType === "outbound";
      if (filter === "adjustment") return matchesSearch && transactionType === "adjustment";
      return matchesSearch;
    });
  }, [sortedTransactions, searchQuery, filter]);

  const recentTransactions = useMemo(() => filteredTransactions.slice(0, 8), [filteredTransactions]);
  const inboundTransactions = useMemo(() => 
    filteredTransactions.filter(t => t.transaction_type === "inbound").slice(0, 8), 
    [filteredTransactions]
  );
  const outboundTransactions = useMemo(() => 
    filteredTransactions.filter(t => t.transaction_type === "outbound").slice(0, 8), 
    [filteredTransactions]
  );

  const renderTable = (tableTransactions, title, emptyMessage, viewAllLink) => (
    <div className="bg-white rounded-lg shadow-sm p-4 h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <Link to={viewAllLink} className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <span className="text-sm font-medium">View All</span>
          <FaEye className="h-4 w-4" />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-center">
          <thead>
            <tr className="border-b border-gray-200 text-gray-600 text-sm">
              <th className="pb-2 font-medium">Product</th>
              <th className="pb-2 font-medium">Type</th>
              <th className="pb-2 font-medium">Quantity</th>
              <th className="pb-2 font-medium">Date</th>
              {/* {role === "admin" && <th className="pb-2 font-medium">Actions</th>} */}
            </tr>
          </thead>
          <tbody>
            {tableTransactions.length > 0 ? (
              tableTransactions.map((transaction) => (
                <tr 
                  key={transaction.id} 
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleView(transaction.id)}
                >
                  <td className="py-3">{transaction.product_name || 'N/A'}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      transaction.transaction_type === "inbound" ? "bg-green-100 text-green-800" :
                      transaction.transaction_type === "outbound" ? "bg-red-100 text-red-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {transaction.transaction_type}
                    </span>
                  </td>
                  <td className="py-3">{transaction.quantity || 0}</td>
                  <td className="py-3">
                    {transaction.date 
                      ? new Date(transaction.date).toLocaleDateString("en-GB") 
                      : 'N/A'}
                  </td>
                  {/* {role === "admin" && (
                    <td className="py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(transaction.id, e);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(transaction.id);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )} */}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={role === "admin" ? 5 : 4} className="py-4 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const nextTable = () => {
    const tables = ['activity', 'inbound', 'outbound'];
    const currentIndex = tables.indexOf(activeTable);
    const nextIndex = (currentIndex + 1) % tables.length;
    setActiveTable(tables[nextIndex]);
  };

  const prevTable = () => {
    const tables = ['activity', 'inbound', 'outbound'];
    const currentIndex = tables.indexOf(activeTable);
    const prevIndex = (currentIndex - 1 + tables.length) % tables.length;
    setActiveTable(tables[prevIndex]);
  };

  const TableCarousel = () => {
    const [activeIndex, setActiveIndex] = useState(0);
  
    const tables = [
      {
        id: 'activity',
        component: renderTable(recentTransactions, "Recent Stock Activity", "No recent activity", "/all-stock"),
      },
      {
        id: 'inbound',
        component: renderTable(inboundTransactions, "Inbound Stock", "No inbound stock", "/inbound-stock"),
      },
      {
        id: 'outbound',
        component: renderTable(outboundTransactions, "Outbound Stock", "No outbound stock", "/outbound-stock"),
      }
    ];
  
    const nextTable = () => {
      setActiveIndex((prev) => (prev + 1) % tables.length);
    };
  
    const prevTable = () => {
      setActiveIndex((prev) => (prev - 1 + tables.length) % tables.length);
    };
  
    return (
      <div className="relative w-[85%] md:w-[70%] flex justify-center items-center h-full">

        {/* Left Arrow */}
        <div className="absolute left-0 z-10">
          <button 
            onClick={prevTable}
            className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transform -translate-x-1/4"
          >
            <FaChevronLeft className="text-gray-600" />
          </button>
        </div>
  
        {/* Table Container */}
        <div className="w-[90%] md:w-[90%] relative h-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={tables[activeIndex].id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.4 }}
            >
              {tables[activeIndex].component}
            </motion.div>
          </AnimatePresence>
        </div>
  
        {/* Right Arrow */}
        <div className="absolute right-0 z-10">
          <button 
            onClick={nextTable}
            className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transform translate-x-1/4"
          >
            <FaChevronRight className="text-gray-600" />
          </button>
        </div>
  
        {/* Dots */}
        <div className="absolute bottom-[-20px] flex justify-center space-x-2">
          {tables.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                activeIndex === index ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label={`Show ${tables[index].id} table`}
            />
          ))}
        </div>
      </div>
    );
  };
  return (
    <div className={`min-h-screen bg-gray-50 pt-16 pb-8 px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
      isSidebarOpen ? (isCollapsed ? 'ml-16' : 'ml-64') : 'ml-0'
    }`}>
      {showDeletePopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center w-96">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this transaction?</p>
            <div className="flex justify-center space-x-4 mt-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(transactionToDelete)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-8xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Transactions */}
          <div className="bg-gradient-to-br from-blue-100 to-white p-4 rounded-lg shadow-md border-l-4 border-t-4 border-blue-500 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                <p className="text-2xl font-bold">{transactionCounts.total}</p>
              </div>
              <FaExchangeAlt className="text-blue-500 text-xl" />
            </div>
            <p className="text-xs mt-2 text-gray-500">All completed inbound and outbound stock entries</p>
          </div>

          {/* Inbound Stock */}
          <div className="bg-gradient-to-br from-green-100 to-white p-4 rounded-lg shadow-md border-r-4 border-b-4 border-green-500 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Inbound Stock</p>
                <p className="text-2xl font-bold">{transactionCounts.inbound}</p>
              </div>
              <FaBox className="text-green-500 text-xl" />
            </div>
            <p className="text-xs mt-2 text-gray-500">Goods received and added to inventory</p>
          </div>

          {/* Outbound Stock */}
          <div className="bg-gradient-to-br from-red-100 to-white p-4 rounded-lg shadow-sm border-l-4 border-t-4 border-red-500 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Outbound Stock</p>
                <p className="text-2xl font-bold">{transactionCounts.outbound}</p>
              </div>
              <FaBoxOpen className="text-red-500 text-xl" />
            </div>
            <p className="text-xs mt-2 text-gray-500">Items issued or sold from inventory</p>
          </div>

          {/* Inventory Value */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-lg shadow-lg text-white flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium opacity-80">Inventory Value</p>
                <p className="text-2xl font-bold">
                  K{transactionCounts.total_value?.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
              </div>
              <FaWarehouse className="text-white opacity-70 text-xl" />
            </div>
            <p className="text-xs mt-2 opacity-80">Current inventory valuation</p>
          </div>
          </div>

        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 sm:flex-none sm:w-48">
              <label htmlFor="filter-dropdown" className="sr-only">Filter</label>
              <select
                id="filter-dropdown"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Transactions</option>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
                <option value="adjustment">Adjustments</option>
              </select>
            </div>

            <div className="relative flex-1 min-w-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="relative flex-1 sm:flex-none sm:w-48">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="product-asc">Product: A-Z</option>
                <option value="product-desc">Product: Z-A</option>
                <option value="date-newest">Date: Newest</option>
                <option value="date-oldest">Date: Oldest</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Product Details Card (30% width) - On the LEFT */}
          <div className="lg:w-[30%]">
  <div className="bg-gradient-to-br from-indigo-200 via-gray-100 to-white p-4 rounded-lg shadow-lg p-6 h-full">
    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
      <FaCubes className="text-indigo-500" />
      Product Overview
    </h2>
    
    <div className="space-y-0">
      {/* Total Products */}
      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-600">Total Products</p>
          <p className="text-2xl font-bold text-blue-600">{productStats.totalProducts}</p>
        </div>
        <FaCubes className="text-blue-400 text-xl" />
      </div>
      
      {/* Low Stock Items */}
      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
          <p className="text-2xl font-bold text-yellow-600">{productStats.lowStockCount}</p>
        </div>
        <FaExclamationTriangle className="text-yellow-400 text-xl" />
      </div>
      
      {/* Out of Stock Items */}
      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-600">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{productStats.outOfStockCount}</p>
        </div>
        <FaBoxOpen className="text-red-400 text-xl" />
      </div>
      
      {/* Categories */}
      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-600">Categories</p>
          <p className="text-2xl font-bold text-green-600">{productStats.categoriesCount}</p>
        </div>
        <FaTags className="text-green-400 text-xl" />
      </div>
    </div>
    
    <div className="mt-6 pt-4 border-t border-gray-100">
      <Link 
        to="/view-products" 
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
      >
        <FaEye className="text-white" />
        View All Products
      </Link>
    </div>
  </div>
</div>
          {/* Table Carousel Panel (70% width) - On the RIGHT */}
          <TableCarousel />
        </div>
      </div>
    </div>
  );
}

export default StockManager;
//working version with carousel and product stats, and a cooler design