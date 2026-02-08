import React, { useState, useEffect } from 'react'
import './styles/neu.css'
import Home from './pages/Home'
import Welcome from './pages/Welcome'
import Send from './pages/Send'
import Receive from './pages/Receive'
import Settings from './pages/Settings'
import AddToken from './pages/AddToken'
import { KeyringController } from './lib/keyring'
import { NetworkController } from './lib/networks'

function App() {
    const [view, setView] = useState('loading'); // loading, welcome, home, send, receive, settings, add-token
    const [network, setNetwork] = useState('bsc');
    const [networkController] = useState(() => new NetworkController());

    useEffect(() => {
        checkWallet();
        networkController.load().then(() => {
            // Force update if networks change
        });
    }, []);

    const checkWallet = async () => {
        const keyring = new KeyringController();
        const hasWallet = await keyring.load('password');
        if (hasWallet) {
            setView('home');
        } else {
            setView('welcome');
        }
    };

    const handleWalletCreated = () => {
        setView('home');
    };

    if (view === 'loading') return <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;

    if (view === 'welcome') return <Welcome onComplete={handleWalletCreated} />;

    if (view === 'home') return (
        <Home
            onSend={() => setView('send')}
            onReceive={() => setView('receive')}
            onSettings={() => setView('settings')}
            onAddToken={() => setView('add-token')}
            network={network}
            setNetwork={setNetwork}
            networkController={networkController}
        />
    );

    if (view === 'send') return <Send onBack={() => setView('home')} network={network} networkController={networkController} />;

    if (view === 'receive') return <Receive onBack={() => setView('home')} />;

    if (view === 'settings') return <Settings onBack={() => setView('home')} networkController={networkController} />;

    if (view === 'add-token') return <AddToken onBack={() => setView('home')} network={network} networkController={networkController} />;

    return null;
}

export default App
