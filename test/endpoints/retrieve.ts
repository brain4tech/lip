import {describe, expect, test,} from "bun:test"
import {
    callPostEndpoint,
    EndpointTest,
    randomInt,
    randomString,
    randomWhitespacePadding,
    testSuite
} from "../definitions";
import {infiniteLifetimeAddress1} from "../addresses";

export {retrieveEndpointTests}

/**
 * Collect all tests.
 */
async function retrieveEndpointTests(): Promise<void> {

    describe('schema', () => {
        testSuite('structure', '/retrieve', schemaStructureTests)

        describe('value', () => {
            testSuite('empty', '/retrieve', schemaEmptyValueTests)
            testSuite('whitespace', '/retrieve', schemaWhitespaceValuesTests)
            testSuite('non-value', '/retrieve', schemaNonValueTypeTests)
        })
    })

    testSuite('authentication', '/retrieve', [], generateInvalidAuthenticationTests)
    testSuite('invalid jwt authentication', '/retrieve', [], generateInvalidAuthenticationTests)

    successfulRetrieval()

}

const schemaStructureTests: EndpointTest[] = [
    {
        name: "none",
        body: {},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "invalid",
        body: {[randomString()]: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "jwt",
        body: {jwt: randomString()},
        expectedCode: 401,
        expectedBody: {info: 'invalid authentication'}
    },
]

const schemaEmptyValueTests: EndpointTest[] = [
    {
        name: "all",
        body: {jwt: ''},
        expectedCode: 401,
        expectedBody: {info: 'invalid authentication'}
    },
]

const schemaWhitespaceValuesTests: EndpointTest[] = [
    {
        name: "jwt",
        body: {jwt: randomWhitespacePadding()},
        expectedCode: 401,
        expectedBody: {info: 'invalid authentication'}
    },

]

const schemaNonValueTypeTests: EndpointTest[] = [

    {
        name: "jwt (null)",
        body: {jwt: null},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "jwt (number)",
        body: {jwt: randomInt(300)},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "jwt (object)",
        body: {jwt: {}},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "jwt (array)",
        body: {jwt: []},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },
]


function generateInvalidAuthenticationTests(): EndpointTest[] {
    return [

        {
            name: "random jwt",
            body: {jwt: randomString()},
            expectedCode: 401,
            expectedBody: {info: 'invalid authentication'}
        },

        {
            name: "write jwt",
            body: {jwt: infiniteLifetimeAddress1.writeToken},
            expectedCode: 401,
            expectedBody: {info: 'invalid token mode'}
        },
    ]
}

function successfulRetrieval(): void {
    test("successful retrieval", async () => {

        const result = await Promise.resolve(callPostEndpoint('/retrieve', {
            jwt: infiniteLifetimeAddress1.readToken,
        }))

        expect(result.code).toEqual(200)
        expect(result.code).not.toEqual({info: ''})
        expect(Object.keys(result.json)).toContain('info')
        expect(Object.keys(result.json)).toContain('lifetime')
        expect(Object.keys(result.json)).toContain('last_update')
    })
}
