let Redis = require('redis');

module.exports = class{

    constructor(port, db, callback){
        this.port = port;
        this.db = db;
        this.client = Redis.createClient(port);
        let theBase = this;

        this.lastValues = {};

        this.client.on("connect", function(err){
            if(err != null)
                console.log(err);

            theBase.client.select(theBase.db, function(err){
                if(err != null)
                    console.log(err);
                else
                {
                    console.log("Connected");

                    theBase.client.keys("*", function(keys){
                        let done = 0;
                        for(let k in keys)
                        {
                            theBase.getLastOne(k, function(data){
                                lastValues[k] = JSON.parse(data).value;
                                done++;

                                if(done >= keys.length)
                                    callback();
                            });
                        }            
                    });
                }
            });
        });
    }

    push(name, value, timestamp, callback)
    {
        let theBase = this;
        if(this.lastValues[name] != value)
        {
            this.client.rpush(name, JSON.stringify({timestamp:timestamp, value:value}), function(err){
                if(err != null)
                    console.log(err);
                
                theBase.lastValues[name] = value;

                callback();
            });
        }
    }

    getLastOne(name, callback)
    {
        if(this.lastValues[name] == undefined)
            this.getLast(name, 1, callback);
        else
            callback(this.lastValues[name]);
    }

    getLast(name, count, callback)
    {
        this.client.lrange(name, -count, -1, function(err, res){
            if(err != null)
                console.log(err);
            else
            {
                let output = [];
                for(let i in res)
                    output.push(JSON.parse(res[i]));

                callback(output);
            }
        });
    }

    getAll(name, callback)
    {
        this.client.lrange(name, 0, -1, function(err, res){
            if(err != null)
                console.log(err);
            else
            {
                let output = [];
                for(let i in res)
                    output.push(JSON.parse(res[i]));

                callback(output);
            }
        });
    }
}