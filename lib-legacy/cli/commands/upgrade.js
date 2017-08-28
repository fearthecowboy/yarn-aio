'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.run = exports.requireLockfile = undefined;

var _keys;

function _load_keys() {
  return _keys = _interopRequireDefault(require('babel-runtime/core-js/object/keys'));
}

var _assign;

function _load_assign() {
  return _assign = _interopRequireDefault(require('babel-runtime/core-js/object/assign'));
}

var _asyncToGenerator2;

function _load_asyncToGenerator() {
  return _asyncToGenerator2 = _interopRequireDefault(require('babel-runtime/helpers/asyncToGenerator'));
}

let run = exports.run = (() => {
  var _ref = (0, (_asyncToGenerator2 || _load_asyncToGenerator()).default)(function* (config, reporter, flags, args) {
    const useLockfile = args.length || flags.latest;
    const lockfile = useLockfile ? yield (_wrapper || _load_wrapper()).default.fromDirectory(config.lockfileFolder, reporter) : new (_wrapper || _load_wrapper()).default();

    var _ref2 = (yield config.readRootManifest()) || {};

    const dependencies = _ref2.dependencies,
          devDependencies = _ref2.devDependencies,
          optionalDependencies = _ref2.optionalDependencies,
          peerDependencies = _ref2.peerDependencies;

    const allDependencies = (0, (_assign || _load_assign()).default)({}, peerDependencies, optionalDependencies, devDependencies, dependencies);
    let addArgs = [];

    if (flags.scope) {
      if (!flags.scope.startsWith('@')) {
        flags.scope = '@' + flags.scope;
      }

      if (!flags.scope.endsWith('/')) {
        flags.scope += '/';
      }

      if (/^@[a-zA-Z0-9-][a-zA-Z0-9_.-]*\/$/g.test(flags.scope)) {
        addArgs = (0, (_keys || _load_keys()).default)(allDependencies).filter(function (dependency) {
          return dependency.startsWith(flags.scope);
        }).map(function (dependency) {
          return getDependency(allDependencies, dependency);
        });
      } else {
        throw new (_errors || _load_errors()).MessageError(reporter.lang('scopeNotValid'));
      }
    } else if (flags.latest && args.length === 0) {
      addArgs = (0, (_keys || _load_keys()).default)(allDependencies).map(function (dependency) {
        return getDependency(allDependencies, dependency);
      });
    } else {
      addArgs = args.map(function (dependency) {
        return getDependency(allDependencies, dependency);
      });
    }

    const addFlags = (0, (_assign || _load_assign()).default)({}, flags, { force: true });

    const install = new (_add || _load_add()).Add(addArgs, addFlags, config, reporter, lockfile);
    yield install.init();
  });

  return function run(_x, _x2, _x3, _x4) {
    return _ref.apply(this, arguments);
  };
})();

exports.setFlags = setFlags;
exports.hasWrapper = hasWrapper;

var _add;

function _load_add() {
  return _add = require('./add.js');
}

var _wrapper;

function _load_wrapper() {
  return _wrapper = _interopRequireDefault(require('../../lockfile/wrapper.js'));
}

var _packageRequest;

function _load_packageRequest() {
  return _packageRequest = _interopRequireDefault(require('../../package-request.js'));
}

var _errors;

function _load_errors() {
  return _errors = require('../../errors.js');
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function setFlags(commander) {
  // TODO: support some flags that install command has
  commander.usage('upgrade [flags]');
  commander.option('-S, --scope <scope>', 'upgrade packages under the specified scope');
  commander.option('--latest', 'upgrade packages to the latest version, ignoring version ranges in package.json');
}

function hasWrapper(commander, args) {
  return true;
}

const requireLockfile = exports.requireLockfile = true;

function getDependency(allDependencies, dependency) {
  const remoteSource = allDependencies[dependency];

  if (remoteSource && (_packageRequest || _load_packageRequest()).default.getExoticResolver(remoteSource)) {
    return remoteSource;
  }

  return dependency;
}