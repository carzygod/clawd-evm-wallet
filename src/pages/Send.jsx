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

    const handleSend = async () => {
        setStatus('signing');
        try {
            const keyring = new KeyringController();
            await keyring.load('password');
            const provider = networkController.getProvider(network);
            const txController = new TransactionController(keyring, provider);

            const tx = await txController.sendTransaction(to, amount);
            console.log('Transaction sent:', tx);
            setStatus('sent');
            // In real app, wait for confirmation or show tx hash
        } catch (e) {
            console.error(e);
            setStatus('error: ' + e.message);
        }
    };

    return (
        <div className="send-container" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                <Button onClick={onBack} style={{ padding: '0', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '18px' }}>←</span>
                </Button>
                <h2 style={{ marginLeft: '16px', fontSize: '20px' }}>Send {network.toUpperCase()}</h2>
            </div>

            <div style={{ flex: 1 }}>
                <Card className="mb-4">
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600', opacity: 0.7, textTransform: 'uppercase' }}>To Address</label>
                        <Input
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            placeholder="0x..."
                            className="mb-0"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600', opacity: 0.7, textTransform: 'uppercase' }}>Amount</label>
                        <div style={{ position: 'relative' }}>
                            <Input
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.0"
                                type="number"
                                className="mb-0"
                            />
                            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', fontWeight: 'bold', opacity: 0.5 }}>
                                {network === 'bsc' ? 'BNB' : network === 'eth' ? 'ETH' : network === 'pol' ? 'POL' : 'ETH'}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <div style={{ marginTop: 'auto' }}>
                {status === 'sent' ? (
                    <Card style={{ textAlign: 'center', color: '#2ecc71', padding: '30px' }}>
                        <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Success!</h3>
                        <p style={{ marginBottom: '20px' }}>Transaction has been sent.</p>
                        <Button onClick={onBack} style={{ width: '100%' }}>Return Home</Button>
                    </Card>
                ) : (
                    <>
                        {status.startsWith('error') && <p style={{ color: '#e74c3c', fontSize: '12px', textAlign: 'center', marginBottom: '10px', background: 'rgba(231, 76, 60, 0.1)', padding: '8px', borderRadius: '8px' }}>{status}</p>}
                        <Button
                            onClick={handleSend}
                            disabled={!to || !amount || status === 'signing'}
                            style={{ width: '100%', padding: '16px', fontSize: '16px' }}
                        >
                            {status === 'signing' ? 'Signing...' : 'Confirm Send'}
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}

export default Send;
