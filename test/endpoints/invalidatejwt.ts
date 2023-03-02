import {describe, expect, test,} from "bun:test"
import {callPostEndpoint, testSuite, randomString, randomWhitespacePadding, EndpointTest, randomInt} from "../definitions";
import {infiniteLifetimeAddress1, infiniteLifetimeAddress2} from "../addresses";

export {invalidatejwtEndpointTests}

/**
 * Collect all tests.
 */
async function invalidatejwtEndpointTests(): Promise<void> {

    describe('schema', () => {
        testSuite('structure', '/invalidatejwt', schemaStructureTests)

        describe('value', () => {
            testSuite('empty', '/invalidatejwt', schemaEmptyValueTests)
            testSuite('whitespace', '/invalidatejwt', schemaWhitespaceValuesTests)
            testSuite('non-value', '/invalidatejwt', schemaNonValueTypeTests)
        })        
    })
    
    describe('value limits', () => {
        testSuite('empty jwt validation before authentication', '/invalidatejwt', jwtEvaluationBeforeAuthenticationTests)
    })
    
    testSuite('authentication', '/invalidatejwt', [], generateInvalidAuthenticationTests)
    testSuite('authenticated jwt validity', '/invalidatejwt', [], generateInvalidTokenTests)

    successfulInvalidation()
    createNewJWTButInvalidateOldInvalidation()
    invalidTokenOnOtherId()
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
        name: "jwt",
        body: {jwt: randomString()},
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
        name: "id + jwt",
        body: {id: randomString(), jwt: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "password + jwt",
        body: {password: randomString(), jwt: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    }
]

const schemaEmptyValueTests: EndpointTest[] = [
    {
        name: "all",
        body: {id: '', password: '', jwt: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt'}
    },

    {
        name: "id",
        body: {id: randomString(), password: '', jwt: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt'}
    },

    {
        name: "password",
        body: {id: '', password: randomString(), jwt: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt'}
    },

    {
        name: "jwt",
        body: {id: '', password: '', jwt: randomString()},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },
    
    {
        name: "id + password",
        body: {id: randomString(), password: randomString(), jwt: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt'}
    },
    
    {
        name: "id + jwt",
        body: {id: randomString(), password: '', jwt: randomString()},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "password + jwt",
        body: {id: '', password: randomString(), jwt: randomString()},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },
]

const schemaWhitespaceValuesTests: EndpointTest[] = [
    {
        name: "id",
        body: {id: randomWhitespacePadding(), password: randomString(), jwt: randomString()},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "password",
        body: {id: randomString(), password: randomWhitespacePadding(), jwt: randomString()},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "jwt",
        body: {id: randomString(), password: randomString(), jwt: randomWhitespacePadding()},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt'}
    }
]

const schemaNonValueTypeTests: EndpointTest[] = [
    {
        name: "id (null)",
        body: {id: null, password: randomString(), jwt: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "id (number)",
        body: {id: randomInt(300), password: randomString(), jwt: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "id (object)",
        body: {id: {}, password: randomString(), jwt: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "id (array)",
        body: {id: [], password: randomString(), jwt: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "password (null)",
        body: {id: randomString(), password: null, jwt: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "password (number)",
        body: {id: randomString(), password: randomInt(300), jwt: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "password (object)",
        body: {id: randomString(), password: {}, jwt: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "password (array)",
        body: {id: randomString(), password: [], jwt: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "jwt (null)",
        body: {id: randomString(), password: randomString(), jwt: null},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "jwt (number)",
        body: {id: randomString(), password: randomString(), jwt: randomInt(300)},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "jwt (object)",
        body: {id: randomString(), password: randomString(), jwt: {}},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "jwt (array)",
        body: {id: randomString(), password: randomString(), jwt: []},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    }
]

const jwtEvaluationBeforeAuthenticationTests: EndpointTest[] = [
    {
        name: "tested by schema > value > empty",
        body: {id: '', password: '', jwt: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt'}
    },

    /*
    {
        name: "all empty",
        body: {id: '', password: '', jwt: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt'}
    },

    {
        name: "empty jwt + id",
        body: {id: randomString(), password: '', jwt: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt'}
    },

    {
        name: "empty jwt + password",
        body: {id: '', password: randomString(), jwt: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt'}
    },

    {
        name: "empty jwt + id, password",
        body: {id: randomString(), password: randomString(), jwt: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt'}
    },

    {
        name: "invalid jwt + id, password",
        body: {id: randomString(), password: randomString(), jwt: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt'}
    },
    */
]

function generateInvalidAuthenticationTests(): EndpointTest[] {return [
    {
        name: "empty id + empty password",
        body: {id: '', password: '', jwt: infiniteLifetimeAddress1.writeToken},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "empty id + random password",
        body: {id: '', password: randomString(), jwt: infiniteLifetimeAddress1.writeToken},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },
    
    {
        name: "empty id + access password",
        body: {id: '', password: infiniteLifetimeAddress1.accessPassword, jwt: infiniteLifetimeAddress1.writeToken},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "empty id + master password",
        body: {id: '', password: infiniteLifetimeAddress1.masterPassword, jwt: infiniteLifetimeAddress1.writeToken},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "random id + empty password",
        body: {id: randomString(), password: '', jwt: infiniteLifetimeAddress1.writeToken},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },
    
    {
        name: "random id + random password",
        body: {id: randomString(), password: randomString(), jwt: infiniteLifetimeAddress1.writeToken},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "random id + access password",
        body: {id: randomString(), password: infiniteLifetimeAddress1.accessPassword, jwt: infiniteLifetimeAddress1.writeToken},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "random id + master password",
        body: {id: randomString(), password: infiniteLifetimeAddress1.masterPassword, jwt: infiniteLifetimeAddress1.writeToken},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },
  
    {
        name: "other id + empty password",
        body: {id: infiniteLifetimeAddress2.id, password: '', jwt: infiniteLifetimeAddress1.writeToken},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },
    
    {
        name: "other id + random password",
        body: {id: infiniteLifetimeAddress2.id, password: randomString(), jwt: infiniteLifetimeAddress1.writeToken},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "other id + access password",
        body: {id: infiniteLifetimeAddress2.id, password: infiniteLifetimeAddress1.accessPassword, jwt: infiniteLifetimeAddress1.writeToken},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "other id + master password",
        body: {id: infiniteLifetimeAddress2.id, password: infiniteLifetimeAddress1.masterPassword, jwt: infiniteLifetimeAddress1.writeToken},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },

    {
        name: "complementary id + master password",
        body: {id: infiniteLifetimeAddress1.id, password: infiniteLifetimeAddress1.masterPassword, jwt: infiniteLifetimeAddress1.writeToken},
        expectedCode: 401,
        expectedBody: {info: 'invalid combination of id and password'}
    },
]}

function generateInvalidTokenTests(): EndpointTest[] {return [

    {
        name: "empty jwt",
        body: {id: infiniteLifetimeAddress1.id, password: infiniteLifetimeAddress1.accessPassword, jwt: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt'}
    },

    {
        name: "random jwt",
        body: {id: infiniteLifetimeAddress1.id, password: infiniteLifetimeAddress1.accessPassword, jwt: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt'}
    },

    {
        name: "invalid jwt (read mode)",
        body: {id: infiniteLifetimeAddress1.id, password: infiniteLifetimeAddress1.accessPassword, jwt: infiniteLifetimeAddress1.readToken},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt'}
    },

    {
        name: "invalid jwt (other read token)",
        body: {id: infiniteLifetimeAddress1.id, password: infiniteLifetimeAddress1.accessPassword, jwt: infiniteLifetimeAddress2.readToken},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt'}
    },

    {
        name: "invalid jwt (other write token)",
        body: {id: infiniteLifetimeAddress1.id, password: infiniteLifetimeAddress1.accessPassword, jwt: infiniteLifetimeAddress2.writeToken},
        expectedCode: 400,
        expectedBody: {info: 'invalid jwt'}
    },
]}

function successfulInvalidation(): void {
    test("successful invalidation", async () => {
        const result_first = await Promise.resolve(callPostEndpoint('/invalidatejwt', {
            id: infiniteLifetimeAddress1.id,
            password: infiniteLifetimeAddress1.accessPassword,
            jwt: infiniteLifetimeAddress1.writeToken
        }))
        expect(result_first.code).toEqual(200)
        expect(result_first.json).toEqual({info: ""})
    })

    test("jwt cannot be invalidated twice", async () => {
        const result_first = await Promise.resolve(callPostEndpoint('/invalidatejwt', {
            id: infiniteLifetimeAddress1.id,
            password: infiniteLifetimeAddress1.accessPassword,
            jwt: infiniteLifetimeAddress1.writeToken
        }))
        expect(result_first.code).toEqual(400)
        expect(result_first.json).toEqual({info: "invalid jwt"})
    })
}

function createNewJWTButInvalidateOldInvalidation(): void {
    test("invalidation of old token after creating a new one", async () => {

        const oldToken = infiniteLifetimeAddress1.writeToken

        // ensure it's invalid
        const result_1 = await Promise.resolve(callPostEndpoint('/invalidatejwt', {
            id: infiniteLifetimeAddress1.id,
            password: infiniteLifetimeAddress1.accessPassword,
            jwt: oldToken
        }))
        expect(result_1.code).toEqual(400)
        expect(result_1.json).toEqual({info: "invalid jwt"})

        // generate new token
        const result_2 = await Promise.resolve(callPostEndpoint('/jwt', {
            id: infiniteLifetimeAddress1.id,
            password: infiniteLifetimeAddress1.accessPassword,
            mode: 'write'
        }))
        expect(result_2.code).toEqual(200)
        expect(result_2.json).not.toEqual({info: ""})

        infiniteLifetimeAddress1.writeToken = result_2.json.info

        // old token is still invalid
        const result_3 = await Promise.resolve(callPostEndpoint('/invalidatejwt', {
            id: infiniteLifetimeAddress1.id,
            password: infiniteLifetimeAddress1.accessPassword,
            jwt: oldToken
        }))
        expect(result_3.code).toEqual(400)
        expect(result_3.json).toEqual({info: "invalid jwt"})

    })
}

function invalidTokenOnOtherId(): void {
    test("invalid token on other id", async () => {

        const token = infiniteLifetimeAddress1.writeToken

        // invalidate old token
        const result_1 = await Promise.resolve(callPostEndpoint('/invalidatejwt', {
            id: infiniteLifetimeAddress1.id,
            password: infiniteLifetimeAddress1.accessPassword,
            jwt: token
        }))
        expect(result_1.code).toEqual(200)
        expect(result_1.json).toEqual({info: ""})

        // use invalid token on other id
        const result_2 = await Promise.resolve(callPostEndpoint('/invalidatejwt', {
            id: infiniteLifetimeAddress2.id,
            password: infiniteLifetimeAddress2.accessPassword,
            jwt: token
        }))
        expect(result_2.code).toEqual(400)
        expect(result_2.json).toEqual({info: "invalid jwt"})

        // generate new write token for further use
        const result_3 = await Promise.resolve(callPostEndpoint('/jwt', {
            id: infiniteLifetimeAddress1.id,
            password: infiniteLifetimeAddress1.accessPassword,
            mode: 'write'
        }))
        expect(result_3.code).toEqual(200)
        expect(result_3.json).not.toEqual({info: ""})
        infiniteLifetimeAddress1.writeToken = result_3.json.info
    })
}
