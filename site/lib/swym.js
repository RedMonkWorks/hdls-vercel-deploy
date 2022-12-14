const SWYM_HDLS_CONFIG = {
  storefrontAccessToken: '1164b762f8549554583031ac743f4747', //Get from Shopify Develop app
  storefrontGraphqlEndpoint:
    'https://swym-hdls-staging.myshopify.com/api/2021-07/graphql.json', //Shopiy Store url with graphql endpoint
  swymPid: 'BZJ3UlIxMXVCOCb++RWYUTLG2LilSFjX3A9fu9JepvM=', //Unique provider id from Swym Dashboard
  swymHost: 'https://swymstore-v3dev-01-01.swymrelay.com', //Get from Swym Dashboard
  swymLname: 'My Wishlist',
}

let hdls_ls_name = 'hdls_ls' // Local Storage Key storing config and list objects
let pdpIdentifier = '/product/' // Pageurl includes this and productHandle is the substring after this
let productFormSelector = '[aria-label="Add to Cart"]' // Wishlist button is injected as child of this component

export default async function SwymInit(product) {
  const pageUrl = window.location.href

  // console.log(product)

  // PDP page
  if (pageUrl.includes(pdpIdentifier)) {
    var productHandle = pageUrl.split(pdpIdentifier)[1]
    console.log(
      'Hdls - PDP recognized getting product data for handle:',
      productHandle
    )

    var productForm = document.querySelector(productFormSelector).parentElement

    var swymButton = document.createElement('button')

    swymButton.setAttribute(
      'class',
      'wishlistPdp ProductSidebar_button__13iVS Button_root__G_l9X'
    )

    swymButton.innerText += `${'\u2665'} Add To Wishlist`

    swymButton.onclick = async function (e) {
      e.preventDefault()

      var productData = product //await hdls_ProductData(productHandle)
      var productId = window
        .atob(productData.id)
        .split('gid://shopify/Product/')[1]
      var productUrl = window.location.origin + '/product/' + productHandle
      var variantId = window
        .atob(productData.variants[0].id)
        .split('gid://shopify/ProductVariant/')[1]

      var hdls_ls = JSON.parse(localStorage.getItem(hdls_ls_name))

      var swymConfig = await hdls_RefreshSwymConfig(hdls_ls)

      hdls_AddToWishlist(productId, variantId, productUrl, swymConfig)

      console.log('Hdls - PDP Wishlist Button Clicked')
    }

    productForm.appendChild(swymButton)
  }
}

async function hdls_ProductData(productHandle) {
  //Gets product data from Shopify Storfront API
  var myHeaders = new Headers()
  myHeaders.append(
    'X-Shopify-Storefront-Access-Token',
    SWYM_HDLS_CONFIG.storefrontAccessToken
  )
  myHeaders.append('Content-Type', 'application/json')

  var graphql = JSON.stringify({
    query: `{
      product(handle: "${productHandle}") {
          id
          title
          onlineStoreUrl
          variants(first: 10) {
              edges {
                  node {
                      id
                      price
                      title
                      image {
                          id
                          src
                      }
                      selectedOptions {
                          name
                          value
                      }
                  }
              }
          }
          images(first: 1) {
            edges {
                node {
                    src
                }
            }
          }
          options {
              name
              values
          }
      }
    }`,
    variables: {},
  })
  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: graphql,
    redirect: 'follow',
  }

  return fetch(SWYM_HDLS_CONFIG.storefrontGraphqlEndpoint, requestOptions)
    .then((response) => response.json())
    .then((result) => {
      console.log('Hdls - Product Data', result)
      return result.data.product
    })
    .catch((error) => {
      console.log('error', error)
      return error
    })
}

