const doMonthlyInitialization = () => {
    const userModel = require('../models/userModel');
    userModel.find({deliveryPersonInfo: { $ne: null}},(err,users) => {
        if(err) {
            console.log(err);
        }
        else if(!users) {
            console.log("Collection users is not initialized");
        }
        else {
            users.forEach(user => {
                if(user.deliveryPersonInfo.allMonthRecords.length < 12) {
                    for(var i = 0; i < 12; i++) {
                        user.deliveryPersonInfo.allMonthRecords.push({
                            earning: 0,
                            numberOfRequest: 0,
                            numberOfCompletion: 0,
                            numberOfRejection: 0,
                            numberOfCancellation: 0
                        })
                    }
                }

                date = new Date();
                let monthIndex = (date.getMonth() + 12 - 1) % 12;
                user.deliveryPersonInfo.allMonthRecords[monthIndex].earning = user.deliveryPersonInfo.monthlyRecord.earning;
                user.deliveryPersonInfo.allMonthRecords[monthIndex].numberOfRequest = user.deliveryPersonInfo.monthlyRecord.numberOfRequest;
                user.deliveryPersonInfo.allMonthRecords[monthIndex].numberOfCompletion = user.deliveryPersonInfo.monthlyRecord.numberOfCompletion;
                user.deliveryPersonInfo.allMonthRecords[monthIndex].numberOfRejection = user.deliveryPersonInfo.monthlyRecord.numberOfRejection;
                user.deliveryPersonInfo.allMonthRecords[monthIndex].numberOfCancellation = user.deliveryPersonInfo.monthlyRecord.numberOfCancellation;

                user.deliveryPersonInfo.monthlyRecord.earning = 0;
                user.deliveryPersonInfo.monthlyRecord.numberOfRequest = 0;
                user.deliveryPersonInfo.monthlyRecord.numberOfCompletion = 0;
                user.deliveryPersonInfo.monthlyRecord.numberOfRejection = 0;
                user.deliveryPersonInfo.monthlyRecord.numberOfCancellation = 0;

                user.save()
                .catch(err => {
                    console.log("Error: "+err);
                });
            });
        }
    });
}

module.exports = doMonthlyInitialization;