"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var url = require("url");
var http = require("http");
var https = require("https");
var http_error_1 = require("./http-error");
function request(options) {
    var timeout = 2.4 * 1000;
    var retries = 3;
    if (typeof options.timeout == 'undefined') {
        options.timeout = timeout;
    }
    if (typeof options.retries == 'undefined') {
        options.retries = retries;
    }
    var promise = new Promise(function (resolve, reject) {
        requestImpl(options, 0, function (error, response) {
            if (error) {
                reject(error);
            }
            else {
                resolve(response);
            }
        });
    });
    return promise;
}
exports.default = request;
function requestImpl(roptions, tries, callback) {
    var retryErrors = ['ECONNRESET', 'ETIMEDOUT', 'ESOCKETTIMEDOUT'];
    //TODO check for error in url and return Error object
    var urll = url.parse(roptions.url);
    if (roptions.json) {
        if (!roptions.headers) {
            roptions.headers = {};
        }
        roptions.headers['Content-Type'] = 'application/json';
    }
    var options = {
        hostname: urll.hostname,
        path: urll.path,
        port: urll.port,
        headers: roptions.headers,
        method: roptions.method
    };
    var protocol = http;
    if (urll.protocol == 'https:') {
        protocol = https;
    }
    var str = '';
    var req = protocol.request(options, function (response) {
        //console.log(`${roptions.url} STATUS: ${response.statusCode}`);
        if ((response.statusCode < 200) || (response.statusCode > 299)) {
            var message = "status code " + response.statusCode + " while connecting to " + roptions.url;
            var err = new http_error_1.HttpError(response.statusCode, message);
            if ((response.statusCode > 299) && (response.statusCode < 400)) {
                if (response.headers && response.headers.location) {
                    err.location = response.headers.location;
                }
            }
            callback(err, null);
            return;
        }
        response.on('data', function (chunk) {
            str += chunk;
        });
        response.on('end', function () {
            if (roptions.json && str) {
                str = JSON.parse(str);
            }
            callback(null, {
                statusCode: response.statusCode,
                data: str
            });
        });
    });
    req.on('socket', function (socket) {
        socket.setTimeout(roptions.timeout);
        socket.on('timeout', function () {
            //console.log(`aborting connection to ${roptions.url} after timeout if ${roptions.timeout} ms`);
            req.abort();
        });
    });
    req.on('error', function (e) {
        //console.log(`error connecting to ${roptions.url}`);
        if (retryErrors.indexOf(e.code) != -1 && roptions.retries > tries) {
            var nextTry = tries + 1;
            //console.log(` retrying connection to ${roptions.url} number ${nextTry}`);
            requestImpl(roptions, nextTry, callback);
        }
        else {
            var err = new http_error_1.HttpError(e.code, roptions.url + " responded with " + e.code);
            callback(err, null);
        }
    });
    if ((roptions.method == 'POST') || (roptions.method == 'PUT')) {
        if (roptions.json) {
            req.write(JSON.stringify(roptions.body));
        }
        else {
            req.write(roptions.body);
        }
    }
    req.end();
}
