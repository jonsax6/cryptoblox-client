'use strict'
const store = require('../store')
const actions = require('./actions')
const events = require('./events')
const api = require('./api')

const BASE_URL = 'https://api.coingecko.com/api/v3'
let PG = 1

const allCoinsMarkets = async (PG) => {
  let allMarketData = `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${PG}&sparkline=true`
	const res = await fetch(allMarketData)
	const data = await res.json()
  data.forEach(coin => {
    store.markets.push(coin)
  })
} 

const onSignUpSuccess = (response) => {
	$('#sign-up-form').trigger('reset')
	$('#sign-up').hide()
	$('#login-title').text('Thank you! You can sign-in now...')
	$('#sign-up-error').hide()
	$('#sign-up-welcome').show()
}

const onSignUpFailure = () => {
	$('#sign-up-error').show()
	$('#sign-up-welcome').hide()
}

const onSignInButton = () => {
  // if we click on the sign in button, change store.onLoginView to true
  store.onLoginView = true
  $('#sign-in-btn').hide()
  $('#login-forms').show()
  $('#splash-table').hide()
  $('#user-alert-message').hide()
  $('#user-alert-message').text('Cryptocurrency Markets by Market Cap')
}

const onHome = () => {
  if (!store.login) {
  $('#sign-in-btn').show()
  $('#login-forms').hide()
  $('#splash-table').show()
  $('#user-alert-message').show()
  $('#user-alert-message').text('Cryptocurrency Markets by Market Cap')  
} else {
  $('#market-tab').trigger('click')
}
}

const onSignInSuccess = async (response) => {
  store.token = response.user.token
  store.user = response.user.email
  store.login = true
  store.owner = response.user._id
  // if we click sign in, change store.onLoginView to false
  store.onLoginView = false
  $('#app-tabs').show()
  $('#sign-in-btn').hide()
  $('#user-account-span').show()
  $('#user-account-form').hide()
  $('#user-account-text').text(`${store.user} account`)
  $('#app-tabs-content').show()
  $('#sign-in-form').trigger('reset')
  $('.login-forms').hide()
  $('#sign-out-btn').show()
  $('#sign-up-error').hide()
  $('#login-title').text('Login to see your crypto:')
  $('#user-alert-message').show()
  $('#user-alert-message').text('...looking up market data...')
  $('#transaction-table').empty()
  $('#user-alert-message').hide()
  $('#user-alert-message').text('')
  $('.market-tab-table').empty()
  await populateCoinsTable()
  store.images = getCoinImages(store.markets)
  api
    .index()
    .then(onIndexSuccess)
    .then(onShowPortfolio)
    .catch((error) => console.error(error))
}

const onLogoClick = () => {
  if (store.login) {
    $('#app-tabs').show()
    $('#user-account-span').show()
    $('#user-account-form').hide()
    $('#user-account-text').text(`${store.user} account`)
    $('#app-tabs-content').show()
    $('#sign-in-form').trigger('reset')
    $('#change-account-info-form').trigger('reset')
    $('.login-forms').hide()
    $('#sign-out-btn').show()
    $('#sign-up-error').hide()
  }
}

const onSignInFailure = (error) => {
	$('#login-title').hide()
	$('#user-login-message').show()
	$('#user-login-message').text('Account not found.  Try another account.')
}

const onSignOutSuccess = () => {
  // change store.login to false
  store.login = false
  // make sure store.onLoginView is false so we don't default to the login screen,
  // we want to logout to the splash screen market overview
  store.onLoginView = false
  $('#splash-table').show()
  $('#sign-in-btn').show()
  $('#sign-out-btn').hide()
	$('#sign-up-form').trigger('reset')
  $('#user-account-form').hide()
	$('#change-account-info-form').trigger('reset')
  $('#user-account-span').hide()
  $('#app-tabs').hide()
  $('#app-tabs-content').hide()
  $('#transaction-table').empty()
  $('#portfolio-cards').empty()
  $('#account-usd-value').empty()
  $('#account-btc-value').empty()
  $('#account-change').empty()
  $('#user-alert-message').show()
	$('#user-alert-message').text('See you next time!')
	$('#user-alert-message').fadeOut(4000, () => {
    // if we sign out we want to make sure 'Cryptocurrency Markets by Market Cap' doesn't pop up
    // if we click 'Sign In' while the 'See you next time!' is still fading. This if statement
    // won't allow that message to appear over the login forms if we have logged out already.
    if (!store.onLoginView) {
      $('#user-alert-message').text('Cryptocurrency Markets by Market Cap')
      $('#user-alert-message').show()
    }
  })



}

