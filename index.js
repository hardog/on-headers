/*!
 * on-headers
 * Copyright(c) 2014 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Reference to Array slice.
 */

var slice = Array.prototype.slice

/**
 * Execute a listener when a response is about to write headers.
 *
 * @param {Object} res
 * @return {Function} listener
 * @api public
 */

module.exports = function onHeaders(res, listener) {
  if (!res) {
    throw new TypeError('argument res is required')
  }

  if (typeof listener !== 'function') {
    throw new TypeError('argument listener must be a function')
  }

  // res.writeHead 原始Node.js request对象的方法
  // res.writeHead 在调用方法res.end结束前调用, 首次响应客户端的时间
  res.writeHead = createWriteHead(res.writeHead, listener)
}

function createWriteHead(prevWriteHead, listener) {
  var fired = false;

  // return function with core name and argument list
  return function writeHead(statusCode) {
    // set headers from arguments
    var args = setWriteHeadHeaders.apply(this, arguments);

    // fire listener
    if (!fired) {
      fired = true
      // this代表 response
      listener.call(this)

      // pass-along an updated status code
      // 将状态码更新
      if (typeof args[0] === 'number' && this.statusCode !== args[0]) {
        args[0] = this.statusCode
        args.length = 1
      }
    }

    prevWriteHead.apply(this, args);
  }
}

function setWriteHeadHeaders(statusCode) {
  var length = arguments.length

  // headerIndex表示当前参数中的第几个是设置响应头的位置
  var headerIndex = length > 1 && typeof arguments[1] === 'string'
    ? 2
    : 1

  // headers表示响应头
  var headers = length >= headerIndex + 1
    ? arguments[headerIndex]
    : undefined

  this.statusCode = statusCode

  // the following block is from node.js core
  // 响应头是否形如: [['content-type', 'urlencode..'], []]
  if (Array.isArray(headers)) {
    // handle array case
    for (var i = 0, len = headers.length; i < len; ++i) {
      this.setHeader(headers[i][0], headers[i][1])
    }
  } else if (headers) {
    // 响应头形如{'content-type': 'application/json', attr2: value2, ...}
    // handle object case
    var keys = Object.keys(headers)
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i]
      if (k) this.setHeader(k, headers[k])
    }
  }

  // copy leading arguments
  // 返回除header外的参数
  var args = new Array(Math.min(length, headerIndex))
  for (var i = 0; i < args.length; i++) {
    args[i] = arguments[i]
  }

  return args
}
