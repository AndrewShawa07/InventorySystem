import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaUserCheck, FaUserTimes, FaTrash } from 'react-icons/fa';
import "../index.css";
import { useContext } from 'react';
import { SidebarContext } from '../context/SidebarContext';

function UserManager() {
  const { isSidebarOpen, isCollapsed } = useContext(SidebarContext);
  const [users, setUsers] = useState([]);
  const [showDeletePopup, setShowDeletePopup] = useState(false); // State for delete popup visibility
  const [userToDelete, setUserToDelete] = useState(null); // State for user ID to delete
  const navigate = useNavigate();

  // Check if the user is authenticated
  const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    return !!token; // Returns true if token exists, false otherwise
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      console.log("User is not authenticated");
      navigate("/login"); // Redirect to login page
    } else {
      console.log("User is authenticated");
    }
  }, [navigate]);

  // Fetch users with authentication
  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:8080/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
      console.log("Users fetched:", response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      if (error.response && error.response.status === 401) {
        navigate("/login");
      }
    }
  }, [navigate]);

  // Run fetchUsers on component mount
  useEffect(() => {
    if (isAuthenticated()) {
      fetchUsers();
    }
  }, [fetchUsers]);

  // Update user role
  const updateRole = async (id, role, e) => {
    e.stopPropagation(); // Prevent row click from triggering
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`http://localhost:8080/users/${id}`, { role }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(users.map(user => (user.id === id ? { ...user, role } : user)));
    } catch (error) {
      console.error("Error updating role:", error);
      if (error.response && error.response.status === 401) {
        navigate("/login");
      }
    }
  };

  // Delete user
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8080/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(users.filter((user) => user.id !== id)); // Remove from UI
    } catch (error) {
      console.error("Error deleting user:", error);
      if (error.response && error.response.status === 401) {
        navigate("/login");
      }
    } finally {
      setShowDeletePopup(false); // Hide the popup after deletion
    }
  };

  // Show delete confirmation popup
  const confirmDelete = (id) => {
    setUserToDelete(id); // Set the user ID to delete
    setShowDeletePopup(true); // Show the popup
  };

  // Cancel delete action
  const cancelDelete = () => {
    setShowDeletePopup(false); // Hide the popup
    setUserToDelete(null); // Reset the user ID
  };

  return (
    <div className={`min-h-screen bg-gray-50 pt-16 pb-8 px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
      isSidebarOpen ? (isCollapsed ? 'ml-16' : 'ml-64') : 'ml-0'
    }`}>
      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center w-96">
            <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this user?</p>
            <div className="flex justify-center space-x-4 mt-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(userToDelete)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
      <Link to="/stock-manager" className="text-blue-500 hover:underline mb-4 block">
          &larr; Back to Dashboard
          </Link>
        <h1 className="text-3xl font-bold text-green-700 mb-8 text-center">
          User Management
        </h1>
        {/* Table for Users */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden p-4">
          <table className="w-full text-left border-separate border-spacing-y-2 table-fixed">
            <thead>
              <tr className="bg-green-100 text-green-700">
                <th className="px-4 py-2 w-6">#</th>
                <th className="px-4 py-2">Username</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2 flex justify-center">Loggin Status</th>
                {/* <th className="px-4 py-2">Last Active</th> */}
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr
                  key={user.id}
                  className="bg-white shadow-md hover:shadow-lg transition duration-200 ease-in-out cursor-pointer"
                >
                  <td className="px-4 py-3 w-6">{index + 1}</td>
                  <td className="px-4 py-3 break-words max-w-xs">{`${user.firstname} ${user.lastname}`}</td>
                  <td className="px-4 py-3 truncate max-w-xs">{user.email}</td>
                  <td className="px-4 py-3 flex justify-center items-center">
                    {user.isLoggedIn ? (
                      <FaUserCheck className="text-green-600 text-xl" />
                    ) : (
                      <FaUserTimes className="text-red-600 text-xl" />
                    )}
                  </td>
                   {/* <td className="px-4 py-3 truncate max-w-xs">
                    {user.lastActive ? new Date(user.lastActive).toLocaleString() : "N/A"}
                  </td> */}
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => updateRole(user.id, e.target.value, e)}
                      className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 bg-white text-gray-700"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(user.id); // Show delete confirmation popup
                      }}
                      className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UserManager;