import { ethers } from 'ethers';

const DEFAULT_NETWORKS = {
    bsc: {
        chainId: 56,
        name: 'BNB Smart Chain',
        rpcUrl: 'https://binance.llamarpc.com',
        symbol: 'BNB',
        blockExplorer: 'https://bscscan.com'
    },
    eth: {
        chainId: 1,
        name: 'Ethereum',
        rpcUrl: 'https://eth.llamarpc.com',
        symbol: 'ETH',
        blockExplorer: 'https://etherscan.io'
    },
    arb: {
        chainId: 42161,
        name: 'Arbitrum One',
        rpcUrl: 'https://arbitrum.llamarpc.com',
        symbol: 'ETH',
        blockExplorer: 'https://arbiscan.io'
    },
    pol: {
        chainId: 137,
        name: 'Polygon',
        rpcUrl: 'https://polygon.llamarpc.com',
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
            this.networks = { ...this.networks, ...JSON.parse(data.networks) };
        }
    }

    async save() {
        await chrome.storage.local.set({ 'networks': JSON.stringify(this.networks) });
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
