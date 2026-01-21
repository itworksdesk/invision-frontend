import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Package,
  Users,
  Truck,
  Box,
  BarChart3,
  Home,
  Settings,
  Menu,
  X,
  UserCog
} from "lucide-react";
import { cn } from "../../lib/utils";
import invisionLogo from "@/assets/invision_logo2.png";
import { useAuth } from "@/auth/AuthContext";


type MenuItem = {
  name: string;
  href?: string;
  id: string;
  icon: React.ElementType;
  hasSubmenu?: boolean;
  subItems?: { name: string; href: string; id: string }[];
};

const menuItems: MenuItem[] = [
  { name: "Dashboard", id: "dashboard", href: "/", icon: Home },
  {
    name: "Products",
    id: "products",
    icon: Box,
    hasSubmenu: true,
    subItems: [
      { name: "Inventory", id: "products_inventory", href: "/products" },
      { name: "Categories", id: "products_categories", href: "/categories" }
    ]
  },
  {
    name: "Orders",
    id: "orders",
    icon: Package,
    hasSubmenu: true,
    subItems: [
      { name: "Sales Orders", id: "orders_sales", href: "/sales-orders" },
      { name: "Purchase Orders", id: "orders_purchase", href: "/purchase-orders" },
      { name: "Quotations", id: "orders_quotations", href: "/quotations" },
      { name: "Invoices", id: "orders_invoices", href: "/invoices" }
    ]
  },
  { name: "Customers", id: "customers", href: "/customers", icon: Users },
  { name: "Suppliers", id: "suppliers", href: "/suppliers", icon: Truck },
  { name: "Sales Persons", id: "sales_persons", href: "/sales-persons", icon: Users },
  { name: "User Management", id: "user_management", href: "/users", icon: UserCog },
  { name: "Reports", id: "reports", href: "/reports", icon: BarChart3 },
  // { name: "Settings", id: "settings", href: "/settings", icon: Settings }
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const { user } = useAuth();


  const toggleSubmenu = (id: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md border hover:bg-gray-50 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-gray-600" />
        ) : (
          <Menu className="h-6 w-6 text-gray-600" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white w-64 h-screen shadow-sm border-r fixed lg:static top-0 z-40 overflow-y-auto transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-6 flex items-center">
          <img
            src={invisionLogo}
            alt="InVision Logo"
            className="h-9 w-9 object-contain -mt-2"
          />
          <h1 className="text-xl font-bold ml-2 text-primary">InVision</h1>
        </div>

        {/* Navigation */}
        <nav className="mt-2">
          <ul>
            {menuItems
              .filter((item) => {
                // ✅ Only Admins can see User Management
                if (item.id === "user_management" && user?.role !== "Admin") {
                  return false;
                }
                return true;
              })
              .map((item) => {
                const isSubItemActive =
                  item.subItems?.some((sub) => sub.href === location.pathname) || false;

                return (
                  <li key={item.id}>
                    {item.hasSubmenu ? (
                      <>
                        <button
                          onClick={() => toggleSubmenu(item.id)}
                          className={cn(
                            "w-full text-left flex items-center justify-between py-3 px-6 transition-colors rounded-[var(--radius)]",
                            isSubItemActive
                              ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] border-r-4 border-[hsl(var(--primary))]"
                              : "text-gray-600 hover:bg-[hsl(var(--muted))]"
                          )}
                        >
                          <div className="flex items-center">
                            <item.icon className="h-5 w-5 mr-3" />
                            {item.name}
                          </div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={cn(
                              "h-4 w-4 transition-transform",
                              expandedMenus[item.id] ? "rotate-180" : ""
                            )}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {expandedMenus[item.id] && (
                          <ul className="pl-4 py-1 bg-[hsl(var(--muted))]">
                            {item.subItems?.map((sub) => (
                              <li key={sub.id}>
                                <NavLink
                                  to={sub.href}
                                  onClick={handleLinkClick}
                                  className={({ isActive }) =>
                                    cn(
                                      "block w-full text-left py-2 px-8 text-sm transition-colors",
                                      isActive
                                        ? "text-[hsl(var(--primary))] font-medium"
                                        : "text-gray-600 hover:text-[hsl(var(--primary))]"
                                    )
                                  }
                                >
                                  {sub.name}
                                </NavLink>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <NavLink
                        to={item.href || "#"}
                        onClick={handleLinkClick}
                        className={({ isActive }) =>
                          cn(
                            "w-full text-left flex items-center py-3 px-6 transition-colors rounded-[var(--radius)]",
                            isActive
                              ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] border-r-4 border-[hsl(var(--primary))]"
                              : "text-gray-600 hover:bg-[hsl(var(--muted))]"
                          )
                        }
                      >
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.name}
                      </NavLink>
                    )}
                  </li>
                );
              })}
          </ul>
        </nav>

      </aside>
    </>
  );
}