import Elysia, {t} from 'elysia'
import {jwt} from '@elysiajs/jwt'
import {EndpointHandler} from './endpointhandler'
import {Env, printToStdout} from './utils'
import {lipController} from './lip'

export {lip}

/**
 * Evaluate environment variables.
 */
Env.reevaluate()

/**
 * Create app and other application components.
 */
let endpointHandler = new EndpointHandler()
const app = new Elysia()
const lip = new lipController(app)

lip.start()


// ------ endpoint and app behaviour definition ------

app.use(
    jwt({
        name: 'jwt',
        secret: Env.getJwtSecret(),
        exp: '6m'
    })
)

/**
 * Hello world endpoint.
 */
app.get('/', () => JSON.stringify({info: 'hello lip!'}))


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

    if (Env.toStdout)
        printToStdout(`Caught ${error.name}: '${error.message}'`)
    printToStdout(error)

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


// stop internal handlers and close resources.
app.onStop(() => {
    endpointHandler.stop()
})
