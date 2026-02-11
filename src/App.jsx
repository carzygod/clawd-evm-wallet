import React, { useState, useEffect, Suspense } from 'react'
import './styles/neu.css'

// Lazy load components to split bundle
const Home = React.lazy(() => import('./pages/Home'));
const Welcome = React.lazy(() => import('./pages/Welcome'));
const Send = React.lazy(() => import('./pages/Send'));
const Receive = React.lazy(() => import('./pages/Receive'));
const Settings = React.lazy(() => import('./pages/Settings'));
const AddToken = React.lazy(() => import('./pages/AddToken'));

// We need a small loading component
const Loader = () => (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <p>Loading...</p>
    </div>
);

function App() {
    const [view, setView] = useState('loading');
    const [network, setNetwork] = useState('bsc');
    const [networkController, setNetworkController] = useState(null);

    useEffect(() => {
        // Dynamically import heavy logic
        const init = async () => {
            try {
                const { NetworkController } = await import('./lib/networks');
                const { KeyringController } = await import('./lib/keyring');

                const nc = new NetworkController();
                await nc.load();
                setNetworkController(nc);

                // Load saved network preference
                const netData = await chrome.storage.local.get('network');
                if (netData.network) {
                    setNetwork(netData.network);
                }

                const keyring = new KeyringController();
                const hasWallet = await keyring.load('password');
                if (hasWallet) {
                    setView('home');
                } else {
                    setView('welcome');
                }
            } catch (e) {
                console.error("Failed to init app", e);
            }
        };
        init();
    }, []);

    // Save network preference whenever it changes
    useEffect(() => {
        if (network) {
            chrome.storage.local.set({ network });
        }
    }, [network]);

    const handleWalletCreated = () => {
        setView('home');
    };

    // Render logic
    return (
        <Suspense fallback={<Loader />}>
            {view === 'loading' && <Loader />}

            {view === 'welcome' && <Welcome onComplete={handleWalletCreated} />}

            {view === 'home' && networkController && (
                <Home
                    onSend={() => setView('send')}
                    onReceive={() => setView('receive')}
                    onSettings={() => setView('settings')}
                    onAddToken={() => setView('add-token')}
                    network={network}
                    setNetwork={setNetwork}
                    networkController={networkController}
                />
            )}

            {view === 'send' && networkController && (
                <Send onBack={() => setView('home')} network={network} networkController={networkController} />
            )}

            {view === 'receive' && <Receive onBack={() => setView('home')} />}

            {view === 'settings' && networkController && (
                <Settings onBack={() => setView('home')} networkController={networkController} />
            )}

            {view === 'add-token' && networkController && (
                <AddToken onBack={() => setView('home')} network={network} networkController={networkController} />
            )}
        </Suspense>
    );
}

export default App
