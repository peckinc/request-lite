
import { STATUS_CODES } from 'http';

class HttpError extends Error {
    constructor(public statusCode: number, message?: string) {
        super(message || STATUS_CODES[statusCode]);
        this.name = STATUS_CODES[statusCode];
    }
}
export {HttpError};