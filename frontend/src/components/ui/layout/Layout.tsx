import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

// Global refresh callback store — pages apna refresh register karte hain
type RefreshFn = () => void;
let globalRefresh: RefreshFn | null = null;

export function registerRefresh(fn: RefreshFn) {
    globalRefresh = fn;
}

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = useCallback(async () => {
        if (!globalRefresh) return;
        setIsRefreshing(true);
        try {
            await globalRefresh();
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    return (
        <div className="flex h-screen bg-dark-bg overflow-hidden">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header
                    onMenuClick={() => setSidebarOpen(true)}
                    onRefresh={handleRefresh}
                    isRefreshing={isRefreshing}
                />
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}