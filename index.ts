import {RestypedBase, RestypedRoute} from 'restyped'
import * as AwsLambda from 'aws-lambda'
import * as Route from 'route-parser'
import Request from './request'
import Response from './response'

export {Response, Request}

export interface TypedRequest<T extends RestypedRoute> extends Request {
  body: T['body']
  params: T['params']
  query: T['query']
}

export type HTTPMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'HEAD'
  | 'DELETE'
  | 'OPTIONS'

export interface IAsyncRouter<API extends RestypedBase> {
  route<Path extends keyof API, Method extends HTTPMethod>(
    path: Path,
    method: Method,
    handler: (
      req: TypedRequest<API[Path][Method]>,
      res: Response
    ) => Promise<API[Path][Method]['response'] | void>
  ): void

  get<Path extends keyof API>(
    path: Path,
    handler: (
      req: TypedRequest<API[Path]['GET']>,
      res: Response
    ) => Promise<API[Path]['GET']['response'] | void>
  ): void
  post<Path extends keyof API>(
    path: Path,
    handler: (
      req: TypedRequest<API[Path]['POST']>,
      res: Response
    ) => Promise<API[Path]['POST']['response'] | void>
  ): void
  put<Path extends keyof API>(
    path: Path,
    handler: (
      req: TypedRequest<API[Path]['PUT']>,
      res: Response
    ) => Promise<API[Path]['PUT']['response'] | void>
  ): void

  delete<Path extends keyof API>(
    path: Path,
    handler: (
      req: TypedRequest<API[Path]['DELETE']>,
      res: Response
    ) => Promise<API[Path]['DELETE']['response'] | void>
  ): void
  patch<Path extends keyof API>(
    path: Path,
    handler: (
      req: TypedRequest<API[Path]['PATCH']>,
      res: Response
    ) => Promise<API[Path]['PATCH']['response'] | void>
  ): void
  options<Path extends keyof API>(
    path: Path,
    handler: (
      req: TypedRequest<API[Path]['OPTIONS']>,
      res: Response
    ) => Promise<API[Path]['OPTIONS']['response'] | void>
  ): void
  head<Path extends keyof API>(
    path: Path,
    handler: (
      req: TypedRequest<API[Path]['HEAD']>,
      res: Response
    ) => Promise<API[Path]['HEAD']['response'] | void>
  ): void
  wait<Path extends keyof API, Method extends HTTPMethod>(): Promise<
    API[Path][Method]['response'] | void
  >
}

export default function AsyncRouter<APIDef extends RestypedBase>(
  event: AwsLambda.APIGatewayEvent,
  context: AwsLambda.APIGatewayEventRequestContext,
  callback: AwsLambda.ProxyCallback,
  proxyName: string = 'proxy'
): IAsyncRouter<APIDef> {
  let routeMatched: boolean = false
  let promise: Promise<
    APIDef[keyof APIDef][HTTPMethod]['response'] | void
  > = null

  const createAsyncRoute = function<
    Path extends keyof APIDef,
    Method extends HTTPMethod
  >(
    path: Path,
    method: Method,
    handler: (
      req: TypedRequest<APIDef[Path][Method]>,
      res: Response
    ) => Promise<APIDef[Path][Method]['response'] | void>
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
    const req: TypedRequest<APIDef[Path][Method]> = new Request(
      event,
      context,
      routeParams
    ) as TypedRequest<APIDef[Path][Method]>
    const res = new Response(callback)

    promise = handler(req, res)
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
      ) => Promise<APIDef[Path]['GET']['response'] | void>
    ) {
      return createAsyncRoute(path, 'GET', handler)
    },
    post: function<Path extends keyof APIDef>(
      path: Path,
      handler: (
        req: TypedRequest<APIDef[Path]['POST']>,
        res: Response
      ) => Promise<APIDef[Path]['POST']['response'] | void>
    ) {
      return createAsyncRoute(path, 'POST', handler)
    },
    put: function<Path extends keyof APIDef>(
      path: Path,
      handler: (
        req: TypedRequest<APIDef[Path]['PUT']>,
        res: Response
      ) => Promise<APIDef[Path]['PUT']['response'] | void>
    ) {
      return createAsyncRoute(path, 'PUT', handler)
    },
    delete: function<Path extends keyof APIDef>(
      path: Path,
      handler: (
        req: TypedRequest<APIDef[Path]['DELETE']>,
        res: Response
      ) => Promise<APIDef[Path]['DELETE']['response'] | void>
    ) {
      return createAsyncRoute(path, 'DELETE', handler)
    },
    patch: function<Path extends keyof APIDef>(
      path: Path,
      handler: (
        req: TypedRequest<APIDef[Path]['PATCH']>,
        res: Response
      ) => Promise<APIDef[Path]['PATCH']['response'] | void>
    ) {
      return createAsyncRoute(path, 'PATCH', handler)
    },
    options: function<Path extends keyof APIDef>(
      path: Path,
      handler: (
        req: TypedRequest<APIDef[Path]['OPTIONS']>,
        res: Response
      ) => Promise<APIDef[Path]['OPTIONS']['response'] | void>
    ) {
      return createAsyncRoute(path, 'OPTIONS', handler)
    },
    head: function<Path extends keyof APIDef>(
      path: Path,
      handler: (
        req: TypedRequest<APIDef[Path]['HEAD']>,
        res: Response
      ) => Promise<APIDef[Path]['HEAD']['response'] | void>
    ) {
      return createAsyncRoute(path, 'HEAD', handler)
    },
    wait: function<
      Path extends keyof APIDef,
      Method extends HTTPMethod
    >(): Promise<APIDef[Path][Method]['response'] | void> {
      if (!routeMatched) {
        const res = new Response(callback)
        res.status(404).send()
        return Promise.resolve<void>(null)
      }

      return promise
    }
  }
}
