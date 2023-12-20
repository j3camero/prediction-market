
function DoNothingAlgorithm(price, volume, cash, position) {
    return {};
  }
  
  function WideSpreadMarketmakingAlgorithm(price, volume, cash, position) {
    return {
      buy: {
        hi: 0.10,
        lo: 0,
        shares: 1,
      },
      sell: {
        hi: 1,
        lo: 0.90,
        shares: 1,
      },
    };
  }
  
  function ZeroSpreadMarketmakingAlgorithm(price, volume, cash, position) {
    const budget = 10 + cash;
    const buyPrice = 0.5 * price;
    const buyShares = budget / buyPrice;
    const sellPrice = 0.5 * (price + 1);
    const sellCapitalCost = 1 - sellPrice;
    const sellShares = budget / sellCapitalCost;
    return {
      buy: {
        hi: price,
        lo: 0,
        shares: buyShares,
      },
      sell: {
        hi: 1,
        lo: price,
        shares: sellShares,
      },
    };
  }
  
  function AlwaysBuyAlgorithm(price, volume, cash, position) {
    return {
      buy: {
        hi: 1,
        lo: 0.99,
        shares: 0.01,
      },
    };
  }
  
  function RandomWalkAlgorithm(price, volume, cash, position) {
    const budget = 1 + cash;
    const worseCaseCost = 1;
    const maxShares = 0.1 * budget / worseCaseCost;
    const randomShares = Math.random() * maxShares;
    if (position > 0) {
      return {
        sell: {
          hi: 0.01,
          lo: 0,
          shares: randomShares,
        },
      };
    } else {
      return {
        buy: {
          hi: 1,
          lo: 0.99,
          shares: randomShares,
        },
      };
    }
  }
  
  const algos = {};
  
  function RegisterAlgorithm(algo, name) {
    algos[name] = {
      algo,
      cash: 0,
      position: 0,
    };
  }
  
  function CalculateDemandAbovePrice(bids, price) {
    let totalShares = 0;
    for (const name in bids) {
      const bid = bids[name];
      const hi = bid.hi;
      const lo = bid.lo;
      const shares = bid.shares;
      const p = Math.max(Math.min(price, hi), lo);
      totalShares += shares * (hi - p) / (hi - lo);
    }
    return totalShares;
  }
  
  function CalculateSupplyBelowPrice(offers, price) {
    let totalShares = 0;
    for (const name in offers) {
      const ask = offers[name];
      const hi = ask.hi;
      const lo = ask.lo;
      const shares = ask.shares;
      const p = Math.max(Math.min(price, hi), lo);
      totalShares += shares * (p - lo) / (hi - lo);
    }
    return totalShares;
  }
  
  function CalculateMarketEquilibriumPrice(bids, offers) {
    let lo = 0;
    let hi = 1;
    while (true) {
      const mid = 0.5 * (hi + lo);
      if (mid === hi || mid === lo) {
        return mid;
      }
      const demand = CalculateDemandAbovePrice(bids, mid);
      const supply = CalculateSupplyBelowPrice(offers, mid);
      if (demand < supply) {
        hi = mid;
      } else {
        lo = mid;
      }
    }
    // Shouldn't get here.
    throw 'Problem while calculating market equilibrium price';
  }
  
  function ExecuteTrade(name, shares, price) {
    if (shares > 0) {
      algos[name].cash -= price * shares;
    } else {
      algos[name].cash -= (1 - price) * shares;
    }
    algos[name].position += shares;
    const printTrades = true;
    if (printTrades) {
      if (shares > 0.000001) {
        console.log(name, 'bought', shares.toFixed(6), 'at', price.toFixed(6));
      }
      if (shares < -0.000001) {
        console.log(name, 'sold', (-shares).toFixed(6), 'at', price.toFixed(6));
      }
    }
  }
  
  function ExecuteTradesAtPrice(bids, offers, price) {
    let sharesBought = 0;
    for (const name in bids) {
      const bid = bids[name];
      const hi = bid.hi;
      const lo = bid.lo;
      const shares = bid.shares;
      const p = Math.max(Math.min(price, hi), lo);
      const sharesToBuy = bid.shares * (bid.hi - p) / (bid.hi - bid.lo);
      ExecuteTrade(name, sharesToBuy, price);
      sharesBought += sharesToBuy;
    }
    let sharesSold = 0;
    for (const name in offers) {
      const ask = offers[name];
      const hi = ask.hi;
      const lo = ask.lo;
      const shares = ask.shares;
      const p = Math.max(Math.min(price, hi), lo);
      const sharesToSell = shares * (p - lo) / (hi - lo);
      ExecuteTrade(name, -sharesToSell, price);
      sharesSold += sharesToSell;
    }
    const volumeMismatch = Math.abs(sharesBought - sharesSold);
    if (volumeMismatch > 0.000001) {
      throw 'Volume mismatch during trade matching';
    }
    return sharesBought;
  }
  
  function Tick(price, volume) {
    const bids = {};
    const offers = {};
    for (const name in algos) {
      const a = algos[name];
      const algo = a.algo;
      const cash = a.cash;
      const position = a.position;
      const orders = algo(price, volume, cash, position);
      //console.log(name, orders);
      if (orders.buy) {
        bids[name] = orders.buy;
      }
      if (orders.sell) {
        offers[name] = orders.sell;
      }
    }
    price = CalculateMarketEquilibriumPrice(bids, offers);
    volume = ExecuteTradesAtPrice(bids, offers, price);
    return [price, volume];
  }
  
  function RunSimulation(numTicks) {
    let price = 0.5;
    let volume = 0;
    for (let i = 0; i < numTicks; i++) {
      [price, volume] = Tick(price, volume);
      console.log(price.toFixed(6), volume.toFixed(6));
    }
  }
  
  RegisterAlgorithm(DoNothingAlgorithm, 'DoNothing');
  RegisterAlgorithm(WideSpreadMarketmakingAlgorithm, 'WideSpreadMM');
  RegisterAlgorithm(ZeroSpreadMarketmakingAlgorithm, 'ZeroSpreadMM');
  //RegisterAlgorithm(AlwaysBuyAlgorithm, 'AlwaysBuy');
  RegisterAlgorithm(RandomWalkAlgorithm, 'RandomWalk1');
  RegisterAlgorithm(RandomWalkAlgorithm, 'RandomWalk2');
  RunSimulation(3);
  