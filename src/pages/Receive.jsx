import React from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import { KeyringController } from '../lib/keyring';
import QRCode from 'react-qr-code';

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
        <div className="app-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Button onClick={onBack} style={{ padding: '0', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '20px', paddingBottom: '2px' }}>←</span>
                </Button>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-color)' }}>Receive</h2>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px' }}>
                <Card style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '20px' }}>

                    {/* QR Code Placeholder */}
                    <div style={{
                        width: '200px',
                        height: '200px',
                        background: 'var(--bg-color)',
                        borderRadius: '30px',
                        boxShadow: 'inset 5px 5px 10px var(--shadow-dark), inset -5px -5px 10px var(--shadow-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        padding: '10px'
                    }}>
                        {address && (
                            <QRCode
                                value={address}
                                size={160}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                viewBox={`0 0 256 256`}
                                fgColor="#333"
                                bgColor="transparent"
                            />
                        )}
                    </div>

                    <div style={{ textAlign: 'center', width: '100%' }}>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', opacity: 0.5, letterSpacing: '1px' }}>Your Address</p>
                        <p style={{
                            wordBreak: 'break-all',
                            fontWeight: '600',
                            fontSize: '13px',
                            margin: '12px 0 0 0',
                            textAlign: 'center',
                            lineHeight: '1.5',
                            fontFamily: 'monospace',
                            color: 'var(--text-color)'
                        }}>
                            {address}
                        </p>
                    </div>
                </Card>
            </div>

            <div style={{ marginTop: 'auto' }}>
                <Button
                    onClick={copyAddress}
                    style={{ width: '100%', padding: '16px', fontSize: '16px' }}
                >
                    {copied ? 'Address Copied!' : 'Copy Address'}
                </Button>
            </div>
        </div>
    );
}

export default Receive;
