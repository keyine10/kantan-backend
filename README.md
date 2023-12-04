# Backend for Kantan

## Description
This is the backend server for a Kanban board web application called Kantan

## Installation

```bash
$ https://github.com/keyine10/kantan-backend.git
$ npm install
```

## Create .env file
```
#POSTGRES credentials
DATABASE_USER = postgres
DATABASE_PASSWORD = 
DATABASE_NAME = postgres
DATABASE_PORT = 
DATABASE_HOST =
API_KEY = 

#JWT configurations
JWT_SECRET=
JWT_TOKEN_AUDIENCE=
JWT_TOKEN_ISSUER=
JWT_ACCESS_TOKEN_TTL=3600
```


## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

