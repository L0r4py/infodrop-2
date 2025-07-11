// src/components/InfoTicker.js

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Newspaper, Activity, Users, Bitcoin } from 'lucide-react';

// Fonction pour récupérer les prix crypto via CoinGecko
const fetchCryptoPrices = async () => {
    try {
        const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd'
        );

        if (!response.ok) {
            throw new Error('Erreur API CoinGecko');
        }

        const data = await response.json();

        return {
            btc: data.bitcoin?.usd || 0,
            eth: data.ethereum?.usd || 0
        };
    } catch (error) {
        console.error('Erreur récupération prix crypto:', error);
        // Retourner les dernières valeurs en cache si erreur
        const cached = localStorage.getItem('infodrop_crypto_prices');
        if (cached) {
            return JSON.parse(cached);
        }
        return { btc: 0, eth: 0 };
    }
};

const InfoTicker = () => {
    const [tickerData, setTickerData] = useState({
        weather: { temp: 22, condition: '☀️' },
        btc: 0,
        eth: 0,
        date: new Date(),
        stats: {
            articlesLast24h: 234,
            activeSources: 65,
            connectedMembers: 12
        },
        lastPriceUpdate: null
    });

    // Charger les prix crypto
    const loadCryptoPrices = async () => {
        console.log('🔄 Actualisation des prix crypto...');
        const prices = await fetchCryptoPrices();

        if (prices.btc > 0 && prices.eth > 0) {
            // Sauvegarder en cache
            localStorage.setItem('infodrop_crypto_prices', JSON.stringify(prices));

            setTickerData(prev => ({
                ...prev,
                btc: prices.btc,
                eth: prices.eth,
                lastPriceUpdate: new Date()
            }));
        }
    };

    // Charger les prix au démarrage et toutes les 4 heures
    useEffect(() => {
        // Charger depuis le cache d'abord
        const cached = localStorage.getItem('infodrop_crypto_prices');
        if (cached) {
            const prices = JSON.parse(cached);
            setTickerData(prev => ({
                ...prev,
                btc: prices.btc,
                eth: prices.eth
            }));
        }

        // Puis charger les prix frais
        loadCryptoPrices();

        // Actualiser toutes les 4 heures (14400000 ms)
        const cryptoInterval = setInterval(loadCryptoPrices, 14400000);

        return () => clearInterval(cryptoInterval);
    }, []);

    // Update de l'heure toutes les minutes
    useEffect(() => {
        const timeInterval = setInterval(() => {
            setTickerData(prev => ({
                ...prev,
                date: new Date()
            }));
        }, 60000); // 1 minute

        return () => clearInterval(timeInterval);
    }, []);

    // Update des stats toutes les 10 secondes (simulation)
    useEffect(() => {
        const statsInterval = setInterval(() => {
            setTickerData(prev => ({
                ...prev,
                stats: {
                    ...prev.stats,
                    connectedMembers: Math.max(8, prev.stats.connectedMembers + Math.floor(Math.random() * 3 - 1))
                }
            }));
        }, 10000);

        return () => clearInterval(statsInterval);
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

    const formatPrice = (price) => {
        if (!price || price === 0) return '---';
        return price.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
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
                {/* Contenu principal */}
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
                        className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer group"
                        title={tickerData.lastPriceUpdate ? `Dernière MAJ: ${tickerData.lastPriceUpdate.toLocaleTimeString()}` : ''}
                    >
                        <Bitcoin className="w-3 h-3 text-orange-400 group-hover:text-orange-300" />
                        <span className="font-medium">{formatPrice(tickerData.btc)}</span>
                    </button>
                    <button
                        onClick={() => openTradingView('eth')}
                        className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer group"
                        title={tickerData.lastPriceUpdate ? `Dernière MAJ: ${tickerData.lastPriceUpdate.toLocaleTimeString()}` : ''}
                    >
                        <span className="text-blue-400 group-hover:text-blue-300">ETH</span>
                        <span className="font-medium">{formatPrice(tickerData.eth)}</span>
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

                {/* Duplication pour le scroll continu */}
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
                        className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer group"
                    >
                        <Bitcoin className="w-3 h-3 text-orange-400 group-hover:text-orange-300" />
                        <span className="font-medium">{formatPrice(tickerData.btc)}</span>
                    </button>
                    <button
                        onClick={() => openTradingView('eth')}
                        className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer group"
                    >
                        <span className="text-blue-400 group-hover:text-blue-300">ETH</span>
                        <span className="font-medium">{formatPrice(tickerData.eth)}</span>
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