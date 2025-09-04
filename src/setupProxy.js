const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/frost",
    createProxyMiddleware({
      target: "https://frost.met.no",
      changeOrigin: true,
      pathRewrite: { "^/frost": "" },
    })
  );
};
