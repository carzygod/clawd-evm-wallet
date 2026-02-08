import React, { useState } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import { KeyringController } from '../lib/keyring';

function Welcome({ onComplete }) {
    const [mnemonic, setMnemonic] = useState('');
    const [mode, setMode] = useState('home'); // 'home', 'create', 'import'
    const [error, setError] = useState('');

    const handleCreate = async () => {
        const newMnemonic = KeyringController.createMnemonic();
        setMnemonic(newMnemonic);
        setMode('create-step-2');
    };

    const confirmCreate = async () => {
        const keyring = new KeyringController();
        await keyring.importMnemonic(mnemonic); // Should actually store it
        await keyring.save('password'); // mock password
        onComplete();
    };

    const handleImport = async () => {
        if (!mnemonic) return setError('Please enter a mnemonic');
        try {
            const keyring = new KeyringController();
            // Detect if mnemonic or private key
            if (mnemonic.trim().split(' ').length > 1) {
                await keyring.importMnemonic(mnemonic);
            } else {
                await keyring.importPrivateKey(mnemonic);
            }
            await keyring.save('password');
            onComplete();
        } catch (e) {
            setError(e.message);
        }
    };

    if (mode === 'home') {
        return (
            <div className="welcome-container" style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Welcome to Meme Wallet</h2>
                <Card className="mb-4">
                    <p>The most meme-able crypto wallet extension.</p>
                </Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <Button onClick={handleCreate}>Create New Wallet</Button>
                    <Button onClick={() => setMode('import')}>Import Wallet</Button>
                </div>
            </div>
        );
    }

    if (mode === 'create-step-2') {
        return (
            <div className="welcome-container" style={{ padding: '20px' }}>
                <h3>Backup Your Mnemonic</h3>
                <Card className="mb-4">
                    <p style={{ wordBreak: 'break-word', fontWeight: 'bold' }}>{mnemonic}</p>
                </Card>
                <p style={{ fontSize: '0.9em', color: '#666' }}>
                    Write these words down on paper. Do not share them with anyone.
                </p>
                <Button onClick={confirmCreate} style={{ width: '100%', marginTop: '20px' }}>
                    I Saved It
                </Button>
            </div>
        );
    }

    if (mode === 'import') {
        return (
            <div className="welcome-container" style={{ padding: '20px' }}>
                <h3>Import Wallet</h3>
                <textarea
                    className="neu-input"
                    value={mnemonic}
                    onChange={(e) => setMnemonic(e.target.value)}
                    placeholder="Enter 12-word phrase or Private Key"
                    rows={4}
                    style={{ height: '100px', resize: 'none' }}
                />
                {error && <p style={{ color: 'red', fontSize: '0.9em' }}>{error}</p>}
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <Button onClick={() => setMode('home')} style={{ flex: 1 }}>Back</Button>
                    <Button onClick={handleImport} style={{ flex: 1 }}>Import</Button>
                </div>
            </div>
        );
    }

    return null;
}

export default Welcome;
