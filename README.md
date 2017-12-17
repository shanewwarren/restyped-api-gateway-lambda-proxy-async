# RESTyped API Gateway Lambda Proxy Wrapper

API Gateway Lambda Proxy route wrappers for declaring type-safe APIs with [RESTyped](https://github.com/rawrmaan/restyped). Also supports `async` route functions.

## WIP

Probably not ready to use yet.

## Usage

`npm install restyped-api-gateway-lambda-proxy-async`

It's just like normal express, except you'll need to provide a RESTyped API definition file for the API you want to use, and return a Promise with your response value in order to activate type-checking.

```typescript
import { APIGatewayEvent, APIGatewayEventRequestContext, ProxyCallback } from '@types/aws-lambda'
import RestypedRouter from 'restyped-api-gateway-lambda-proxy-async'
import {MyAPI} from './MyAPI' // <- Your API's RESTyped definition

// Lambda function body.
export function(
  event: APIGatewayEvent,
  context: APIGatewayEventRequestContext,
  callback: ProxyCallback) {

const router = RestypedRouter<MyAPI>(event, context, callback);

// You'll get a compile error if you declare a route that doesn't exist in your API definition.
router.post('/posts', async (req, res) => {
  // Error if you try to access body properties that don't exist in your API definition.
  const {title, author, body} = req.body
  //     ^ string  ^ string  ^ number

  const postId = await Post.create(title, author, body)

  // Error if you don't return the response type defined in your API definition.
  return res({
    body: postId
  });

}
```

## Error handling and status codes

### Error handling

You can `throw` from inside your `async` function and your thrown error will be passed to `next(err)`.

### Status codes

Use express directly to send responses with status codes. Don't forget to `return` after you `res.send()`.

```typescript
router.get('/posts/{id}', async (req, res) => {
  const {id} = req.params
  const post = await Post.get(id)

  if (!post) {
    return res({
      statusCode: 404
    })
  }

  return res({
    body: Post
  })
})
```
