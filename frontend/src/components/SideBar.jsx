import React, { useState } from 'react';

const Sidebar = ({ isHovered, setIsHovered, onNavigate }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
    
  const menuItems = [
    { icon: '🎮', label: 'Skill Tree', id: 'skill-tree' },
    { icon: '✦', label: 'Create Tree', id: 'create-tree' },
    { icon: '◈', label: 'Other Trees', id: 'other-trees' },
    { icon: '⚙', label: 'Settings', id: 'settings' },
  ];

  const handleMenuClick = (itemId) => {
    if (onNavigate) {
      onNavigate(itemId);
    }
  };

  // If collapsed, don't show hover expansion
  const displayWidth = isCollapsed ? 'w-16' : (isHovered ? 'w-56' : 'w-16');
  const shouldExpand = !isCollapsed && isHovered;

  return (
    <div
      onMouseEnter={() => !isCollapsed && setIsHovered(true)}
      onMouseLeave={() => !isCollapsed && setIsHovered(false)}
      className={`flex flex-col h-full text-gray-100 pt-[14px] pb-6 transition-all duration-300 ease-in-out ${displayWidth} overflow-hidden border-r border-gray-800`}
      style={{ background: '#0a0818' }}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between px-4 pb-[14px]">
        <div className="w-8 h-8 flex-shrink-0 rounded-md bg-gray-800 flex items-center justify-center text-gray-300 font-bold text-lg">
          N
        </div>
        {shouldExpand && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 hover:bg-gray-700 rounded transition-all duration-200"
            title="Collapse sidebar"
          >
            <span className="text-lg">«</span>
          </button>
        )}
      </div>

      {/* Collapsed Toggle Button */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="mx-2 mb-4 p-2 hover:bg-gray-700 rounded transition-all duration-200 flex items-center justify-center"
          title="Expand sidebar"
        >
          <span className="text-lg">»</span>
        </button>
      )}

      {/* Divider */}
      {!isCollapsed && <div className="mx-4 mb-6 h-px bg-gray-800" />}

      {/* Menu Items */}
      <nav className="flex flex-col gap-1 px-2 flex-1 pointer-events-auto">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleMenuClick(item.id)}
            className="w-full flex items-center px-3 py-2 rounded cursor-pointer transition-all duration-200 hover:bg-gray-700 group bg-transparent border-none"
          >
            <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 text-lg group-hover:text-blue-400 transition-all duration-200 pointer-events-none">
              {item.icon}
            </span>
            <span
              className={`ml-3 font-rajdhani font-normal text-gray-400 whitespace-nowrap transition-all duration-300 group-hover:text-gray-200 pointer-events-none ${
                shouldExpand ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
              }`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto" style={{ paddingTop: 'calc(60px - 6rem)' }}>
        {!isCollapsed && <div className="mx-2 mb-4 h-px bg-gray-800" />}
        <div className="flex items-center px-3 py-2 rounded cursor-pointer transition-all duration-200 hover:bg-gray-700 group">
          <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 text-lg group-hover:text-cyan-400 transition-all duration-200">
            ◉
          </span>
          <span
            className={`ml-3 font-rajdhani font-normal text-gray-400 whitespace-nowrap transition-all duration-300 group-hover:text-gray-200 ${
              shouldExpand ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
            }`}
          >
            Profile
          </span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;