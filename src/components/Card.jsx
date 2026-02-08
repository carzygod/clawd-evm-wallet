import React from 'react';
import '../styles/neu.css';

const Card = ({ children, className }) => {
    return (
        <div className={`neu-card ${className || ''}`}>
            {children}
        </div>
    );
};

export default Card;
