    constructor(predictionOutcomeEvaluationFunction, conditionTimeframe, outcomeEvaluationFunction, successHistoryTimeframe){
        this.indicators = [];
        this.lastTimestamp = undefined;
        this.currentValues = [];
        this.currentPredictions = []; //Not used
        this.currentAvgPrediction = undefined;

        this.history = [];
        this.successes = 0;
        this.success_chances = 0;

        this.conditionTimeframe = conditionTimeframe;
        this.outcomeEvaluationFunction = outcomeEvaluationFunction;
        this.predictionOutcomeEvaluationFunction = predictionOutcomeEvaluationFunction;

        this.successHistoryTimeframe = successHistoryTimeframe;
        this.success_history = [];
    }

let result = this.outcomeEvaluationFunction(this.history[0], this.history.slice(1, foundIndex + 1));
                let outcomeEval = this.predictionOutcomeEvaluationFunction(this.history[0], this.history.slice(1, foundIndex + 1), result);

                if(outcomeEval != 0 && outcomeEval != 1 && outcomeEval != -1)
                    throw new Error("Eval should be 0 or 1 or -1");

                //Todo: Remove old
                if(outcomeEval == 1){
                    this.successes++;
                    this.success_chances++;
                    this.success_history.push({timestamp:this.history[0].timestamp, success:1, chance:1});
                }
                if(outcomeEval == -1){
                    this.success_chances++;
                    this.success_history.push({timestamp:this.history[0].timestamp, success:0, chance:1});                    
                }

                while(this.success_history.length > 0 && this.lastTimestamp - this.success_history[0].timestamp > this.successHistoryTimeframe)
                {
                    let removed = this.success_history.shift();
                    this.successes -= removed.success;
                    this.success_chances -= removed.chance;
                }

                    getSuccessRate(){
        return this.successes / this.success_chances;
    }