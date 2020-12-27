const http = require('http')
const PORT = 3000
const DEFAULT_HEADER = { 'Content-Type': 'application/json' }
const HeroFactory = require('./factories/heroFactory')
const heroService = HeroFactory.generateInstance()
const Hero = require('./entities/hero')
const { error } = require('console')

const routes = {
  '/heroes:get': async (request, response) => {
    const { id } = request.queryString
    const heroes = await heroService.find(id)
    response.write(JSON.stringify({ results: heroes }))
    return response.end
  },
  '/heroes:post': async (request, response) => {
    for await (const data of request) {
      try {
        const item = JSON.parse(data)
        const hero = new Hero(item)
        const { error, valid } = hero.isValid()
        if(!valid){
          response.writeHead(400, DEFAULT_HEADER)
          response.write(JSON.stringify({ error: error.join(',') }))
        }
  
        const id = await heroService.create(hero)
        response.writeHead(201, DEFAULT_HEADER)
        response.write(JSON.stringify({ success: 'User created with success!', id }))
  
        return response.end()

      } catch (error) {
        return handleError(reponse)(error)
      }
    }
  },
  default: (request, response) => {
    response.write('Hello')
    response.end()
  }
}

const handleError = response => {
  return error => {
    console.error('Error', error)
    response.writeHead(500, DEFAULT_HEADER)
    response.write(JSON.stringify({ error: 'Internal Server Error' }))

    return response.end()
  }
}

const handler = (request, response) => {
  const { url, method } = request
  const [first, route, id] = url.split('/')
  const key = `/${route}:${method.toLowerCase()}`

  request.queryString = { id: isNaN(id) ? id : Number(id) }
  response.writeHead(200, DEFAULT_HEADER)
  
  const chosen = routes[key] || routes.default
  
  return chosen(request, response).catch(handleError(error))
}

http.createServer(handler)
  .listen(PORT, () => console.log('Server Running'))