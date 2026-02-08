import React from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import { KeyringController } from '../lib/keyring';

function Receive({ onBack }) {
    const [address, setAddress] = React.useState('');
    const [copied, setCopied] = React.useState(false);

    React.useEffect(() => {
        const keyring = new KeyringController();
        keyring.load('password').then(() => {
            setAddress(keyring.getAddress());
        });
    }, []);

    const copyAddress = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="receive-container" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                <Button onClick={onBack} style={{ padding: '0', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '18px' }}>←</span>
                </Button>
                <h2 style={{ marginLeft: '16px', fontSize: '20px' }}>Receive Assets</h2>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Card className="mb-4" style={{ padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    <div style={{
                        width: '180px',
                        height: '180px',
                        background: 'var(--bg-color)',
                        borderRadius: '20px',
                        boxShadow: 'inset 5px 5px 10px var(--shadow-dark), inset -5px -5px 10px var(--shadow-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '24px'
                    }}>
                        <span style={{ opacity: 0.3, fontWeight: 'bold' }}>QR Code</span>
                    </div>

                    <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.5, letterSpacing: '1px' }}>Your Address</p>
                    <p style={{ wordBreak: 'break-all', fontWeight: 'bold', fontSize: '14px', margin: '12px 0', textAlign: 'center', lineHeight: '1.4' }}>
                        {address}
                    </p>
                </Card>
            </div>

            <Button
                onClick={copyAddress}
                style={{ width: '100%', padding: '16px' }}
            >
                {copied ? 'Copied!' : 'Copy Address'}
            </Button>
        </div>
    );
}

export default Receive;
