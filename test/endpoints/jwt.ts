import {describe, expect, test,} from "bun:test"
import {callPostEndpoint, testSuite, randomString, randomWhitespacePadding, EndpointTest, randomInt} from "../definitions";
import {infiniteLifetimeAddress1, infiniteLifetimeAddress2} from "../addresses";

export {jwtEndpointTests}

/**
 * Collect all tests.
 */
function jwtEndpointTests(): void {

    describe('schema', () => {
        testSuite('structure', '/jwt', schemaStructureTests)

        describe('value', () => {
            testSuite('empty', '/jwt', schemaEmptyValueTests)
            testSuite('whitespace', '/jwt', schemaWhitespaceValuesTests)
            testSuite('non-value', '/jwt', schemaNonValueTypeTests)
        })        
    })
    
    describe('value limits', () => {
        testSuite('mode evaluation before authentication', '/jwt', modeEvaluationBeforeAuthenticationTests)
        testSuite('allowed mode values', '/jwt', jwtTokenModeTests)
    })

    testSuite('authentication', '/jwt', invalidAuthenticationTests)

    describe('authentication', masterPasswordUsage)
    readTokenThrottling1()
    readTokenThrottling2()
    singleWriteToken1()
    singleWriteToken2()
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
    },

    {
        name: "mode",
        body: {mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "id + password",
        body: {id: randomString(), password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "id + mode",
        body: {id: randomString(), mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "password + mode",
        body: {password: randomString(), mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    }
]

const schemaEmptyValueTests: EndpointTest[] = [
    {
        name: "all",
        body: {id: '', password: '', mode: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },

    {
        name: "id",
        body: {id: randomString(), password: '', mode: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },

    {
        name: "password",
        body: {id: '', password: randomString(), mode: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },

    {
        name: "mode",
        body: {id: '', password: '', mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },
    
    {
        name: "id + password",
        body: {id: randomString(), password: randomString(), mode: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },
    
    {
        name: "id + mode",
        body: {id: randomString(), password: '', mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },

    {
        name: "password + mode",
        body: {id: '', password: randomString(), mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },
]

const schemaWhitespaceValuesTests: EndpointTest[] = [
    {
        name: "id",
        body: {id: randomWhitespacePadding(), password: randomString(), mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },

    {
        name: "password",
        body: {id: randomString(), password: randomWhitespacePadding(), mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },

    {
        name: "mode",
        body: {id: randomString(), password: randomString(), mode: randomWhitespacePadding()},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    }
]

const schemaNonValueTypeTests: EndpointTest[] = [
    {
        name: "id (null)",
        body: {id: null, password: randomString(), mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "id (number)",
        body: {id: randomInt(300), password: randomString(), mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "id (object)",
        body: {id: {}, password: randomString(), mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "id (array)",
        body: {id: [], password: randomString(), mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "password (null)",
        body: {id: randomString(), password: null, mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "password (number)",
        body: {id: randomString(), password: randomInt(300), mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "password (object)",
        body: {id: randomString(), password: {}, mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "password (array)",
        body: {id: randomString(), password: [], mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "mode (null)",
        body: {id: randomString(), password: randomString(), mode: null},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "mode (number)",
        body: {id: randomString(), password: randomString(), mode: randomInt(300)},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "mode (object)",
        body: {id: randomString(), password: randomString(), mode: {}},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "mode (array)",
        body: {id: randomString(), password: randomString(), mode: []},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    }
]

const modeEvaluationBeforeAuthenticationTests: EndpointTest[] = [
    {
        name: "tested by schema > value > empty",
        body: {id: '', password: '', mode: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },

    /*
    {
        name: "all empty",
        body: {id: '', password: '', mode: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },

    {
        name: "empty mode + id",
        body: {id: randomString(), password: '', mode: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },

    {
        name: "empty mode + password",
        body: {id: '', password: randomString(), mode: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },

    {
        name: "empty mode + id, password",
        body: {id: randomString(), password: randomString(), mode: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },

    {
        name: "invalid mode + id, password",
        body: {id: randomString(), password: randomString(), mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },
    */
]

const jwtTokenModeTests: EndpointTest[] = [
    {
        name: "invalid mode (empty credentials)",
        body: {id: '', password: '', mode: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt mode'}
    },

    {
        name: "read (empty credentials)",
        body: {id: '', password: '', mode: 'read'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "write (empty credentials)",
        body: {id: '', password: '', mode: 'write'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "write (invalid credentials)",
        body: {id: randomString(), password: randomString(), mode: 'write'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },
]

const invalidAuthenticationTests: EndpointTest[] = [
    {
        name: "empty id + empty password",
        body: {id: '', password: '', mode: 'read'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "empty id + random password",
        body: {id: '', password: randomString(), mode: 'read'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },
    
    {
        name: "empty id + access password",
        body: {id: '', password: infiniteLifetimeAddress1.accessPassword, mode: 'read'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "empty id + master password",
        body: {id: '', password: infiniteLifetimeAddress1.masterPassword, mode: 'read'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "random id + empty password",
        body: {id: randomString(), password: '', mode: 'read'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },
    
    {
        name: "random id + random password",
        body: {id: randomString(), password: randomString(), mode: 'read'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "random id + access password",
        body: {id: randomString(), password: infiniteLifetimeAddress1.accessPassword, mode: 'read'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "random id + master password",
        body: {id: randomString(), password: infiniteLifetimeAddress1.masterPassword, mode: 'read'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },
  
    {
        name: "other id + empty password",
        body: {id: infiniteLifetimeAddress2.id, password: '', mode: 'read'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },
    
    {
        name: "other id + random password",
        body: {id: infiniteLifetimeAddress2.id, password: randomString(), mode: 'read'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "other id + access password",
        body: {id: infiniteLifetimeAddress2.id, password: infiniteLifetimeAddress1.accessPassword, mode: 'read'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "other id + master password",
        body: {id: infiniteLifetimeAddress2.id, password: infiniteLifetimeAddress1.masterPassword, mode: 'read'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "complementary id + master password",
        body: {id: infiniteLifetimeAddress1.id, password: infiniteLifetimeAddress1.masterPassword, mode: 'read'},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },
]

function masterPasswordUsage(): void {
    test("master password not allowed", async () => {

        const result_read = await Promise.resolve(callPostEndpoint('/jwt', {
            id: infiniteLifetimeAddress1.id,
            password: infiniteLifetimeAddress1.masterPassword,
            mode: 'read'
        }))
        expect(result_read.json).toEqual({info: "invalid combination of id and password"})
        expect(result_read.code).toEqual(401)

        const result_write = await Promise.resolve(callPostEndpoint('/jwt', {
            id: infiniteLifetimeAddress1.id,
            password: infiniteLifetimeAddress1.masterPassword,
            mode: 'write'
        }))
        expect(result_write.json).toEqual({info: "invalid combination of id and password"})
        expect(result_write.code).toEqual(401)
    })
}

function readTokenThrottling1(): void {
    test("read token throttling", async () => {

        const result_first = await Promise.resolve(callPostEndpoint('/jwt', {
            id: infiniteLifetimeAddress1.id,
            password: infiniteLifetimeAddress1.accessPassword,
            mode: 'read'
        }))
        expect(result_first.json).not.toEqual({info: ""})
        expect(result_first.code).toEqual(200)

        infiniteLifetimeAddress1.readToken = result_first.json.info

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

function readTokenThrottling2(): void {
    test("one throttling does not interfer other ids", async () => {

        const result_first = await Promise.resolve(callPostEndpoint('/jwt', {
            id: infiniteLifetimeAddress2.id,
            password: infiniteLifetimeAddress2.accessPassword,
            mode: 'read'
        }))
        expect(result_first.json).not.toEqual({info: ""})
        expect(result_first.code).toEqual(200)

        infiniteLifetimeAddress2.readToken = result_first.json.info

        for (let i: number = 0; i < 5; i++){
            const result_loop = await Promise.resolve(callPostEndpoint('/jwt', {
                id: infiniteLifetimeAddress2.id,
                password: infiniteLifetimeAddress2.accessPassword,
                mode: 'read'
            }))
            expect(result_first.json).not.toEqual({info: ""})
            expect(result_loop.code).toEqual(200)
        }


        const result_throttled = await Promise.resolve(callPostEndpoint('/jwt', {
            id: infiniteLifetimeAddress2.id,
            password: infiniteLifetimeAddress2.accessPassword,
            mode: 'read'
        }))
        expect(result_throttled.json).not.toEqual({info: ''})
        expect(result_throttled.code).toEqual(429)
    })
}

function singleWriteToken1(): void {
    test("single write token", async () => {

        const result_first = await Promise.resolve(callPostEndpoint('/jwt', {
            id: infiniteLifetimeAddress1.id,
            password: infiniteLifetimeAddress1.accessPassword,
            mode: 'write'
        }))
        expect(result_first.code).toEqual(200)
        expect(result_first.json).not.toEqual({info: ""})

        infiniteLifetimeAddress1.writeToken = result_first.json.info

        const result_blocked = await Promise.resolve(callPostEndpoint('/jwt', {
            id: infiniteLifetimeAddress1.id,
            password: infiniteLifetimeAddress1.accessPassword,
            mode: 'write'
        }))
        expect(result_blocked.json).toEqual({info: 'write jwt already exists'})
        expect(result_blocked.code).toEqual(409)
    })
}

function singleWriteToken2(): void {
    test("one write token does not block other ids", async () => {

        const result_first = await Promise.resolve(callPostEndpoint('/jwt', {
            id: infiniteLifetimeAddress2.id,
            password: infiniteLifetimeAddress2.accessPassword,
            mode: 'write'
        }))
        expect(result_first.code).toEqual(200)
        expect(result_first.json).not.toEqual({info: ""})

        infiniteLifetimeAddress2.writeToken = result_first.json.info

        const result_blocked = await Promise.resolve(callPostEndpoint('/jwt', {
            id: infiniteLifetimeAddress2.id,
            password: infiniteLifetimeAddress2.accessPassword,
            mode: 'write'
        }))
        expect(result_blocked.json).toEqual({info: 'write jwt already exists'})
        expect(result_blocked.code).toEqual(409)
    })
}
