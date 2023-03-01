import {describe, expect, test, afterAll} from "bun:test"
import {callIndexEndpoint} from "./definitions";
import { unlink } from "fs";
import { createEndpointTests } from "./endpoints/create";
import { jwtEndpointTests } from "./endpoints/jwt";

import {lip} from '../src'

export {endpointBase}

const endpointBase = `http://${lip.hostname}:${lip.port}`
console.log("Testing on", endpointBase, '\n')

/**
 * Describe tests here.
 */
function runTests(): void {

    // test index ('/') endpoint
    describe('INDEX', () => {
        test("just fetchin'", async () => {
            const result = await Promise.resolve(callIndexEndpoint())
            expect(result.json).toEqual({info: "hello lip!"})
            expect(result.code).toEqual(200)
        })
    })
    
    describe('CREATE', createEndpointTests)
    describe('JWT', jwtEndpointTests)
}

runTests()
