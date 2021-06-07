const doWeeklyInitialization = () => {
    const userModel = require('../models/userModel');
    userModel.updateMany(
        {deliveryPersonInfo: { $ne: null}},
        {$set: {
            "deliveryPersonInfo.weeklyRecord": {
                earning: 0,
                numberOfRequest: 0,
                numberOfCompletion: 0,
                numberOfRejection: 0,
                numberOfCancellation: 0
            }
        }},
        (err,res) => {
            if(err)
                console.log('Error: ' + err);
        }
    );
}

module.exports = doWeeklyInitialization;