function hdls_VariantSelector(productData, productHandle) {
  var productId = window.atob(productData.id).split('gid://shopify/Product/')[1]
  var productUrl = window.location.origin + '/product/' + productHandle

  var wishlistModalForm = document.querySelector(`#empi-${productId}`)

  // Create Modal Bkg if already doesn't exists
  if (wishlistModalForm === null) {
    var wishlistModal = document.createElement('div')
    wishlistModal.setAttribute('class', 'wishlist-modal')
    wishlistModal.setAttribute('id', `empi-${productId}`)
    document.querySelector('body').appendChild(wishlistModal)

    // Create a form for variant selection
    var swymForm = document.createElement('form')
    swymForm.setAttribute('class', 'wishlist-form')

    swymForm.innerHTML = `
      <h2 class="column-span-3">Which variant do you want to add to Wishlist</h2>
      <img class="column-span-3" src="${productData.images.edges[0].node.src}" width="200px">
    `

    productData.options.forEach((option, index) => {
      swymForm.innerHTML += `
        <label value=${option.name}> ${option.name} </label>
        <select class="column-span-2">  
          ${variantOptions(option)}
        </select>
      `
    })

    function variantOptions(option) {
      var options

      option.values.forEach((variant) => {
        options += `<option value = "${variant}"> ${variant} </option>`
      })

      return options
    }

    wishlistModal.appendChild(swymForm)

    var swymButton = document.createElement('button')
    swymButton.setAttribute(
      'class',
      'column-span-3 ProductSidebar_button__13iVS Button_root__G_l9X'
    )
    swymButton.innerText = 'Add To Wishlist'

    swymButton.onclick = async function (event) {
      event.preventDefault()

      console.log('Clicked')

      var selection = document.querySelectorAll(
        `#empi-${productId} > form.wishlist-form > select`
      )
      var variantType = document.querySelectorAll(
        `#empi-${productId} > form.wishlist-form > label`
      )

      var selectedSelection = []
      var selectedType = []

      selection.forEach((obj) => {
        selectedSelection.push(obj.value)
      })
      variantType.forEach((obj) => {
        selectedType.push(obj.attributes.value.nodeValue)
      })

      var variantNotFound = 0

      productData.variants.edges.forEach(async (obj) => {
        var variantId = window
          .atob(obj.node.id)
          .split('gid://shopify/ProductVariant/')[1]
        var selectedOptions = obj.node.selectedOptions
        var variantFound = false

        selectedOptions.some((variant, index) => {
          var name = selectedType[index]
          var value = selectedSelection[index]

          if (
            selectedType[index] == variant.name &&
            selectedSelection[index] == variant.value
          ) {
            variantFound = true
            // console.log(selectedSelection[index], variant.value, variantFound)
            // console.log(selectedType[index], variant.name)
          } else if (
            selectedType[index] != variant.name ||
            selectedSelection[index] != variant.value
          ) {
            variantFound = false
            // console.log(selectedSelection[index], variant.value, variantFound)
            // console.log(selectedType[index], variant.name)
            return true
          }
        })

        if (variantFound) {
          console.log('Hdls - Adding to wishlist', productUrl)

          var hdls_ls = JSON.parse(localStorage.getItem(hdls_ls_name))

          var swymConfig = await hdls_RefreshSwymConfig(hdls_ls)

          hdls_AddToWishlist(productId, variantId, productUrl, swymConfig)

          document.querySelector(`#empi-${productId}`).style.display = 'none'
        } else {
          variantNotFound++
        }

        if (variantNotFound === productData.variants.edges.length)
          console.log(
            'Select another variant this variant is not found',
            variantNotFound,
            productData.variants.edges.length
          )
      })
    }

    swymForm.appendChild(swymButton)
  } else {
    wishlistModalForm.style.display = 'block'
  }

  window.onclick = function (event) {
    if (event.target.className === 'wishlist-modal') {
      event.target.style.display = 'none'
    }
  }
}

