import React, { useState } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import '../styles/neu.css';

function Settings({ onBack, networkController }) {
    const [rpcUrl, setRpcUrl] = useState('');
    const [networkKey, setNetworkKey] = useState('bsc');
    const [msg, setMsg] = useState({ text: '', type: '' });

    const handleAddRpc = async () => {
        if (!rpcUrl) return;
        try {
            await networkController.addCustomRpc(networkKey, rpcUrl);
            setMsg({ text: 'Success! RPC Updated', type: 'success' });
            setRpcUrl('');
            setTimeout(() => setMsg({ text: '', type: '' }), 3000);
        } catch (e) {
            setMsg({ text: 'Error: ' + e.message, type: 'error' });
        }
    };

    return (
        <div className="app-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Button onClick={onBack} style={{ padding: '0', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '20px', paddingBottom: '2px' }}>←</span>
                </Button>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-color)' }}>Settings</h2>
            </div>

            {/* Network Settings */}
            <Card style={{ padding: '20px' }}>
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>🌐</span>
                    <h3 style={{ margin: 0 }}>Network RPC</h3>
                </div>

                <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '16px', lineHeight: '1.4' }}>
                    Customize the RPC URL for your networks to improve connection speed or privacy.
                </p>

                <div className="mb-4">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Select Network
                    </label>
                    <div className="neu-input" style={{ padding: '0', display: 'flex', alignItems: 'center' }}>
                        <select
                            value={networkKey}
                            onChange={(e) => setNetworkKey(e.target.value)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                width: '100%',
                                padding: '14px 16px',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: 'var(--accent-color)',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="bsc">Binance Smart Chain (BSC)</option>
                            <option value="eth">Ethereum Mainnet</option>
                            <option value="arb">Arbitrum One</option>
                            <option value="pol">Polygon (Matic)</option>
                        </select>
                    </div>
                </div>

                <div className="mb-4">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        New RPC URL
                    </label>
                    <Input
                        value={rpcUrl}
                        onChange={(e) => setRpcUrl(e.target.value)}
                        placeholder="https://rpc.example.com"
                    />
                </div>

                <Button
                    onClick={handleAddRpc}
                    disabled={!rpcUrl}
                    style={{ width: '100%', marginTop: '8px' }}
                >
                    Save Configuration
                </Button>

                {msg.text && (
                    <div style={{
                        marginTop: '16px',
                        padding: '10px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        textAlign: 'center',
                        background: msg.type === 'success' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                        color: msg.type === 'success' ? '#27ae60' : '#c0392b',
                        border: `1px solid ${msg.type === 'success' ? '#2ecc71' : '#e74c3c'}`
                    }}>
                        {msg.text}
                    </div>
                )}
            </Card>

            {/* Security Settings */}
            <Card style={{ padding: '20px', opacity: 0.8 }}>
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>🔒</span>
                    <h3 style={{ margin: 0 }}>Security</h3>
                </div>

                <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '16px' }}>
                    View your sensitive keys. Never share these with anyone.
                </p>

                <Button
                    style={{
                        width: '100%',
                        color: '#c0392b',
                        fontSize: '13px'
                    }}
                    disabled
                >
                    Reveal Private Key (Coming Soon)
                </Button>
            </Card>

            <div style={{ textAlign: 'center', marginTop: 'auto', paddingBottom: '10px' }}>
                <p style={{ fontSize: '11px', opacity: 0.4 }}>Meme Wallet v1.0.0</p>
            </div>
        </div>
    );
}

export default Settings;
