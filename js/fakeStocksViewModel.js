
function fakeStocksViewModel(){
  let self = this
  self.user = ko.observable(new player("you", 1000))
  self.markets = ko.observableArray(createMarkets())
  console.log(self.markets())
  self.stocks = ko.observableArray(createTickers(self.markets()))
  console.log(self.stocks())
  self.gameThread = gameLoop(self)
  self.gameThread.run()



  self.stocksDisplay = ko.computed(function(){
    let display = new Array()

    for(let i=1;i<self.stocks().length;i++){
      display.push(self.stocks()[i])
    }

    return display
  })
}

/*
 * Code for the player object
 *
 *
*/

function player(name, funds){
  let self = this

  /*
   *Properties
  */
  self.name = name
  self.availableFunds = ko.observable(funds) //Keeps track of what's available. Should probably calculate
  self.baseFunds = ko.observable(funds) //Keeps track of starting money, used to figure out what the player has earned
  self.assets = ko.observableArray([]) //An array of the stocks that have been purchased

  self.assetsDisplay = ko.computed(function(){
    let display = new Array()

    for(let i = 0;i<self.assets().length;i++){
      let curPurchaseRecord = self.assets()[i]
      let elem = display.find(function(element){return element.stock.symbol == curPurchaseRecord.stock.symbol})

      if(!elem){
        display.push({stock : curPurchaseRecord.stock,
                      qty : 1,
                      earnings : curPurchaseRecord.stock.price() - curPurchaseRecord.purchasePrice })
      }else{
        elem.qty += 1
        elem.earnings += curPurchaseRecord.stock.price() - curPurchaseRecord.purchasePrice
      }
    }

    return display
  })

  self.totalValue = ko.computed(function(){
    let total = parseFloat(self.availableFunds())
    for(let i = 0;i<self.assets().length;i++){
      total += parseFloat(self.assets()[i].stock.price())
    }
    return total.toFixed(2)
  })

  self.earnings = ko.computed(function(){
    return self.totalValue() - self.baseFunds()

  })

  /*
   *Methods
  */

  self.PurchaseStock = function(stock){
    //if this was purchased from the "Portfolio" section it is in a purchase record wrapper
    //we need to unwrap it
    if(stock.stock){
      stock = stock.stock
    }
    let purchaseRecord = {purchasePrice : parseFloat(stock.price()),
                          stock : stock }
    self.assets.push(purchaseRecord)
    self.availableFunds(self.availableFunds() - parseFloat(stock.price()))
  }

  self.SellStock = function(purchaseRecord){
    let salePrice = purchaseRecord.stock.price()
    let earnings = salePrice - purchaseRecord.purchasePrice
    self.availableFunds(parseFloat(self.availableFunds()) + parseFloat(salePrice))

    stockIndex = self.assets().findIndex(function(element){return purchaseRecord.stock.symbol == element.stock.symbol})
    if(stockIndex > -1){
      self.assets.splice(stockIndex, 1)
    }

  }

  return self
}

/*
*
* This is the the code for the stocks
*
*/
function getRandomChar(){
  let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

  return alphabet.split("")[parseInt(Math.random() * 26)]

}

function getStockSymbol(){
  let ticker = ""

  /*Lets say all tickers will be three characters*/
  for(let i = 0;i < 3;i++){
    ticker += getRandomChar()
  }
  //console.log(ticker)
  return ticker
}

function stock(symbol, price, market){
  let self = this

  self.symbol = symbol
  self.price = ko.observable(price)
  self.market = market

  return self
}

function createTickers(markets){
  let tickers = new Array()

  for(let i = 0; i < 26;i++){
    tickers.push(new stock(getStockSymbol(), (Math.random() * 100).toFixed(2), getMarket(markets)))
  }

  return tickers
}

/*
 *Game loop will handle all the event and timing logic
 *
 *For the first go around the game loop will break "days" into 10 30 second increments
 *There will be bars going accross the screen to show which pat of the day we are currently in.
 *
 *When the "time of day" changes, make the stocks change... it'll be random at first
 */
function gameLoop(model){
  let self = this
  //Game parameters
  self.volatility = .1
  self.marketUpside = .6 //how likely stocks are to go up or down. below thelower the number the lower stocks will likely go


  self.dayIncrement = ko.observable(0)
  self.day = ko.observable(1)

  self.run = function(){
    setTimeout(function(){
      let curDay = self.day()
      let curDayIncrement = self.dayIncrement()
      curDayIncrement++
      if(curDayIncrement == 10){
        curDayIncrement = 0
        curDay += 1
        $("#notice-text").text("")
        console.log("resetting notices")
        self.day(curDay)
      }
      self.dayIncrement(curDayIncrement)
      self.updateStockPrices()
      self.run()
    }, 3000)
  }

  self.updateStockPrices = function(){
    //Lets shake up the markets sometimes
    for(let i=0;i<model.markets().length;i++){
      let curMarket = model.markets()[i]
      //console.log("attempting to adjust " + curMarket.name)
      //console.log(curMarket)
      adjustMarket(curMarket, null, null)
    }

    for(let i=0;i<model.stocks().length;i++){
        let curStock = model.stocks()[i]
        let multiplier = Math.random()
        let upside = parseFloat(curStock.market.marketUpside())
        let volatility = parseFloat(curStock.market.volatility())
        if(Math.random() >= upside){
          multiplier = multiplier * -1
        }
        multiplier = multiplier * volatility
        let currentPrice = curStock.price()
        let newPrice = (parseFloat(currentPrice) + (currentPrice * multiplier)).toFixed(2)

        if(newPrice <= .01){
          newPrice = .01
        }

        curStock.price(newPrice)
    }
  }

  return self
}

/*
 *Let's define some markets like oil, gold, tech etc... they can have their own volatility and upside
 *here's the constructor
*/
function market(name, volatility, marketUpside){
  self = this
  self.name = name
  self.volatility = ko.observable(volatility) //how much a stock may change
  self.marketUpside = ko.observable(marketUpside) //how likely a stock is to go up instead of down
  return self
}

/*
 *Now here's a function that will return the markets
 *for now they'll be hardcoded
 *this will be called in our model view constructor
*/
function createMarkets(){
  let markets = new Array()
  markets.push(new market("oil", "0.10", "0.10"))
  markets.push(new market("gold", "0.50", "0.50"))
  markets.push(new market("commodities", "0.90", "0.90"))
  markets.push(new market("tech", "0.10", "0.60"))

  return markets
}

/*function to randomly choose a market*/
function getMarket(markets){
  let i = parseInt(Math.random() * markets.length)
  return markets[i]
}

/*
 *This will "randomly" adjust a markets volatility and upside
*/
adjustMarket = function(market, volatility, upside){
  if(!volatility && !upside){
    //If no values were passed in we're going to randomly adjust...
    //...sometimes, lets say 20% of the time
    let i = Math.random()
    //console.log(i)
    if(i >= .1){
      return
    }
    else{
      market.volatility(Math.random().toFixed(2))
      market.marketUpside(Math.random().toFixed(2))
      $("#notice-text").html("<span class=\"notice\">The " + market.name + " market was just adjusted! (" + market.volatility() + ", " + self.marketUpside() + ")</span>")
      //console.log("The " + market.name + " was just adjusted! (" + market.volatility() + ", " + self.marketUpside() + ")")
    }
  }
}
