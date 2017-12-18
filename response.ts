import {ProxyCallback, ProxyResult} from 'aws-lambda'
import * as HttpStatus from 'http-status-codes'
import HttpHeaderFields from 'http-header-fields-typed'

export default class Response {
  private _callback: ProxyCallback
  private _statusCode: number
  private _base64Encoded: boolean
  private _body: any
  private _headers: {[header: string]: boolean | number | string}

  constructor(callback: ProxyCallback) {
    this._callback = callback

    // defaults
    this._statusCode = HttpStatus.OK
    this._base64Encoded = false
    this._headers = {}
    this._body = null
  }

  /**
   * Set status `code`.
   *
   * @param code
   */
  public status(code: number): Response {
    this._statusCode = code
    return this
  }

  public base64Encoded(value: boolean): Response {
    this._base64Encoded = value
    return this
  }

  /**
   * Set header `field` to `val`, or pass
   * an object of header fields.
   *
   * Examples:
   *
   *    res.set('Foo', ['bar', 'baz']);
   *    res.set('Accept', 'application/json');
   *
   * Aliased as `res.header()`.
   */
  public set(field: string, value: string | number | boolean): Response {
    this._headers[field] = value
    return this
  }

  public header(field: string, value: string | number | boolean): Response {
    return this.set(field, value)
  }

  /**
   * Get value for header `field`.
   *
   * @param field
   */
  public get(field: string): string | number | boolean {
    return this._headers[field]
  }

  public contentType(type: string): Response {
    return this.set(HttpHeaderFields.CONTENT_TYPE, type)
  }

  /**
   * Set the location header to `url`.
   *
   * The given `url` can also be the name of a mapped url, for
   * example by default express supports "back" which redirects
   * to the _Referrer_ or _Referer_ headers or "/".
   *
   * Examples:
   *
   *    res.location('/foo/bar').;
   *    res.location('http://example.com');
   *
   * @param url
   */
  public location(url: string): Response {
    return this.set(HttpHeaderFields.LOCATION, url)
  }

  /**
   * Redirect to the given `url` with optional response `status`
   * defaulting to 302.
   *
   * The resulting `url` is determined by `res.location()`, so
   * it will play nicely with mounted apps, relative paths,
   * `"back"` etc.
   *
   * Examples:
   *
   *    res.redirect('/foo/bar');
   *    res.redirect('http://example.com');
   *    res.redirect(301, 'http://example.com');
   *    res.redirect('http://example.com', 301);
   *    res.redirect('../login'); // /blog/post/1 -> /blog/login
   */
  public redirect(url: any, status?: number): void {
    this.location(url).status(status || HttpStatus.MOVED_TEMPORARILY)
  }

  error(error: Error) {
    let content: string = ''
    switch (this.get(HttpHeaderFields.CONTENT_TYPE)) {
      case 'text/plain':
      case 'text/html':
        content = 'Internal Server Error.'
        break
      case 'application/json':
      default:
        content = JSON.stringify({
          message: 'Internal Server Error'
        })
    }

    return this._callback(null, {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      isBase64Encoded: false,
      body: content,
      headers: this._headers
    })
  }

  send(body?: any) {
    let content: string = ''
    let responseBody: any = body || this._body || {}

    switch (this.get(HttpHeaderFields.CONTENT_TYPE)) {
      case 'text/plain':
      case 'text/html':
        content = responseBody.toString()
        break
      case 'application/json':
      default:
        content = JSON.stringify(responseBody)
    }

    return this._callback(null, {
      statusCode: this._statusCode,
      headers: this._headers,
      isBase64Encoded: this._base64Encoded,
      body: content
    } as ProxyResult)
  }
}
