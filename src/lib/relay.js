import { ethers } from 'ethers';
import nacl from 'tweetnacl';
import { KeyringController } from './keyring';
import { NetworkController } from './networks';

export class RelayController {
    constructor() {
        this.ws = null;
        this.url = null;
        this.reconnectTimer = null;
        this.keyring = new KeyringController();
        this.networkController = new NetworkController();
        this.isConnected = false;
        this.manuallyDisconnected = false;
        this.pendingResolvers = new Map();
    }

    async init() {
        // 0. Load Networks
        await this.networkController.load();

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
            } else if (message.type === 'CONFIRM_TX') {
                console.log('[Relay] Received CONFIRM_TX for ID:', message.id);
                console.log('[Relay] Pending Resolvers:', [...this.pendingResolvers.keys()]);
                const resolver = this.pendingResolvers.get(message.id);
                if (resolver) {
                    resolver.resolve(true);
                    this.pendingResolvers.delete(message.id);
                } else {
                    console.warn('[Relay] No resolver found for ID:', message.id);
                }
            } else if (message.type === 'REJECT_TX') {
                console.log('[Relay] Received REJECT_TX for ID:', message.id);
                const resolver = this.pendingResolvers.get(message.id);
                if (resolver) {
                    resolver.reject(new Error('User rejected the request'));
                    this.pendingResolvers.delete(message.id);
                }
            }
        });

        // 3. Monitor Session Storage for Lock status changes (Optional/Advanced)
        // chrome.storage.session.onChanged...
    }

    checkConnection() {
        if (this.manuallyDisconnected) return;
        if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.log('[Relay] Connection check failed. Reconnecting...');
            if (this.url) this.connect(this.url);
        }
    }

    startHeartbeat() {
        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                // Send a ping. Server might not reply with pong, but traffic keeps NAT open.
                // Assuming server ignores unknown json or handles ping.
                // If server expects specific ping format, adjust here. 
                // For now sending a minimal valid JSON or comment.
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 20000); // 20 seconds
    }

    stopHeartbeat() {
        if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
    }

    disconnect() {
        this.stopHeartbeat();
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
            // If already connected to same URL, do nothing? 
            // Better to force reconnect if state is weird.
            try { this.ws.close(); } catch (e) { }
        }
        this.url = url;
        this.stopHeartbeat();

        console.log('[Relay] Connecting to:', url);
        try {
            this.ws = new WebSocket(url);

            this.ws.onopen = async () => {
                console.log('[Relay] Connected');
                this.isConnected = true;
                if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

                this.startHeartbeat();
                await this.sendAuth();
            };

            this.ws.onmessage = async (event) => {
                try {
                    const envelope = JSON.parse(event.data);
                    if (envelope.type === 'pong') {
                        // Heartbeat response, ignore
                        return;
                    }

                    if (envelope.method === 'get_address' && envelope.id === 0) {
                        // Legacy Handshake
                        await this.handleHandshake(envelope);
                    } else if (envelope.type === 'auth_success') {
                        console.log('[Relay] Auth Success:', envelope.message);
                    } else if (envelope.type === 'auth_error') {
                        console.error('[Relay] Auth Error:', envelope.message);
                        this.stopHeartbeat();
                        this.ws.close();
                    } else {
                        await this.handleRelayMessage(envelope);
                    }
                } catch (e) {
                    // Ignore parse errors from ping/pong non-json if any
                    // console.error('[Relay] Error handling message:', e);
                }
            };

            this.ws.onclose = () => {
                console.log('[Relay] Disconnected');
                this.isConnected = false;
                this.stopHeartbeat();
                if (!this.manuallyDisconnected) {
                    this.scheduleReconnect();
                }
            };

            this.ws.onerror = (err) => {
                console.error('[Relay] Error:', err); // Might print "Receiving end does not exist" if extension context invalidated
                this.isConnected = false;
                // createWebSocket will trigger onclose usually
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

        console.log('[Relay] Scheduling reconnect in 5s...');
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

            // 3. Verify Ed25519 (TweetNaCl)
            const messageString = JSON.stringify(data);
            const messageBytes = new TextEncoder().encode(messageString);
            const signatureBytes = this.hexToBytes(auth.signature);
            const pubKeyBytes = this.hexToBytes(auth.pubkey);

            if (!nacl.sign.detached.verify(messageBytes, signatureBytes, pubKeyBytes)) {
                throw new Error('Invalid Ed25519 signature');
            }

            await chrome.storage.local.set({ [nonceKey]: data.nonce });

            const result = await this.executeMethod(data.method, data.params, data.id);
            await this.sendSignedResponse(data.id, data.nonce, result);

        } catch (e) {
            console.error('[Relay] Execution Error:', e.message);
            this.sendErrorResponse(data.id, data.nonce, e.message);
        }
    }

    async executeMethod(method, params, id) {
        switch (method) {
            case 'get_address':
                const pubData = await chrome.storage.local.get('publicAddress');
                if (pubData.publicAddress) return pubData.publicAddress;
                throw new Error('Wallet not initialized');

            case 'sign_transaction':
                if (await this.keyring.load()) {
                    await this.requestUserApproval(id, method, params);

                    const tx = params[0];
                    console.log('[Relay] sign_transaction request approved:', JSON.stringify(tx, null, 2));

                    // Basic Validation
                    if (tx.to && !ethers.isAddress(tx.to)) {
                        if (!tx.to.includes('.')) {
                            throw new Error(`Invalid 'to' address: ${tx.to}. Must be valid Ethereum address (42 chars) or ENS name.`);
                        }
                    }
                    // Validate value
                    try {
                        if (tx.value) {
                            tx.value = BigInt(tx.value); // Convert to BigInt to be safe
                        }
                    } catch (e) {
                        throw new Error(`Invalid 'value': ${tx.value}`);
                    }

                    let provider = null;

                    // 1. Try explicit chainId from TX
                    if (tx.chainId) {
                        const network = this.networkController.getNetworkByChainId(tx.chainId);
                        if (network) {
                            console.log('[Relay] Using Provider from ChainID:', network.name);
                            provider = new ethers.JsonRpcProvider(network.rpcUrl);
                        }
                    }

                    // 2. Fallback to persisted user selection
                    if (!provider) {
                        const stored = await chrome.storage.local.get('network');
                        if (stored.network) {
                            const network = this.networkController.getNetwork(stored.network);
                            if (network) {
                                console.log('[Relay] Using Fallback Provider (Selected Network):', network.name);
                                provider = new ethers.JsonRpcProvider(network.rpcUrl);
                            }
                        }
                    }

                    if (!provider) {
                        console.warn('[Relay] No Provider found for transaction! Signing might fail if fields are missing.');
                    }

                    try {
                        return await this.keyring.signTransaction(tx, provider);
                    } catch (err) {
                        console.error('[Relay] signTransaction failed:', err);
                        throw err; // Re-throw to send error response
                    }
                } else {
                    throw new Error('Wallet Locked. Please unlock to sign.');
                }

            case 'send_transaction':
                if (await this.keyring.load()) {
                    await this.requestUserApproval(id, method, params);

                    const tx = params[0];
                    console.log('[Relay] send_transaction request approved:', JSON.stringify(tx, null, 2));

                    // Basic Validation
                    if (tx.to && !ethers.isAddress(tx.to)) {
                        if (!tx.to.includes('.')) {
                            throw new Error(`Invalid 'to' address: ${tx.to}.`);
                        }
                    }
                    // Validate value
                    try {
                        if (tx.value) tx.value = BigInt(tx.value);
                    } catch (e) {
                        throw new Error(`Invalid 'value': ${tx.value}`);
                    }

                    let provider = null;
                    if (tx.chainId) {
                        const network = this.networkController.getNetworkByChainId(tx.chainId);
                        if (network) provider = new ethers.JsonRpcProvider(network.rpcUrl);
                    }
                    if (!provider) {
                        const stored = await chrome.storage.local.get('network');
                        if (stored.network) {
                            const network = this.networkController.getNetwork(stored.network);
                            if (network) provider = new ethers.JsonRpcProvider(network.rpcUrl);
                        }
                    }

                    if (!provider) throw new Error('No Provider found. Cannot broadcast transaction.');

                    try {
                        // sendTransaction returns the hash directly from our KeyringController update
                        return await this.keyring.sendTransaction(tx, provider);
                    } catch (err) {
                        console.error('[Relay] sendTransaction failed:', err);
                        throw err;
                    }
                } else {
                    throw new Error('Wallet Locked. Please unlock to send.');
                }

            case 'sign_message':
                if (await this.keyring.load()) {
                    await this.requestUserApproval(id, method, params);
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

    async sendSignedError(id, nonce, errorMsg, code = -32603) {
        const responseData = {
            nonce: nonce,
            id: id,
            result: null,
            error: errorMsg,
            code: code
        };

        try {
            if (await this.keyring.load()) {
                const messageString = JSON.stringify(responseData);
                const signature = await this.keyring.signMessage(messageString);
                const address = this.keyring.getAddress();

                this.ws.send(JSON.stringify({
                    type: 'wallet_response', // Added type for clarity, though server might look at structure
                    data: responseData,
                    auth: { address, signature }
                }));
            }
        } catch (e) {
            console.error('[Relay] Failed to sign error response:', e);
            // Fallback to unsigned error if signing fails?
            // Server might reject it, but better than nothing.
            this.ws.send(JSON.stringify({
                type: 'wallet_response',
                data: responseData,
                auth: null
            }));
        }
    }

    sendErrorResponse(id, nonce, errorMsg) {
        // Legacy unsigned implementation, maybe replace?
        this.sendSignedError(id, nonce, errorMsg);
    }


    async requestUserApproval(id, method, params) {
        // 1. Check Auto-Confirm Setting
        const settings = await chrome.storage.local.get('autoConfirm');
        if (settings.autoConfirm) {
            return true; // Auto-confirm enabled
        }

        // 2. Prepare Pending Request
        await chrome.storage.local.set({
            pendingRequest: { id, method, params }
        });

        // 3. Open Confirmation Popup
        await chrome.windows.create({
            url: 'index.html#confirm',
            type: 'popup',
            width: 360,
            height: 600
        });

        // 4. Wait for User Action
        return new Promise((resolve, reject) => {
            this.pendingResolvers.set(id, { resolve, reject });
        });
    }

    hexToBytes(hex) {
        if (typeof hex !== 'string') return new Uint8Array();
        if (hex.startsWith('0x')) hex = hex.slice(2);
        if (hex.length % 2) return new Uint8Array();
        const array = new Uint8Array(hex.length / 2);
        for (let i = 0; i < array.length; i++) {
            const j = i * 2;
            array[i] = parseInt(hex.substring(j, j + 2), 16);
        }
        return array;
    }
}
