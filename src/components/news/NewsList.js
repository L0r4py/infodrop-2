// src/components/news/NewsList.js

import React from 'react';
import NewsCard from './NewsCard';

// Composant de liste des actualités
const NewsList = ({ news, onRead, darkMode }) => {
    return (
        <div>
            {news.map(item => (
                <NewsCard
                    key={item.id}
                    news={item}
                    onRead={onRead}
                    darkMode={darkMode}
                />
            ))}
        </div>
    );
};

export default NewsList;