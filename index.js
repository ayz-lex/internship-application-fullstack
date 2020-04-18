addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
/**
 * Respond with hello worker text
 * @param {Request} request
 */

class ElementHandler {
  element(element) {
    if (element.tagName === 'title') {
      return element.prepend('New title for ')
    } else if (element.tagName === 'h1' && element.hasAttribute('id') && element.getAttribute('id') === 'title') {
      return element.prepend('Altered ').append('!')
    } else if (element.tagName === 'p' && element.hasAttribute('id') && element.getAttribute('id') === 'description') {
      return element.setInnerContent('Yay!')
    } else if (element.tagName === 'a' && element.hasAttribute('id') && element.getAttribute('id') === 'url') {
      return element.setInnerContent('Go to google.com').setAttribute('href', 'https://google.com')
    }
  }
}

const VARIANTS_URL = 'https://cfw-takehome.developers.workers.dev/api/variants'

async function handleRequest(request) {

  //get cookies
  let cookies = request.headers.get('Cookie')

  let response

  //check if cookies exist
  if (cookies) {

    //get and fetch url
    let cookieArray = cookies.split(';')
    for (let i = 0; i < cookieArray.length; ++i) {
      let cookiePair = cookieArray[i].split('=')
      if (cookiePair[0].trim() === 'url') {
        let url = cookiePair[1].trim()
        response = await fetch(url)
        if (!response.ok) {
          return newError(response.status)
        }
        break
      }
    }

  } else {

    response = await fetch(VARIANTS_URL)

    //fetch variants and choose a url
    if (!response.ok) {
      return newError(response.status)
    }

    //choose a url
    let obj = await response.json()
    let variants = obj.variants
    let url = Math.random() >= 0.5 ? variants[0] : variants[1]
    response = await fetch(url)

    if (!response.ok) {
      return newError(response.status)
    }

    //create response
    response = new Response(response.body)

    //create cookie
    cookies = `url=${url}; max-age=${60 * 60}; Path='/'` 

    //set cookie
    response.headers.set('Set-Cookie', cookies)
  }

  //rewrite the file
  return new HTMLRewriter().on('*', new ElementHandler()).transform(response)
}

//function that sends to error page.
function newError(note) {
  return new Response(note, {
    headers: {'content-type': 'text/plain'},
  })
}
