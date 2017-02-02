//https://www.npmjs.com/package/technicalindicators

const Indicators = require('technicalindicators');

var sma = new Indicators.SMA({period : 5, values : []});
sma.nextValue(16);
sma.getResult();