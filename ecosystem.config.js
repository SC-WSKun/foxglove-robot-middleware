module.exports = {
  apps : [{
    name: "foxglove-robot-middleware",
    script: "dist/main.js",
    // autorestart: true,
    env: {
      "NODE_ENV": "development",
    }
  }]
}
