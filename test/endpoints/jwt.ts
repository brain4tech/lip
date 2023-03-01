import {expect, test,} from "bun:test"
import {callPostEndpoint, testSuite, randomString, randomWhitespacePadding, EndpointTest, randomInt} from "../definitions";
import {infiniteLifetimeAddress1} from "../addresses";

export {jwtEndpointTests}

/**
 * Describe all tests here.
 */
const jwtEndpointTests = () => {
    testSuite('required schema', '/jwt', schemaTests)
    testSuite('object values', '/jwt', schemaObjectValueTests)

    jwtPasswordTypeTests()
    jwtReadTokenThrottling()
    jwtSingleWriteToken()

}

// schema (id, password, mode)

// values

// token generation + throttling

const schemaTests: EndpointTest[] = [
    {
        name: "no body content",
        body: {},
        expectedCode: 400
    },

    {
        name: "invalid body content",
        body: {[randomString()]: randomString()},
        expectedCode: 400
    },

    {
        name: "invalid body content | no value",
        body: {[randomString()]: ''},
        expectedCode: 400
    },

    {
        name: "id only | non-empty",
        body: {id: randomString()},
        expectedCode: 400
    },

    {
        name: "password only | non-empty",
        body: {password: randomString()},
        expectedCode: 400
    },

    {
        name: "mode only | non-empty",
        body: {mode: randomString()},
        expectedCode: 400
    },

    {
        name: "id and password only",
        body: {id: randomString(), password: randomString()},
        expectedCode: 400
    },

    {
        name: "id and mode only",
        body: {id: randomString(), mode: randomString()},
        expectedCode: 400
    },

    {
        name: "access and mode only",
        body: {password: randomString(), mode: randomString()},
        expectedCode: 400
    }
]

const schemaObjectValueTests: EndpointTest[] = [

    // leave one attribute emtpy (every attribute once)
    {
        name: "empty values",
        body: {id: '', password: '', mode: ''},
        expectedCode: 400
    },

    {
        name: "non-empty id",
        body: {id: randomString(), password: '', mode: ''},
        expectedCode: 400
    },

    {
        name: "non-empty password",
        body: {id: '', password: randomString(), mode: ''},
        expectedCode: 400
    },

    {
        name: "non-empty mode",
        body: {id: '', password: '', mode: randomString()},
        expectedCode: 400
    },
    
    {
        name: "empty id",
        body: {id: '', password: randomString(), mode: randomString()},
        expectedCode: 400
    },

    {
        name: "empty password",
        body: {id: randomString(), password: '', mode: randomString()},
        expectedCode: 400
    },

    {
        name: "empty mode",
        body: {id: randomString(), password: randomString(), mode: ''},
        expectedCode: 400
    },

    // set attributes to non-string (integer, sub-object)
    {
        name: "non-string id | null",
        body: {id: null, password: randomString(), mode: randomString()},
        expectedCode: 400
    },

    {
        name: "non-string id | number",
        body: {id: randomInt(300), password: randomString(), mode: randomString()},
        expectedCode: 400
    },

    {
        name: "non-string id | object",
        body: {id: {}, password: randomString(), mode: randomString()},
        expectedCode: 400
    },

    {
        name: "non-string id | array",
        body: {id: [], password: randomString(), mode: randomString()},
        expectedCode: 400
    },

    {
        name: "non-string password | null",
        body: {id: randomString(), password: null, mode: randomString()},
        expectedCode: 400
    },

    {
        name: "non-string password | number",
        body: {id: randomString(), password: randomInt(300), mode: randomString()},
        expectedCode: 400
    },

    {
        name: "non-string password | object",
        body: {id: randomString(), password: {}, mode: randomString()},
        expectedCode: 400
    },

    {
        name: "non-string password | array",
        body: {id: randomString(), password: [], mode: randomString()},
        expectedCode: 400
    },

    {
        name: "non-string mode | null",
        body: {id: randomString(), password: randomString(), mode: null},
        expectedCode: 400
    },

    {
        name: "non-string mode | number",
        body: {id: randomString(), password: randomString(), mode: randomInt(300)},
        expectedCode: 400
    },

    {
        name: "non-string mode | object",
        body: {id: randomString(), password: randomString(), mode: {}},
        expectedCode: 400
    },

    {
        name: "non-string mode | array",
        body: {id: randomString(), password: randomString(), mode: []},
        expectedCode: 400
    },

    // set spaces and newlines in values
    {
        name: "padded id",
        body: {id: randomWhitespacePadding(), password: randomString(), mode: randomString()},
        expectedCode: 400
    },

    {
        name: "padded password",
        body: {id: randomString(), password: randomWhitespacePadding(), mode: randomString()},
        expectedCode: 400
    },

    {
        name: "padded mode",
        body: {id: randomString(), password: randomString(), mode: randomWhitespacePadding()},
        expectedCode: 400
    },
]


function jwtPasswordTypeTests(): void {
    test("wrong password type (used: master)", async () => {
        const result = await Promise.resolve(callPostEndpoint('/jwt', {
            id: infiniteLifetimeAddress1.id,
            password: infiniteLifetimeAddress1.masterPassword,
            mode: 'read'
        }))
        expect(result.code).toEqual(401)
    })
}


function jwtReadTokenThrottling(): void {
    test("read token throttling", async () => {

        const result_first = await Promise.resolve(callPostEndpoint('/jwt', {
            id: infiniteLifetimeAddress1.id,
            password: infiniteLifetimeAddress1.accessPassword,
            mode: 'read'
        }))
        expect(result_first.code).toEqual(200)
        expect(result_first.json).not.toEqual({info: ""})

        infiniteLifetimeAddress1.readToken = result_first.json['info']

        for (let i: number = 0; i < 5; i++){
            const result_loop = await Promise.resolve(callPostEndpoint('/jwt', {
                id: infiniteLifetimeAddress1.id,
                password: infiniteLifetimeAddress1.accessPassword,
                mode: 'read'
            }))
            expect(result_loop.code).toEqual(200)
        }


        const result_throttled = await Promise.resolve(callPostEndpoint('/jwt', {
            id: infiniteLifetimeAddress1.id,
            password: infiniteLifetimeAddress1.accessPassword,
            mode: 'read'
        }))
        expect(result_throttled.code).toEqual(429)
    })
}

function jwtSingleWriteToken(): void {
    test("single write token", async () => {

        const result_first = await Promise.resolve(callPostEndpoint('/jwt', {
            id: infiniteLifetimeAddress1.id,
            password: infiniteLifetimeAddress1.accessPassword,
            mode: 'write'
        }))
        expect(result_first.code).toEqual(200)
        expect(result_first.json).not.toEqual({info: ""})

        infiniteLifetimeAddress1.writeToken = result_first.json['info']


        const result_throttled = await Promise.resolve(callPostEndpoint('/jwt', {
            id: infiniteLifetimeAddress1.id,
            password: infiniteLifetimeAddress1.accessPassword,
            mode: 'write'
        }))
        expect(result_throttled.code).toEqual(409)
    })
}
