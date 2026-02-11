import { RelayController } from '../lib/relay';

console.log('Background script initialized');

// Initialize Relay Service
const relay = new RelayController();
relay.init().catch(console.error);

// Keep-Alive Alarm (1 minute interval)
chrome.alarms.create('keepAlive', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'keepAlive') {
        console.log('[Background] Keep-Alive Alarm Triggered');
        relay.checkConnection();
    }
});

// Open Settings on Install (Optional, but good for demo)
chrome.runtime.onInstalled.addListener(() => {
    // chrome.runtime.openOptionsPage();
});
