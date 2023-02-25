import Elysia, {t} from 'elysia'
import {jwt} from '@elysiajs/jwt'
import {EndpointHandler} from './endpointhandler'

// read JWT secret token from environment variables or set to default
let jwtSecret: string | undefined = Bun.env['LOCALIP_PUB_JWT_SECRET']
jwtSecret = ((jwtSecret === undefined) ? 'g0hZu73c7IpUJUViMJtRkvdVU8pf7tqCCaVisfJK' : jwtSecret)

const app = new Elysia()
app.use(
    jwt({
        name: 'jwt',
        secret: jwtSecret,
        exp: '6m'
    })
)
let endpointHandler = new EndpointHandler()

/**
 * Hello world endpoint.
 */
app.get('/', () => JSON.stringify({info: 'hello localip-pub'}))

/**
 * Create new address.
 */
app.post('/create', ({body, set}) => {
        const returnObject = endpointHandler.createAddress(body)
        set.status = returnObject.code
        return returnObject.return
    },
    {
        schema: {
            body: t.Object({
                id: t.String(),
                access_password: t.String(),
                master_password: t.String(),
                lifetime: t.Optional(t.Number())
            }),
            response: t.Object({
                info: t.String()
            })
        }
    })

/**
 * Update an address.
 */
app.post('/update', async ({body, set, jwt}) => {
        const returnObject = await endpointHandler.updateAddress(body, jwt)
        set.status = returnObject.code
        return returnObject.return
    },
    {
        schema: {
            body: t.Object({
                jwt: t.String(),
                ip_address: t.String()
            }),
            response: t.Object({
                info: t.String(),
                jwt: t.Optional(t.String()),
                last_update: t.Optional(t.Number())
            })
        }
    })

/**
 * Retrieve an address.
 */
app.post('/retrieve', async ({body, set, jwt}) => {
        const returnObject = await endpointHandler.retrieveAddress(body, jwt)
        set.status = returnObject.code
        return returnObject.return
    },
    {
        schema: {
            body: t.Object({
                jwt: t.String()
            }),
            response: t.Object({
                info: t.String(),
                last_update: t.Optional(t.Number()),
                lifetime: t.Optional(t.Number())
            })
        }
    })

/**
 * Delete an address.
 */
app.post('/delete', async ({body, set}) => {
        const returnObject = await endpointHandler.deleteAddress(body)
        set.status = returnObject.code
        return returnObject.return
    },
    {
        schema: {
            body: t.Object({
                id: t.String(),
                password: t.String()
            }),
            response: t.Object({
                info: t.String()
            })
        }
    })

/**
 * Acquire a JWT.
 */
app.post('/jwt', async ({body, set, jwt}) => {
        const returnObject = await endpointHandler.acquireJWT(body, jwt)
        set.status = returnObject.code
        return returnObject.return
    },
    {
        schema: {
            body: t.Object({
                id: t.String(),
                password: t.String(),
                mode: t.String()
            }),
            response: t.Object({
                info: t.String()
            })
        }
    })

/**
 * Invalidate a JWT in write mode.
 */
app.post('/invalidatejwt', async ({body, set, jwt}) => {
        const returnObject = await endpointHandler.invalidateJWT(body, jwt)
        set.status = returnObject.code
        return returnObject.return
    },
    {
        schema: {
            body: t.Object({
                id: t.String(),
                password: t.String(),
                jwt: t.String()
            }),
            response: t.Object({
                info: t.String()
            })
        }
    })

// some error handling
app.onError(({code, set, error}) => {

    console.log(`Caught ${error.name}: '${error.message}'`)

    if (code == 'VALIDATION') {
        set.status = 400
        return {info: 'could not validate json, please check json, content-type and documentation'}
    }

    if (code == 'NOT_FOUND') {
        set.status = 404
        return {info: 'resource does not exist'}
    }

    if (code == 'UNKNOWN' || code == 'INTERNAL_SERVER_ERROR') {
        set.status = 500
        return {info: 'internal server error'}
    }

    return ''
})

// start application on 0.0.0.0 and port 8080
app.listen(8080)
console.log(`localip-pub running at ${app.server?.hostname}:${app.server?.port}`)
