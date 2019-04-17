import * as url from 'url';
import * as http from 'http';
import * as https from 'https';
import {HttpError} from './http-error';

export default function request(options: {
    url: string;
    method: string;
    headers?: any;
    json?: boolean;
    body?: any;
    timeout?: number;
    retries?: number;
}): Promise<{ statusCode: number, data: any }> {

    let timeout: number = 2.4 * 1000;
    let retries: number = 3;

    if (typeof options.timeout == 'undefined') {
        options.timeout = timeout;
    }
    if (typeof options.retries == 'undefined') {
        options.retries = retries;
    }

    var promise = new Promise<{ statusCode: number, data: any }>(

        function (resolve, reject) {
            requestImpl(options, 0, (error: HttpError, response: { statusCode: number, data: any }) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(response);
                }
            });
        });


    return promise;
}

function requestImpl(roptions: {
    url: string;
    method: string;
    headers?: any;
    json?: boolean;
    body?: any;
    timeout?: number;
    retries?: number;
}, tries: number, callback: (error: HttpError, response: { statusCode: number, data: any }) => void) {

    let retryErrors = ['ECONNRESET', 'ETIMEDOUT', 'ESOCKETTIMEDOUT'];

    //TODO check for error in url and return Error object
    let urll = url.parse(roptions.url);
    if (roptions.json) {
        if (!roptions.headers) {
            roptions.headers = {};
        }
        roptions.headers['Content-Type'] = 'application/json';
    }
    let options = {
        hostname: urll.hostname,
        path: urll.path,
        port: urll.port,
        headers: roptions.headers,
        method:roptions.method
    }

    let protocol: any = http;
    if (urll.protocol == 'https:') {
        protocol = https;
    }

    var str = '';
    var req = protocol.request(options, (response) => {

        //console.log(`${roptions.url} STATUS: ${response.statusCode}`);

        if ((response.statusCode < 200) || (response.statusCode > 299)) {
            let message = `status code ${response.statusCode} while connecting to ${roptions.url}`;
            
            let err:HttpError = new HttpError(response.statusCode, message);
            //console.log(err.message);
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

    req.on('error', (e) => {
        //console.log(`error connecting to ${roptions.url}`);
        if (retryErrors.indexOf(e.code) != -1 && roptions.retries > tries) {
            let nextTry = tries + 1;

            //console.log(` retrying connection to ${roptions.url} number ${nextTry}`);
            requestImpl(roptions, nextTry, callback);
        }
        else {
            let err: HttpError = new HttpError(e.code,`${roptions.url} responded with ${e.code}`);
            callback(err, null);
        }
    });

    if ((roptions.method == 'POST') || (roptions.method == 'PUT')) {
        if (roptions.json) {
            req.write(JSON.stringify(roptions.body));
        } else {
            req.write(roptions.body);
        }
    }

    req.end();

}