const onEditTransactionSuccess = () => {
  // empty the transactions table first before refilling it
  $('#transaction-table').empty()
  $('#transaction-form-new').trigger('reset')
  $('#transaction-form-edit').trigger('reset')
  $('#transaction-form-delete').trigger('reset')
  $('#editTransactionModalLabel').text('Your transaction was revised.')
  $('#edit-modal-close').trigger('click')
	$('#user-alert-message').show()
	$('#user-alert-message').text('Your transaction was revised.')
	$('#user-alert-message').fadeOut(4000)

  api.index()
    .then(onIndexSuccess)
    .catch(error => console.error(error))
}

const onDeleteTransactionSuccess = () => {
  // empty the transactions table first before refilling it
  $('#transaction-table').empty()
  $('#transaction-form-new').trigger('reset')
  $('#transaction-form-edit').trigger('reset')
  $('#transaction-form-delete').trigger('reset')
  $('#delete-modal-close').trigger('click')
  api.index()
    .then(onIndexSuccess)
    .catch((error) => console.error(error))
}

const onTransactionTabClick = () => {
  api.index()
		.then(onIndexSuccess)
		.catch((error) => console.error(error))
}

const onTransactionSuccess = async (response) => {
  $('#transaction-table').empty()
  $('#transaction-form-new').trigger('reset')
  $('#transaction-form-edit').trigger('reset')
  $('#transaction-form-delete').trigger('reset')
  $('#new-modal-close').trigger('click')
	$('#user-alert-message').show()
	$('#user-alert-message').text('Your transaction was added.')
	$('#user-alert-message').fadeOut(4000)
  // user-alert-message
  api.index()
    .then(onIndexSuccess)
    .catch(error => console.error(error))
}

const onIndexSuccess = (response) => {
  $('#transaction-table').empty()
  // make a data variable from the fetched transactions from API
  const data = response.transaction
  // make the data available to the global store object
  store.transactions = data
  const markets = store.markets
  // iterate over the data array backwards (most recent first)
  data.slice().reverse().forEach(transaction => {
		const coin = transaction.coin
    const coinNormalized = coin.toLowerCase()
    const txOwner = transaction.owner
		const symbol = transaction.symbol
		const price = transaction.price
		const quantity = transaction.quantity
		const orderType = transaction.orderType
    const id = transaction._id
    // initialize variable for current market price
    let currentPrice
    // iterate over the store.markets object
    markets.forEach((crypto) => {
      // if the iterated crypto.id matches the current transaction coin id grab the current price
      // and assign it to currentPrice
      if (crypto.id === coin) {
        currentPrice = crypto.current_price
      }
    })    
    // variable for the coin images array created in getCoinImages()
    const coins = store.images
    // filter through coins and return the object with the same id key as 'coinNormalized' above
    // variable to contain the image
    let coinImage = null
    coins.forEach(coinObj => {
      // if the object from the images object array's coin key is the same as key we're iterating above
      // grab that URL and bind it to coinImage variable
      if (coinNormalized === coinObj.id) {
      coinImage = coinObj.image
      }
    }) 
		$('#transaction-form-new').trigger('reset')
    // fills out the transactions table
    if (store.owner === txOwner) {
      $('#transaction-table').append(
        `<tr>
          <td class="text-light" scope="row">
          <b><img src="${coinImage}" style="height: 1.25em;">&nbsp;&nbsp;${coin}</b></td>
          <td class="text-right">${symbol}</td>
          <td class="text-right">${actions.formatter.format(price)}</td>
          <td class="text-right">${new Intl.NumberFormat().format(
            quantity
          )}</td>
          <td class="text-right">${orderType}</td>
          <td class="text-right">
            <a 
              class="edit-tx" 
              href="#" 
              data-id="${id}" 
              data-coin="${coin}"
              data-symbol="${symbol}"
              data-price="${currentPrice}"
              data-bs-toggle="modal"
              data-bs-target="#edit-transaction-modal" 
              style="text-decoration:none">edit &nbsp;
            </a><span>/</span>
            <a 
              class="delete-tx" 
              href="#" 
              data-id="${id}" 
              data-coin="${coin}"
              data-bs-toggle="modal"
              data-bs-target="#delete-transaction-modal" 
              style="text-decoration:none">delete
            </a>                
          </td>
        </tr>`
      )
    }
	})
}

