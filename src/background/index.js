import { RelayController } from '../lib/relay';

console.log('Background script initialized');

// Initialize Relay Service
const relay = new RelayController();
relay.init().catch(console.error);

// Open Settings on Install (Optional, but good for demo)
chrome.runtime.onInstalled.addListener(() => {
    // chrome.runtime.openOptionsPage();
});
