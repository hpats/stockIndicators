var _ = require("lodash");

module.exports = {
  sma: function (n, array) {
    var returnArray = [];
    for (i = 0; i < n; i++) {
      returnArray[i] = array[i];
    }
    for (i = n; i <= array.length; i++) {
      returnArray[i] = _.sum(_.slice(array, i - n, i)) / n;
    }
    return returnArray;
  },
  ema: function (n, array) {
    let returnArray = [];
    let weight = 2 / (n + 1);
    for (i = 0; i < n; i++) {
      returnArray[i] = array[i];
    }
    let tempArray = _.slice(array, 0, n);
    returnArray[n - 1] = _.last(sma.sma(n, tempArray));

    for (i = n; i < array.length; i++) {
      returnArray[i] = weight * array[i] + (1 - weight) * returnArray[i - 1];
    }
    return returnArray;
  },
  copp: function (n, array) {
    var roc11 = roc.roc(11, array);
    var roc14 = roc.roc(14, array);

    var rocTotal = [];
    _.forEach(roc14, function (value, i) {
      rocTotal[i] = roc11[i] + value;
    });
    var returnArray = [];
    if (rocTotal.length >= n) {
      for (var z = n; z <= rocTotal.length; z++) {
        var nArray = _.takeRight(_.slice(rocTotal, z - n, z), n);
        var a = 0,
          b = 0;
        i = 0; // copp = a/b
        _.forEach(nArray, function (value) {
          i++;
          a = a + value * i;
          b = b + i;
        });
        returnArray.push(a / b);
      }
      var to = rocTotal.length - returnArray.length;
      for (i = 0; i < to; i++) {
        returnArray.unshift(0);
      }
    }
    return returnArray;
  },
  chaikin: function (volume, high, low, close) {
    /*
        Chaikin Oscillator
        The Chaikin Oscillator was developed in the 1970s.[6] The indicator is based upon the momentum of the Accumulation/Distribution (AD).[7] AD calculates the position of a stock's daily closing price as a fraction of the daily price range of the stock—a fraction that is multiplied by the daily volume in order to quantify the net accumulation or distribution of a stock. AD is expressed mathematically as:

        {\displaystyle AD=cum{\frac {(C-L)-(H-C)}{(H-L)}}\times V\!\,}{\displaystyle AD=cum{\frac {(C-L)-(H-C)}{(H-L)}}\times V\!\,} or {\displaystyle AD=cum{\frac {2C-(H+L)}{(H-L)}}\times V\!\,}{\displaystyle AD=cum{\frac {2C-(H+L)}{(H-L)}}\times V\!\,}

        where "AD" represents the Accumulation/Distribution cumulative total running line, "cum" is an instructive abbreviation meaning "calculate a cumulative total running line", "C" is the daily closing price, "H" is the daily high price, "L" is the daily low price, and "V" is the daily total volume.

        The indicator is measured as the difference between the 3-day exponential moving average (EMA) of the AD to the 10-day EMA of the AD.[8][9] It signals when crossing above or below the zero line or when bullish/bearish departures take place. These signals anticipate the change in direction of the AD. Stock analysts observe a Chaikin Oscillator graph to look for the signal to buy or sell a stock.[10]
        https://en.wikipedia.org/wiki/Chaikin_Analytics
    */
    var returnArray = [],
      ad = [];
    var mfMulti = 0;
    for (i = 0; i < close.length; i++) {
      if (high[i] - low[i] != 0) {
        mfMulti =
          (close[i] - low[i] - (high[i] - close[i])) / (high[i] - low[i]);
      }
      var mf = mfMulti * volume[i];
      if (ad.length > 0) {
        ad.push(_.last(ad) + mf);
      } else {
        ad[0] = mf;
      }
    }
    var ema3 = ema.ema(6, ad);
    var ema10 = ema.ema(20, ad);

    for (i = 0; i < ema3.length; i++) {
      returnArray.push(ema3[i] - ema10[i]);
    }
    return returnArray;
  },
  macd: function(array) {
    macdreturn = { "line": [], "signal": [], "histogram": [] };
    var ema12 = ema.ema(12, array);
    var ema26 = ema.ema(26, array);

    if (ema26.length > 0) {
      for(i=0;i<array.length;i++){
        macdreturn.line.push(ema12[i] - ema26[i]);
      }

      macdreturn.signal = ema.ema(9, macdreturn.line);

      for(i=0;i<array.length;i++){
        macdreturn.histogram.push(macdreturn.line[i] - macdreturn.signal[i]);
      }
      return macdreturn;

    } else {
      return null;
    }
  },
  rsi: function(n, array) {
    var change = [];var gain = [];var loss = [];
    change[0] = 0;
    gain[0] = 0;
    loss[0] = 0;
    var priceOld = array[0];
    var returnObj = {
      'RS': [],
      'RSI': []
    };
    returnObj.RS = _.fill(Array(n-1), 0);
    returnObj.RSI = _.fill(Array(n-1), 50);
    _.forEach(array, function(value, index) {
      let valueToPush = value - array[index - 1]

      change.push(valueToPush);
      if (valueToPush > 0) {
        gain.push(Math.abs(valueToPush));
        loss.push(0);
      } else if (valueToPush < 0) {
        gain.push(0);
        loss.push(Math.abs(valueToPush));
      } else if (valueToPush == 0) {
        gain.push(0);
        loss.push(0);
      }
    });
    _.forEach(array, function(value, index) {
      if (index <= array.length-n) {
        let gainSlice = _.slice(gain, index, n + index);
        let lossSlice = _.slice(loss, index, n + index);
        let avgGainIn = _.sum(gainSlice) / n;
        let avgLossIn = _.sum(lossSlice) / n;
        returnObj.RS.push(avgGainIn/avgLossIn);
        returnObj.RSI.push(100 - 100 / (1 + (avgGainIn/avgLossIn)));
      }
    });
    return returnObj;

  },
  mfi: function(n, close, volume, low, high) {

    var returnObj = { 'MF': [], 'MFI': [] };
    returnObj.MF = _.fill(Array(n), 0);
    returnObj.MFI = _.fill(Array(n), 50);
    var typicalPrice = [];
    var moneyFlow = [];
    _.forEach(close, function(value, index) {
      typicalPrice.push((value + low[index] + high[index]) / 3);
      moneyFlow.push(((value + low[index] + high[index]) / 3) * volume[index]);
    })
    _.forEach(close, function(value, index) {
      if (close[index - 1]) {
        if (index <= close.length - n) {
          let typicalPriceSlice = _.slice(typicalPrice, index, n + index);
          let moneyFlowSlice = _.slice(moneyFlow, index, n + index);
          let positiveMF = 0;
          let negativemf = 0;
          let lastArrayprice = close[index - 1];
          _.forEach(typicalPriceSlice, function(typicalPriceS, i) {
            if (typicalPriceSlice[i - 1]) {
              if (typicalPriceS > typicalPriceSlice[i - 1]) {
                positiveMF += moneyFlowSlice[i];
              }
              if (typicalPriceS < typicalPriceSlice[i - 1]) {
                negativemf += moneyFlowSlice[i];
              }
            } else {
              if (typicalPriceS > lastArrayprice) {
                positiveMF += moneyFlowSlice[i];
              }
              if (typicalPriceS < lastArrayprice) {
                negativemf += moneyFlowSlice[i];
              }
            }
          })
          returnObj.MF.push(positiveMF / negativemf);
          returnObj.MFI.push(100 - 100 / (1 + (positiveMF / negativemf)));
        }
      }
    })
    return returnObj;
  },
  roc: function(n, close) {
    rocreturn = []
    rocreturn = _.fill(Array(n), 0);
    for(i=n;i<close.length;i++){
      rocreturn[i]=(((close[i] - close[i - n]) / close[i - n]) * 100);
    }
    return rocreturn;
  },
  deviation: function(n, array) {
    var deviation = [];
    
    deviation = _.fill(Array(n-1), 0);
    function stda(array) {
      var avg = _.sum(array) / n;
      return Math.sqrt(_.sum(_.map(array, (i) => Math.pow((i - avg), 2))) / n);
    };

    _.forEach(array, function(value, index) {
      if (index <= array.length - n) {
        let arraySlice = _.slice(array, index, n + index);
        deviation.push(stda(arraySlice));
      }
    });
    return deviation;
  },
  bb: function (n, array) {
    var smaN = sma.sma(n, array);
    var stdDev = deviation.deviation(n, array);
    var stdDevX2 = _.map(stdDev, function (x) {
      return x * 2;
    });
    var middleBand = smaN;
    var upperBand = [];
    var lowerBand = [];
    for (var i = 0; i < array.length; i++) {
      upperBand.push(smaN[i] + stdDevX2[i]);
      lowerBand.push(smaN[i] - stdDevX2[i]);
    }
    var bbWidth = [];
    for (i = 0; i < array.length; i++) {
      bbWidth.push(((upperBand[i] - lowerBand[i]) / middleBand[i]) * 100);
    }
    var percB = [];
    for (i = 0; i < array.length; i++) {
      percB.push((array[i] - lowerBand[i]) / (upperBand[i] - lowerBand[i]));
    }

    return {
      bb: {
        middleBand: middleBand,
        upperBand: upperBand,
        lowerBand: lowerBand,
        bbwidth: bbWidth,
        percB: percB,
      },
    };
  },
  test :function(){

  },
  atr: function(n, high, low, close) {
    let trArray = [];
    let ATR = [];
    
    for (var i = 0; i < close.length; i++) {
      var H_l = high[i] - low[i];
      var H_C = Math.abs(high[i] - close[i]);
      var L_C = Math.abs(low[i] - close[i]);
      var tr = Math.max(H_l, H_C, L_C);
      trArray.push(tr);
    }
    var trAverage = 0;
    for (i = 0; i < n; i++) {
      trAverage = trAverage + trArray[i];

    }
    ATR.push(trAverage / n);
    for (i = n; i < trArray.length; i++) {
      ATR.push(((_.last(ATR) * (n - 1)) + trArray[i]) / n);
    }
    var diff = close.length - ATR.length;
    for (i = 0; i < ATR.length; i++) {
      trAverage = trAverage + ATR[i];
    }
    trAverage = trAverage / ATR.length;
    for (i = 0; i < diff; i++) {
      ATR.unshift(trAverage);
    }

    return ATR;
  }
};
