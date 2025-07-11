// src/components/common/InfoTicker.js

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Newspaper, Activity, Users, Bitcoin } from 'lucide-react';

// Composant Ticker amélioré
const InfoTicker = () => {
    const [tickerData, setTickerData] = useState({
        weather: { temp: 22, condition: '☀️' },
        btc: 65432,
        eth: 3456,
        date: new Date(),
        stats: {
            articlesLast24h: 234,
            activeSources: 65,
            connectedMembers: 12
        }
    });

    useEffect(() => {
        // Actualisation toutes les 4 heures pour économiser la bande passante
        const interval = setInterval(() => {
            setTickerData(prev => ({
                ...prev,
                btc: prev.btc + (Math.random() - 0.5) * 1000,
                eth: prev.eth + (Math.random() - 0.5) * 100,
                date: new Date(),
                stats: {
                    ...prev.stats,
                    connectedMembers: Math.max(1, prev.stats.connectedMembers + Math.floor(Math.random() * 5 - 2))
                }
            }));
        }, 14400000); // 4 heures = 4 * 60 * 60 * 1000 millisecondes
        return () => clearInterval(interval);
    }, []);

    const openTradingView = (crypto) => {
        const symbol = crypto === 'btc' ? 'BTCUSD' : 'ETHUSD';
        window.open(`https://www.tradingview.com/chart/?symbol=${symbol}`, '_blank');
    };

    const formatDate = (date) => {
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        const dateStr = date.toLocaleDateString('fr-FR', options);
        return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    };

    return (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-slate-300 py-2 overflow-hidden relative border-b border-slate-700">
            <div
                className="flex whitespace-nowrap text-sm"
                style={{
                    minWidth: 'max-content',
                    animation: 'ticker-scroll 60s linear infinite'
                }}
                onMouseEnter={(e) => e.currentTarget.style.animationPlayState = 'paused'}
                onMouseLeave={(e) => e.currentTarget.style.animationPlayState = 'running'}
            >
                <div className="flex items-center gap-8 px-4">
                    <span className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {formatDate(tickerData.date)}
                    </span>
                    <span className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {tickerData.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-2">
                        {tickerData.weather.condition}
                        {tickerData.weather.temp}°C
                    </span>
                    <button
                        onClick={() => openTradingView('btc')}
                        className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
                    >
                        <Bitcoin className="w-3 h-3 text-orange-400" />
                        ${tickerData.btc.toFixed(0)}
                    </button>
                    <button
                        onClick={() => openTradingView('eth')}
                        className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
                    >
                        ETH ${tickerData.eth.toFixed(0)}
                    </button>
                    <span className="flex items-center gap-2">
                        <Newspaper className="w-3 h-3 text-blue-400" />
                        <strong>{tickerData.stats.articlesLast24h}</strong> Articles publiés ces 24h
                    </span>
                    <span className="flex items-center gap-2">
                        <Activity className="w-3 h-3 text-emerald-400" />
                        <strong>{tickerData.stats.activeSources}</strong> Sources actives
                    </span>
                    <span className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-purple-400" />
                        <strong>{tickerData.stats.connectedMembers}</strong> Membres connectés
                    </span>
                </div>
                {/* Duplicate for continuous scroll */}
                <div className="flex items-center gap-8 px-4">
                    <span className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {formatDate(tickerData.date)}
                    </span>
                    <span className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {tickerData.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex items-center gap-2">
                        {tickerData.weather.condition}
                        {tickerData.weather.temp}°C
                    </span>
                    <button
                        onClick={() => openTradingView('btc')}
                        className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
                    >
                        <Bitcoin className="w-3 h-3 text-orange-400" />
                        ${tickerData.btc.toFixed(0)}
                    </button>
                    <button
                        onClick={() => openTradingView('eth')}
                        className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
                    >
                        ETH ${tickerData.eth.toFixed(0)}
                    </button>
                    <span className="flex items-center gap-2">
                        <Newspaper className="w-3 h-3 text-blue-400" />
                        <strong>{tickerData.stats.articlesLast24h}</strong> Articles publiés ces 24h
                    </span>
                    <span className="flex items-center gap-2">
                        <Activity className="w-3 h-3 text-emerald-400" />
                        <strong>{tickerData.stats.activeSources}</strong> Sources actives
                    </span>
                    <span className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-purple-400" />
                        <strong>{tickerData.stats.connectedMembers}</strong> Membres connectés
                    </span>
                </div>
            </div>
        </div>
    );
};

export default InfoTicker;