

import {describe, expect, test,} from "bun:test"
import {callPostEndpoint, testSuite, randomString, randomWhitespacePadding, EndpointTest, randomInt, randomIpv4Address, randomIpv6Address, regenerateWriteJWT} from "../definitions";
import {infiniteLifetimeAddress1, infiniteLifetimeAddress2} from "../addresses";

export {updateEndpointTests}

/**
 * Collect all tests.
 */
async function updateEndpointTests(): Promise<void> {

    describe('schema', () => {
        testSuite('structure', '/update', schemaStructureTests)

        describe('value', () => {
            testSuite('empty', '/update', schemaEmptyValueTests)
            testSuite('whitespace', '/update', schemaWhitespaceValuesTests)
            testSuite('non-value', '/update', schemaNonValueTypeTests)
        })        
    })
    
    describe('value limits', () => {
        testSuite('empty ip address validation before authentication', '/update', ipAddressEvaluationBeforeAuthenticationTests)

        testSuite('ip address validity', '/update', ipAddressValidty)
    })
    
    testSuite('authentication', '/update', [], generateInvalidAuthenticationTests)
    testSuite('invalid jwt authentication', '/update', [], generateInvalidAuthenticationTests)
    
    invalidJWTAuthentication()
    successfulUpdates()

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
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "ip_address",
        body: {ip_address: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "jwt + ip_address + invalid",
        body: {jwt: randomString(), ip_address: randomString(), [randomString()]: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },
]

const schemaEmptyValueTests: EndpointTest[] = [
    {
        name: "all",
        body: {jwt: '', ip_address: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid ip address'}
    },

    {
        name: "jwt",
        body: {jwt: randomString(), ip_address: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid ip address'}
    },

    {
        name: "ip_address",
        body: {jwt: '', ip_address: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'invalid ip address'}
    },
    
]

const schemaWhitespaceValuesTests: EndpointTest[] = [
    {
        name: "jwt",
        body: {jwt: randomWhitespacePadding(), ip_address: randomIpv4Address()},
        expectedCode: 401,
        expectedBody: {info: 'invalid authentication'}
    },

    {
        name: "ip_address",
        body: {jwt: randomString(), ip_address: randomWhitespacePadding()},
        expectedCode: 400,
        expectedBody: {info: 'invalid ip address'}
    }
]

const schemaNonValueTypeTests: EndpointTest[] = [

    {
        name: "jwt (null)",
        body: { jwt: null, ip_address: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "jwt (number)",
        body: {jwt: randomInt(300), ip_address: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "jwt (object)",
        body: {jwt: {}, ip_address: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "jwt (array)",
        body: {jwt: [], ip_address: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "ip_address (null)",
        body: {jwt: randomString(), ip_address: null},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "ip_address (number)",
        body: {jwt: randomString(), ip_address: randomInt(300)},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "ip_address (object)",
        body: {jwt: randomString(), ip_address: {}},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    },

    {
        name: "ip_address (array)",
        body: {jwt: randomString(), ip_address: []},
        expectedCode: 400,
        expectedBody: {info: 'could not validate json, please check json, content-type and documentation'}
    }
]

const ipAddressEvaluationBeforeAuthenticationTests: EndpointTest[] = [
    {
        name: "tested by schema > value > empty",
        body: {jwt: '', ip_address: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid ip address'}
    },
]

const ipAddressValidty: EndpointTest[] = [
    {
        name: "empty ip address",
        body: {jwt: '', ip_address: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid ip address'}
    },

    {
        name: "random string",
        body: {jwt: '', ip_address: randomString()},
        expectedCode: 400,
        expectedBody: {info: 'invalid ip address'}
    },

    {
        name: "invalid ipv4 (1)",
        body: {jwt: '', ip_address: "0.0.0.300"},
        expectedCode: 400,
        expectedBody: {info: 'invalid ip address'}
    },

    {
        name: "invalid ipv4 (2)",
        body: {jwt: '', ip_address: "256.0.0.0"},
        expectedCode: 400,
        expectedBody: {info: 'invalid ip address'}
    },

    {
        name: "invalid ipv4 (3)",
        body: {jwt: '', ip_address: "256.0.0..0"},
        expectedCode: 400,
        expectedBody: {info: 'invalid ip address'}
    },

    {
        name: "invalid ipv4 (4)",
        body: {jwt: '', ip_address: "256.0.0.0."},
        expectedCode: 400,
        expectedBody: {info: 'invalid ip address'}
    },

    {
        name: "invalid ipv4 (5)",
        body: {jwt: '', ip_address: "256.0.0"},
        expectedCode: 400,
        expectedBody: {info: 'invalid ip address'}
    },

    {
        name: "invalid ipv6 (1)",
        body: {jwt: '', ip_address: '::x'},
        expectedCode: 400,
        expectedBody: {info: 'invalid ip address'}
    },

    {
        name: "invalid ipv6 (2)",
        body: {jwt: '', ip_address: "x::a"},
        expectedCode: 400,
        expectedBody: {info: 'invalid ip address'}
    },

    {
        name: "invalid ipv6 (3)",
        body: {jwt: '', ip_address: "1:1:1:1:1:1:1:1:1"},
        expectedCode: 400,
        expectedBody: {info: 'invalid ip address'}
    },

    {
        name: "invalid ipv6 (4)",
        body: {jwt: '', ip_address: "1:1:1:1:1:1:1:1:"},
        expectedCode: 400,
        expectedBody: {info: 'invalid ip address'}
    },

    {
        name: "invalid ipv6 (5)",
        body: {jwt: '', ip_address: "1:1:1:1:1:1:1::1"},
        expectedCode: 400,
        expectedBody: {info: 'invalid ip address'}
    },

    {
        name: "valid ipv4",
        body: {jwt: '', ip_address: randomIpv4Address()},
        expectedCode: 401,
        expectedBody: {info: 'invalid authentication'}
    },

    {
        name: "valid ipv6",
        body: {jwt: '', ip_address: randomIpv6Address()},
        expectedCode: 401,
        expectedBody: {info: 'invalid authentication'}
    },
    
]

function generateInvalidAuthenticationTests(): EndpointTest[] {return [
    {
        name: "empty jwt + empty ip address",
        body: {jwt: '', ip_address: ''},
        expectedCode: 400,
        expectedBody: {info: 'invalid ip address'}
    },

    {
        name: "empty jwt + random ip address",
        body: {jwt: '', ip_address: randomIpv4Address()},
        expectedCode: 401,
        expectedBody: {info: 'invalid authentication'}
    },

    {
        name: "random jwt + empty ip address",
        body: {jwt: randomString(), ip_address: randomIpv4Address()},
        expectedCode: 401,
        expectedBody: {info: 'invalid authentication'}
    },
    
    {
        name: "access jwt + random ip address",
        body: {jwt: infiniteLifetimeAddress1.accessPassword, ip_address: randomIpv4Address()},
        expectedCode: 401,
        expectedBody: {info: 'invalid authentication'}
    },
    
    {
        name: "other access jwt + random ip address",
        body: {jwt: infiniteLifetimeAddress2.accessPassword, ip_address: randomIpv4Address()},
        expectedCode: 401,
        expectedBody: {info: 'invalid authentication'}
    }
]}

function invalidJWTAuthentication(): void {

    test("invalid write jwt", async () => {

        const oldToken = infiniteLifetimeAddress1.writeToken
        infiniteLifetimeAddress1.writeToken = await regenerateWriteJWT(infiniteLifetimeAddress1)

        const result = await Promise.resolve(callPostEndpoint('/update', {
            jwt: oldToken,
            ip_address: randomIpv4Address()
        }))

        expect(result.code).toEqual(401)
        expect(result.json).toEqual({info: 'invalid authentication'})
    })
}

function successfulUpdates(): void {
    test("successful update", async () => {

        const result = await Promise.resolve(callPostEndpoint('/update', {
            jwt: infiniteLifetimeAddress1.writeToken,
            ip_address: randomIpv4Address()
        }))

        expect(result.code).toEqual(200)
        expect(result.code).not.toEqual({info: ''})
        expect(Object.keys(result.json)).toContain('info')
        expect(Object.keys(result.json)).toContain('last_update')
    })
}