const onChangePasswordSuccess = () => {
  $('#user-account-form').hide()
	$('#app-tabs').show()
	$('#app-tabs-content').show()
	$('#change-account-info-form').trigger('reset')
  $('#account-info').text('Your account information:')
  $('#user-alert-message').show()
  $('#user-alert-message').text('Your password has been changed.')
	$('#user-alert-message').fadeOut(4000)
}

const onChangePasswordFailure = (error) => {
	$('#account-info').text('Invalid password. Please try again:')
	console.error(error)
}

const onTransactionFailure = (error) => {
	console.log(error)
}

//------------MARKET OVERVIEW FUNCTIONS-----------//
const current_BTC_price = async () => {
	const CRYPTO_MARKETS = `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`
	let res = await fetch(CRYPTO_MARKETS)
	const data = await res.json()
	let BTC_USD_price = data[0].current_price
	return BTC_USD_price
}

const populateCoinsTable = async () => {
  let data = store.markets
  // find the starting index based on current page number in store.page
  // if page is 1, then the marketIndex is 0, if page is 2, then marketIndex is 100, and so on...
  let startIndex = (store.page - 1) * 100

  for (let i = startIndex; i < (startIndex + 100); i++) {
    let coinData = data[i]
    const marketCap = coinData.market_cap
      ? Number(coinData.market_cap).toFixed(2)
      : '-'
    const coinPrice = coinData.current_price
      ? Number(coinData.current_price).toFixed(2)
      : '-'
    const volume = coinData.total_volume
      ? Number(coinData.total_volume).toFixed(2)
      : '-'
    const cirSuppy = coinData.circulating_supply
      ? Number(coinData.circulating_supply).toFixed(2)
      : '-'
    const coinDelta = coinData.price_change_percentage_24h
      ? Number(coinData.price_change_percentage_24h).toFixed(2)
      : '-'
    const sparkData = coinData.sparkline_in_7d.price
    const high24 = coinData.high_24h
    const sparkAve = actions.movingAve(sparkData)
    const coinSymbol = coinData.symbol
    const coinName = coinData.name
    const id = coinData.id
    const capSymbol = coinSymbol.toUpperCase() //converts lowercase coin symbols to uppercase

    //table dynamically created, data feed from fetch(marketData)
    var classColor //variable to change color class for percent change 24h (coinDelta).
    if (coinDelta > 0) {
      //if change is a positive number show it green
      classColor = 'success'
    }
    if (coinDelta < 0) {
      //if change is a negative number show it red
      classColor = 'danger'
    }
    $('.market-tab-table').append(
			//populates the table rows with data from API
			`<tr class="text-light">
          <td class="text-center" scope="row">${coinData.market_cap_rank}</td>
          <td><b class="text-right"><img src="${coinData.image}" style="height: 1.25em;">&nbsp;&nbsp;&nbsp;${coinName}</b></td>
          <td class="text-right">${actions.formatter.format(marketCap)}</td>
          <td class="text-right">${actions.formatter.format(coinPrice)}</td>
          <td id="coin-change-percent" class="text-right text-${classColor}">${coinDelta}%</td>
          <td class="text-center p-0"><span id="sparkline-splash${i}"></span></td>
          <td class="text-center">
            <a 
              class="new-tx" 
              href="#" 
              data-coin="${id}"
              data-symbol="${coinSymbol}"
              data-price="${coinPrice}"
              data-bs-toggle="modal"
              data-bs-target="#new-transaction-modal" 
              style="text-decoration:none"
              >add &nbsp;
            </a>
          </td>
      </tr>`
		)
    $('#market-table-splash').append(
      `
      <tr>
          <td class="text-center" scope="row">${coinData.market_cap_rank}</td>
          <td><b class="text-right"><img src="${
            coinData.image
          }" style="height: 1.25em;">&nbsp;&nbsp;&nbsp;${coinName}</b></td>
          <td class="text-right">${actions.formatter.format(marketCap)}</td>
          <td class="text-right">${actions.formatter.format(coinPrice)}</td>
          <td id="coin-change-percent" class="text-right text-${classColor}">${coinDelta}%</td>
          <td class="text-center p-0"><span id="sparkline${i}"></span></td>
      </tr>
      `
    )
    //control flow for painting sparklines green (up-trending) or red (down-trending)
    if (sparkAve[0] > sparkAve[sparkAve.length - 1]) {
      actions.sparkLine(sparkAve, '#ff0000', i)
    }
    if (sparkAve[0] < sparkAve[sparkAve.length - 1]) {
      actions.sparkLine(sparkAve, '#00bf00', i)
    }
  }
}

