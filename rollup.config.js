const path = require('path')
const nodeResolve = require('rollup-plugin-node-resolve')
const sourceMaps = require('rollup-plugin-sourcemaps')
const useBabel = require('rollup-plugin-babel')
const typescript = require('rollup-plugin-typescript2')
const babelConfig = require('./babel.config')
const packageJson = require('./package.json')

const input = path.resolve(__dirname, packageJson.esnext)

// Plugins
const resolve = (overrides = {}) => {
  return nodeResolve({
    extensions: ['.ts'],
    ...overrides,
  })
}
const babel = (overrides = {}) => {
  return useBabel({
    ...babelConfig,
    extensions: ['.ts'],
    ...overrides,
  })
}

// Build targets
const buildCjs = {
  input,
  output: {
    file: path.resolve(__dirname, packageJson.main),
    format: 'cjs',
    exports: 'named',
    sourcemap: true,
  },
  plugins: [resolve(), typescript(), sourceMaps()],
}

const buildUmd = {
  input,
  output: {
    file: path.resolve(__dirname, packageJson['umd:main']),
    format: 'umd',
    name: 'ReachSchema',
    exports: 'named',
    sourcemap: true,
  },
  plugins: [resolve(), typescript(), babel(), sourceMaps()],
}

const buildEsm = {
  input,
  output: {
    file: path.resolve(__dirname, packageJson.module),
    format: 'esm',
    sourcemap: true,
  },
  plugins: [resolve(), typescript(), babel(), sourceMaps()],
}

module.exports = [buildCjs, buildUmd, buildEsm]
