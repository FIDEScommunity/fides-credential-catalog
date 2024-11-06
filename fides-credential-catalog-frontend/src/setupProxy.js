const {createProxyMiddleware} = require('http-proxy-middleware');

module.exports = function (app) {
    const options = {
        target: 'http://localhost:8088',
        changeOrigin: true,

        onProxyReq(proxyReq, req, res) {
            //proxyReq.setHeader('x-tenant-id', '3c1a2d9c-b5ee-4107-ad9e-0a78b9e30e37');
            //proxyReq.setHeader('x-tenant-id', '3f1a660d-5e49-465c-8d65-343846d3bc9c');
            proxyReq.setHeader('x-tenant-id', '9d019f49-573d-4874-a479-dddf0bcdecfe');
            proxyReq.setHeader('x-tenant-key', '9d019f49-573d-4874-a479-dddf0bcdecfe');
            // proxyReq.setHeader('x-tenant-key', '0886cb71-eed0-4431-922c-828bd61159dd');
            // proxyReq.setHeader('x-app-external-key', '35e7ee44-640f-4400-ac32-8569bfd0d059'); // satisfeed
            //proxyReq.setHeader('x-app-external-key', '2dc5cb0d-9cf5-4f32-84e7-75defea6028b'); // servicemelder
            // if (req.headers.host.endsWith(":5000"))
            // {
            //     proxyReq.setHeader('x-tenant-key', '0886cb71-eed0-4431-922c-828bd61159dd');
            // } else {
            //     proxyReq.setHeader('x-tenant-id', 'fdbc06f9-ae9b-40e4-b951-8d8388b50d2f');
            //     console.log("5001 rabo ", req.method, req.url)
            // }
        }
    };

    app.use(
        '/api',
        createProxyMiddleware(options)
    );
};
