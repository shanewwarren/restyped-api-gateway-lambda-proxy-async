import {RestypedBase, RestypedRoute} from 'restyped'
import * as AwsLambda from 'aws-lambda'
import Request from './request'

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
  callback: AwsLambda.ProxyCallback
) {
  const routeMatched = false
  const createAsyncRoute = function<
    Path extends keyof APIDef,
    Method extends HTTPMethod
  >(
    path: Path,
    method: Method,
    handler: (
      req: TypedRequest<APIDef[Path][Method]>,
      res: AwsLambda.ProxyCallback
    ) => Promise<APIDef[Path][Method]['response']>
  ) {
    route(path, method, handler)
  }

  /**
   * Router function. Should be called for each route you want to create.
   *
   * @param {Object} params
   * Parameters object containing the route information
   *
   * @param {string|Array} params.method
   * HTTP verb to create the route for.
   *
   * @param {string|Array} params.path
   * The path to match the route on.
   *
   * @param {Callback} params.handler
   * Function to be called when the route is matched. Should take two parameters, those being
   * request and response.
   *
   * @return {Callback|boolean}
   * Calls the handler method specified in the route information when a route matches, else returns
   * false.
   */
  const route = function(
    path: string,
    method: HTTPMethod,
    handler: (req: Request, res: AwsLambda.ProxyCallback) => void
  ) {
    if (routeMatched || !routeMatcher(path, method)) {
      return false
    }

    this.routeMatched = true

    const request = new Request(this.event, this.context)
    const instancedClass = this

    const response = (error?: Error | null, result?: AwsLambda.ProxyResult) => {
      const responseData: any = {}

      responseData.statusCode = Number.isInteger(result.statusCode)
        ? result.statusCode
        : 200

      responseData.headers =
        typeof result.headers === 'object' ? result.headers : {}

      if (result.isBase64Encoded) {
        responseData.body = result.body || ''
        responseData.isBase64Encoded = true
      } else {
        responseData.body = JSON.stringify(result.body || result)
      }

      return instancedClass.callback(
        null,
        responseData as AwsLambda.ProxyResult
      )
    }

    return handler(request, response)
  }

  /**
   * Makes an attempt to match the route based on the parameters specified to the route method.
   *
   * @param {Object} params
   * Parameters object containing the route information
   *
   * @param {string|Array} params.method
   * HTTP verb to create the route for.
   *
   * @param {string|Array} params.path
   * The path to match the route on.
   *
   * @return {boolean}
   * Returns true or false depending on if the route was matched.
   */
  const routeMatcher = function(path: string, method: HTTPMethod): boolean {
    return event.resource === path && event.httpMethod === method
  }

  return {
    route: createAsyncRoute,
    get: function<Path extends keyof APIDef>(
      path: Path,
      handler: (
        req: TypedRequest<APIDef[Path]['GET']>,
        res: AwsLambda.ProxyCallback
      ) => Promise<APIDef[Path]['GET']['response']>
    ) {
      return createAsyncRoute(path, 'GET', handler)
    },
    post: function<Path extends keyof APIDef>(
      path: Path,
      handler: (
        req: TypedRequest<APIDef[Path]['POST']>,
        res: AwsLambda.ProxyCallback
      ) => Promise<APIDef[Path]['POST']['response']>
    ) {
      return createAsyncRoute(path, 'POST', handler)
    },
    put: function<Path extends keyof APIDef>(
      path: Path,
      handler: (
        req: TypedRequest<APIDef[Path]['PUT']>,
        res: AwsLambda.ProxyCallback
      ) => Promise<APIDef[Path]['PUT']['response']>
    ) {
      return createAsyncRoute(path, 'PUT', handler)
    },
    delete: function<Path extends keyof APIDef>(
      path: Path,
      handler: (
        req: TypedRequest<APIDef[Path]['DELETE']>,
        res: AwsLambda.ProxyCallback
      ) => Promise<APIDef[Path]['DELETE']['response']>
    ) {
      return createAsyncRoute(path, 'DELETE', handler)
    },
    patch: function<Path extends keyof APIDef>(
      path: Path,
      handler: (
        req: TypedRequest<APIDef[Path]['PATCH']>,
        res: AwsLambda.ProxyCallback
      ) => Promise<APIDef[Path]['PATCH']['response']>
    ) {
      return createAsyncRoute(path, 'PATCH', handler)
    },
    options: function<Path extends keyof APIDef>(
      path: Path,
      handler: (
        req: TypedRequest<APIDef[Path]['OPTIONS']>,
        res: AwsLambda.ProxyCallback
      ) => Promise<APIDef[Path]['OPTIONS']['response']>
    ) {
      return createAsyncRoute(path, 'OPTIONS', handler)
    },
    head: function<Path extends keyof APIDef>(
      path: Path,
      handler: (
        req: TypedRequest<APIDef[Path]['HEAD']>,
        res: AwsLambda.ProxyCallback
      ) => Promise<APIDef[Path]['HEAD']['response']>
    ) {
      return createAsyncRoute(path, 'HEAD', handler)
    }
  }
}
