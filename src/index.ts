import Elysia, {t} from 'elysia'
import { jwt } from '@elysiajs/jwt'
import {EndpointHandler} from './endpointhandler'

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

// hello world
app.get('/', () => JSON.stringify({info: 'hello localip-pub'}))

// retrieve ip addresses
app.post('/retrieve', async ({body, set, jwt}) => {
        const returnObject = await endpointHandler.retrieveAddress(body, jwt)
        set.status = returnObject.code
        return returnObject.return
    },
    {
        schema: {
            body: t.Union(
                [
                    t.Object({
                        id: t.String(),
                        password: t.String(),
                    }),
                    t.Object({
                        jwt: t.String()
                    })
                ]
            ),
            response: t.Object({
                info: t.String(),
                last_update: t.Optional(t.Number())
            })
        }
    })

// create new ip address id
app.post('/create', ({body, set}) => {
        const returnObject = endpointHandler.createAddress(body)
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

// update ip address ip
app.post('/update', async ({body, set, jwt}) => {
        const returnObject = await endpointHandler.updateAddress(body, jwt)
        set.status = returnObject.code
        return returnObject.return
    },
    {
        schema: {
            body: t.Union(
                [
                    t.Object({
                        id: t.String(),
                        password: t.String(),
                    }),
                    t.Object({
                        jwt: t.String()
                    })
                ]
            ),
            response: t.Object({
                info: t.String(),
                last_update: t.Optional(t.Number())
            })
        }
    })

// acquire jwt
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

// invalidate jwt in write mode
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

// error handling
app.onError(({code, set, error}) => {

    console.log("An error occurred:")
    console.log(error)

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

app.listen(8080)
console.log(`localip-pub running at ${app.server?.hostname}:${app.server?.port}`)
