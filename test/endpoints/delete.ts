import {describe, expect, test,} from "bun:test"
import {
    callPostEndpoint,
    EndpointTest,
    randomInt,
    randomString,
    randomWhitespacePadding,
    testSuite
} from "../definitions";
import {infiniteLifetimeAddress1, infiniteLifetimeAddress2} from "../addresses";

export {deleteEndpointTests}

/**
 * Collect all tests.
 */
function deleteEndpointTests(): void {

    describe('schema', () => {
        testSuite('structure', '/delete', schemaStructureTests)

        describe('value', () => {
            testSuite('empty', '/delete', schemaEmptyValueTests)
            testSuite('whitespace', '/delete', schemaWhitespaceValuesTests)
            testSuite('non-value', '/delete', schemaNonValueTypeTests)
        })
    })

    testSuite('authentication', '/delete', invalidAuthenticationTests)

    validAddressDeletion()
    invalidAddressHandling()
    recreateAddress()
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
        name: "id",
        body: {id: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "password",
        body: {password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    }
]

const schemaEmptyValueTests: EndpointTest[] = [
    {
        name: "all",
        body: {id: '', password: ''},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "id",
        body: {id: randomString(), password: ''},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "password",
        body: {id: '', password: randomString()},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },
]

const schemaWhitespaceValuesTests: EndpointTest[] = [
    {
        name: "id",
        body: {id: randomWhitespacePadding(), password: randomString()},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "password",
        body: {id: randomString(), password: randomWhitespacePadding()},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },
]

const schemaNonValueTypeTests: EndpointTest[] = [
    {
        name: "id (null)",
        body: {id: null, password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "id (number)",
        body: {id: randomInt(300), password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "id (object)",
        body: {id: {}, password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "id (array)",
        body: {id: [], password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "password (null)",
        body: {id: randomString(), password: null},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "password (number)",
        body: {id: randomString(), password: randomInt(300)},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "password (object)",
        body: {id: randomString(), password: {}},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "password (array)",
        body: {id: randomString(), password: []},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },
]

const invalidAuthenticationTests: EndpointTest[] = [
    {
        name: "empty id + empty password",
        body: {id: '', password: ''},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "empty id + random password",
        body: {id: '', password: randomString()},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "empty id + access password",
        body: {id: '', password: infiniteLifetimeAddress1.accessPassword},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "empty id + master password",
        body: {id: '', password: infiniteLifetimeAddress1.masterPassword},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "random id + empty password",
        body: {id: randomString(), password: ''},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "random id + random password",
        body: {id: randomString(), password: randomString()},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "random id + access password",
        body: {id: randomString(), password: infiniteLifetimeAddress1.accessPassword},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "random id + master password",
        body: {id: randomString(), password: infiniteLifetimeAddress1.masterPassword},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "other id + empty password",
        body: {id: infiniteLifetimeAddress2.id, password: ''},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "other id + random password",
        body: {id: infiniteLifetimeAddress2.id, password: randomString()},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "other id + access password",
        body: {id: infiniteLifetimeAddress2.id, password: infiniteLifetimeAddress1.accessPassword},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "other id + master password",
        body: {id: infiniteLifetimeAddress2.id, password: infiniteLifetimeAddress1.masterPassword},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "complementary id + access password",
        body: {id: infiniteLifetimeAddress1.id, password: infiniteLifetimeAddress1.accessPassword},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },
]

function validAddressDeletion(): void {

    test("valid address deletion", async () => {

        const result_first = await Promise.resolve(callPostEndpoint('/delete', {
            id: infiniteLifetimeAddress2.id,
            password: infiniteLifetimeAddress2.masterPassword,
        }))
        expect(result_first.code).toEqual(200)
        expect(result_first.json).toEqual({info: `deleted address '${infiniteLifetimeAddress2.id}'`})
    })
}

function invalidAddressHandling(): void {

    test("re-delete address fails", async () => {

        const result_first = await Promise.resolve(callPostEndpoint('/delete', {
            id: infiniteLifetimeAddress2.id,
            password: infiniteLifetimeAddress2.masterPassword,
        }))
        expect(result_first.code).toEqual(401)
        expect(result_first.json).toEqual({info: 'invalid combination of id and password'})
    })

    test("token acquiring fails", async () => {

        const result_first = await Promise.resolve(callPostEndpoint('/jwt', {
            id: infiniteLifetimeAddress2.id,
            password: infiniteLifetimeAddress2.masterPassword,
            mode: 'read'
        }))
        expect(result_first.code).toEqual(401)
        expect(result_first.json).toEqual({info: 'invalid combination of id and password'})

        const result_second = await Promise.resolve(callPostEndpoint('/jwt', {
            id: infiniteLifetimeAddress2.id,
            password: infiniteLifetimeAddress2.masterPassword,
            mode: 'write'
        }))
        expect(result_second.code).toEqual(401)
        expect(result_second.json).toEqual({info: 'invalid combination of id and password'})
    })


}

function recreateAddress(): void {

    test("recreation succeeds", async () => {

        const result_first = await Promise.resolve(callPostEndpoint('/create', {
            id: infiniteLifetimeAddress2.id,
            access_password: infiniteLifetimeAddress2.accessPassword,
            master_password: infiniteLifetimeAddress2.masterPassword
        }))
        expect(result_first.code).toEqual(200)
        expect(result_first.json).toEqual({info: `created new address '${infiniteLifetimeAddress2.id}'`})
    })
}
