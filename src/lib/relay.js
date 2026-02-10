import { ethers } from 'ethers';
import * as ed from '@noble/ed25519';
import { KeyringController } from './keyring';

export class RelayController {
    constructor() {
        this.ws = null;
        this.url = null;
        this.reconnectTimer = null;
        this.keyring = new KeyringController();
        this.isConnected = false;
        this.manuallyDisconnected = false;
    }

    async init() {
        // 1. Load Config
        const data = await chrome.storage.local.get('relayUrl');
        if (data.relayUrl) {
            this.connect(data.relayUrl);
        }

        // 2. Listeners
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'RELAY_CONFIG_UPDATED' && message.url) {
                this.manuallyDisconnected = false;
                this.connect(message.url);
            } else if (message.type === 'GET_RELAY_STATUS') {
                sendResponse({ connected: this.isConnected, url: this.url });
            } else if (message.type === 'TOGGLE_RELAY') {
                if (this.isConnected) {
                    this.disconnect();
                    this.manuallyDisconnected = true;
                } else {
                    this.manuallyDisconnected = false;
                    if (this.url) this.connect(this.url);
                }
                sendResponse({ connected: this.isConnected });
            } else if (message.type === 'WALLET_UNLOCKED') {
                // Trigger connection if we were waiting for unlock
                if (this.url && !this.isConnected && !this.manuallyDisconnected) {
                    this.connect(this.url);
                }
            }
        });

        // 3. Monitor Session Storage for Lock status changes (Optional/Advanced)
        // chrome.storage.session.onChanged...
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        console.log('[Relay] Manually disconnected');
    }

    connect(url) {
        if (this.ws) {
            this.ws.close();
        }
        this.url = url;

        console.log('[Relay] Connecting to:', url);
        try {
            this.ws = new WebSocket(url);

            this.ws.onopen = async () => {
                console.log('[Relay] Connected');
                this.isConnected = true;
                if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

                await this.sendAuth();
            };

            this.ws.onmessage = async (event) => {
                try {
                    const envelope = JSON.parse(event.data);
                    if (envelope.method === 'get_address' && envelope.id === 0) {
                        // Legacy Handshake
                        await this.handleHandshake(envelope);
                    } else if (envelope.type === 'auth_success') {
                        console.log('[Relay] Auth Success:', envelope.message);
                    } else if (envelope.type === 'auth_error') {
                        console.error('[Relay] Auth Error:', envelope.message);
                        this.ws.close(); // Server will close anyway
                    } else {
                        await this.handleRelayMessage(envelope);
                    }
                } catch (e) {
                    console.error('[Relay] Error handling message:', e);
                }
            };

            this.ws.onclose = () => {
                console.log('[Relay] Disconnected');
                this.isConnected = false;
                if (!this.manuallyDisconnected) {
                    this.scheduleReconnect();
                }
            };

            this.ws.onerror = (err) => {
                console.error('[Relay] Error:', err);
                this.isConnected = false;
            };

        } catch (e) {
            console.error('[Relay] Connection failed:', e);
            this.isConnected = false;
            if (!this.manuallyDisconnected) {
                this.scheduleReconnect();
            }
        }
    }

    scheduleReconnect() {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        if (this.manuallyDisconnected) return;

        this.reconnectTimer = setTimeout(() => {
            if (this.url) this.connect(this.url);
        }, 5000);
    }

    async sendAuth() {
        try {
            console.log('[Relay] sendAuth (Strict) initiated...');

            // 1. Load Main Wallet from Session
            // keyring.load() checks chrome.storage.session.get('sessionKey')
            if (!await this.keyring.load()) {
                console.warn('[Relay] Wallet Locked (No Session Key). Cannot Authenticate.');
                // We cannot authenticate. Close connection to avoid zombie socket?
                // Or just wait. Server will likely kick us.
                // Let's close and retry later when unlocked.
                this.ws.close();
                return;
            }

            const wallet = this.keyring.wallet;
            const payload = {
                timestamp: Date.now(),
                address: wallet.address,
                publicKey: wallet.publicKey
            };

            // 2. Sign with MAIN Private Key (EIP-191)
            const signature = await wallet.signMessage(JSON.stringify(payload));

            const authMessage = {
                type: 'wallet_auth',
                payload: payload,
                signature: signature
            };

            console.log('[Relay] Sending Strict Auth Message:', JSON.stringify(authMessage, null, 2));
            this.ws.send(JSON.stringify(authMessage));

        } catch (e) {
            console.error('[Relay] sendAuth Failed:', e);
        }
    }

    async handleHandshake(req) {
        try {
            const pubData = await chrome.storage.local.get('publicAddress');
            const address = pubData.publicAddress || null;
            this.ws.send(JSON.stringify({
                id: req.id,
                result: address,
                error: address ? null : 'Wallet not initialized'
            }));
        } catch (e) {
            console.error('Handshake failed:', e);
        }
    }

    async handleRelayMessage(envelope) {
        const { protocol, data, auth } = envelope;

        if (!data || !auth) { return; }
        // Filter out non-relay messages
        if (!protocol) return;

        if (protocol !== 'ed25519/v1') { return; }

        try {
            // 1. Whitelist Check
            const whitelistData = await chrome.storage.local.get('whitelist');
            const whitelist = whitelistData.whitelist || [];
            if (!whitelist.includes(auth.pubkey)) {
                throw new Error('Sender Public Key not in whitelist');
            }

            // 2. Nonce
            const nonceKey = `nonce_${auth.pubkey}`;
            const nonceData = await chrome.storage.local.get(nonceKey);
            const lastNonce = nonceData[nonceKey] || -1;
            if (typeof data.nonce !== 'number' || data.nonce <= lastNonce) {
                throw new Error(`Invalid nonce. Expected > ${lastNonce}, got ${data.nonce}`);
            }

            // 3. Verify Ed25519
            const messageString = JSON.stringify(data);
            const messageBytes = new TextEncoder().encode(messageString);
            const signatureBytes = this.hexToBytes(auth.signature);
            const pubKeyBytes = this.hexToBytes(auth.pubkey);
            if (!await ed.verify(signatureBytes, messageBytes, pubKeyBytes)) {
                throw new Error('Invalid Ed25519 signature');
            }

            await chrome.storage.local.set({ [nonceKey]: data.nonce });

            const result = await this.executeMethod(data.method, data.params);
            await this.sendSignedResponse(data.id, data.nonce, result);

        } catch (e) {
            console.error('[Relay] Execution Error:', e.message);
            this.sendErrorResponse(data.id, data.nonce, e.message);
        }
    }

    async executeMethod(method, params) {
        switch (method) {
            case 'get_address':
                const pubData = await chrome.storage.local.get('publicAddress');
                if (pubData.publicAddress) return pubData.publicAddress;
                throw new Error('Wallet not initialized');

            case 'sign_transaction':
                if (await this.keyring.load()) {
                    return await this.keyring.signTransaction(params[0]);
                } else {
                    throw new Error('Wallet Locked. Please unlock to sign.');
                }

            case 'sign_message':
                if (await this.keyring.load()) {
                    return await this.keyring.signMessage(params[0]);
                } else {
                    throw new Error('Wallet Locked. Please unlock to sign.');
                }

            default:
                throw new Error('Method not supported: ' + method);
        }
    }

    async sendSignedResponse(id, requestNonce, result) {
        const responseData = {
            nonce: requestNonce,
            id: id,
            result: result,
            error: null
        };

        try {
            if (await this.keyring.load()) {
                const messageString = JSON.stringify(responseData);
                const signature = await this.keyring.signMessage(messageString);
                const address = this.keyring.getAddress();

                this.ws.send(JSON.stringify({
                    protocol: 'eth/v1',
                    data: responseData,
                    auth: { address, signature }
                }));
            } else {
                throw new Error("Wallet Locked during response signing");
            }

        } catch (e) {
            this.sendErrorResponse(id, requestNonce, "Signing failed: " + e.message);
        }
    }

    sendErrorResponse(id, nonce, errorMsg) {
        this.ws.send(JSON.stringify({
            protocol: 'eth/v1',
            data: { id, nonce, error: errorMsg, result: null },
            auth: null
        }));
    }

    hexToBytes(hex) {
        if (typeof hex !== 'string') return new Uint8Array();
        if (hex.length % 2) return new Uint8Array();
        const array = new Uint8Array(hex.length / 2);
        for (let i = 0; i < array.length; i++) {
            const j = i * 2;
            array[i] = parseInt(hex.substring(j, j + 2), 16);
        }
        return array;
    }
}
