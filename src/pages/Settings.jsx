import React, { useState } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import { KeyringController } from '../lib/keyring';
import '../styles/neu.css';

function Settings({ onBack, networkController }) {
    const [rpcUrl, setRpcUrl] = useState('');
    const [networkKey, setNetworkKey] = useState('bsc');
    const [relayUrl, setRelayUrl] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });

    // Poll for status
    React.useEffect(() => {
        const checkStatus = () => {
            chrome.runtime.sendMessage({ type: 'GET_RELAY_STATUS' }, (response) => {
                if (response) {
                    setIsConnected(response.connected);
                }
            });
        };

        checkStatus(); // Initial check
        const interval = setInterval(checkStatus, 2000); // Poll every 2s
        return () => clearInterval(interval);
    }, []);

    const toggleConnection = () => {
        chrome.runtime.sendMessage({ type: 'TOGGLE_RELAY' }, (response) => {
            if (response) setIsConnected(response.connected);
        });
    };

    // Load Relay URL on mount
    React.useEffect(() => {
        chrome.storage.local.get('relayUrl').then((data) => {
            if (data.relayUrl) setRelayUrl(data.relayUrl);
        });
    }, []);

    // Save Relay URL when it changes
    React.useEffect(() => {
        if (relayUrl) {
            chrome.storage.local.set({ relayUrl });
            chrome.runtime.sendMessage({ type: 'RELAY_CONFIG_UPDATED', url: relayUrl });
        }
    }, [relayUrl]);

    // Whitelist State
    const [whitelist, setWhitelist] = useState([]);
    const [newWhitelistKey, setNewWhitelistKey] = useState('');

    React.useEffect(() => {
        chrome.storage.local.get('whitelist').then((data) => {
            if (data.whitelist) setWhitelist(data.whitelist);
        });
    }, []);

    const addWhitelistKey = () => {
        if (!newWhitelistKey) return;
        const updated = [...whitelist, newWhitelistKey];
        setWhitelist(updated);
        chrome.storage.local.set({ whitelist: updated });
        setNewWhitelistKey('');
    };

    const removeWhitelistKey = (key) => {
        const updated = whitelist.filter(k => k !== key);
        setWhitelist(updated);
        chrome.storage.local.set({ whitelist: updated });
    };

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

                <div className="mb-4">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '600', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Relay URL (WebSocket)
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: isConnected ? '#2ecc71' : '#e74c3c'
                            }} />
                            <span style={{ fontSize: '11px', fontWeight: '600', color: isConnected ? '#2ecc71' : '#e74c3c' }}>
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Input
                            value={relayUrl}
                            onChange={(e) => setRelayUrl(e.target.value)}
                            placeholder="ws://localhost:8080"
                        />
                        <Button
                            onClick={toggleConnection}
                            style={{
                                width: 'auto',
                                padding: '0 12px',
                                fontSize: '12px',
                                background: isConnected ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)',
                                color: isConnected ? '#e74c3c' : '#27ae60',
                                border: `1px solid ${isConnected ? 'rgba(231, 76, 60, 0.3)' : 'rgba(46, 204, 113, 0.3)'}`
                            }}
                        >
                            {isConnected ? 'Disconnect' : 'Connect'}
                        </Button>
                    </div>
                </div>

                <div className="mb-4">
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Trusted Apps (Ed25519 PubKeys)
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Input
                            value={newWhitelistKey}
                            onChange={(e) => setNewWhitelistKey(e.target.value)}
                            placeholder="Add Public Key (Hex)"
                        />
                        <Button onClick={addWhitelistKey} style={{ width: 'auto', padding: '0 16px' }}>+</Button>
                    </div>
                    {whitelist.length > 0 && (
                        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {whitelist.map((key) => (
                                <div key={key} style={{
                                    background: 'rgba(0,0,0,0.03)',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    fontSize: '12px',
                                    fontFamily: 'monospace'
                                }}>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{key}</span>
                                    <span
                                        onClick={() => removeWhitelistKey(key)}
                                        style={{ cursor: 'pointer', color: '#e74c3c', fontWeight: 'bold', marginLeft: '10px' }}
                                    >
                                        ✕
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
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
