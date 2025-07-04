import React from "react";

interface CustomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}

const CustomDrawer: React.FC<CustomDrawerProps> = ({ isOpen, onClose, children, width = "max-w-lg" }) => {
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full ${width} w-full bg-content1 shadow-xl transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ maxWidth: 500 }}
        tabIndex={-1}
        aria-modal="true"
        role="dialog"
      >
        {children}
      </aside>
    </>
  );
};

export const CustomDrawerHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-6 border-b border-divider flex items-center justify-between">
    <div className="text-lg font-bold">{children}</div>
  </div>
);

export const CustomDrawerBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-6 overflow-y-auto flex-1">{children}</div>
);

export const CustomDrawerFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-4 border-t border-divider flex gap-2 justify-end">{children}</div>
);

export default CustomDrawer; 