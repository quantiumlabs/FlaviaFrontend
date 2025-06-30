module.exports = {
  apps: [
    {
      name: "flavia-frontend",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
