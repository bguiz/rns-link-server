const express = require('express');
const vhost = require('vhost');
const Web3 = require('web3');
const RNS = require('@rsksmart/rns');

const lruCache = require('./lru-cache-memory.js');

const deploymentType =
  (process.env.DEPLOYMENT_TYPE || '').toLowerCase();

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

async function rnsVhostHandler (req, res) {
  const hostname = req.vhost[0];
  const hostSegments = hostname.split('.').reverse();
  if (hostSegments.length < 1) {
    res.status(400).json({
      error: 'no domain',
    });
  }

  const rskDomain = `${hostname}.rsk`;

  if (!rns.utils.isValidDomain(rskDomain)) {
    res.status(400).json({
      error: 'invalid rns domain',
    });
  }

  let addr;
  let contenthash;

  const cacheResult = lruCache.get(rskDomain);
  if (typeof cacheResult === 'string') {
    contenthash = JSON.parse(cacheResult);
  } else {
    try {
      addr = await rns.addr(rskDomain) || '';
    } catch (ex) {
      console.error(ex);
    }
    try {
      contenthash = await rns.contenthash(rskDomain) || '';
    } catch (ex) {
      console.error(ex);
    }

    if (contenthash) {
      lruCache.set(rskDomain, JSON.stringify(contenthash));
    }
  }

  let redirectUrl;
  if (contenthash) {
    switch (contenthash.protocolType) {
      case 'ipfs':
        redirectUrl = `https://ipfs.io/ipfs/${contenthash.decoded}`;
        break;
        // TODO add support for more protocol types
        // TODO add support for more gateways
      default:
        // do nothing
    }
  }

  if (redirectUrl) {
    res.redirect(302, redirectUrl);
    return;
  }

  res.status(200).json({
    hostname,
    hostSegments,
    rskDomain,
    addr,
    contenthash,
  });
}

// Guard against regex-based DoS attack vectors by limiting max length
// NOTE may opt to add such a guard in load balancer layer

// NOTE DNS allows more characters in domains than RNS does
// Ref: https://en.wikipedia.org/wiki/Percent-encoding#Types_of_URI_characters
// Ref: rns.js implementation of `isValidDomain`

// NOTE RNS allows theoretically unlimited lengths for each "label"
// within a domain, and theoretically unlimited subdomain depth.
// Therefore the full domain, is of unlimited length.
// DNS, however, does specify a maximum length of 253 characters in total,
// and a maximum of 63 characters per subdomain.
// Thus the maxmium length allowed by this server is
// `(253 - '.rsk.link'.length)`, which is `244`
// Ref: https://devblogs.microsoft.com/oldnewthing/20120412-00/?p=7873
// Ref: https://webmasters.stackexchange.com/a/16997/116884
if (deploymentType === 'production' ||
    deploymentType === 'staging') {
  server.use(vhost(/([a-z0-9\.]{2,244})\.rsk\.link/i, rnsVhostHandler));
} else {
  // localhost
  server.use(vhost(/([a-z0-9\.]{2,244})\.localhost/i, rnsVhostHandler));
}

module.exports = server;
