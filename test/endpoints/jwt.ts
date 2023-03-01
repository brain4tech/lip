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
    testSuite('valid jwt modes, random credentials', '/jwt', validJwtModesInvalidCredentials)
    testSuite('valid jwt modes, valid credentials', '/jwt', validJwtModesValidCredentials)

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
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "invalid body content",
        body: {[randomString()]: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "invalid body content | no value",
        body: {[randomString()]: ''},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "id only | non-empty",
        body: {id: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "password only | non-empty",
        body: {password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "mode only | non-empty",
        body: {mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "id and password only",
        body: {id: randomString(), password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "id and mode only",
        body: {id: randomString(), mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "access and mode only",
        body: {password: randomString(), mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    }
]

const schemaObjectValueTests: EndpointTest[] = [

    // leave one attribute emtpy (every attribute once)
    {
        name: "empty values",
        body: {id: '', password: '', mode: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },

    {
        name: "non-empty id",
        body: {id: randomString(), password: '', mode: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },

    {
        name: "non-empty password",
        body: {id: '', password: randomString(), mode: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },

    {
        name: "non-empty mode",
        body: {id: '', password: '', mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },
    
    {
        name: "empty id",
        body: {id: '', password: randomString(), mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },

    {
        name: "empty password",
        body: {id: randomString(), password: '', mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },

    {
        name: "empty mode",
        body: {id: randomString(), password: randomString(), mode: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },

    // set attributes to non-string (integer, sub-object)
    {
        name: "non-string id | null",
        body: {id: null, password: randomString(), mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-string id | number",
        body: {id: randomInt(300), password: randomString(), mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-string id | object",
        body: {id: {}, password: randomString(), mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-string id | array",
        body: {id: [], password: randomString(), mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-string password | null",
        body: {id: randomString(), password: null, mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-string password | number",
        body: {id: randomString(), password: randomInt(300), mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-string password | object",
        body: {id: randomString(), password: {}, mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-string password | array",
        body: {id: randomString(), password: [], mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-string mode | null",
        body: {id: randomString(), password: randomString(), mode: null},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-string mode | number",
        body: {id: randomString(), password: randomString(), mode: randomInt(300)},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-string mode | object",
        body: {id: randomString(), password: randomString(), mode: {}},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-string mode | array",
        body: {id: randomString(), password: randomString(), mode: []},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    // set spaces and newlines in values
    {
        name: "padded id",
        body: {id: randomWhitespacePadding(), password: randomString(), mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },

    {
        name: "padded password",
        body: {id: randomString(), password: randomWhitespacePadding(), mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },

    {
        name: "padded mode",
        body: {id: randomString(), password: randomString(), mode: randomWhitespacePadding()},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },
]

const validJwtModesInvalidCredentials: EndpointTest[] = [

    // read mode
    {
        name: "read | empty values",
        body: {id: '', password: '', mode: 'read'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },
    
    {
        name: "read | empty id",
        body: {id: '', password: randomString(), mode: 'read'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "read | empty password",
        body: {id: randomString(), password: '', mode: 'read'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    // write mode
    {
        name: "write | empty values",
        body: {id: '', password: '', mode: 'write'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },
    
    {
        name: "write | empty id",
        body: {id: '', password: randomString(), mode: 'write'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "write | empty password",
        body: {id: randomString(), password: '', mode: 'write'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },
]

const validJwtModesValidCredentials: EndpointTest[] = [

    // read mode
    {
        name: "read | empty id",
        body: {id: '', password: infiniteLifetimeAddress1.accessPassword, mode: 'read'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "read | empty password",
        body: {id: infiniteLifetimeAddress1.id, password: '', mode: 'read'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    // write mode   
    {
        name: "write | empty id",
        body: {id: '', password: infiniteLifetimeAddress1.accessPassword, mode: 'write'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "write | empty password",
        body: {id: infiniteLifetimeAddress1.id, password: '', mode: 'write'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },
]

function jwtPasswordTypeTests(): void {
    test("wrong password type (used: master)", async () => {
        const result = await Promise.resolve(callPostEndpoint('/jwt', {
            id: infiniteLifetimeAddress1.id,
            password: infiniteLifetimeAddress1.masterPassword,
            mode: 'read'
        }))
        expect(result.json).toEqual({info: 'invalid combination of id and password'})
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
        expect(result_first.json).not.toEqual({info: ""})
        expect(result_first.code).toEqual(200)

        infiniteLifetimeAddress1.readToken = result_first.json['info']

        for (let i: number = 0; i < 5; i++){
            const result_loop = await Promise.resolve(callPostEndpoint('/jwt', {
                id: infiniteLifetimeAddress1.id,
                password: infiniteLifetimeAddress1.accessPassword,
                mode: 'read'
            }))
            expect(result_first.json).not.toEqual({info: ""})
            expect(result_loop.code).toEqual(200)
        }


        const result_throttled = await Promise.resolve(callPostEndpoint('/jwt', {
            id: infiniteLifetimeAddress1.id,
            password: infiniteLifetimeAddress1.accessPassword,
            mode: 'read'
        }))
        expect(result_throttled.json).not.toEqual({info: ''})
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


        const result_blocked = await Promise.resolve(callPostEndpoint('/jwt', {
            id: infiniteLifetimeAddress1.id,
            password: infiniteLifetimeAddress1.accessPassword,
            mode: 'write'
        }))
        expect(result_blocked.json).toEqual({info: 'write jwt already exists'})
        expect(result_blocked.code).toEqual(409)
    })
}
