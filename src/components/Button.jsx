import React from 'react';
import '../styles/neu.css';

const Button = ({ children, onClick, disabled, className, style }) => {
    return (
        <button
            className={`neu-btn ${className || ''}`}
            onClick={onClick}
            disabled={disabled}
            style={style}
        >
            {children}
        </button>
    );
};

export default Button;
