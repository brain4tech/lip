import {describe, expect, test} from "bun:test"
import {callIndexEndpoint} from "./definitions";
import {createEndpointTests} from "./endpoints/create";
import {jwtEndpointTests} from "./endpoints/jwt";
import {invalidatejwtEndpointTests} from "./endpoints/invalidatejwt";
import {updateEndpointTests} from "./endpoints/update";
import {retrieveEndpointTests} from "./endpoints/retrieve";
import {jwtValidityTests} from "./miscellaneous/jwt-validty";
import {deleteEndpointTests} from "./endpoints/delete";

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
    describe('INVALIDATE JWT', invalidatejwtEndpointTests)
    describe('UPDATE', updateEndpointTests)
    describe('RETRIEVE', retrieveEndpointTests)
    describe('DELETE', deleteEndpointTests)

    describe('JWT VALIDITY TESTS', jwtValidityTests)
}

runTests()
