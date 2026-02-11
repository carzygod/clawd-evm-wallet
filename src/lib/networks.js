import { ethers } from 'ethers';

const DEFAULT_NETWORKS = {
    bsc: {
        chainId: 56,
        name: 'BNB Smart Chain',
        rpcUrl: 'https://bsc-dataseed.binance.org/',
        symbol: 'BNB',
        blockExplorer: 'https://bscscan.com'
    },
    eth: {
        chainId: 1,
        name: 'Ethereum',
        rpcUrl: 'https://rpc.flashbots.net',
        symbol: 'ETH',
        blockExplorer: 'https://etherscan.io'
    },
    arb: {
        chainId: 42161,
        name: 'Arbitrum One',
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
        symbol: 'ETH',
        blockExplorer: 'https://arbiscan.io'
    },
    pol: {
        chainId: 137,
        name: 'Polygon',
        rpcUrl: 'https://polygon-rpc.com',
        symbol: 'POL',
        blockExplorer: 'https://polygonscan.com'
    }
};

export class NetworkController {
    constructor() {
        this.networks = { ...DEFAULT_NETWORKS };
    }

    async load() {
        const data = await chrome.storage.local.get('networks');
        if (data.networks) {
            const storedNetworks = JSON.parse(data.networks);
            // Merge stored networks but force-update default networks (to apply RPC fixes)
            this.networks = { ...storedNetworks };

            // Re-apply defaults to ensure essential config (like RPCs) is up-to-date
            for (const key of Object.keys(DEFAULT_NETWORKS)) {
                if (this.networks[key]) {
                    // Keep user customizations if needed, but for now we enforce the fix
                    this.networks[key] = { ...this.networks[key], ...DEFAULT_NETWORKS[key] };
                } else {
                    this.networks[key] = DEFAULT_NETWORKS[key];
                }
            }
        }
    }

    async save() {
        await chrome.storage.local.set({ 'networks': JSON.stringify(this.networks) });
    }

    getNetworkByChainId(chainId) {
        if (!chainId) return null;
        // chainId might be hex or number
        const id = Number(chainId);
        for (const key of Object.keys(this.networks)) {
            if (this.networks[key].chainId === id) {
                return this.networks[key];
            }
        }
        return null;
    }

    getNetwork(key) {
        return this.networks[key];
    }

    getAllNetworks() {
        return this.networks;
    }

    getProvider(key) {
        const network = this.networks[key];
        if (!network) throw new Error('Network not supported');
        return new ethers.JsonRpcProvider(network.rpcUrl);
    }

    async addCustomRpc(key, url) {
        if (!this.networks[key]) throw new Error('Network not found');
        // Validate RPC?
        try {
            const provider = new ethers.JsonRpcProvider(url);
            await provider.getNetwork(); // check if valid
            this.networks[key].rpcUrl = url;
            await this.save();
        } catch (e) {
            throw new Error('Invalid RPC URL');
        }
    }
}
