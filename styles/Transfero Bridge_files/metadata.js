var BrzContractAddressForChainID = {};
var BridgeContractAddressForChainID = {};

window.Metadata = {
    InitializeMetadata: async (brzContractAddressForChainID, bridgeContractAddressForChainID, apiProvidersConfig) => {
        BrzContractAddressForChainID = brzContractAddressForChainID;
        BridgeContractAddressForChainID = bridgeContractAddressForChainID;

        const Web3Modal = window.Web3Modal.default;
        const WalletConnectProvider = window.WalletConnectProvider.default;

        // Check that the web page is run in a secure context,
        // as otherwise MetaMask won't be available
        if (location.protocol !== 'https:') {
            return;
        }

        // Tell Web3modal what providers we have available.
        // Built-in web browser provider (only one can exist as a time)
        // like MetaMask, Brave or Opera is added automatically by Web3modal
        const providerOptions = {
            walletconnect: {
                package: WalletConnectProvider,
                options: {
                    rpc: {
                        1: "https://mainnet.infura.io/v3/" + apiProvidersConfig.infuraId,
                        3: "https://ropsten.infura.io/v3/" + apiProvidersConfig.infuraId,
                        4: "https://rinkeby.infura.io/v3/" + apiProvidersConfig.infuraId,
                        42: "https://kovan.infura.io/v3/" + apiProvidersConfig.infuraId,
                        5: "https://goerli.infura.io/v3/" + apiProvidersConfig.infuraId,
                        30: "https://rsk.getblock.io/mainnet/?api_key=" + apiProvidersConfig.getBlockAPIKey,
                        31: "https://public-node.testnet.rsk.co",
                        56: "https://bsc.getblock.io/mainnet/?api_key=" + apiProvidersConfig.getBlockAPIKey,
                        97: "https://bsc.getblock.io/testnet/?api_key=" + apiProvidersConfig.getBlockAPIKey
                    },
                }
            }
        };

        web3Modal = new Web3Modal({
            theme: "dark",
            cacheProvider: true, // optional
            providerOptions, // required
            disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
        });
    }
}
