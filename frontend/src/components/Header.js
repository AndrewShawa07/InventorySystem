import React, { useEffect, useState, useContext } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaHome, FaBell, FaSlidersH, FaUsers, FaBox, FaBoxOpen, FaBoxes, FaArrowDown, FaArrowUp, FaCubes } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { SidebarContext } from '../context/SidebarContext';

const Header = () => {
  // const { isSidebarOpen, setIsSidebarOpen } = useContext(SidebarContext);
const { isSidebarOpen, setIsSidebarOpen, isCollapsed, toggleSidebar } = useContext(SidebarContext);

  const [userName, setUserName] = useState("");
  //const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  useEffect(() => {
    const fetchUserAndNotifications = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setUserName(user.firstname || "User");

          const response = await axios.get("http://localhost:8080/notifications", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          setNotifications(response.data);
        }
      } catch (error) {
        console.error("Error retrieving user data or notifications:", error);
      }
    };

    fetchUserAndNotifications();
  }, []);

  const handleLogout = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;

      const user = JSON.parse(storedUser);
      const userId = user.id;

      await axios.post(
        "http://localhost:8080/auth/logout",
        { userId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("role");

      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error.response?.data || error.message);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.patch(
        `http://localhost:8080/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: 1 } : n
      ));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <>
      {/* Header */}
      <header className={`fixed top-0 right-0 bg-white shadow-sm py-3 px-4 sm:px-6 flex justify-between items-center border-b border-gray-200 z-40 ${
  isSidebarOpen 
    ? (isCollapsed ? 'left-16' : 'left-64') 
    : 'left-0'
}`}>
        <div className="flex items-center space-x-4">
        
<button 
  onClick={() => {
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
    } else {
      toggleSidebar();
    }
  }}
  className="p-1 rounded-md hover:bg-gray-100 transition-colors"
>
  <Menu className="w-5 h-5 text-gray-600" />
</button>
          
          {/* <div className="flex items-center">
            <img
              src="/logo.jpg"
              alt="DMIS Logo"
              className="h-8 w-8 rounded-full"
            />
            <h1 className="ml-2 text-lg font-semibold text-gray-800 hidden sm:block">DMIS</h1>
          </div> */}
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button 
              className="relative p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            >
              <FaBell className="w-4 h-4 text-gray-600" />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              Welcome, {userName || "User"}
            </span>
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-medium text-green-800">
              {userName ? userName.charAt(0).toUpperCase() : "U"}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 ${
  isSidebarOpen 
    ? (isCollapsed ? 'w-16' : 'w-64') 
    : 'w-0'
} bg-gray-800 text-white shadow-lg z-50 transition-all duration-300 ease-in-out`}>
  
  <div className="p-4 h-full flex flex-col">
    <div className="flex items-center justify-between mb-6">
      {!isCollapsed && (
        <div className="flex items-center space-x-2">
          <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-full" />
          <h2 className="text-lg font-semibold">EIZIMS</h2>
        </div>
      )}
      {/* {!isCollapsed && (
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      )} */}
    </div>

    <nav className="flex-1">
      <ul className="space-y-1">
        <li>
          <Link
            to="../stock-manager"
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-2 rounded-md hover:bg-gray-100  hover:text-green-600`}
            title={isCollapsed ? "Dashboard" : ""}
          >
            <FaHome className="w-4 h-4" />
            {!isCollapsed && <span>Dashboard</span>}
          </Link>
        </li>
        <li>
  <Link
    to="../all-stock"
    className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-2 rounded-md hover:bg-gray-100 hover:text-green-600`}
    title={isCollapsed ? "Stock Transactions" : ""}
  >
    <FaBoxes className="w-4 h-4" />
    {!isCollapsed && <span>Stock Transactions</span>}
  </Link>
</li>

<li>
  <Link
    to="../inbound-stock"
    className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-2 rounded-md hover:bg-gray-100 hover:text-blue-600`}
    title={isCollapsed ? "Inbound Stock" : ""}
  >
    <FaArrowDown className="w-4 h-4" />
    {!isCollapsed && <span>Inbound Stock</span>}
  </Link>
</li>
<li>
  <Link
    to="../outbound-stock"
    className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-2 rounded-md hover:bg-gray-100 hover:text-red-600`}
    title={isCollapsed ? "Outbound Stock" : ""}
  >
    <FaArrowUp className="w-4 h-4" />
    {!isCollapsed && <span>Outbound Stock</span>}
  </Link>
</li>
<li>
  <Link
    to="../adjustments"
    className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-2 rounded-md hover:bg-gray-100 hover:text-red-600`}
    title={isCollapsed ? "Adjustments" : ""}
  >
    <FaSlidersH className="w-4 h-4" />
    {!isCollapsed && <span>Adjustments</span>}
  </Link>
</li>
        <li>
  <Link
    to="/view-products"
    className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-2 rounded-md hover:bg-gray-100 hover:text-green-600`}
    title={isCollapsed ? "View Products" : ""}
  >
    <FaCubes className="w-4 h-4" />
    {!isCollapsed && <span>Products</span>}
  </Link>
</li>
        {role === "admin" && (
          <li>
            <Link
              to="/user-manager"
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-2 rounded-md hover:bg-gray-100  hover:text-green-600`}
              title={isCollapsed ? "User Management" : ""}
            >
              <FaUsers className="w-4 h-4" />
              {!isCollapsed && <span>User Management</span>}
            </Link>
          </li>
        )}
      </ul>
    </nav>

    <div className="mt-auto">
      <button
        onClick={handleLogout}
        className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-2 rounded-md hover:bg-gray-100  hover:text-red-600 w-full`}
        title={isCollapsed ? "Logout" : ""}
      >
        <LogOut className="w-4 h-4" />
        {!isCollapsed && <span>Logout</span>}
      </button>
    </div>
  </div>
</div>

      {/* Notifications Popup */}
      {isNotificationsOpen && (
        <div className="fixed right-4 mt-2 w-72 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    notifications.forEach((n) => !n.is_read && markNotificationAsRead(n.id));
                  }}
                  className="text-xs text-gray-500 hover:text-green-600"
                >
                  Mark all read
                </button>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start p-2 text-sm ${
                      !notification.is_read ? "bg-green-50" : "bg-white"
                    } border-b border-gray-100 last:border-0`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 truncate">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={() => markNotificationAsRead(notification.id)}
                        className="ml-2 p-1 text-gray-400 hover:text-green-500"
                        title="Mark as read"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-3">
                  No notifications
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
