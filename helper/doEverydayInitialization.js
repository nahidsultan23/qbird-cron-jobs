const doEverydayInitialization = () => {
    const userModel = require('../models/userModel');
    userModel.updateMany(
        {deliveryPersonInfo: { $ne: null}},
        {$set: {
            "deliveryPersonInfo.dailyRecord": {
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

    const activeDeliveryPersonModel = require('../models/activeDeliveryPersonModel');
    activeDeliveryPersonModel.updateMany(
        {},
        {$set: {
            "numberOfRequestsToday": 0
        }},
        (err,res) => {
            if(err)
                console.log('Error: ' + err);
        }
    );
}

module.exports = doEverydayInitialization;