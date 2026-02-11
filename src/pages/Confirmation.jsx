import React, { useState, useEffect } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import { ethers } from 'ethers';

function Confirmation() {
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load pending request
        chrome.storage.local.get('pendingRequest').then((data) => {
            if (data.pendingRequest) {
                setRequest(data.pendingRequest);
            }
            setLoading(false);
        });
    }, []);

    const handleConfirm = () => {
        if (!request) return;
        // Pass a callback to ensure message is sent before closing
        chrome.runtime.sendMessage({ type: 'CONFIRM_TX', id: request.id }, () => {
            window.close();
        });
    };

    const handleReject = () => {
        if (!request) return;
        chrome.runtime.sendMessage({ type: 'REJECT_TX', id: request.id }, () => {
            window.close();
        });
    };

    if (loading) return <div className="app-container" style={{ padding: '24px', textAlign: 'center' }}>Loading Request...</div>;
    if (!request) return <div className="app-container" style={{ padding: '24px', textAlign: 'center' }}>No pending request found.</div>;

    const { params, method } = request;
    const tx = params[0] || {};
    // Fallbacks
    const to = tx.to || 'Unknown';
    const value = tx.value ? ethers.formatEther(tx.value) : '0';
    const chainId = tx.chainId || 'Unknown';

    return (
        <div className="app-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
            <h2 style={{ textAlign: 'center', margin: '0', fontSize: '20px', fontWeight: '700' }}>Confirm Request</h2>

            <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                    <span style={{
                        background: 'var(--text-color)',
                        color: 'var(--bg-color)',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                    }}>
                        {method.replace('_', ' ')}
                    </span>
                </div>

                <div>
                    <label style={{ fontSize: '11px', opacity: 0.6, fontWeight: '600', textTransform: 'uppercase' }}>Network (Chain ID)</label>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{chainId}</div>
                </div>

                <div>
                    <label style={{ fontSize: '11px', opacity: 0.6, fontWeight: '600', textTransform: 'uppercase' }}>To</label>
                    <div style={{ fontSize: '13px', wordBreak: 'break-all', fontFamily: 'monospace', background: 'rgba(0,0,0,0.03)', padding: '8px', borderRadius: '8px' }}>
                        {to}
                    </div>
                </div>

                <div>
                    <label style={{ fontSize: '11px', opacity: 0.6, fontWeight: '600', textTransform: 'uppercase' }}>Value</label>
                    <div style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.5px' }}>
                        {value} <span style={{ fontSize: '14px', fontWeight: '500' }}>ETH</span>
                    </div>
                </div>

                {tx.data && tx.data !== '0x' && (
                    <div>
                        <label style={{ fontSize: '11px', opacity: 0.6, fontWeight: '600', textTransform: 'uppercase' }}>Data</label>
                        <div style={{
                            fontSize: '11px',
                            wordBreak: 'break-all',
                            fontFamily: 'monospace',
                            maxHeight: '80px',
                            overflowY: 'auto',
                            background: 'rgba(0,0,0,0.03)',
                            padding: '8px',
                            borderRadius: '8px'
                        }}>
                            {tx.data}
                        </div>
                    </div>
                )}
            </Card>

            <div style={{ display: 'flex', gap: '16px' }}>
                <Button onClick={handleReject} style={{
                    flex: 1,
                    background: 'rgba(231, 76, 60, 0.1)',
                    color: '#e74c3c',
                    border: '1px solid rgba(231, 76, 60, 0.3)',
                    boxShadow: 'none'
                }}>
                    Reject
                </Button>
                <Button onClick={handleConfirm} style={{ flex: 1 }}>
                    Confirm
                </Button>
            </div>
        </div>
    );
}

export default Confirmation;
