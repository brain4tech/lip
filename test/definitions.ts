import {endpointBase} from "./index.test";
import {randomBytes} from "crypto";
import {describe, expect, test} from "bun:test";
import {lipAddress} from "./addresses";

var randomIpv6 = require('random-ipv6');

export {callIndexEndpoint, callPostEndpoint}
export {EndpointTest, testSuite}
export {randomString, randomWhitespacePadding, randomInt}
export {randomIpv4Address, randomIpv6Address}
export {padString, nowToSeconds}
export {regenerateWriteJWT}

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
 * @param staticTests Array of static tests to loop through.
 * @param dynamicTests Function that returns a list of tests to run through.
 */
function testSuite(name: string, endpoint: string, staticTests: EndpointTest[] = [], dynamicTests: () => EndpointTest[] = () => {
    return []
}): void {
    describe(name, () => {

        // static tests
        staticTests.forEach((endpointTest: EndpointTest) => {
            test(endpointTest.name, async () => {
                const call = callPostEndpoint(endpoint, endpointTest.body)
                const result = await Promise.resolve(call)
                expect(result.code).toEqual(endpointTest.expectedCode)
                if (endpointTest.expectedBody) expect(result.json).toEqual(endpointTest.expectedBody)
            })
        })

        // dynamic tests
        const dynamicEndpointTests = dynamicTests()
        const testCount: number = dynamicEndpointTests.length
        for (let i: number = 0; i < testCount; i++) {
            test(dynamicEndpointTests[i].name, async () => {
                const endpointTest = dynamicTests()[i]

                const call = callPostEndpoint(endpoint, endpointTest.body)
                const result = await Promise.resolve(call)
                expect(result.code).toEqual(endpointTest.expectedCode)
                if (endpointTest.expectedBody) expect(result.json).toEqual(endpointTest.expectedBody)
            })
        }
    })
}

/**
 * Generate a string with random content.
 * @param halfLength Amount of characters / 2
 * @returns The generated String
 */
function randomString(halfLength: number = 5): string {
    return randomBytes(halfLength).toString('hex')
}

/**
 * Generate a random ipv4 address.
 * @returns The generated address
 */
function randomIpv4Address(): string {
    return `${randomInt(256)}.${randomInt(256)}.${randomInt(256)}.${randomInt(256)}`
}

/**
 * Generate a random ipv6 address.
 * @returns The generated address
 */
function randomIpv6Address(): string {
    return randomIpv6().toString()
}

/**
 * Generate a specified amount of random whitespace padding.
 * @param count Amount of padding.
 * @returns The generated string.
 */
function randomWhitespacePadding(count: number = 5): string {
    const paddingChars = [' ', '\n', '\t', '\r']

    let returnString: string = ''
    for (let i: number = 0; i < count; i++) {
        returnString += paddingChars[randomInt(paddingChars.length - 1)]
    }

    return returnString
}

/**
 * Add some padding right and left of passed string.
 * @param content String to pad.
 * @param paddingCount Amount of padding on both sides.
 * @returns Padded string.
 */
function padString(content: string, paddingCount: number = 5): string {
    return randomWhitespacePadding(paddingCount) + content + randomWhitespacePadding(paddingCount)
}

/**
 * Generate a random number between 0 and max.
 * @param max Upper limit.
 * @returns Number.
 */
function randomInt(max: number): number {
    return Math.floor(Math.random() * max)
}

/**
 * Math.floor() current Date.now()
 * @returns Current timestamp in seconds.
 */
function nowToSeconds(): number {
    return Math.floor(Date.now() / 1000)
}

async function regenerateWriteJWT(id: lipAddress): Promise<string> {

    await Promise.resolve(callPostEndpoint('/invalidatejwt', {
        id: id.id,
        password: id.accessPassword,
        jwt: id.writeToken
    }))

    const result = await Promise.resolve(callPostEndpoint('/jwt', {
        id: id.id,
        password: id.accessPassword,
        mode: 'write'
    }))

    return result.json.info
}