const getCoinImages = (data) => {
  let coinImages = []
  data.forEach(coin => {
    let coinObj = {}
    coinObj.id = coin.id
    coinObj.image = coin.image
    coinImages.push(coinObj)
  })
  return coinImages
}

const onShowMarkets = async () => {
  if (!store.loaded) {
    $('.market-tab-table').empty()
    populateCoinsTable()
  }
}

const onShowPortfolio = () => {
  $('#portfolio-cards').empty()
  // variable for the fetched transactions from database
  let txs = store.transactions
  // variable for large database from coingecko
  let markets = store.markets
  // initialize portfolio object
  let portfolio = {}
  // iterate over transactions
  txs.forEach(tx => {
    // make the coin name all lower case for each transaction
    let coin = tx.coin.toLowerCase()
    // if user owns the transaction
    if(store.owner === tx.owner) {
      // and if the token is NOT already in the portfolio object
      if(!(coin in portfolio)) {
        // initialize this crypto into the portfolio starting at 0
        portfolio[coin] = { quantity: 0 }
      }
    }
  })
  // iterate over each key in the portfolio
  for (const coin in portfolio) {
    // now iterate over each transaction
    txs.forEach(tx => {
      // if the coin in the store transactions array is the same as the coin were iterating
      // add the quantity from that coin object to the coin key in the portfolio 
      if(tx.coin.toLowerCase() === coin && store.owner === tx.owner) {
        portfolio[coin].id = coin
        if (tx.orderType === 'buy') {
          portfolio[coin].quantity += tx.quantity
        } else {
          portfolio[coin].quantity -= tx.quantity
        }
      }
    })
  }
  let usdValue 
  let totalUsdValue = 0
  let totalBtcValue = 0
  let totalChangeAmount = 0
  let totalChangePercentage
  let totalChangeColor
  let change
  let circSupply
  let marketCap
  for (const coin in portfolio) {
    const coins = store.images
    coins.forEach((coinObj) => {
			// if the object from the images object array's coin key is the same as key we're iterating above
			// grab that URL and bind it to coinImage variable
			if (portfolio[coin].id === coinObj.id) {
				portfolio[coin].image = coinObj.image
			}
		})
    // iterate over the large crypto object array and set each variable value to be displayed
    markets.forEach(crypto => {
      if(coin === crypto.id) {
        portfolio[coin].id = coin
        portfolio[coin].price = crypto.current_price
        portfolio[coin].usdValue = portfolio[coin].quantity * crypto.current_price
        totalUsdValue += portfolio[coin].usdValue
        totalBtcValue = totalUsdValue / store.markets[0].current_price
        portfolio[coin].change = crypto.price_change_percentage_24h
        portfolio[coin].changeColor = portfolio[coin].change > 0 ? 'success' : 'danger'
        circSupply = crypto.circulating_supply
        marketCap = crypto.market_cap
        totalChangeAmount += portfolio[coin].usdValue * (portfolio[coin].change/100)
        totalChangePercentage = (totalChangeAmount/totalUsdValue) * 100
        totalChangeColor = totalChangePercentage > 0 ? 'success' : 'danger'
      }
    })
  }
  let displayOrder = []
  for (const coin in portfolio) {
    displayOrder.push(portfolio[coin])
  }
  displayOrder.sort((a,b) => {
    if(a.usdValue > b.usdValue) return -1
    if(a.usdValue < b.usdValue) return 1
    return 0
  })

  displayOrder.forEach(coin => {
    $('#portfolio-cards').append(
      `
    <div class="col-lg-3 col-md-4 col-sm-6 col-12 rounded-3">
      <div class="card bg-card text-white m-auto mt-4" style="width: 18rem;">
        <div class="text-center">
          <img src="${coin.image}" class="card-img-top text-center" alt="crypto-logo">
        </div>
        <div class="card-body">
          <h5 class="card-title">${coin.id}</h5>
          <p class="card-text">${coin.quantity}
          </p>
        </div>
        <ul class="list-group list-group-flush">
          <li class="list-group-item bg-secondary text-light">Current Price: ${actions.formatter.format(
            coin.price
          )}</li>
          <li class="list-group-item bg-secondary text-light">USD value: ${actions.formatter.format(
            coin.usdValue
          )}</li>
          <li class="list-group-item bg-card text-${coin.changeColor}">24h Change: ${coin.change.toPrecision(
        2
      )}%</li>
          <li class="list-group-item bg-card text-light">Market Cap: ${actions.formatter.format(
            marketCap
          )}</li>
          <li class="list-group-item bg-card text-light">Circ Supply: ${new Intl.NumberFormat().format(
            circSupply
          )}</li>
        </ul>
      </div>
    </div>`
    )
  })


  $('#account-usd-value').text(`${actions.formatter.format(totalUsdValue)}`)
  $('#account-btc-value').html(`<i class="icon-btc"></i>${new Intl.NumberFormat().format(totalBtcValue)}`)
  $('#account-change').html(`<span class="text-${totalChangeColor}">
      ${totalChangePercentage.toPrecision(2)}%
    </span>`)
}

