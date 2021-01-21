# rsk.link server

Redirects visitors to the appropriate decentralised content
based on the RNS domain.

To view `subdomain.example.rsk`,
enter `subdomain.example.rsk.link` in your browser,
and you will be redirected to `ipfs.io/ipfs/${IPFS_HASH}`.
Note that the specified domain or subdomain needs to be registered using RNS, and have a its `contenthash` set.

## Usage

For development with auto-reload:

```bash
npm run dev
```

For deployment:

```bash
node run.js
```

When this server is running on `localhost`,
you may test it using `curl`:

```bash
curl -X GET http://example.localhost:7111
```

If the domain is registered and has its `contenthash` set,
you should see a redirect result:

```test
Found. Redirecting to https://ipfs.io/ipfs/${IPFS_HASH}
```

Otherwise, you should simply see information about the domain:

```json
{"hostname":"example","hostSegments":["example"],"rskDomain":"example.rsk","addr":"0x${RSK_ACCOUNT_ADDRESS}"}
```

## Author

[Brendan Graetz](http://bguiz.com)

## Licence

GPL-3.0
