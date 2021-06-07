const constants = require("./myConstants");
const userModel = require('../models/userModel');
const orderModel = require('../models/orderModel');
const adModel = require('../models/adModel');
const activeDeliveryPersonModel = require('../models/activeDeliveryPersonModel');

const performOrderTimeOut = (orders,index) => {
    if(index < 0) {
        const findDeliveryPerson = require('./findDeliveryPerson');
        return findDeliveryPerson(orders,orders.length-1,500);
    }

    orders[index].currentState = constants.ORDER_PLACED;
    if(orders[index].deliveryPersonID) {
        orders[index].rejectedBy.push(orders[index].deliveryPersonID);
        activeDeliveryPersonModel.findOneAndUpdate(
            {
                deliveryPersonID: orders[index].deliveryPersonID
            },
            {$set: {
                "deliveryRequestOrderID": null,
                "ongoingDeliveryID": null
            }},
            (err,res) => {
                if(err) {
                    console.log('Error: ' + err);
                    performOrderTimeOut(orders,index-1);
                }
                else {
                    var deliveryPersonID = orders[index].deliveryPersonID;
                    orders[index].deliveryPersonID = null;
                    orders[index]
                    .save()
                    .then(order => {
                        orders[index] = order;
                        performOrderTimeOut(orders,index-1);
                        userModel.findById(deliveryPersonID,(err,user) => {
                            if(!err && user !== null) {
                                user.deliveryPersonInfo.rejectedDeliveries.push(order.id);
                                user.deliveryPersonInfo.dailyRecord.numberOfRejection += 1;
                                user.deliveryPersonInfo.weeklyRecord.numberOfRejection += 1;
                                user.deliveryPersonInfo.monthlyRecord.numberOfRejection += 1;
                                user.save()
                            }
                        });
                    })
                    .catch(err => {
                        console.log("Error: "+err);
                        performOrderTimeOut(orders,index-1);
                    });
                }
            }
        );
    }
    else {
        orders[index]
        .save()
        .then(order => {
            orders[index] = order;
            performOrderTimeOut(orders,index-1);
        })
        .catch(err => {
            console.log("Error: "+err);
            performOrderTimeOut(orders,index-1);
        });
    }
}

const doDeliveryStatusUpdateTask = () => {
    var threshold45Sec = Date.now() - 45000;
    var threshold2Min = Date.now() - 130000;
    var threshold24Hour = Date.now() - 24 * 3600000;
    var query = [
        {
            $and:[
                {currentState:constants.ORDER_PLACED},
                {"stateRecord.0.time": { $gt: threshold24Hour}}
            ]
        },
        {
            $and:[
                {currentState:constants.REQUEST_ASSIGNED},
                {"stateRecord.1.time": { $lt: threshold45Sec}}
            ]
        },
        {
            $and:[
                {currentState:constants.WAITING_FOR_RESPONSE},
                {"stateRecord.2.time": { $lt: threshold45Sec}}
            ]
        },
        {
            $and:[
                {currentState:constants.WAITING_FOR_DECISION},
                {"stateRecord.3.time": { $lt: threshold2Min}}
            ]
        }
    ];

    orderModel.find({$or: query},(err,orders) => {
        if(err) {
            console.log(err);
        }
        else if(!orders) {
            console.log("Collection orders is not initialized");
        }
        else {
            performOrderTimeOut(orders,orders.length-1);
        }
    });

    orderModel.find({
        $and: [
            {currentState:constants.ORDER_PLACED},
            {"stateRecord.0.time": { $lte: threshold24Hour}}
        ]
    })
    .exec((err,orders) => {
        if(err) {
            console.log(err);
        }
        else if(!orders) {
            console.log("Collection orders is not initialized");
        }
        else {
            let adsToAdjust = {};
            orders.forEach(order => {
                order.itemsArrangedByStoppages.forEach(point => {
                    point.items.forEach(item => {
                        let adKey = item.adID.toString();
                        if(adsToAdjust[adKey])
                            adsToAdjust[adKey] += item.quantity;
                        else
                            adsToAdjust[adKey] = item.quantity;
                    });
                });
                order.currentState = constants.NO_DELIVERY_PERSON_FOUND;
                order.stateRecord[order.currentState].time = Date.now();
                order.save();
            })

            adModel.find({ _id: { $in : Object.keys(adsToAdjust) }},(err,ads) => {
                if(err) {
                    console.log(err);
                }
                if(!ads) {
                    console.log("Collection ads is not initialized");
                }

                ads.forEach(ad => {
                    let quantity = adsToAdjust[ad.id.toString()];
                    if(!ad.numOfItems && quantity) ad.available = true;
                    ad.numOfItems += quantity;
                    ad.save();
                })
            });
        }
    });
}

module.exports = doDeliveryStatusUpdateTask;