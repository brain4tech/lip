import {describe, expect, test} from "bun:test"
import {callIndexEndpoint} from "./definitions";
import {createEndpointTests} from "./endpoints/create";
import {jwtEndpointTests} from "./endpoints/jwt";

import {lip} from '../src'

export {endpointBase}

const endpointBase = `http://${lip.hostname}:${lip.port}`
console.log("Testing on", endpointBase, '\n')

/**
 * Describe all tests here.
 */
describe("index endpoint", () => {
    test("just fetchin'", async () => {
        const result = await Promise.resolve(callIndexEndpoint())
        expect(result.json).toEqual({info: "hello lip!"})
        expect(result.code).toEqual(200)
    })

})

describe("/create", createEndpointTests)
describe("/jwt", jwtEndpointTests)

/*
afterAll(() => {
    console.log("AFTER ALL")
    lip.stop()
    deleteTestingDatabase()
  }
)  

function deleteTestingDatabase(): void {
    const dbNameFromEnv = Bun.env['LIP_DB_NAME']
    console.log("HEHEHEHE")
    if (!dbNameFromEnv) return
    unlink(dbNameFromEnv, () => {})
}
*/