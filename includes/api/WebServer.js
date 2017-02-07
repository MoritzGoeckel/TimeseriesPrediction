const Express = require('express');
const ExpressRest = require('express-rest');

module.exports = class{
    constructor(port){
        this.port = port;
    }

    start(data){
        let exp = Express();
        let rest = ExpressRest(exp);

        exp.use("/", Express.static(__dirname + '/frontend'));

        rest.get('/api', function(req, rest) {
            //req.params.query
            return rest.ok(data);
        });

        let listener = exp.listen(this.port, function(){
            console.log('Listening on port ' + listener.address().port);
        });
    }
}