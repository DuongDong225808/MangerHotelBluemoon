'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Home,
    Users,
    Receipt,
    DollarSign,
    User
} from 'lucide-react';

const menuItems = [
    { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { href: '/households', label: 'Hộ Dân Cư', icon: Home },
    { href: '/residents', label: 'Dân cư', icon: Users },
    { href: '/fees', label: 'Phí', icon: Receipt },
    { href: '/revenue', label: 'Doanh thu', icon: DollarSign },
    { href: '/users', label: 'User', icon: User },
];

const Sidebar = () => {
    const pathname = usePathname();

    return (
        <div className="h-screen w-64 bg-gray-900 text-white fixed left-0 top-0">
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-8">Blue Moon</h1>
                <nav>
                    <ul className="space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>
        </div>
    );
};

export default Sidebar; 