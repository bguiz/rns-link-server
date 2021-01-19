const express = require('express');
const vhost = require('vhost');
const Web3 = require('web3');
const RNS = require('@rsksmart/rns');

const rpcUrl = process.env.RPC_URL ||
  'https://public-node.rsk.co/';
// Ref: https://developers.rsk.co/rif/rns/architecture/registry/
const rnsRegistryAddress = process.env.RNS_REGISTRY_ADDRESS ||
  '0xcb868aeabd31e2b66f74e9a55cf064abb31a4ad5';
// Ref: https://developers.rsk.co/rif/rns/architecture/definitive-resolver/
const rnsResolverAddress = process.env.RNS_RESOLVER_ADDRESS ||
  '0xD87f8121D44F3717d4bAdC50b24E50044f86D64B';
const rnsChainId = process.env.RNS_CHAIN_ID ||
  31;

// Ref: https://developers.rsk.co/rif/rns/libs/javascript/Advanced-usage/
const web3 = new Web3(rpcUrl);
const rns = new RNS(web3);
// TODO figure out if custom initialisation is necessary
// const rns = new RNS(
//   web3,
//   {
//     contractAddresses: {
//       // registry: rnsRegistryAddress.toLowerCase(),
//       // resolver: rnsResolverAddress.toLowerCase(),
//     },
//     networkId: rnsChainId,
//   }
// );

const server = express();

function rnsVhostHandler (req, res) {
  const hostname = req.vhost[0];
  const hostSegments = hostname.split('.').reverse();
  if (hostSegments.length < 1) {
    res.status(400).json({
      error: 'no domain',
    });
  }
  const numEmptyHostSegments = hostSegments.filter(
    (segment) => (typeof segment !== 'string' || segment.length < 1),
  ).length;
  if (numEmptyHostSegments > 0) {
    res.status(400).json({
      error: 'empty segments in domain',
    });
  }
  res.status(200).json({
    hostname,
    hostSegments,
  });
}

// TODO guard against regex-based DoS attack vectors
server.use(vhost(/([a-z0-9\.]+)\.localhost/ig, rnsVhostHandler));
server.use(vhost(/([a-z0-9\.]+)\.rsk\.link/ig, rnsVhostHandler));

module.exports = server;
