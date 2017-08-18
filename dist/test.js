"use strict";
var index_1 = require("./index");
var assert = require("assert");
var ServerMock = require("mock-http-server");
describe('@peck/request-lite', function () {
    // Run an HTTP server on localhost:9000 
    var server = new ServerMock({ host: "localhost", port: 9000 });
    var url = "http://localhost:9000";
    beforeEach(function (done) {
        server.start(done);
    });
    afterEach(function (done) {
        server.stop(done);
    });
    it('should return an error if the url does not exist', function (done) {
        server.on({
            method: 'GET',
            path: '/something',
            reply: {
                status: 200,
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ hello: "world" })
            }
        });
        index_1.default({
            url: url,
            method: 'GET',
            json: true
        }).then(function (response) {
            done(new Error("Get / should have thrown an error"));
        }).catch(function (error) {
            done();
        });
    });
    it('should be able to GET', function () {
        server.on({
            method: 'GET',
            path: '/',
            reply: {
                status: 200,
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ hello: "world" })
            }
        });
        return index_1.default({
            url: url,
            method: 'GET'
        });
    });
    it('should be able to GET json', function (done) {
        server.on({
            method: 'GET',
            path: '/',
            reply: {
                status: 200,
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ hello: "world" })
            }
        });
        index_1.default({
            url: url,
            method: 'GET',
            json: true
        }).then(function (response) {
            assert(response.data.hello == "world");
            done();
        }).catch(function (error) {
            done(error);
        });
    });
});
