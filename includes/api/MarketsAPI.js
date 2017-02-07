let request = require("request");

module.exports.getMarkets = function (callback)
{
    let rates;
    request("http://api.fixer.io/latest?base=USD", function(err, res){
        
        if(err != null)
            console.log(err);

        rates = JSON.parse(res.body).rates;

        request("http://api.bitcoincharts.com/v1/markets.json", function(err, res){

            if(err != null)
                console.log(err);

            let array = JSON.parse(res.body);

            let possibleMarkets = [];
            for(let i in array)
            {
                let obj = array[i];

                if(obj.currency != 'USD')
                {
                    obj.usdbid = (obj.bid / rates[obj.currency]);
                    obj.usdask = (obj.ask / rates[obj.currency]);
                }
                else
                {
                    obj.usdbid = obj.bid;
                    obj.usdask = obj.ask;
                }

                obj.usdvolume = obj.volume * obj.usdask;
                obj.usdmedian = (obj.usdbid + obj.usdask) / 2;

                if(obj.usdvolume > 1000 * 500 && Math.abs(obj.usdask - obj.usdbid) / obj.usdbid < 0.4)
                    possibleMarkets.push(obj);
            }

            possibleMarkets = possibleMarkets.sort(function(a, b){ return b.usdmedian - a.usdmedian; })
            callback(possibleMarkets);
        });
    });
}