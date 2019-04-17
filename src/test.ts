import request from './index'
import * as assert from 'assert';
import { HttpError } from './http-error';

let ServerMock = require("mock-http-server");

describe('@peck/request-lite', function () {

    // Run an HTTP server on localhost:9000 
    let server = new ServerMock({ host: "localhost", port: 9000 });
    let url = "http://localhost:9000";

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

        request({
            url: url,
            method: 'GET',
            json: true
        }).then((response) => {
            done.fail(new Error("Get / should have thrown an error"));
        }).catch((error:HttpError) => {
            assert(error.statusCode == 404);
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

        return request({
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

        request({
            url: url,
            method: 'GET',
            json: true
        }).then((response) => {
            assert(response.data.hello == "world");
            done();
        }).catch((error) => {
            done.fail(error);
        });
        
    });

});