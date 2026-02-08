import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import NetworkSelector from '../components/NetworkSelector';
import { TransactionController } from '../lib/transaction';
import { KeyringController } from '../lib/keyring';
import { TokenController } from '../lib/tokens';

function Home({ onSend, onReceive, onSettings, onAddToken, network, setNetwork, networkController }) {
    const [balance, setBalance] = useState('0.00');
    const [address, setAddress] = useState('');
    const [copied, setCopied] = useState(false);
    const [networks, setNetworks] = useState(networkController.getAllNetworks());
    const [tokens, setTokens] = useState([]); // List of tokens with balances

    useEffect(() => {
        setNetworks(networkController.getAllNetworks());

        // 1. Load immediate cache if available
        const loadCache = async () => {
            const keyring = new KeyringController();
            if (await keyring.load('password')) {
                const userAddress = keyring.getAddress();
                setAddress(userAddress);

                const cacheKey = `cache_${network}_${userAddress}`;
                const cached = await chrome.storage.local.get(cacheKey);
                if (cached[cacheKey]) {
                    const data = JSON.parse(cached[cacheKey]);
                    setBalance(data.balance || '0.00');
                    setTokens(data.tokens || []);
                }

                // 2. Trigger network update in background
                fetchData(keyring, userAddress);
            }
        };

        loadCache();

    }, [network, networkController]);

    // Polling
    useEffect(() => {
        const interval = setInterval(() => {
            setNetworks(networkController.getAllNetworks());
        }, 5000);
        return () => clearInterval(interval);
    }, [networkController]);

    const fetchData = async (keyring, userAddress) => {
        try {
            const provider = networkController.getProvider(network);
            const txController = new TransactionController(keyring, provider);

            // Native Balance
            const bal = await txController.getBalance();
            const formattedBal = Number(bal).toFixed(4);
            setBalance(formattedBal);

            // Token Balances
            const tokenController = new TokenController();
            await tokenController.load();
            const storedTokens = tokenController.getTokens(network);
            const tokenBalances = await tokenController.getTokenBalances(network, userAddress, provider);

            const tokensWithBal = storedTokens.map(t => ({
                ...t,
                balance: tokenBalances[t.address] || '0'
            }));
            setTokens(tokensWithBal);

            // Update Cache
            const cacheKey = `cache_${network}_${userAddress}`;
            await chrome.storage.local.set({
                [cacheKey]: JSON.stringify({
                    balance: formattedBal,
                    tokens: tokensWithBal,
                    timestamp: Date.now()
                })
            });
        } catch (e) {
            console.error("Background fetch failed", e);
        }
    };

    const copyAddress = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="home-container" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header with Settings */}
            <div className="flex-between" style={{ zIndex: 100 }}> {/* Z-index for dropdown */}
                <div style={{ width: '40px' }}></div>

                <NetworkSelector
                    network={network}
                    setNetwork={setNetwork}
                    networks={networks}
                />

                <Button onClick={onSettings} style={{ padding: '0', borderRadius: '50%', width: '40px', height: '40px' }}>
                    <span style={{ fontSize: '18px' }}>⚙️</span>
                </Button>
            </div>

            {/* Balance Card */}
            <Card style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '140px', zIndex: 1 }}>
                <p style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }}>Total Balance</p>
                <h1 style={{ margin: '12px 0', fontSize: '36px', letterSpacing: '-1px' }}>
                    {balance} <span style={{ fontSize: '16px', fontWeight: '500', opacity: 0.8 }}>{networks[network]?.symbol || ''}</span>
                </h1>
                <div
                    onClick={copyAddress}
                    style={{
                        fontSize: '12px',
                        opacity: 0.6,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: 'rgba(0,0,0,0.05)',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        alignSelf: 'center'
                    }}
                >
                    {address.slice(0, 6)}...{address.slice(-4)}
                    {copied ? '✓' : '❐'}
                </div>
            </Card>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0 10px', zIndex: 1 }}>
                <div className="text-center">
                    <Button onClick={onSend} style={{ borderRadius: '50%', width: '64px', height: '64px', padding: 0 }}>
                        <span style={{ fontSize: '24px' }}>↑</span>
                    </Button>
                    <p style={{ marginTop: '8px', fontSize: '12px', fontWeight: '600' }}>Send</p>
                </div>
                <div className="text-center">
                    <Button onClick={onReceive} style={{ borderRadius: '50%', width: '64px', height: '64px', padding: 0 }}>
                        <span style={{ fontSize: '24px' }}>↓</span>
                    </Button>
                    <p style={{ marginTop: '8px', fontSize: '12px', fontWeight: '600' }}>Receive</p>
                </div>
                <div className="text-center">
                    <Button style={{ borderRadius: '50%', width: '64px', height: '64px', padding: 0, opacity: 0.5 }}>
                        <span style={{ fontSize: '24px' }}>⇄</span>
                    </Button>
                    <p style={{ marginTop: '8px', fontSize: '12px', fontWeight: '600' }}>Swap</p>
                </div>
            </div>

            {/* Token List */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', zIndex: 1 }}>
                <div className="flex-between mb-4">
                    <h3 style={{ fontSize: '16px', opacity: 0.8 }}>Assets</h3>
                    <Button onClick={onAddToken} style={{ padding: '4px 12px', fontSize: '12px', height: 'auto', borderRadius: '8px' }}>+ Add</Button>
                </div>
                {tokens.length === 0 ? (
                    <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '20px', fontStyle: 'italic', fontSize: '13px' }}>
                        No custom tokens imported
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {tokens.map((token, idx) => (
                            <Card key={idx} style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--text-color)', color: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                                        {token.symbol[0]}
                                    </div>
                                    <div style={{ fontWeight: '700', fontSize: '15px' }}>{token.symbol}</div>
                                </div>
                                <div style={{ fontWeight: '600', fontSize: '15px' }}>{Number(token.balance).toFixed(4)}</div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Home;
