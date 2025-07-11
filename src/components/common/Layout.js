// src/components/common/Layout.js

import React from 'react';
import Header from './Header';
import InfoTicker from './InfoTicker';
import Footer from './Footer';

const Layout = ({ children, userStats, onMenuClick, darkMode }) => {
    return (
        <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'} transition-colors`}>
            <Header userStats={userStats} onMenuClick={onMenuClick} />
            <InfoTicker />
            {children}
            <Footer />
        </div>
    );
};

export default Layout;