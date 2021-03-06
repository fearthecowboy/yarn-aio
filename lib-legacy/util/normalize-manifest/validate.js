'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _set;

function _load_set() {
  return _set = _interopRequireDefault(require('babel-runtime/core-js/set'));
}

var _keys;

function _load_keys() {
  return _keys = _interopRequireDefault(require('babel-runtime/core-js/object/keys'));
}

var _slicedToArray2;

function _load_slicedToArray() {
  return _slicedToArray2 = _interopRequireDefault(require('babel-runtime/helpers/slicedToArray'));
}

var _map;

function _load_map() {
  return _map = _interopRequireDefault(require('babel-runtime/core-js/map'));
}

exports.isValidPackageName = isValidPackageName;

exports.default = function (info, isRoot, reporter, warn) {
  if (isRoot) {
    for (const key in (_typos || _load_typos()).default) {
      if (key in info) {
        warn(reporter.lang('manifestPotentialTypo', key, (_typos || _load_typos()).default[key]));
      }
    }
  }

  // validate name
  const name = info.name;

  if (typeof name === 'string') {
    if (isRoot && isBuiltinModule(name)) {
      warn(reporter.lang('manifestBuiltinModule', name));
    }

    // cannot start with a dot
    if (name[0] === '.') {
      throw new (_errors || _load_errors()).MessageError(reporter.lang('manifestNameDot'));
    }

    // cannot contain the following characters
    if (!isValidPackageName(name)) {
      throw new (_errors || _load_errors()).MessageError(reporter.lang('manifestNameIllegalChars'));
    }

    // cannot equal node_modules or favicon.ico
    const lower = name.toLowerCase();
    if (lower === 'node_modules' || lower === 'favicon.ico') {
      throw new (_errors || _load_errors()).MessageError(reporter.lang('manifestNameBlacklisted'));
    }
  }

  // validate license
  if (isRoot && !info.private) {
    if (typeof info.license === 'string') {
      const license = info.license.replace(/\*$/g, '');
      if (!(0, (_util || _load_util()).isValidLicense)(license)) {
        warn(reporter.lang('manifestLicenseInvalid'));
      }
    } else {
      warn(reporter.lang('manifestLicenseNone'));
    }
  }

  // validate strings
  for (const key of strings) {
    const val = info[key];
    if (val && typeof val !== 'string') {
      throw new (_errors || _load_errors()).MessageError(reporter.lang('manifestStringExpected', key));
    }
  }

  cleanDependencies(info, isRoot, reporter, warn);
};

exports.cleanDependencies = cleanDependencies;

var _errors;

function _load_errors() {
  return _errors = require('../../errors.js');
}

var _util;

function _load_util() {
  return _util = require('./util.js');
}

var _typos;

function _load_typos() {
  return _typos = _interopRequireDefault(require('./typos.js'));
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const isBuiltinModule = require('is-builtin-module');

const strings = ['name', 'version'];

const dependencyKeys = [
// npm registry will include optionalDependencies in dependencies and we'll want to dedupe them from the
// other fields first
'optionalDependencies',

// it's seemingly common to include a dependency in dependencies and devDependencies of the same name but
// different ranges, this can cause a lot of issues with our determinism and the behaviour of npm is
// currently unspecified.
'dependencies', 'devDependencies'];

function isValidName(name) {
  return !name.match(/[\/@\s\+%:]/) && encodeURIComponent(name) === name;
}

function isValidScopedName(name) {
  if (name[0] !== '@') {
    return false;
  }

  const parts = name.slice(1).split('/');
  return parts.length === 2 && isValidName(parts[0]) && isValidName(parts[1]);
}

function isValidPackageName(name) {
  return isValidName(name) || isValidScopedName(name);
}

function cleanDependencies(info, isRoot, reporter, warn) {
  // get dependency objects
  const depTypes = [];
  for (const type of dependencyKeys) {
    const deps = info[type];
    if (!deps || typeof deps !== 'object') {
      continue;
    }
    depTypes.push([type, deps]);
  }

  // aggregate all non-trivial deps (not '' or '*')
  const nonTrivialDeps = new (_map || _load_map()).default();
  for (const _ref of depTypes) {
    var _ref2 = (0, (_slicedToArray2 || _load_slicedToArray()).default)(_ref, 2);

    const type = _ref2[0];
    const deps = _ref2[1];

    for (const name of (0, (_keys || _load_keys()).default)(deps)) {
      const version = deps[name];
      if (!nonTrivialDeps.has(name) && version && version !== '*') {
        nonTrivialDeps.set(name, { type: type, version: version });
      }
    }
  }

  // overwrite first dep of package with non-trivial version, remove the rest
  const setDeps = new (_set || _load_set()).default();
  for (const _ref3 of depTypes) {
    var _ref4 = (0, (_slicedToArray2 || _load_slicedToArray()).default)(_ref3, 2);

    const type = _ref4[0];
    const deps = _ref4[1];

    for (const name of (0, (_keys || _load_keys()).default)(deps)) {
      let version = deps[name];

      const dep = nonTrivialDeps.get(name);
      if (dep) {
        if (version && version !== '*' && version !== dep.version && isRoot) {
          // only throw a warning when at the root
          warn(reporter.lang('manifestDependencyCollision', dep.type, name, dep.version, type, version));
        }
        version = dep.version;
      }

      if (setDeps.has(name)) {
        delete deps[name];
      } else {
        deps[name] = version;
        setDeps.add(name);
      }
    }
  }
}