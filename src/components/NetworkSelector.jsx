import React, { useState, useRef, useEffect } from 'react';
import '../styles/neu.css';

const NetworkSelector = ({ network, setNetwork, networks }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (key) => {
        setNetwork(key);
        setIsOpen(false);
    };

    const currentNetwork = networks[network] || { name: 'Unknown' };

    return (
        <div ref={dropdownRef} style={{ position: 'relative', zIndex: 100 }}>
            {/* Trigger Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="neu-btn"
                style={{
                    padding: '10px 16px',
                    minWidth: '140px',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    textTransform: 'none',
                    letterSpacing: '0',
                    fontWeight: '600'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Dot indicator */}
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2ecc71', boxShadow: '0 0 5px #2ecc71' }}></div>
                    {currentNetwork.name}
                </div>
                <span style={{ fontSize: '10px', opacity: 0.6, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: '120%',
                        left: 0,
                        width: '100%',
                        background: 'var(--bg-color)',
                        borderRadius: '12px',
                        padding: '8px',
                        boxShadow: 'var(--shadow-dark) 5px 5px 10px, var(--shadow-light) -5px -5px 10px', // Convex card style
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                    }}
                >
                    {Object.entries(networks).map(([key, net]) => (
                        <div
                            key={key}
                            onClick={() => handleSelect(key)}
                            style={{
                                padding: '10px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: network === key ? '700' : '500',
                                background: network === key ? 'rgba(0,0,0,0.05)' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.1s'
                            }}
                            onMouseEnter={(e) => {
                                if (network !== key) e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
                            }}
                            onMouseLeave={(e) => {
                                if (network !== key) e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            {network === key && <span style={{ color: '#2ecc71' }}>●</span>}
                            {net.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NetworkSelector;
