module.exports = {
  port: process.env.PORT || 3000,
  staticRoute: "/app", // The URL portion
  staticPath: "app", // The local path on disk
  distDir: "dist"
};
