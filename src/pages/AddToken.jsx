import React, { useState } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import { TokenController } from '../lib/tokens';

function AddToken({ onBack, network, networkController }) {
    const [address, setAddress] = useState('');
    const [msg, setMsg] = useState('');
    const [status, setStatus] = useState('');

    const handleAdd = async () => {
        if (!address) return;
        setStatus('loading');
        setMsg('');
        try {
            const provider = networkController.getProvider(network);
            const tokenController = new TokenController();
            await tokenController.load();

            const symbol = await tokenController.addToken(network, address, provider);

            setStatus('success');
            setMsg(`Successfully added ${symbol}!`);
            setTimeout(() => {
                onBack();
            }, 1500);
        } catch (e) {
            setStatus('error');
            setMsg(e.message);
        }
    };

    return (
        <div className="add-token-container" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                <Button onClick={onBack} style={{ padding: '0', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '18px' }}>←</span>
                </Button>
                <h2 style={{ marginLeft: '16px', fontSize: '20px' }}>Add Token</h2>
            </div>

            <div style={{ flex: 1 }}>
                <Card className="mb-4">
                    <p style={{ fontSize: '13px', opacity: 0.7, marginBottom: '20px', lineHeight: '1.5' }}>
                        Paste the contract address of the ERC-20 token you want to add to <strong>{network.toUpperCase()}</strong>.
                    </p>

                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600', opacity: 0.7, textTransform: 'uppercase' }}>Contract Address</label>
                    <Input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="0x..."
                    />

                    {msg && (
                        <div style={{
                            marginTop: '16px',
                            padding: '12px',
                            borderRadius: '12px',
                            background: status === 'error' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)',
                            color: status === 'error' ? '#c0392b' : '#27ae60',
                            fontSize: '13px',
                            fontWeight: '600',
                            textAlign: 'center'
                        }}>
                            {msg}
                        </div>
                    )}
                </Card>
            </div>

            <Button
                onClick={handleAdd}
                style={{ width: '100%', padding: '16px' }}
                disabled={!address || status === 'loading'}
            >
                {status === 'loading' ? 'Verifying...' : 'Add Token'}
            </Button>
        </div>
    );
}

export default AddToken;
