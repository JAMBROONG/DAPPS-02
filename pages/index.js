import Head from "next/head";
import React, { useState, useEffect } from "react";
import { useMoralis, useMoralisWeb3Api } from "react-moralis";

export default function Home() {
  const { isAuthenticated, authenticate, user, logout } = useMoralis();
  const [wallet, setWallet] = useState("");
  const [dropdown1, setDropdown1] = useState(false);
  const [dropdown2, setDropdown2] = useState(false);
  const [balance, setBalanace] = useState('');
  const [network1, setNetwork1] = useState({
    img: "/eth-icon.svg",
    text: "Ethereum Mainnet",
  });
  const [network2, setNetwork2] = useState({
    img: "/binance-logo.svg",
    text: "Binance Smart Chain",
  });
  const Web3Api = useMoralisWeb3Api();

  useEffect(async () => {
    if (isAuthenticated) {
      const walletAddress = await user.get("ethAddress");
      setWallet(
        walletAddress.slice(0, 5) +
          "..." +
          walletAddress.slice(
            walletAddress.length - 5,
            walletAddress.length - 1
          )
      );
      const options = { chain: 'bsc', address: walletAddress, token_addresses: process.env.TOKEN }
      const balances = await Web3Api.account.getTokenBalances(options);
      console.log(balances);
      setBalanace(balances[0].balance / 10 ** 9);

    }
  }, [isAuthenticated]);

  async function loginEvt() {
    await authenticate({
      signingMessage: "Signing in IDM Surprise Program",
    });
  }

  async function logoutEvt() {
    await logout();
    setWallet("Connect Wallet");
    console.log("logged out");
  }

  return (
    <div className="container">
      <Head>
        <title>DAPPS-02</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
        <script src="https://cdn.jsdelivr.net/npm/web3@latest/dist/web3.min.js"></script>
        <script src="https://unpkg.com/moralis/dist/moralis.js"></script>
      </Head>

      <div className="container-fluid">
        <div className="row mt-5 bg-none">
          <div className="col-md-8">
          <img className="img-header" src="/asix.png" />
          </div>
          <div className="col-md-4">
            <div className="d-flex float-right justify-content-md-center">
              {isAuthenticated ? (
                <>
                  <button className="btn-wallet-address">
                    <img className="img-option" src="/metamask-fox.svg" />
                    {wallet}
                  </button>
                  <button
                  onClick={async () => {
                    logoutEvt();
                  }}
                  className="btn-wallet"
                >
                  Disconnect
                </button>
                </>
              ) : (
                <button
                  onClick={async () => {
                    loginEvt();
                  }}
                  className="btn-wallet"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-5 align-items-center justify-content-md-center">
        <div className="col-md-5">
          <div className="card">
            <h5 className="card-header">STARTING CHAIN</h5>
            <div className="card-body">
              <form>
                {
                  isAuthenticated ? (
                    <small className="float-right text-green">
                  <i className="bi-circle-fill"></i> Connected
                </small>
                  ) : (
                    <small className="float-right info">
                  <i className="bi-circle-fill"></i> Not Connected
                </small>
                  )
                }
                
                <div className="form-group">
                  <label htmlFor="network1">Network</label>
                  <div
                    id="network1"
                    className="custDropdown"
                    tabIndex={0}
                    onBlur={() => setDropdown1(false)}
                    onClick={(e) =>
                      dropdown1 == false
                        ? setDropdown1(true)
                        : setDropdown1(false)
                    }
                  >
                    <div className="form form-control">
                      <img className="img-option" src={network1.img} />
                      {network1.text}
                    </div>
                    {dropdown1 && (
                      <div className="dropdown-content">
                        <div
                          className="dropdown-item"
                          onClick={() => {
                            setNetwork1(network2);
                            setNetwork2(network1);
                            setDropdown1(false);
                          }}
                        >
                          <img className="img-option" src={network2.img} />
                          {network2.text}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="send">Amount to Send</label>
                  <div className="input-group form">
                    <div className="input-group-prepend">
                      <span className="input-group-text">
                        <img className="img-asix" src="/asix.png" />
                      </span>
                    </div>
                    <input
                      type="text"
                      name="send"
                      id="send"
                      className="form-control"
                    />
                  </div>
                </div>
              </form>
              <p id="msg_insuff" className="text-red">
                Insufficient balance{" "}
              </p>
              <p id="msg_min" className="text-red">
                Under minimum amount{" "}
              </p>
              <p id="available" className="info">
                Available:{
                  isAuthenticated ? (
                    balance + " ASIX"
                  ) : (
                    " 0 ASIX"
                  )
                }
              </p>
              <p id="min" className="info">
                Min:{" 0 ASIX"}
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-2 text-center mb-3">
          <button
            className="btn-switch"
            onClick={() => {
              setNetwork2(network1);
              setNetwork1(network2);
              setDropdown2(false);
            }}
          >
            <i className="bi-arrow-left-right"></i>
          </button>
        </div>

        <div className="col-md-5">
          <div className="card">
            <h5 className="card-header">DESTINATION CHAIN</h5>
            <div className="card-body">
              <form>
                <div className="form-group">
                  <label htmlFor="network2">Network</label>
                  <div
                    id="network2"
                    className="custDropdown"
                    tabIndex={0}
                    onBlur={() => setDropdown2(false)}
                    onClick={() =>
                      dropdown2 == false
                        ? setDropdown2(true)
                        : setDropdown2(false)
                    }
                  >
                    <div className="form form-control">
                      <img className="img-option" src={network2.img} />
                      {network2.text}
                    </div>
                    {dropdown2 && (
                      <div className="dropdown-content">
                        <div
                          className="dropdown-item"
                          onClick={() => {
                            setNetwork2(network1);
                            setNetwork1(network2);
                            setDropdown2(false);
                          }}
                        >
                          <img className="img-option" src={network1.img} />
                          {network1.text}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="send">Amount to Receive</label>
                  <div className="input-group form">
                    <div className="input-group-prepend">
                      <span className="input-group-text">
                        <img className="img-asix" src="/asix.png" />
                      </span>
                    </div>
                    <input
                      type="text"
                      name="receive"
                      id="receive"
                      className="form-control"
                      disabled
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="row justify-content-md-center mt-2 rock">
        <table className="noborder">
          <tr>
            <td style={{width: "60%"}} className="text-right">Bridge Fee</td>
            <td className="text-center">:</td>
            <td style={{width: "30%"}}>0</td>
          </tr>
          <tr>
            <td className="text-right">Blockchain Fee</td>
            <td className="text-center">:</td>
            <td>0</td>
          </tr>
          <tr>
            <td className="text-right">Total Fee</td>
            <td className="text-center">:</td>
            <td>0</td>
          </tr>
          <tr>
            <td className="text-right">
              Total Cost(Amount to Send + Blockchain Fee)
            </td>
            <td className="text-center">:</td>
            <td>0</td>
          </tr>
          <tr>
            <td className="text-right">Wait Time</td>
            <td className="text-center">:</td>
            <td>~1m30s</td>
          </tr>
        </table>
      </div> */}

      <div className="row justify-content-md-center mt-4">
        <div className="col-md-4 text-center">
          <button className="btn-transfer">Bridge</button>
        </div>
      </div>

      <footer className="mt-5 text-center pb-3">
        <p className="info">ini Footer</p>
      </footer>
    </div>
  );
}
