'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _keys;

function _load_keys() {
  return _keys = _interopRequireDefault(require('babel-runtime/core-js/object/keys'));
}

var _stringify2;

function _load_stringify() {
  return _stringify2 = _interopRequireDefault(require('babel-runtime/core-js/json/stringify'));
}

exports.default = stringify;

var _misc;

function _load_misc() {
  return _misc = require('../util/misc.js');
}

var _constants;

function _load_constants() {
  return _constants = require('../constants.js');
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const YARN_VERSION = require('../../package.json').version;
const NODE_VERSION = process.version;

function shouldWrapKey(str) {
  return str.indexOf('true') === 0 || str.indexOf('false') === 0 || /[:\s\n\\",\[\]]/g.test(str) || /^[0-9]/g.test(str) || !/^[a-zA-Z]/g.test(str);
}

function maybeWrap(str) {
  if (typeof str === 'boolean' || typeof str === 'number' || shouldWrapKey(str)) {
    return (0, (_stringify2 || _load_stringify()).default)(str);
  } else {
    return str;
  }
}

const priorities = {
  name: 1,
  version: 2,
  uid: 3,
  resolved: 4,
  registry: 5,
  dependencies: 6
};

function priorityThenAlphaSort(a, b) {
  if (priorities[a] || priorities[b]) {
    return (priorities[a] || 100) > (priorities[b] || 100) ? 1 : -1;
  } else {
    return (0, (_misc || _load_misc()).sortAlpha)(a, b);
  }
}

function _stringify(obj, options) {
  if (typeof obj !== 'object') {
    throw new TypeError();
  }

  const indent = options.indent;
  const lines = [];

  // Sorting order needs to be consistent between runs, we run native sort by name because there are no
  // problems with it being unstable because there are no to keys the same
  // However priorities can be duplicated and native sort can shuffle things from run to run
  const keys = (0, (_keys || _load_keys()).default)(obj).sort(priorityThenAlphaSort);

  let addedKeys = [];

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const val = obj[key];
    if (val == null || addedKeys.indexOf(key) >= 0) {
      continue;
    }

    //
    const valKeys = [key];

    // get all keys that have the same value equality, we only want this for objects
    if (typeof val === 'object') {
      for (let j = i + 1; j < keys.length; j++) {
        const key = keys[j];
        if (val === obj[key]) {
          valKeys.push(key);
        }
      }
    }

    //
    const keyLine = valKeys.sort((_misc || _load_misc()).sortAlpha).map(maybeWrap).join(', ');

    if (typeof val === 'string' || typeof val === 'boolean' || typeof val === 'number') {
      lines.push(`${keyLine} ${maybeWrap(val)}`);
    } else if (typeof val === 'object') {
      lines.push(`${keyLine}:\n${_stringify(val, { indent: indent + '  ' })}` + (options.topLevel ? '\n' : ''));
    } else {
      throw new TypeError();
    }

    addedKeys = addedKeys.concat(valKeys);
  }

  return indent + lines.join(`\n${indent}`);
}

function stringify(obj, noHeader, enableVersions) {
  const val = _stringify(obj, {
    indent: '',
    topLevel: true
  });
  if (noHeader) {
    return val;
  }

  const lines = [];
  lines.push('# THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.');
  lines.push(`# yarn lockfile v${(_constants || _load_constants()).LOCKFILE_VERSION}`);
  if (enableVersions) {
    lines.push(`# yarn v${YARN_VERSION}`);
    lines.push(`# node ${NODE_VERSION}`);
  }
  lines.push('\n');
  lines.push(val);

  return lines.join('\n');
}