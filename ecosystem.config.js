module.exports = {
  apps: [
    {
      name: "TEST_APP",
      script: "index.js",
      exec_mode: "cluster",
      instances: 4,
      env: {
        COMMON_VARIABLE: "true",
      },
    },
  ],
}
