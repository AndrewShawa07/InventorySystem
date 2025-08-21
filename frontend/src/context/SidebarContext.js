// src/context/SidebarContext.js
import { createContext, useState, useEffect } from 'react';

export const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const storedPreference = localStorage.getItem('sidebarOpen');
    return storedPreference ? JSON.parse(storedPreference) : true;
  });

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const storedCollapse = localStorage.getItem('sidebarCollapsed');
    return storedCollapse ? JSON.parse(storedCollapse) : false;
  });

  const toggleSidebar = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setIsSidebarOpen(true);
    } else {
      setIsCollapsed(true);
    }
  };

  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  return (
    <SidebarContext.Provider value={{
      isSidebarOpen,
      setIsSidebarOpen,
      isCollapsed,
      setIsCollapsed,
      toggleSidebar
    }}>
      {children}
    </SidebarContext.Provider>
  );
};
