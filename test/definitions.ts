import {endpointBase} from "./index.test";
import {randomBytes} from "crypto";
import {expect, test} from "bun:test";

export {callIndexEndpoint, callPostEndpoint}
export {EndpointTest, testSuite}
export {randomString, randomWhitespacePadding, randomInt}
export {nowToSeconds}

/**
 * Define global type to use.
 */
type EndpointResponse = {
    json: object
    code: number
}

/**
 * Define global type to define a test for bulk test creation.
 */
type EndpointTest = {
    name: string
    body: object
    expectedCode: number
    expectedBody?: object
}

/**
 * Make a fetch request to the index endpoint.
 */
async function callIndexEndpoint(): Promise<EndpointResponse> {
    const response = await fetch(endpointBase + '/')
    return {json: await response.json(), code: response.status}
}

/**
 * Make a POST request to a specified endpoint.
 * @param endpoint The endpoint to send the request to.
 * @param json The body (gets converted to JSON).
 */
async function callPostEndpoint(endpoint: string, json: object): Promise<EndpointResponse> {
    const response = await fetch(
        endpointBase + endpoint,
        {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(json)
        })
    return {json: await response.json(), code: response.status}
}

/**
 * Run an array of endpoint tests.
 * @param name Name of test suite.
 * @param endpoint Endpoint to test to.
 * @param tests Specified tests.
 */
function testSuite(name: string, endpoint: string, tests: EndpointTest[]): void {
    tests.forEach( (endpointTest: EndpointTest) => {
        test(endpointTest.name, async () => {
            const call = callPostEndpoint(endpoint, endpointTest.body)
            const result = await Promise.resolve(call)
            expect(result.code).toEqual(endpointTest.expectedCode)
            if (endpointTest.expectedBody) expect(result.json).toEqual(endpointTest.expectedBody)

        })
    })

}

/**
 * Generate a string with random content.
 * @param halfLength Amount of characters / 2
 * @returns The generated String
 */
function randomString(halfLength: number = 5): string{
    return randomBytes(halfLength).toString('hex')
}

/**
 * Generate a specified amount of random whitespace padding.
 * @param count Amount of padding.
 * @returns The generated string.
 */
function randomWhitespacePadding(count: number = 5): string{
    const paddingChars = [' ', '\n', '\t', '\r']

    let returnString: string = ''
    for (let i: number = 0; i < count; i++){
        returnString += paddingChars[randomInt(paddingChars.length - 1)]
    }

    return returnString
}

/**
 * Generate a random number between 0 and max.
 * @param max Upper limit.
 * @returns Number.
 */
function randomInt(max: number): number{
    return Math.floor(Math.random() * max)
}

/**
 * Math.floor() current Date.now()
 * @returns Current timestamp in seconds.
 */
function nowToSeconds(): number {
    return Math.floor(Date.now() / 1000)
}