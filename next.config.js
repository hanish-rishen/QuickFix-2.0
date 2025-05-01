/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use the default SWC compiler
  swcMinify: true,

  // Configure images domains for external sources
  images: {
    domains: [
      "firebasestorage.googleapis.com",
      "lh3.googleusercontent.com",
      "images.pexels.com",
    ],
  },

  // Custom webpack configuration to handle specific dependencies
  webpack: (config, { isServer, dev }) => {
    // Fix for Firebase storage and undici module with private class fields
    config.module.rules.push({
      test: /\.m?js$/,
      // Capture undici module regardless of where it's located in node_modules tree
      include: (modulePath) => {
        return (
          /node_modules[\\/]@firebase[\\/]storage/.test(modulePath) ||
          /node_modules[\\/]firebase[\\/]storage/.test(modulePath) ||
          /node_modules[\\/]undici/.test(modulePath) ||
          // This is the key addition - specifically target the nested undici package
          /node_modules[\\/]@firebase[\\/]storage[\\/]node_modules[\\/]undici/.test(
            modulePath
          )
        );
      },
      use: {
        loader: "babel-loader",
        options: {
          // Use babel to transform the code with class features support
          presets: [["@babel/preset-env", { targets: "defaults" }]],
          plugins: [
            // Use the 'transform' versions which are installed
            "@babel/plugin-transform-class-properties",
            "@babel/plugin-transform-private-methods",
            "@babel/plugin-transform-private-property-in-object",
          ],
          babelrc: false,
          configFile: false,
        },
      },
    });

    return config;
  },
};

module.exports = nextConfig;
