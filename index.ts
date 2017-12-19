import {RestypedBase, RestypedRoute} from 'restyped'
import * as AwsLambda from 'aws-lambda'
import * as Route from 'route-parser'
import Request from './request'
import Response from './response'

export interface TypedRequest<T extends RestypedRoute> extends Request {
  body: T['body']
  params: T['params']
  query: T['query']
}

type HTTPMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'HEAD'
  | 'DELETE'
  | 'OPTIONS'

export default function AsyncRouter<APIDef extends RestypedBase>(
  event: AwsLambda.APIGatewayEvent,
  context: AwsLambda.APIGatewayEventRequestContext,
  callback: AwsLambda.ProxyCallback,
  proxyName: string = 'proxy'
) {
  let routeMatched: boolean = false
  const createAsyncRoute = function<
    Path extends keyof APIDef,
    Method extends HTTPMethod
  >(
    path: Path,
    method: Method,
    handler: (
      req: TypedRequest<APIDef[Path][Method]>,
      res: Response
    ) => Promise<APIDef[Path][Method]['response'] | undefined>
  ) {
    console.log('path: ', path, event.path)
    const route = new Route(path)
    const routeParams: {[name: string]: string} | false = route.match(
      event.path
    )

    console.log('routeParams: ', routeParams)

    if (routeMatched || !routeParams || event.httpMethod !== method) {
      return
    }

    routeMatched = true
    const req = new Request(event, context, routeParams)
    const res = new Response(callback)

    handler(req, res)
      .then(result => res.send(result))
      .catch(err => res.error(err))
  }

  return {
    route: createAsyncRoute,
    get: function<Path extends keyof APIDef>(
      path: Path,
      handler: (
        req: TypedRequest<APIDef[Path]['GET']>,
        res: Response
      ) => Promise<APIDef[Path]['GET']['response']>
    ) {
      return createAsyncRoute(path, 'GET', handler)
    },
    post: function<Path extends keyof APIDef>(
      path: Path,
      handler: (
        req: TypedRequest<APIDef[Path]['POST']>,
        res: Response
      ) => Promise<APIDef[Path]['POST']['response']>
    ) {
      return createAsyncRoute(path, 'POST', handler)
    },
    put: function<Path extends keyof APIDef>(
      path: Path,
      handler: (
        req: TypedRequest<APIDef[Path]['PUT']>,
        res: Response
      ) => Promise<APIDef[Path]['PUT']['response']>
    ) {
      return createAsyncRoute(path, 'PUT', handler)
    },
    delete: function<Path extends keyof APIDef>(
      path: Path,
      handler: (
        req: TypedRequest<APIDef[Path]['DELETE']>,
        res: Response
      ) => Promise<APIDef[Path]['DELETE']['response']>
    ) {
      return createAsyncRoute(path, 'DELETE', handler)
    },
    patch: function<Path extends keyof APIDef>(
      path: Path,
      handler: (
        req: TypedRequest<APIDef[Path]['PATCH']>,
        res: Response
      ) => Promise<APIDef[Path]['PATCH']['response']>
    ) {
      return createAsyncRoute(path, 'PATCH', handler)
    },
    options: function<Path extends keyof APIDef>(
      path: Path,
      handler: (
        req: TypedRequest<APIDef[Path]['OPTIONS']>,
        res: Response
      ) => Promise<APIDef[Path]['OPTIONS']['response']>
    ) {
      return createAsyncRoute(path, 'OPTIONS', handler)
    },
    head: function<Path extends keyof APIDef>(
      path: Path,
      handler: (
        req: TypedRequest<APIDef[Path]['HEAD']>,
        res: Response
      ) => Promise<APIDef[Path]['HEAD']['response']>
    ) {
      return createAsyncRoute(path, 'HEAD', handler)
    },
    noMatch: function() {
      if (!routeMatched) {
        const res = new Response(callback)
        res.status(404).send()
      }
    }
  }
}
