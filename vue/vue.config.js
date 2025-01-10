const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    host: '0.0.0.0', // Umożliwia nasłuchiwanie na wszystkich interfejsach
    allowedHosts: 'all', // Akceptuje dowolny Host Header
  }
})
