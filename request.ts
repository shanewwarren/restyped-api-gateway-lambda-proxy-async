import * as AwsLambda from 'aws-lambda'

export default class Request {
  private event: AwsLambda.APIGatewayEvent
  private context: AwsLambda.APIGatewayEventRequestContext

  constructor(
    event: AwsLambda.APIGatewayEvent,
    context: AwsLambda.APIGatewayEventRequestContext
  ) {
    this.event = event
    this.context = context
  }

  /**
   * Gets the query string parameters from the event.
   *
   * @return {Object}
   * An object containing all the query string parameters.
   */
  get query(): {[name: string]: string} {
    return this.event.queryStringParameters || {}
  }

  /**
   * Returns the inputted pathParameters from the event object.
   *
   * @return {Object}
   * The path parameters object.
   */
  get params() {
    return this.event.pathParameters || {}
  }

  /**
   * Gets the JSON parsed body from the request. If the body is not parse-able an empty object is
   * returned.
   *
   * @return {Object}
   * JSON parsed body input.
   */
  get body() {
    let body

    try {
      body = JSON.parse(this.event.body)
    } catch (error) {
      body = {}
    }

    return body
  }

  /**
   * Gets the cognito authorizer claims.
   *
   * @return {Object}
   * The lambda context object
   */
  get claims(): {[name: string]: string} {
    return this.context.authorizer && this.context.authorizer.claims
      ? this.context.authorizer.claims
      : {}
  }

  /**
   * Gets the whole lambda context object.
   *
   * @return {Object}
   * The lambda context object
   */
  get contextObject(): AwsLambda.APIGatewayEventRequestContext {
    return this.context
  }

  /**
   * Gets the whole lambda event object.
   *
   * @return {Object}
   * The lambda event object
   */
  get eventObject(): AwsLambda.APIGatewayEvent {
    return this.event
  }

  /**
   * Gets the stage variables from the event object.
   *
   * @return {Object}
   * Returns the stage variables if they are available. Will return an empty object if not.
   */
  get stageVariables(): {[name: string]: string} {
    return this.event.stageVariables || {}
  }

  /**
   * Returns the raw body sent in the request without it being JSON parsed.
   *
   * @return {string}
   * The raw body from the request.
   */
  get rawBody() {
    return this.event.body
  }

  /**
   * Return the headers object or an empty object from the event.
   *
   * @return {Object}
   * The headers from the request
   */
  get headers() {
    return this.event.headers || {}
  }
}
