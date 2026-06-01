import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { ModuleFederationPlugin } from "@module-federation/enhanced/webpack";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const deps = require("./package.json").dependencies;

export default {
  entry: "./src/index.ts",
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
    publicPath: "http://localhost:3001/",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: "ts-loader",
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "@": path.join(__dirname, "src"),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),
    new ModuleFederationPlugin({
      name: "products",
      filename: "remoteEntry.js",
      exposes: {
        "./App": "./src/App",
      },
      remotes: {
        categoryPicker:
          "categoryPicker@http://localhost:3003/remoteEntry.js",
      },
      shared: {
        react: { singleton: true, requiredVersion: deps.react },
        "react-dom": { singleton: true, requiredVersion: deps["react-dom"] },
        // Singleton event bus — without this each MFE bundles its own mitt()
        // instance and events never cross the federation boundary.
        "@admin/event-bus": { singleton: true, requiredVersion: false },
        // Singleton router — products reads/writes ?category/?q/?page via the
        // host's router. As a remote it uses the shell's <BrowserRouter>;
        // standalone it provides its own (see bootstrap.tsx). The core
        // `react-router` (Router contexts) must be a singleton too.
        "react-router-dom": { singleton: true, requiredVersion: deps["react-router-dom"] },
        "react-router": { singleton: true, requiredVersion: false },
      },
      dts: false,
    }),
  ],
  devServer: {
    port: 3001,
    hot: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    historyApiFallback: false,
  },
};
