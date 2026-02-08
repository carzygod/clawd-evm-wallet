import React, { useState } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import { KeyringController } from '../lib/keyring';
import '../styles/neu.css';

function Settings({ onBack, networkController }) {
    const [rpcUrl, setRpcUrl] = useState('');
    const [networkKey, setNetworkKey] = useState('bsc');
    const [msg, setMsg] = useState({ text: '', type: '' });

    // Security State
    const [isRevealed, setIsRevealed] = useState(false);
    const [privateKey, setPrivateKey] = useState('');
    const [copyMsg, setCopyMsg] = useState('');

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

    const handleRevealKey = async () => {
        try {
            const keyring = new KeyringController();
            // In a real app, we would prompt for password here
            const isAuthenticated = await keyring.load('password');

            if (isAuthenticated && keyring.wallet) {
                setPrivateKey(keyring.wallet.privateKey);
                setIsRevealed(true);
            } else {
                setMsg({ text: 'Failed to load wallet', type: 'error' });
            }
        } catch (e) {
            setMsg({ text: 'Error: ' + e.message, type: 'error' });
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(privateKey);
        setCopyMsg('Copied!');
        setTimeout(() => setCopyMsg(''), 2000);
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
            <Card style={{ padding: '20px', border: isRevealed ? '1px solid #e74c3c' : 'none' }}>
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>🔒</span>
                    <h3 style={{ margin: 0 }}>Security</h3>
                </div>

                {!isRevealed ? (
                    <>
                        <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '16px' }}>
                            View your private key. <br />
                            <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>Warning: Never share this with anyone!</span>
                        </p>

                        <Button
                            onClick={handleRevealKey}
                            style={{
                                width: '100%',
                                color: '#c0392b',
                                fontSize: '13px',
                                background: 'rgba(231, 76, 60, 0.1)',
                                boxShadow: 'none',
                                border: '1px solid rgba(231, 76, 60, 0.3)'
                            }}
                        >
                            Reveal Private Key
                        </Button>
                    </>
                ) : (
                    <div style={{ animation: 'fadeIn 0.3s' }}>
                        <p style={{ fontSize: '12px', color: '#e74c3c', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>
                            DO NOT SHARE THIS KEY!
                        </p>
                        <div
                            className="neu-input"
                            style={{
                                padding: '12px',
                                wordBreak: 'break-all',
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                background: 'rgba(0,0,0,0.02)',
                                marginBottom: '12px',
                                userSelect: 'text' // Allow selection
                            }}
                        >
                            {privateKey}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Button
                                onClick={copyToClipboard}
                                style={{ flex: 1, fontSize: '13px' }}
                            >
                                {copyMsg || 'Copy'}
                            </Button>
                            <Button
                                onClick={() => { setIsRevealed(false); setPrivateKey(''); }}
                                style={{ flex: 1, fontSize: '13px', background: 'transparent', boxShadow: 'none', border: '1px solid rgba(0,0,0,0.1)' }}
                            >
                                Hide
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            <div style={{ textAlign: 'center', marginTop: 'auto', paddingBottom: '10px' }}>
                <p style={{ fontSize: '11px', opacity: 0.4 }}>Meme Wallet v1.0.0</p>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

export default Settings;
