import {describe, expect, test,} from "bun:test"
import {callPostEndpoint, testSuite, randomString, randomWhitespacePadding, EndpointTest, randomInt, padString} from "../definitions";
import {infiniteLifetimeAddress1, infiniteLifetimeAddress2, zeroLifetimeAddress1, oneLifetimeAddress1} from "../addresses";

export {createEndpointTests}

/**
 * Collect all tests.
 */
function createEndpointTests(): void {

    describe('schema', () => {
        testSuite('structure', '/create', schemaStructureTests)

        describe('value', () => {
            testSuite('empty', '/create', schemaEmptyValueTests)
            testSuite('whitespace', '/create', schemaWhitespaceValuesTests)
            testSuite('non-value', '/create', schemaNonValueTypeTests)
        })

        describe('optional', () => {
            testSuite('lifetime', '/create', schemaLifetimeTests)
        })
        
    })
    
    describe('value limits', () => {
        testSuite('lifetime range', '/create', lifetimeRangeLimitTests)
    })
    
    unsetLifetimeCreationTests()
    setLifetimeCreationTests()
    zeroLifetimeCreationTests()
    oneSecondLifetimeCreationTests()
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
        name: "access password",
        body: {access_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "master password",
        body: {master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "id + access password",
        body: {id: randomString(), access_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "id + master password",
        body: {id: randomString(), master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "access password + master password",
        body: {access_password: randomString(), master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    }
]

const schemaEmptyValueTests: EndpointTest[] = [
    {
        name: "all",
        body: {id: '', access_password: '', master_password: ''},
        expectedCode: 400,
        expectedBody: {info: 'id cannot be emtpy'}
    },

    {
        name: "id",
        body: {id: randomString(), access_password: '', master_password: ''},
        expectedCode: 400,
        expectedBody: {info: 'access password cannot be emtpy'}
    },

    {
        name: "access password",
        body: {id: '', access_password: randomString(), master_password: ''},
        expectedCode: 400,
        expectedBody: {info: 'id cannot be emtpy'}
    },

    {
        name: "master password",
        body: {id: '', access_password: '', master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'id cannot be emtpy'}
    },
    
    {
        name: "id + access password",
        body: {id: randomString(), access_password: randomString(), master_password: ''},
        expectedCode: 400,
        expectedBody: {info: 'master password cannot be emtpy'}
    },
    
    {
        name: "id + master password",
        body: {id: randomString(), access_password: '', master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'access password cannot be emtpy'}
    },

    {
        name: "access password + master password",
        body: {id: '', access_password: randomString(), master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'id cannot be emtpy'}
    },
]

const schemaWhitespaceValuesTests: EndpointTest[] = [
    {
        name: "id",
        body: {id: randomWhitespacePadding(), access_password: randomString(), master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'id cannot be emtpy'}
    },

    {
        name: "access password",
        body: {id: randomString(), access_password: randomWhitespacePadding(), master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'access password cannot be emtpy'}
    },

    {
        name: "master password",
        body: {id: randomString(), access_password: randomString(), master_password: randomWhitespacePadding()},
        expectedCode: 400,
        expectedBody: {info: 'master password cannot be emtpy'}
    }
]

const schemaNonValueTypeTests: EndpointTest[] = [
    {
        name: "id (null)",
        body: {id: null, access_password: randomString(), master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "id (number)",
        body: {id: randomInt(300), access_password: randomString(), master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "id (object)",
        body: {id: {}, access_password: randomString(), master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "id (array)",
        body: {id: [], access_password: randomString(), master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "access password (null)",
        body: {id: randomString(), access_password: null, master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "access password (number)",
        body: {id: randomString(), access_password: randomInt(300), master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "access password (object)",
        body: {id: randomString(), access_password: {}, master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "access password (array)",
        body: {id: randomString(), access_password: [], master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "master password (null)",
        body: {id: randomString(), access_password: randomString(), master_password: null},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "master password (number)",
        body: {id: randomString(), access_password: randomString(), master_password: randomInt(300)},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "master password (object)",
        body: {id: randomString(), access_password: randomString(), master_password: {}},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "master password (array)",
        body: {id: randomString(), access_password: randomString(), master_password: []},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    }
]

const schemaLifetimeTests: EndpointTest[] = [
    {
        name: "exists in schema",
        body: {id: '', access_password: '', master_password: '', lifetime: -1},
        expectedCode: 400,
        expectedBody: {info: 'id cannot be emtpy'}
    },

    {
        name: "non-value type (null)",
        body: {id: randomString(), access_password: randomString(), master_password: randomString(), lifetime: null},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-value type (string)",
        body: {id: randomString(), access_password: randomString(), master_password: randomString(), lifetime: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-value type (object)",
        body: {id: randomString(), access_password: randomString(), master_password: randomString(), lifetime: {}},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-value type (array)",
        body: {id: randomString(), access_password: randomString(), master_password: randomString(), lifetime: []},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    }
]

const lifetimeRangeLimitTests: EndpointTest[] = [
    {
        name: "-2",
        body: {id: randomString(), access_password: randomString(), master_password: randomString(), lifetime: -2},
        expectedCode: 400,
        expectedBody: {info: 'invalid lifetime setting'}
    },

    {
        name: "31536000 + 1 (1 year)",
        body: {id: randomString(), access_password: randomString(), master_password: randomString(), lifetime: 31536000 + 1},
        expectedCode: 400,
        expectedBody: {info: 'invalid lifetime setting'}
    },
]

function unsetLifetimeCreationTests(): void {
    test("create infinite address 1 (lifetime unset)", async () => {
        const result = await Promise.resolve(callPostEndpoint('/create', {
            id: infiniteLifetimeAddress1.id,
            access_password: infiniteLifetimeAddress1.accessPassword,
            master_password: infiniteLifetimeAddress1.masterPassword
        }))
        expect(result.json).toEqual({info: `created new address '${infiniteLifetimeAddress1.id}'`})
        expect(result.code).toEqual(200)
    })

    test("redoing address 1 creation fails with: 409 'id already exists'", async () => {
        const result = await Promise.resolve(callPostEndpoint('/create', {
            id: infiniteLifetimeAddress1.id,
            access_password: infiniteLifetimeAddress1.accessPassword,
            master_password: infiniteLifetimeAddress1.masterPassword
        }))
        expect(result.json).toEqual({info: 'id already exists'})
        expect(result.code).toEqual(409)
    })
}

function setLifetimeCreationTests(): void {
    test("create infinite address 2 (set lifetime)", async () => {
        const result = await Promise.resolve(callPostEndpoint('/create', {
            id: infiniteLifetimeAddress2.id,
            access_password: infiniteLifetimeAddress2.accessPassword,
            master_password: infiniteLifetimeAddress2.masterPassword,
            lifetime: infiniteLifetimeAddress2.lifetime
        }))
        expect(result.json).toEqual({info: `created new address '${infiniteLifetimeAddress2.id}'`})
        expect(result.code).toEqual(200)
    })

    test("redoing address 2 creation fails with: 409 'id already exists'", async () => {
        const result = await Promise.resolve(callPostEndpoint('/create', {
            id: infiniteLifetimeAddress2.id,
            access_password: infiniteLifetimeAddress2.accessPassword,
            master_password: infiniteLifetimeAddress2.masterPassword,
            lifetime: infiniteLifetimeAddress2.lifetime
        }))
        expect(result.json).toEqual({info: 'id already exists'})
        expect(result.code).toEqual(409)
    })

}

function zeroLifetimeCreationTests(): void {
    test("five zero-lifetime address creations succeed", async () => {

        for (let i: number = 0; i < 5; i++){
            const result = await Promise.resolve(callPostEndpoint('/create', {
                id: zeroLifetimeAddress1.id,
                access_password: zeroLifetimeAddress1.accessPassword,
                master_password: zeroLifetimeAddress1.masterPassword,
                lifetime: zeroLifetimeAddress1.lifetime
            }))
            expect(result.json).toEqual({info: `created new address '${zeroLifetimeAddress1.id}'`})
            expect(result.code).toEqual(200)
        }
    })
}

function oneSecondLifetimeCreationTests(): void {
    test("multiple one-second-lifetime address creation testing", async () => {

        const result1 = await Promise.resolve(callPostEndpoint('/create', {
            id: oneLifetimeAddress1.id,
            access_password: oneLifetimeAddress1.accessPassword,
            master_password: oneLifetimeAddress1.masterPassword,
            lifetime: oneLifetimeAddress1.lifetime
        }))
        expect(result1.json).toEqual({info: `created new address '${oneLifetimeAddress1.id}'`})
        expect(result1.code).toEqual(200)

        const result2 = await Promise.resolve(callPostEndpoint('/create', {
            id: oneLifetimeAddress1.id,
            access_password: oneLifetimeAddress1.accessPassword,
            master_password: oneLifetimeAddress1.masterPassword,
            lifetime: oneLifetimeAddress1.lifetime
        }))
        expect(result2.json).toEqual({info: 'id already exists'})
        expect(result2.code).toEqual(409)

        await Bun.sleep(1000)

        const result3 = await Promise.resolve(callPostEndpoint('/create', {
            id: oneLifetimeAddress1.id,
            access_password: oneLifetimeAddress1.accessPassword,
            master_password: oneLifetimeAddress1.masterPassword,
            lifetime: oneLifetimeAddress1.lifetime
        }))
        expect(result3.json).toEqual({info: `created new address '${oneLifetimeAddress1.id}'`})
        expect(result3.code).toEqual(200)
    
    })
}
