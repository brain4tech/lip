import {randomString} from "./definitions"

export {infiniteLifetimeAddress1, infiniteLifetimeAddress2}
export {zeroLifetimeAddress1, oneLifetimeAddress1}


type lipAddress = {
    id: string
    accessPassword: string
    masterPassword: string
    lifetime?: number
    readToken?: string
    writeToken?: string
}

const infiniteLifetimeAddress1: lipAddress = {
    id: randomString(),
    accessPassword: randomString(),
    masterPassword: randomString(),
}

const infiniteLifetimeAddress2: lipAddress = {
    id: randomString(),
    accessPassword: randomString(),
    masterPassword: randomString(),
    lifetime: -1
}

const zeroLifetimeAddress1: lipAddress = {
    id: randomString(),
    accessPassword: randomString(),
    masterPassword: randomString(),
    lifetime: 0
}

const oneLifetimeAddress1: lipAddress = {
    id: randomString(),
    accessPassword: randomString(),
    masterPassword: randomString(),
    lifetime: 1
}
