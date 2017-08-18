# request-lite

*Zero-dependency utility for making http requests and returning ES6 promises*

* Written in Typescript
* Zero dependencies
* Returns an ES6 Promise

## Usage

Usage is loosly modeled after the excellent [request](https://www.npmjs.com/package/request) package, but with fewer features in exchange for zero dependencies.

```typescript
import request from '@peck/request-lite'

let options = {
    url: 'http://google.com',
    method: 'GET',
}
request(options).then((response) => {
    console.log('success: ',response);
}).catch((error) => {
    console.error('This should not have failed! ', error);
});
```