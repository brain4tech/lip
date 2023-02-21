import Elysia, {t} from 'elysia'
import {EndpointHandler} from './endpointhandler'

const app = new Elysia()
let endpointHandler = new EndpointHandler()

// hello world
app.get('/', () => JSON.stringify({info: 'hello localip-pub'}))

// retrieve ip addresses
app.post('/retrieve', ({body, set}) => {
        const returnObject = endpointHandler.retrieveAddress(body)
        set.status = returnObject.code
        return returnObject.return
    },
    {
        schema: {
            body: t.Object({
                id: t.String()
            }),
            response: t.Object({
                info: t.String()
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
                id: t.String()
            }),
            response: t.Object({
                info: t.String()
            })
        }
    })

// update ip address ip
app.post('/update', ({body, set}) => {
        const returnObject = endpointHandler.updateAddress(body)
        set.status = returnObject.code
        return returnObject.return
    },
    {
        schema: {
            body: t.Object({
                id: t.String(),
                ip_address: t.String()
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
        return {info: 'could not validate json, please check json and content-type'}
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

app.listen(3000)
console.log(`localip-pub running at ${app.server?.hostname}:${app.server?.port}`)
