import {expect, test,} from "bun:test"
import {callPostEndpoint, testSuite, randomString, randomWhitespacePadding, EndpointTest, randomInt} from "../definitions";
import {infiniteLifetimeAddress1, infiniteLifetimeAddress2, zeroLifetimeAddress1, oneLifetimeAddress1} from "../addresses";

export {createEndpointTests}

/**
 * Describe all tests here.
 */
const createEndpointTests = () => {
    testSuite('required schema', '/create', schemaTests)
    testSuite('required object values', '/create', schemaObjectValueTests)
    testSuite('optional object values', '/create', schemaLifetimeValueTests)

    createEndpointValidCreationWithoutLifetimeTests()
    createEndpointValidCreationWithLifetimeTests()
}

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
        name: "access password only | non-empty",
        body: {access_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "master password only | non-empty",
        body: {master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "id and access password only",
        body: {id: randomString(), access_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "id and master password only",
        body: {id: randomString(), master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "access and master password only",
        body: {access_password: randomString(), master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    }
]

const schemaObjectValueTests: EndpointTest[] = [

    // leave one attribute emtpy (every attribute once)
    {
        name: "empty values",
        body: {id: '', access_password: '', master_password: ''},
        expectedCode: 400,
        expectedBody: {info: 'id cannot be emtpy'}
    },

    {
        name: "non-empty id",
        body: {id: randomString(), access_password: '', master_password: ''},
        expectedCode: 400,
        expectedBody: {info: 'access password cannot be emtpy'}
    },

    {
        name: "non-empty access password",
        body: {id: '', access_password: randomString(), master_password: ''},
        expectedCode: 400,
        expectedBody: {info: 'id cannot be emtpy'}
    },

    {
        name: "non-empty master password",
        body: {id: '', access_password: '', master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'id cannot be emtpy'}
    },
    
    {
        name: "empty id",
        body: {id: '', access_password: randomString(), master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'id cannot be emtpy'}
    },

    {
        name: "empty access_password",
        body: {id: randomString(), access_password: '', master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'access password cannot be emtpy'}
    },

    {
        name: "empty master password",
        body: {id: randomString(), access_password: randomString(), master_password: ''},
        expectedCode: 400,
        expectedBody: {info: 'master password cannot be emtpy'}
    },

    // set attributes to non-string (integer, sub-object)
    {
        name: "non-string id | null",
        body: {id: null, access_password: randomString(), master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-string id | number",
        body: {id: randomInt(300), access_password: randomString(), master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-string id | object",
        body: {id: {}, access_password: randomString(), master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-string id | array",
        body: {id: [], access_password: randomString(), master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-string access_password | null",
        body: {id: randomString(), access_password: null, master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-string access_password | number",
        body: {id: randomString(), access_password: randomInt(300), master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-string access_password | object",
        body: {id: randomString(), access_password: {}, master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-string access_password | array",
        body: {id: randomString(), access_password: [], master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-string master password | null",
        body: {id: randomString(), access_password: randomString(), master_password: null},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-string master password | number",
        body: {id: randomString(), access_password: randomString(), master_password: randomInt(300)},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-string master password | object",
        body: {id: randomString(), access_password: randomString(), master_password: {}},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-string master password | array",
        body: {id: randomString(), access_password: randomString(), master_password: []},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    // set spaces and newlines in values
    {
        name: "padded id",
        body: {id: randomWhitespacePadding(), access_password: randomString(), master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'id cannot be emtpy'}
    },

    {
        name: "padded access_password",
        body: {id: randomString(), access_password: randomWhitespacePadding(), master_password: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'access password cannot be emtpy'}
    },

    {
        name: "padded master password",
        body: {id: randomString(), access_password: randomString(), master_password: randomWhitespacePadding()},
        expectedCode: 400,
        expectedBody: {info: 'master password cannot be emtpy'}
    },
]

const schemaLifetimeValueTests: EndpointTest[] = [

    // non-number values
    {
        name: "non-number lifetime | null",
        body: {id: randomString(), access_password: randomString(), master_password: randomString(), lifetime: null},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-number lifetime | string",
        body: {id: randomString(), access_password: randomString(), master_password: randomString(), lifetime: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-number lifetime | object",
        body: {id: randomString(), access_password: randomString(), master_password: randomString(), lifetime: {}},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "non-number lifetime | array",
        body: {id: randomString(), access_password: randomString(), master_password: randomString(), lifetime: []},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    // range settings
    {
        name: "below -1 lifetime (-30)",
        body: {id: randomString(), access_password: randomString(), master_password: randomString(), lifetime: -30},
        expectedCode: 400,
        expectedBody: {info: 'invalid lifetime setting'}
    },

    {
        name: "over one year lifetime (31536001)",
        body: {id: randomString(), access_password: randomString(), master_password: randomString(), lifetime: 31536001},
        expectedCode: 400,
        expectedBody: {info: 'invalid lifetime setting'}
    },
]

function createEndpointValidCreationWithoutLifetimeTests(): void {
    test("create infinite address 1 (unset lifetime)", async () => {
        const result = await Promise.resolve(callPostEndpoint('/create', {
            id: infiniteLifetimeAddress1.id,
            access_password: infiniteLifetimeAddress1.accessPassword,
            master_password: infiniteLifetimeAddress1.masterPassword
        }))
        expect(result.json).toEqual({info: `created new address '${infiniteLifetimeAddress1.id}'`})
        expect(result.code).toEqual(200)
    })

    test("double create address 1", async () => {
        const result = await Promise.resolve(callPostEndpoint('/create', {
            id: infiniteLifetimeAddress1.id,
            access_password: infiniteLifetimeAddress1.accessPassword,
            master_password: infiniteLifetimeAddress1.masterPassword
        }))
        expect(result.json).toEqual({info: 'id already exists'})
        expect(result.code).toEqual(409)
    })
}

function createEndpointValidCreationWithLifetimeTests(): void {
    test("create infinite address 2 (lifetime = -1)", async () => {
        const result = await Promise.resolve(callPostEndpoint('/create', {
            id: infiniteLifetimeAddress2.id,
            access_password: infiniteLifetimeAddress2.accessPassword,
            master_password: infiniteLifetimeAddress2.masterPassword,
            lifetime: infiniteLifetimeAddress2.lifetime
        }))
        expect(result.json).toEqual({info: `created new address '${infiniteLifetimeAddress2.id}'`})
        expect(result.code).toEqual(200)
    })

    test("double create address 2", async () => {
        const result = await Promise.resolve(callPostEndpoint('/create', {
            id: infiniteLifetimeAddress2.id,
            access_password: infiniteLifetimeAddress2.accessPassword,
            master_password: infiniteLifetimeAddress2.masterPassword,
            lifetime: infiniteLifetimeAddress2.lifetime
        }))
        expect(result.json).toEqual({info: 'id already exists'})
        expect(result.code).toEqual(409)
    })

    // test zero-lifetime
    test("multiple lifetime == 0 address creation", async () => {

        const result1 = await Promise.resolve(callPostEndpoint('/create', {
            id: zeroLifetimeAddress1.id,
            access_password: zeroLifetimeAddress1.accessPassword,
            master_password: zeroLifetimeAddress1.masterPassword,
            lifetime: zeroLifetimeAddress1.lifetime
        }))
        expect(result1.json).toEqual({info: `created new address '${zeroLifetimeAddress1.id}'`})
        expect(result1.code).toEqual(200)

        const result2 = await Promise.resolve(callPostEndpoint('/create', {
            id: zeroLifetimeAddress1.id,
            access_password: zeroLifetimeAddress1.accessPassword,
            master_password: zeroLifetimeAddress1.masterPassword,
            lifetime: zeroLifetimeAddress1.lifetime
        }))
        expect(result2.json).toEqual({info: `created new address '${zeroLifetimeAddress1.id}'`})
        expect(result2.code).toEqual(200)

        const result3 = await Promise.resolve(callPostEndpoint('/create', {
            id: zeroLifetimeAddress1.id,
            access_password: zeroLifetimeAddress1.accessPassword,
            master_password: zeroLifetimeAddress1.masterPassword,
            lifetime: zeroLifetimeAddress1.lifetime
        }))
        expect(result3.json).toEqual({info: `created new address '${zeroLifetimeAddress1.id}'`})
        expect(result3.code).toEqual(200)
    })

    // test 1 second lifetime
    test("multiple lifetime == 1 address creation", async () => {

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