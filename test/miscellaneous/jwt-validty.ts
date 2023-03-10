import {describe, expect, test,} from "bun:test"
import {callPostEndpoint, randomIpv4Address, regenerateWriteJWT} from "../definitions";
import {infiniteLifetimeAddress2, oneLifetimeAddress1, zeroLifetimeAddress1} from "../addresses";

export {jwtValidityTests}

/**
 * Collect all tests.
 */
async function jwtValidityTests(): Promise<void> {

    describe("expired ip addresses", JWTLifetimeExpiredIpTests)
    describe("recreated ip addresses", JWTLifetimeIpRecreationTests)
}

function JWTLifetimeExpiredIpTests(): void {

    test("invalid jwt acquiring on zero-lifetime address", async () => {

        // create zero-lifetime and acquire read and write tokens
        await Promise.resolve(callPostEndpoint('/create', {
            id: zeroLifetimeAddress1.id,
            access_password: zeroLifetimeAddress1.accessPassword,
            master_password: zeroLifetimeAddress1.masterPassword,
            lifetime: zeroLifetimeAddress1.lifetime
        }))

        await Bun.sleep(1100)

        const result = await Promise.resolve(callPostEndpoint('/jwt', {
            id: zeroLifetimeAddress1.id,
            password: zeroLifetimeAddress1.accessPassword,
            mode: 'write'
        }))
        expect(result.code).toEqual(401)
        expect(result.json).toEqual({info: 'invalid combination of id and password'})
    })

    test("invalid reading/writing after address expiration", async () => {

        // create one-second lifetimes, acquire tokens,
        // create zero-lifetime and acquire read and write tokens
        await Promise.resolve(callPostEndpoint('/create', {
            id: oneLifetimeAddress1.id,
            access_password: oneLifetimeAddress1.accessPassword,
            master_password: oneLifetimeAddress1.masterPassword,
            lifetime: oneLifetimeAddress1.lifetime
        }))

        const result_1 = await Promise.resolve(callPostEndpoint('/jwt', {
            id: oneLifetimeAddress1.id,
            password: oneLifetimeAddress1.accessPassword,
            mode: 'write'
        }))
        expect(result_1.code).toEqual(200)
        expect(result_1.json).not.toEqual({info: ''})

        oneLifetimeAddress1.writeToken = result_1.json.info

        const result_2 = await Promise.resolve(callPostEndpoint('/jwt', {
            id: oneLifetimeAddress1.id,
            password: oneLifetimeAddress1.accessPassword,
            mode: 'read'
        }))
        expect(result_2.code).toEqual(200)
        expect(result_2.json).not.toEqual({info: ''})

        oneLifetimeAddress1.readToken = result_2.json.info

        // regenerate write token
        oneLifetimeAddress1.writeToken = await regenerateWriteJWT(oneLifetimeAddress1)

        // update/read data
        const ipAddress = randomIpv4Address()
        const result_3 = await Promise.resolve(callPostEndpoint('/update', {
            jwt: oneLifetimeAddress1.writeToken,
            ip_address: ipAddress
        }))

        expect(result_3.code).toEqual(200)
        expect(result_3.json).not.toEqual({info: ''})
        expect(Object.keys(result_3.json)).toContain('last_update')

        const result_4 = await Promise.resolve(callPostEndpoint('/retrieve', {
            jwt: oneLifetimeAddress1.readToken
        }))

        expect(result_4.code).toEqual(200)
        expect(Object.keys(result_4.json)).toContain('info')
        expect(Object.keys(result_4.json)).toContain('last_update')

        expect(ipAddress).toBe(result_4.json.info)

        // wait a second
        await Bun.sleep(2000)

        // retry reading/writing
        const result_5 = await Promise.resolve(callPostEndpoint('/update', {
            jwt: oneLifetimeAddress1.writeToken,
            ip_address: randomIpv4Address()
        }))
        expect(result_5.code).toEqual(401)
        expect(result_5.json).toEqual({info: 'invalid authentication'})

        const result_6 = await Promise.resolve(callPostEndpoint('/retrieve', {
            jwt: oneLifetimeAddress1.readToken
        }))
        expect(result_6.code).toEqual(401)
        expect(result_6.json).toEqual({info: 'invalid authentication'})

        // retry token acquiring
        expect(await regenerateWriteJWT(oneLifetimeAddress1)).toEqual("invalid combination of id and password")
    })


}

function JWTLifetimeIpRecreationTests(): void {

    test("invalid jwt usage on addresses with prior created and deleted id", async () => {

        // acquire fresh tokens for address
        infiniteLifetimeAddress2.writeToken = await regenerateWriteJWT(infiniteLifetimeAddress2)
        const result = await Promise.resolve(callPostEndpoint('/jwt', {
            id: infiniteLifetimeAddress2.id,
            password: infiniteLifetimeAddress2.accessPassword,
            mode: 'read'
        }))
        infiniteLifetimeAddress2.readToken = result.json.info
        const writeToken = infiniteLifetimeAddress2.writeToken
        const readToken = infiniteLifetimeAddress2.readToken

        // update/read data
        const ipAddress = randomIpv4Address()
        const result_1 = await Promise.resolve(callPostEndpoint('/update', {
            jwt: infiniteLifetimeAddress2.writeToken,
            ip_address: ipAddress
        }))

        expect(result_1.code).toEqual(200)
        expect(result_1.json).not.toEqual({info: ''})
        expect(Object.keys(result_1.json)).toContain('last_update')

        const lastUpdate = result_1.json.last_update

        const result_2 = await Promise.resolve(callPostEndpoint('/retrieve', {
            jwt: infiniteLifetimeAddress2.readToken
        }))
        expect(result_2.code).toEqual(200)

        expect(result_2.json.info).toBe(ipAddress)
        expect(result_2.json.last_update).toBe(lastUpdate)
        expect(result_2.json.lifetime).toBe(-1)

        // delete address
        await Promise.resolve(callPostEndpoint('/delete', {
            id: infiniteLifetimeAddress2.id,
            password: infiniteLifetimeAddress2.masterPassword
        }))

        // recreate address
        const result_3 = await Promise.resolve(callPostEndpoint('/create', {
            id: infiniteLifetimeAddress2.id,
            access_password: infiniteLifetimeAddress2.accessPassword,
            master_password: infiniteLifetimeAddress2.masterPassword
        }))
        expect(result_3.code).toEqual(200)
        expect(result_3.json).toEqual({info: `created new address '${infiniteLifetimeAddress2.id}'`})

        // try reading/writing with old tokens
        const result_4 = await Promise.resolve(callPostEndpoint('/update', {
            jwt: writeToken,
            ip_address: ipAddress
        }))

        expect(result_4.code).toEqual(401)
        expect(result_4.json).toEqual({info: 'invalid authentication'})

        const result_5 = await Promise.resolve(callPostEndpoint('/retrieve', {
            jwt: readToken
        }))
        expect(result_5.code).toEqual(401)
        expect(result_5.json).toEqual({info: 'invalid authentication'})

        infiniteLifetimeAddress2.writeToken = await regenerateWriteJWT(infiniteLifetimeAddress2)
        const result_6 = await Promise.resolve(callPostEndpoint('/jwt', {
            id: infiniteLifetimeAddress2.id,
            password: infiniteLifetimeAddress2.accessPassword,
            mode: 'read'
        }))
        expect(result_6.code).toEqual(200)
        infiniteLifetimeAddress2.readToken = result_2.json.info

    })
}
