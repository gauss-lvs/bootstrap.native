'use strict'
import node from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import {terser} from 'rollup-plugin-terser'
import * as pkg from "./package.json";

// set headers
const MODULE = process.env.MODULE
const NAME = MODULE === 'scrollspy' ? 'ScrollSpy' : MODULE.charAt(0).toUpperCase() + MODULE.slice(1)

const year = (new Date).getFullYear()
const banner = `/*!
  * Native JavaScript for Bootstrap - ${NAME} v${pkg.version} (${pkg.homepage})
  * Copyright 2015-${year} © ${pkg.author}
  * Licensed under MIT (https://github.com/thednp/bootstrap.native/blob/master/LICENSE)
  */`

const miniBanner = `// Native JavaScript for Bootstrap - ${NAME} v${pkg.version} | ${year} © ${pkg.author} | ${pkg.license}-License`

// set config
const MIN = process.env.MIN === 'true' // true/false|unset
const FORMAT = process.env.FORMAT // umd|iife|esm|cjs

const INPUTFILE = './src/components/'+MODULE+'-native.js'
const OUTPUTFILE = './dist/components/'+MODULE+'-native'+(FORMAT!=='umd'?'.'+FORMAT:'')+(MIN?'.min':'')+'.js'

const OUTPUT = {
  file: OUTPUTFILE,
  format: FORMAT, // or iife
}

const PLUGINS = [
  json(),
  node({mainFields: ['jsnext','module'], dedupe: ['shorter-js','event-listener.js']}),
]

if (MIN){
  PLUGINS.push(terser({output: {preamble: miniBanner}}));
} else {
  OUTPUT.banner = banner;
}

if (FORMAT!=='esm') {
  OUTPUT.name = NAME;
}

export default [
  {
    input: INPUTFILE,
    output: OUTPUT,
    plugins: PLUGINS
  }
]