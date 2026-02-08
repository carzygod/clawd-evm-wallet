import React, { useState } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import { TransactionController } from '../lib/transaction';
import { KeyringController } from '../lib/keyring';

function Send({ onBack, network, networkController }) {
    const [to, setTo] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState(''); // '', 'signing', 'sent', 'error'
    const [txDetails, setTxDetails] = useState(null);

    const handleSend = async () => {
        setStatus('signing');
        try {
            const keyring = new KeyringController();
            await keyring.load('password');
            const provider = networkController.getProvider(network);
            const txController = new TransactionController(keyring, provider);

            const tx = await txController.sendTransaction(to, amount);
            console.log('Transaction sent:', tx);
            setTxDetails(tx);
            setStatus('sent');
        } catch (e) {
            console.error(e);
            setStatus('error: ' + e.message);
        }
    };

    const openExplorer = () => {
        if (!txDetails || !txDetails.hash) return;
        const explorerUrl = networkController.getNetwork(network).blockExplorer;
        if (explorerUrl) {
            window.open(`${explorerUrl}/tx/${txDetails.hash}`, '_blank');
        }
    };

    return (
        <div className="app-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Button onClick={onBack} style={{ padding: '0', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '20px', paddingBottom: '2px' }}>←</span>
                </Button>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-color)' }}>Send {network.toUpperCase()}</h2>
            </div>

            {status === 'sent' ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Card style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>
                            ✓
                        </div>
                        <h3 style={{ margin: 0, fontSize: '22px' }}>Transaction Sent!</h3>
                        <p style={{ margin: 0, opacity: 0.6, fontSize: '14px' }}>Your transaction has been broadcasted to the network.</p>

                        <Button onClick={openExplorer} style={{ width: '100%', marginTop: '10px', background: 'var(--accent-color)', color: '#fff' }}>
                            View on Explorer ↗
                        </Button>

                        <Button onClick={onBack} style={{ width: '100%' }}>
                            Return Home
                        </Button>
                    </Card>
                </div>
            ) : (
                <>
                    <Card style={{ padding: '24px' }}>
                        <div className="mb-4">
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Recipient Address
                            </label>
                            <Input
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                placeholder="0x..."
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Amount
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Input
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.0"
                                    type="number"
                                />
                                <div style={{
                                    position: 'absolute',
                                    right: '16px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    opacity: 0.5,
                                    pointerEvents: 'none'
                                }}>
                                    {network === 'bsc' ? 'BNB' : network === 'eth' ? 'ETH' : network === 'pol' ? 'POL' : 'ETH'}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {status.startsWith('error') && (
                        <div style={{
                            padding: '12px',
                            borderRadius: '12px',
                            background: 'rgba(231, 76, 60, 0.1)',
                            color: '#c0392b',
                            fontSize: '13px',
                            textAlign: 'center',
                            border: '1px solid rgba(231, 76, 60, 0.3)'
                        }}>
                            {status}
                        </div>
                    )}

                    <div style={{ marginTop: 'auto' }}>
                        <Button
                            onClick={handleSend}
                            disabled={!to || !amount || status === 'signing'}
                            style={{ width: '100%', padding: '16px', fontSize: '16px' }}
                        >
                            {status === 'signing' ? 'Signing Transaction...' : 'Confirm Send'}
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}

export default Send;
