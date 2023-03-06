<h1>lip</h1>

**Publish and retrieve your local ip addresses!**

*lip* (acronym for *Local Ip Publisher*) is a small webservice for publishing and retrieving (local) ip addresses, written in Typescript. It's mainly designed for distributed architectures that run in local networks, but are not able to find each other through local solutions (e.g. multicasts).

It's ...
- **fast** and **lightweight** by using [bun](https://bun.sh/) as its javascript runtime, [ElysiaJS](https://elysiajs.com/) as the [fastest web framework](https://github.com/SaltyAom/bun-http-framework-benchmark) currently available and SQLite for a local database
- **small**, the project only focusses on being what's intended to be
- **extensible**, so alternative web frameworks and runtimes can be used if desired (you will need to rewrite some code tho)
- **easy-to-use** and **straight-forward**, because we don't like complicated APIs

***lip* is currently in development. While the `main` branch can be used in production, not all required (security) features are included. The application starts on `0.0.0.0:8080` by default.**

<h2>Table of Contents</h2>

- [How to use it](#how-to-use-it)
  - [Local installation](#local-installation)
  - [Docker](#docker)
  - [Docker compose](#docker-compose)
  - [Environment variables](#environment-variables)
  - [Final notice](#final-notice)
- [Missing features and ToDo's](#missing-features-and-todos)
- [A bit on the Why's](#a-bit-on-the-whys)
- [Documentation](#documentation)
  - [Concepts](#concepts)
    - [Authentication](#authentication)
    - [Lifetimes](#lifetimes)
  - [API endpoint reference](#api-endpoint-reference)
    - [`/` (GET)](#-get)
    - [`/create`](#create)
    - [`/update`](#update)
    - [`/retrieve`](#retrieve)
    - [`/delete`](#delete)
    - [`/jwt`](#jwt)
    - [`/invalidatejwt`](#invalidatejwt)
- [FAQ](#faq)
  - [Why this project and idea?](#why-this-project-and-idea)
  - [Why Bun and Typescript?](#why-bun-and-typescript)
  - [How can *lip* be extended towars my needs?](#how-can-lip-be-extended-towars-my-needs)
  - [Dude, why is the code so bad? Are you a beginner?](#dude-why-is-the-code-so-bad-are-you-a-beginner)


## How to use it

### Local installation
Prerequesites:
- working [bun](https://bun.sh/) environment
- this repository

Then, run
```sh
bun run src/index.ts
```

and you are good to go.

### Docker

Clone this repository and execute
```sh
docker build -t lip .
```

You can now run the application with
```sh
docker run -p 8080:8080 -it lip
```

### Docker compose
Rename `docker-compose_template.yaml` to `docker-compose.yaml` and modify/remove the environment variables as you like.

```yaml
version: "3.9"
services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - LIP_HOSTNAME: <HOSTNAME>
      - LIP_PORT: <PORT>
      - LIP_DB_NAME: <MY_DB_NAME>
      - LIP_JWT_SECRET: <MY_JWT_SECRET>
      - LIP_TO_STDOUT: <TO_STDOUT>
    container_name: lip
    restart: always
```

Then, run
```sh
docker compose up -d
```

and the container should be build and executed automagically.

### Environment variables

**`LIP_HOSTNAME`**<br>
Change hostname *lip* starts on. *0.0.0.0* by default.

**`LIP_PORT`**<br>
Change port *lip* starts on. *8080* by default.

**`LIP_DB_NAME`**<br>
*lip* creates a new SQLite database called `lip.sqlite` at the directory you started the command from. You can change this by setting the variable to the directory and name of your choice.

**`LIP_JWT_SECRET`**<br>
JWT generation and validation requires a secret token. *lip* generates a new secret on every startup, but it is advised to use your own one.

**`LIP_TO_STDOUT`**<br>
In case you do not want *lip* to print anything to the console, set the variable to 'false'. Every other value will keep *lip* printing.

### Final notice
You'll be better when using this solution in a closed, project-intern environment. Because of it's small footprint, it can be easily deployed on an existing project server, behind a secure proxy. This way, id's and ip's stay internal and id's do most likely not collide.


## Missing features and ToDo's
*lip* is in early development. The `main` branch will contain stable releases, whereas development takes place in `dev` and features are developed in `feat/<feature-name>` branches.

Currently, there are several features missing for the project to be "completed":

-  [ ] use bcrypt password hashing instead of sha256 for improved security and/or password salting
-  [x] source code documentation
-  [x] endpoint tests
-  [x] protect reading/writing id's using passwords
-  [x] use JWTs for regular address updating
-  [x] add JWT requiring cooldown + modify JWT expire date
-  [x] add lifetime for id to free it after certain amount of time (infinite should also be possible)
-  [x] easy deployment with docker and docker compose
-  [ ] overview on existing id's and their lifetime

Possible features for post project completion could be:
- a password reset feature, connected to an email
- multiple sdk implementations for both publishing and retrieving ip addresses
- multiplattform cli for application usage from the command line

## A bit on the Why's
Basically *lip* is a text-sharing application, where each text is secured with a pre-known id and password. So when starting a "server" and "client" that should communicate, but are unable to find each other (because of e.g. outer restrictions), they can use the set id and password to publish and retrieve the correct ip addresses.

*Mabye an example explains it better.*
<br>You have an architecture (let's say server-client) that is supposed to be run in a local, dynamic network/environment. Unfortunately, the client cannot find the server through existing solutions (like broadcasts or multicasts) and you don't like typing ip addresses manually or hole punching your network.
<br>This means you need a *small*, *easy to host* web application that is freely accessible on the web by all your architecture participants. But because it's on the open web, you need password protection. And because the application may be moved to another location and clients may vary, you need a fixed id that is reserved and can be shipped to the client.

A tangible example would be a server on a local machine and a web application that requires data from the local machine. The web application needs to directly access the local machine, but is unable to find it's ip address (multicasts are disabled within the browser sandbox). Now you can take a small detour with this application, retrieve the needed ip address and directly communicate with your local server.

## Documentation

### Concepts
#### Authentication

**TLDR;**
- when creating an ip at [`/create`](#create), you'll need to specify an *access* and *master* password
- updating and retrieving ip addresses require a JWT
- possible token modes are *read* (only usable at [`/retrieve`](#retrieve)) and *write* (only usable at [`/update`](#update))
- get a JWT at [`/jwt`](#jwt) by providing credential and a token mode
- JWTs can be acquired with *access* passwords only
- tokens expire after 6 minutes
- the creation of *read*-tokens is limited to 6 tokens per minute per id
- *write*-tokens should be invalidated at [`/invalidatejwt`](#invalidatejwt) after usage
- an ip can be deleted at [`/delete`](#delete) with the *master* password only
- when deleting an ip, all existing tokens for that id won't be usable again, even if id is recreated afterwards

When creating a new id, you'll be required to define two passwords. This is to protect the stored ip from being read, changed or deleted by unauthorized users. There are two types of passwords: *access* passwords and *master* passwords. While the *access* password can be shared with other clients/users, the *master* password should be kept internal. You cannot update or retrieve ip addresses with credentials. You'll need a JWT.

To create a JWT, use the [`/jwt`](#jwt) endpoint. Authenticate with id and *access* password, and set a JWt mode. There are two available modes: *read* and *write*. *read*-tokens can only be used at [`/retrieve`](#retrieve), and *write*-tokens can only be used at [`/update`](#update). In addition, a *write*-token can be generated only once per id, while there are "infinite" *read*-tokens (rate limited to 6/minute per id). Once a *write*-token has been generated, the id can only be updated through the valid JWT. Tokens last for 6 minutes. 

*read*-tokens stay valid over multiple application restarts, while *write*-tokens need to be created after every restart. To invalidate all existing tokens, modify the JWT secret. It should be best practice to invalidate *write*-tokens at [`/invalidatejwt`](#invalidatejwt) after usage. This happens automatically after 6 minutes, but during this time, no other *write*-token can be created.

When deleting an id `a` and recreating it (`a'`), all existing JWTs for `a` will not work for `a'`. This ensures that JWTs must be generated for every "new" id. An id can be deleted at [`/delete`](#delete) using the *master* password.

#### Lifetimes
Each token can have a lifetime, measured in seconds. It can be set to everything between -1 and 31536000 (one year). `-1` stands for infinite, `0` for a token deletion within the next second. The lifetime is automatically refreshed with each token update.

Token lifetimes are evaluated lazily. Thus exceeded id are deleted on the next access attempt.

### API endpoint reference
Some general things to consider, before going into the details:
- if not specified, all endpoints are `POST`
- JSON is the only supported body content type. Make sure to set the `Content-Type`-header to `application/json`, else the application won't work and you'll receive a non-`200` status code
- you'll always get a meaningful status code and response JSON `{"info": "<info here>"}` (specified per endpoint)
- `info` always contains some information in case of an error, `200`'s don't contain more information except when specified

The return JSON examples below are only returned on code `200`.

---

#### `/` (GET)
*Check service availability.*

**Returns:**
```json
{
    "info": "hello lip!"
}
```
- `200`, `info` contains 'hello lip!'

---

#### `/create`
*Creates a new id to store an ip address.*

**Requires:**
```json
{
    "id": "<new_id>",
    "access_password": "<access_password>",
    "master_password": "<master_password>",
    "lifetime": -1
}
```

**Returns:**
```json
{
    "info": "created new address '<new_id>'"
}
```
- `200` on a successful id creation
- `400` on invalid id, passwords or lifetime
- `409` if the id already exists

---

#### `/update`
*Updates an id.*

**Requires:**
```json
{
    "jwt": "<jwt>",
    "ip_address": "<ip address>"
}
```

**Returns:**
```json
{
    "info": "",
    "last_update": -1
}
```

- `200` on a successful update
- `400` invalid ip address
- `401` invalid authentication (invalid JWT, wrong JWT mode)

---

#### `/retrieve`
*Gets the ip address to an id.*

**Requires:**
```json
{
    "jwt": "<jwt>"
}
```

**Returns:**
```json
{
    "info": "<ip address>",
    "last_update": -1,
    "lifetime": -1
}
```

- `200` on a successful update
- `401` invalid authentication (invalid JWT, wrong JWT mode)

---

#### `/delete`
*Delete an id.*

**Requires:**
```json
{
    "id": "<id>",
    "password": "<master password>"
}
```

**Returns:**
```json
{
    "info": "deleted address '<id>'"
}
```
- `200` on a successful id creation
- `401` invalid authentication (id does not exist, wrong password)

---

#### `/jwt`
*Get a JWT for easier long-term updating/retrieving.*

**Requires:**
```json
{
    "id": "<id>",
    "password": "<access password>",
    "mode": "<mode>"
}
``` 

**Returns:**
```json
{
    "info": "<jwt>"
}
```

- `200` successful JWT generation
- `400` invalid/unknown mode
- `401` invalid authentication (id does not exist, wrong password)
- `409` write JWT for id already exists

---

#### `/invalidatejwt`
*Invalidates a JWT for updating an id.*

**Requires:**
```json
{
    "id": "<id>",
    "password": "<access password>",
    "jwt": "<jwt>"
}
``` 

**Returns:**
```json
{
    "info": ""
}
```

- `200` successful JWT invalidation
- `400` JWT invalid, wrong token mode
- `401` invalid authentication (id does not exist, wrong password)


## FAQ

### Why this project and idea?
I was in need of this kind of webservice for a much larger project. After some research, I found no simple, lightweight solution to fix my problem. So then I wrote my own one.

### Why Bun and Typescript?
I wanted to learn Javascript/Typescript to have an advantage in future development propjects (I mean, every developer has to visit Javascript at one time in his boring life). And because I'm interested in new technologies, I chose Bun as the runtime.

### How can *lip* be extended towars my needs?
I understand that Bun is not the first choise for Javascript developers. The architecture is kept generic, so the three main parts (routing, handling, database) can be reprogrammed and swap to your likings. The code is not _that_ complicated, so just start at `src/index.ts` for a better understanding.

### Dude, why is the code so bad? Are you a beginner?
Yes, but also no. I have ~8 years experience in coding, but using Typescript is new for me. Please have mercy and feel free to educate me on best practices and coding standarts :-)