async function hdls_AddToWishlist(
  productId,
  variantId,
  productUrl,
  swymConfig
) {
  // console.log(productUrl)
  var myHeaders = new Headers()
  myHeaders.append('Content-Type', 'application/x-www-form-urlencoded')

  var urlencoded = new URLSearchParams()
  urlencoded.append('regid', swymConfig.regid)
  urlencoded.append('sessionid', swymConfig.sessionid)
  urlencoded.append('lid', swymConfig.lid)
  urlencoded.append(
    'a',
    `[{ "epi":${variantId}, "empi": ${productId}, "du":"${productUrl}", "cprops": {"ou":"${productUrl}"}, "note": null, "qty": 1 }]`
  )

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded,
    redirect: 'follow',
  }

  return fetch(
    `https://swymstore-v3dev-01-01.swymrelay.com/api/v3/lists/update-ctx?pid=${encodeURIComponent(
      SWYM_HDLS_CONFIG.swymPid
    )}`,
    requestOptions
  )
    .then((response) => response.json())
    .then((result) => {
      // hdls_ls = JSON.parse(window.localStorage.getItem(hdls_ls_name))
      // var length =
      //   typeof hdls_ls.list.added === 'undefined'
      //     ? 0
      //     : Object.keys(hdls_ls.list.added).length
      // var respData = data.a[0]

      // const addObj = {
      //   ...hdls_ls,
      //   list: {
      //     ...hdls_ls.list,
      //     added: {
      //       ...hdls_ls.list.added,
      //       [length]: {
      //         ...respData,
      //       },
      //     },
      //   },
      // }

      // window.localStorage.setItem(hdls_ls_name, JSON.stringify(addObj))

      // var submitWishlistBtn = document.querySelector(
      //   `[second-product-url="${e.detail.productUrl}"]`
      // )

      // document.querySelector(
      //   `.wishlist-modal[data-url="${e.detail.productUrl}"]`
      // ).style.display = 'none'

      console.log('Hdls - Added variant to wishlist', result)

      return result
    })
    .catch((error) => {
      console.log('error', error)

      return error
    })
}

async function hdls_DeleteFromWishlist(
  productId,
  variantId,
  productUrl,
  swymConfig
) {
  var myHeaders = new Headers()
  myHeaders.append('Content-Type', 'application/x-www-form-urlencoded')

  var urlencoded = new URLSearchParams()
  urlencoded.append('regid', swymConfig.regid)
  urlencoded.append('sessionid', swymConfig.sessionid)
  urlencoded.append('lid', swymConfig.lid)
  urlencoded.append(
    'd',
    `[{ "epi":${variantId}, "empi": ${productId}, "du":"${productUrl}"}]`
  )

  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: urlencoded,
    redirect: 'follow',
  }

  return fetch(
    `https://swymstore-v3dev-01-01.swymrelay.com/api/v3/lists/update-ctx?pid=${encodeURIComponent(
      SWYM_HDLS_CONFIG.swymPid
    )}`,
    requestOptions
  )
    .then((response) => response.json())
    .then((result) => {
      console.log('Hdls - Added variant to wishlist', result)

      return result
    })
    .catch((error) => {
      console.log('error', error)

      return error
    })
}

async function hdls_ProductWishlistState(productId, variantId, swymConfig) {
  var result = await hdls_GetOrCreateDefaultWishlist(swymConfig)

  const found = result.listcontents.some((product) => {
    console.log('Value of found', variantId, product.epi)
    return variantId == product.epi
  })

  return found
}

