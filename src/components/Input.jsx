import React from 'react';
import '../styles/neu.css';

const Input = ({ value, onChange, placeholder, type = 'text', className }) => {
    return (
        <input
            className={`neu-input ${className || ''}`}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
        />
    );
};

export default Input;