const onRefreshMarkets = async () => {
  store.markets = []
  $('#user-alert-message').show()
  $('#user-alert-message').text('...looking up market data...')
  for(let i = 1; i < 6; i++) {
    await allCoinsMarkets(i)
  }
  $('#user-alert-message').hide()
	$('#user-alert-message').text('')
  store.images = getCoinImages(store.markets)
}

//===PAGINATION===//
const onNextPage = () => {
  store.page++
  console.log('store.page: ' + store.page)
  $('.market-tab-table').empty()
  populateCoinsTable()
  if (store.page > 1) {
  $('#previous-page').show()
  }
}

const onPreviousPage = () => {
  store.page--
  console.log('store.page: ' + store.page)
  $('.market-tab-table').empty()
  populateCoinsTable()
  if (store.page === 1) {
    $('#previous-page').hide()
  } 
}


module.exports = {
  onSignUpSuccess,
  onSignUpFailure,
  onSignInSuccess,
  onSignInFailure,
  onSignOutSuccess,
  onTransactionSuccess,
  onTransactionFailure,
  onChangePasswordSuccess,
  onChangePasswordFailure,
  onLogoClick,
  current_BTC_price,
  populateCoinsTable,
  onShowMarkets,
  onShowPortfolio,
  onRefreshMarkets,
  onEditTransactionSuccess,
  onDeleteTransactionSuccess,
  onTransactionTabClick,
  onSignInButton,
  onNextPage,
  onPreviousPage,
  onHome,
}