export async function hdls_GetOrCreateDefaultWishlist(swymConfig) {
  console.log('Hdls - Fetching or Creating List for Current Regid')

  return fetch(
    `${
      SWYM_HDLS_CONFIG.swymHost
    }/api/v3/lists/fetch-lists?pid=${encodeURIComponent(
      SWYM_HDLS_CONFIG.swymPid
    )}`,
    {
      body: `regid=${swymConfig.regid}&sessionid=${swymConfig.sessionid}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    }
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.length) {
        console.log('Hdls - List Fetched for User')

        return data[0]
      } else {
        return fetch(
          `${
            SWYM_HDLS_CONFIG.swymHost
          }/api/v3/lists/create?pid=${encodeURIComponent(
            SWYM_HDLS_CONFIG.swymPid
          )}`,
          {
            body: `lname=${SWYM_HDLS_CONFIG.swymLname}&sessionid=${swymConfig.sessionid}&regid=${swymConfig.regid}`,
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            method: 'POST',
          }
        )
          .then((response) => response.json())
          .then((data) => {
            console.log('Hdls - List Created for User')

            return data
          })
      }
    })
}

export async function hdls_SwymConfig(customerToken) {
  if (customerToken != null) {
    var data = await hdls_GetCustomerEmail(customerToken)

    console.log(data.data.customer)
    var hdls_ls = JSON.parse(localStorage.getItem(hdls_ls_name))

    var extuid = window
      .atob(data.data.customer.id)
      .split('gid://shopify/Customer/')[1]

    var myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/x-www-form-urlencoded')

    var urlencoded = new URLSearchParams()
    urlencoded.append('regid', hdls_ls.regid)
    urlencoded.append('sessionid', hdls_ls.swymSession.sessionid)
    urlencoded.append('platform', 'shopify')
    urlencoded.append('extuid', parseInt(extuid))

    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: urlencoded,
      redirect: 'follow',
    }

    return fetch(
      `https://swymstore-v3dev-01-01.swymrelay.com/api/v3/lists/user-validate-sync?pid=${encodeURIComponent(
        SWYM_HDLS_CONFIG.swymPid
      )}`,
      requestOptions
    )
      .then((response) => response.json())
      .then((result) => {
        console.log('Hdls - User Login Detected and RegID generated', result)

        const swymConfig = {
          regid: result.regid,
          swymSession: {
            sessionid: hdls_CreateSessionid(32),
            timestamp: Date.now(),
          },
        }

        return swymConfig
      })
      .catch((error) => {
        console.log('error', error)

        return error
      })
  } else {
    return fetch(
      `${
        SWYM_HDLS_CONFIG.swymHost
      }/api/v3/provider/register?pid=${encodeURIComponent(
        SWYM_HDLS_CONFIG.swymPid
      )}`,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
      }
    )
      .then((response) => response.json())
      .then((result) => {
        console.log('Hdls - User Logout Detected and RegID generated')

        const swymConfig = {
          regid: result.regid,
          swymSession: hdls_CreateSwymSession(24),
        }

        return swymConfig
      })
      .catch((error) => {
        console.log('error', error)

        return error
      })
  }
}

async function hdls_GetCustomerEmail(customerToken) {
  var myHeaders = new Headers()
  myHeaders.append(
    'X-Shopify-Storefront-Access-Token',
    SWYM_HDLS_CONFIG.storefrontAccessToken
  )
  myHeaders.append('Content-Type', 'application/json')

  var graphql = JSON.stringify({
    query: `{\n  customer(customerAccessToken : "${customerToken}") {\n    id\n    firstName\n    lastName\n    acceptsMarketing\n    email\n    phone\n  }\n}`,
    variables: {},
  })
  var requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: graphql,
    redirect: 'follow',
  }

  return fetch(SWYM_HDLS_CONFIG.storefrontGraphqlEndpoint, requestOptions)
    .then((response) => response.json())
    .then((result) => {
      return result
    })
    .catch((error) => console.log('error', error))
}

function hdls_CreateSessionid(len) {
  // Len is length usually 64
  var outStr = '',
    newStr
  while (outStr.length < len) {
    newStr = Math.random().toString(36 /*radix*/).slice(2 /* drop decimal*/)
    outStr += newStr.slice(0, Math.min(newStr.length, len - outStr.length))
  }

  var timestamp = Date.now()

  var swymSession = {
    sessionid: outStr.toLowerCase(),
    timestamp: timestamp,
  }

  return outStr.toLowerCase()
}

function hdls_CreateSwymSession(len) {
  // Len is length usually 64
  var outStr = '',
    newStr
  while (outStr.length < len) {
    newStr = Math.random().toString(36 /*radix*/).slice(2 /* drop decimal*/)
    outStr += newStr.slice(0, Math.min(newStr.length, len - outStr.length))
  }

  var timestamp = Date.now()

  var swymSession = {
    sessionid: outStr.toLowerCase(),
    timestamp: timestamp,
  }

  return swymSession
}

function hdls_CompareTimestamp(endDate, startDate) {
  var diff = endDate - startDate
  return diff / 60000
}

// This function is called only on pressing Wishlist button
export async function hdls_RefreshSwymConfig(swymConfig) {
  var data = { ...swymConfig }

  if (swymConfig == null) {
    console.log('Regid not found on refresh', swymConfig)

    var swymRegid = await hdls_SwymConfig(null)
    data = { ...data, ...swymRegid }
    return hdls_RefreshSwymConfig(data)
  } else if (
    swymConfig.swymSession != null &&
    hdls_CompareTimestamp(Date.now(), swymConfig.swymSession.timestamp) >= 30
  ) {
    var swymSession = { swymSession: hdls_CreateSwymSession(24) }
    data = { ...data, ...swymSession }

    console.log('SwymSession not found on refresh', swymSession, data)

    return hdls_RefreshSwymConfig(data)
  } else if (typeof swymConfig.lid == 'undefined') {
    console.log('List not found on refresh', swymConfig)

    var list = await hdls_GetOrCreateDefaultWishlist(swymConfig)
    data = { ...data, ...list }
    localStorage.setItem(hdls_ls_name, JSON.stringify(data))
    return data
  } else {
    localStorage.setItem(hdls_ls_name, JSON.stringify(data))
    return data
  }
}

export function SwymCollectionsButton(productData) {
  const SwymButton = () => {
    return (
      <button className="swymCollectionsButton" onClick={variantModal}>
        {'\u2665'}
      </button>
    )
  }

  var data = productData.productData

  async function variantModal(e) {
    e.preventDefault()
    var productHandle = data.slug
    var productData = await hdls_ProductData(productHandle)

    hdls_VariantSelector(productData, productHandle)

    console.log('Hdls - Collection Wishlist Button Clicked', productHandle)
  }

  return (
    <>
      <SwymButton />
    </>
  )
}

export function SwymDeleteButton(productData) {
  const SwymButton = () => {
    return (
      <button className="swymCollectionsButton" onClick={variantModal}>
        {'\u274C'}
      </button>
    )
  }

  var data = productData.productData

  async function variantModal(e) {
    e.preventDefault()

    var hdls_ls = JSON.parse(localStorage.getItem(hdls_ls_name))

    var swymConfig = await hdls_RefreshSwymConfig(hdls_ls)

    // console.log(data.empi, data.epi, data.du, swymConfig)
    
    hdls_DeleteFromWishlist(data.empi, data.epi, data.du, swymConfig).then(() => {
      e.target.parentElement.remove()
    })

    console.log('Hdls - Delete Wishlist Button Clicked', data)
  }

  return (
    <>
      <SwymButton />
    </>
  )
}

export async function hdls_SetLocalStorage(swymData) {
  var hdls_ls = JSON.parse(localStorage.getItem(hdls_ls_name))

  var addData = {
    // ...hdls_ls,
    ...swymData,
  }

  localStorage.setItem(hdls_ls_name, JSON.stringify(addData))

  console.log(swymData)

  return addData
}

export async function hdls_GetListDetails() {
  var hdls_ls = JSON.parse(localStorage.getItem(hdls_ls_name))

  const data = await hdls_RefreshSwymConfig(hdls_ls)

  return data
}
