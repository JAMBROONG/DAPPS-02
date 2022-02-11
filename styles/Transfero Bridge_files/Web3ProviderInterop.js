var web3 = null;
var provider = null;
var web3Modal = null;
var BRZContract = null;
var BridgeContract = null;
var tokenDecimals = 4;
var selectedAddress = "";
var connectedChainId = "";
var connectedProvider = "";


window.Web3ProviderInterop = {
    CheckCachedProvider: async () => {
        if (web3Modal && web3Modal.cachedProvider) {
            if (web3Modal.cachedProvider === "injected") {
                await Web3ProviderInterop.OnConnect();
            } else {
                await web3Modal.clearCachedProvider();
            }
        }
    },
    FetchAll: async () => {
        const chainId = await web3.eth.getChainId();
        connectedChainId = Number.isInteger(chainId) ? "0x" + chainId.toString(16) : chainId;

        let bridgeContractAddress = BridgeContractAddressForChainID[connectedChainId];
        if (!bridgeContractAddress) {
            console.log("Unsupported network");
            DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'BalanceChanged', 0);
            DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'ChainIdChanged', connectedChainId);
            return;
        }

        BridgeContract = new web3.eth.Contract(BridgeAbi, bridgeContractAddress);

        await this.Web3ProviderInterop.FetchAccountData();
        await this.Web3ProviderInterop.FetchBridgeData();
    },
    FetchBridgeData: async () => {
        BridgeContract.methods.feePercentageBridge().call()
            .then((responseFee) => {
                BridgeContract.methods.DECIMALPERCENT().call((error, responseDecimalPercent) => {
                    let decimalPercent = parseInt(responseDecimalPercent);
                    let fee = parseInt(responseFee);
                    let bridgeFee = fee / decimalPercent;
                    DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'BridgeFeeChanged', bridgeFee);
                    console.log(bridgeFee);
                });
            })
            .catch((error) => {
                console.error(error.reason);
            });


        BridgeContract.methods.listBlockchain().call()
            .then((blockchainList) => {
                DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'ValidToNetworksChanged', blockchainList);
                console.log(blockchainList);
            })
            .catch((error) => {
                console.error(error.reason);
            });

        BridgeContract.methods.token().call()
            .then(async (tokenAddress) => {
                await this.Web3ProviderInterop.FetchTokenData(tokenAddress);
            })
            .catch(async (error) => {
                let brzContractAddress = BrzContractAddressForChainID[connectedChainId];
                if (!brzContractAddress) {
                    console.log("Unsupported network");
                    DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'BalanceChanged', 0);
                    return;
                }
                await this.Web3ProviderInterop.FetchTokenData(brzContractAddress);
            });

        BridgeContract.methods.gasAcceptTransfer().call()
            .then((gasAcceptTransfer) => {
                DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'GasAcceptTransferChanged', parseInt(gasAcceptTransfer));
                console.log(gasAcceptTransfer);
            })
            .catch((error) => {
                console.error(error.reason);
            });

    },
    FetchTokenData: async (contractAddress) => {
        DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'TokenAddressChanged', contractAddress);
        console.log("BRZ Address: " + contractAddress);

        BRZContract = new web3.eth.Contract(BrzAbi, contractAddress);

        await this.Web3ProviderInterop.UpdateBalance();

        BRZContract.methods.allowance(selectedAddress, BridgeContract.options.address).call()
            .then((responseAllowance) => {
                let allowance = parseInt(responseAllowance);
                DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'AllowanceChanged', allowance);
                console.log("Allowance: " + responseAllowance)
            })
            .catch((error) => {
                console.error(error.reason);
            });
    },
    FetchAccountData: async () => {
        const accounts = await web3.eth.getAccounts();
        selectedAddress = accounts[0];
        if (!selectedAddress) {
            this.Web3ProviderInterop.OnDisconnect();
            return;
        }
        DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'SelectedAddressChanged', selectedAddress);
        console.log("Address: " + selectedAddress);

        console.log("Connected chain: " + connectedChainId);
        DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'ChainIdChanged', connectedChainId);
        
        const providerInfo = Web3Modal.getProviderInfo(provider);
        DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'ProviderSelectedChanged', providerInfo.name);
    },
    OnConnect: async () => {
        try {
            if (web3Modal.providerController.injectedProvider === null &&
                Object.keys(web3Modal.providerController.providerOptions).length === 0) {
                DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'SendMessage', "No provider was found", false);
                return;
            }
            provider = await web3Modal.connect();
            web3 = new Web3(provider);
            await this.Web3ProviderInterop.FetchAll();
            DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'IsConnectedChanged', true);
        } catch (e) {
            console.log("Could not get a wallet connection", e);
            return;
        }

        // Subscribe to accounts change
        provider.on("accountsChanged", async (accounts) => {
            await this.Web3ProviderInterop.FetchAll();
        });

        // Subscribe to chainId change
        provider.on("chainChanged", async (chainId) => {
            await this.Web3ProviderInterop.FetchAll();
        });

    },
    ClearCachedProvider: async () => {
        await web3Modal.clearCachedProvider();
    },
    OnDisconnect: async () => {
        console.log("Killing the wallet connection", provider);

        if (provider.disconnect) {
            await provider.disconnect();
        }
        
        await web3Modal.clearCachedProvider();
        provider = null;
        selectedAddress = "";
        connectedChainId = "";
        connectedProvider = "";
        DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'ProviderSelectedChanged', "None");
        DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'SelectedAddressChanged', selectedAddress);
        DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'ChainIdChanged', "");
        DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'BalanceChanged', 0);
        DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'IsConnectedChanged', false);
    },
    UpdateBalance: async () => {
        BRZContract.methods.balanceOf(selectedAddress).call()
            .then((balance) => {
                BRZContract.methods.decimals().call((error, responseDecimals) => {
                    let decimals = parseInt(responseDecimals);
                    tokenDecimals = decimals;
                    const friendlyBalance = parseFloat(balance) / (10 ** decimals);
                    DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'BalanceChanged', friendlyBalance);
                    DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'TokenDecimalsChanged', decimals);
                });
            })
            .catch((error) => {
                console.error(error.reason);
            });
    },
    GetAllowance: async () => {
        BRZContract.methods.allowance(selectedAddress, BridgeContract.options.address).call()
            .then((responseAllowance) => {
                let allowance = parseInt(responseAllowance);
                DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'AllowanceChanged', allowance);
                console.log("Allowance: " + responseAllowance)
            })
            .catch((error) => {
                console.error(error.reason);
            });
    },
    UpdateMinValues: async (network) => {
        let minGasPrice = await BridgeContract.methods.getMinGasPrice(network).call();
        let minTokenAmount = await BridgeContract.methods.getMinTokenAmount(network).call();
        let minTokenFee = await BridgeContract.methods.getMinBRZFee(network).call();
        let minValues = {
            minGasPriceWei: parseInt(minGasPrice),
            minTokenAmount: parseInt(minTokenAmount),
            minTokenFee: parseInt(minTokenFee)
        };
        DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'MinValuesChanged', minValues);
    },
    ApproveMax: async () => {
        const maxAmount = web3.utils.toBN((2 ** 50 - 1) * (10 ** tokenDecimals));
        await this.Web3ProviderInterop.Approve(maxAmount);
    },
    ApproveWithAmount: async (amount) => {
        const calculatedAmount = web3.utils.toBN(parseInt(amount * (10 ** tokenDecimals)));
        await this.Web3ProviderInterop.Approve(calculatedAmount);
    },
    Approve: async (amount) => {

        BRZContract.methods.approve(BridgeContract.options.address, amount)
            .send({ from: selectedAddress })
            .on('receipt', function (receipt) {
                BRZContract.methods.allowance(selectedAddress, BridgeContract.options.address).call()
                    .then((responseAllowance) => {
                        let allowance = parseInt(responseAllowance);
                        DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'AllowanceChanged', allowance);
                        console.log("Allowance: " + responseAllowance)
                    })
                    .catch((error) => {
                        console.error(error.reason);
                    });
                DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'SendMessage', 'Approve success message', true);
                console.log(receipt.transactionHash);
            })
            .catch(function (error) {
                DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'SendMessage', error.message, false);
                console.warn(error.message);
            });
    },
    ReceiveTokens: async (receiveTokensModel) => {
        console.log(receiveTokensModel)
        BridgeContract.methods.receiveTokens(
                receiveTokensModel.amount,
                receiveTokensModel.transactionFee,
                receiveTokensModel.toBlockchain,
                receiveTokensModel.toAddress
            )
            .send({ from: selectedAddress })
            .on('receipt', function (receipt) {
                console.log(receipt.transactionHash);
                DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'SuccessConfirmation');
                DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'SendMessage', 'ReceiveToken success message', true);
            })
            .catch(function (error) {
                DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'SendMessage', error.message, false);
                console.warn(error.message);
            });
    },
    GetListBlockchain: async (chainId) => {
        let bridgeContractAddress = BridgeContractAddressForChainID[chainId];

        BridgeContract = new web3.eth.Contract(BridgeAbi, bridgeContractAddress);

        BridgeContract.methods.feePercentageBridge().call()
            .then((responseFee) => {
                BridgeContract.methods.DECIMALPERCENT().call((error, responseDecimalPercent) => {
                    let decimalPercent = parseInt(responseDecimalPercent);
                    let fee = parseInt(responseFee);
                    let bridgeFee = fee / decimalPercent;
                    DotNet.invokeMethodAsync('BRZBridge.Blazor.Client', 'BridgeFeeChanged', bridgeFee);
                    console.log(bridgeFee);
                });
            })
            .catch((error) => {
                console.error(error.reason);
            });

        let blockchainList = await BridgeContract.methods.listBlockchain().call();
        return blockchainList;
    },
    AddTokenToWallet: async (contractAddress, decimals) => {
        if (window.ethereum) {
            window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20',
                    options: {
                        address: contractAddress,
                        symbol: 'BRZ',
                        decimals: decimals
                    },
                },
            })
            .then((success) => {
                if (success) {
                    console.log('BRZ successfully added to wallet!')
                } else {
                    throw new Error('Something went wrong.')
                }
            })
            .catch(console.error)
        }
    },
    SwitchChainWallet: async (networkData) => {
        if (window.ethereum) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: networkData.chainId }],
                });
            } catch (switchError) {
                // This error code indicates that the chain has not been added to MetaMask.
                if (switchError.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [networkData],
                        });
                    } catch (addError) {
                        // handle "add" error
                    }
                }
            }
        }
    },
    ExistsBlockchain: async (network) => {
        let exists = await BridgeContract.methods.existsBlockchain(network).call();
        return exists;
    },
    IsProviderSelected: () => {
        if (provider) return true;
        return false;
    },
    GetSelectedAddress: () => {
        return selectedAddress;
    },
    ToChecksumAddress: (address) => {
        try {
            return web3.utils.toChecksumAddress(address);
        } catch {
            return address;
        }
    },
    IsValidAddress: (address) => {
        return web3.utils.isAddress(address);
    }
}