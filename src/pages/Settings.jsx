import React, { useState } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';

function Settings({ onBack, networkController }) {
    const [rpcUrl, setRpcUrl] = useState('');
    const [networkKey, setNetworkKey] = useState('bsc');
    const [msg, setMsg] = useState('');

    const handleAddRpc = async () => {
        if (!rpcUrl) return;
        try {
            await networkController.addCustomRpc(networkKey, rpcUrl);
            setMsg('RPC Updated!');
            setRpcUrl('');
            setTimeout(() => setMsg(''), 2000);
        } catch (e) {
            setMsg('Error: ' + e.message);
        }
    };

    return (
        <div className="settings-container" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <Button onClick={onBack} style={{ padding: '8px 15px', marginRight: '15px' }}>←</Button>
                <h2 style={{ margin: 0 }}>Settings</h2>
            </div>

            <Card className="mb-4">
                <h3>Custom RPC</h3>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9em', color: '#666' }}>Network</label>
                <select
                    value={networkKey}
                    onChange={(e) => setNetworkKey(e.target.value)}
                    className="neu-input"
                >
                    <option value="bsc">BSC</option>
                    <option value="eth">Ethereum</option>
                    <option value="arb">Arbitrum</option>
                    <option value="pol">Polygon</option>
                </select>

                <label style={{ display: 'block', marginTop: '15px', marginBottom: '5px', fontSize: '0.9em', color: '#666' }}>New RPC URL</label>
                <Input
                    value={rpcUrl}
                    onChange={(e) => setRpcUrl(e.target.value)}
                    placeholder="https://..."
                />

                <Button onClick={handleAddRpc} style={{ width: '100%', marginTop: '20px' }}>
                    Update RPC
                </Button>
                {msg && <p style={{ textAlign: 'center', marginTop: '10px', color: msg.includes('Error') ? 'red' : 'green' }}>{msg}</p>}
            </Card>

            {/* Export Keys could go here */}
            <Card>
                <h3>Security</h3>
                <Button style={{ width: '100%', background: '#ffcccb' }} disabled>Export Private Key (Coming Soon)</Button>
            </Card>
        </div>
    );
}

export default Settings;
