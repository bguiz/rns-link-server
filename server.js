const express = require('express');
const vhost = require('vhost');

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
