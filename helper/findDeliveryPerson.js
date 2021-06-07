const constants = require("./myConstants");

const findDeliveryPerson = (orders,index,distance,alternativeMedium) => {
    if(index < 0)
        return;

    var shoppingStartPoint = orders[index].itemsArrangedByStoppages[0].coordinate;
    let centerLocation = {
        type: "Point",
        coordinates: [
            shoppingStartPoint.long,
            shoppingStartPoint.lat
        ]
    };

    var threshold = Date.now() - 30000;
    let query = {
        lastUpdatedOn: {$gt: threshold},
        deliveryPersonID: {$nin: orders[index].rejectedBy},
        ongoingDeliveryID: null,
        deliveryRequestOrderID: null,
        allowRequest: true,
        curLocation: {
            $near: {
                $geometry: centerLocation,
                $maxDistance: distance
            }
        }
    };

    if(orders[index].distance < 2) {
        //for Bicycle deliveryMedium = null
        query.deliveryMedium = alternativeMedium ? "Motorcycle" : null;
    }
    else if(orders[index].distance > 7) {
        query.deliveryMedium = alternativeMedium ? null : "Motorcycle";
    }
    else {
        // forcing to skip default and carry out alternativeMedium phase to avoid run it twice
        alternativeMedium = true;
    }

    let mediumForLog = "any delivery medium";
    if(query.deliveryMedium === null) {
        mediumForLog = "Bicycle";
    }
    else if(query.deliveryMedium) {
        mediumForLog = query.deliveryMedium;
    }

    console.log("Finding dellivery person with "+ mediumForLog +" within " + distance + " meters for order :" + orders[index].id);

    const activeDeliveryPersonModel = require('../models/activeDeliveryPersonModel');
    activeDeliveryPersonModel.find(
        query,
        null,
        {
            sort: {numberOfRequestsToday: 1},
            limit: 1
        },
        (err,activeDeliveryPersons) => {
            if(err) {
                console.log('Error: ' + err);
                return findDeliveryPerson(orders,index-1,500);
            }
            const orderModel = require('../models/orderModel');
            orderModel.findById(orders[index].id,(err,order) => {
                if(err || !order) {
                    console.log('Error: ' + err);
                    return findDeliveryPerson(orders,index-1,500);
                }
                else if(activeDeliveryPersons.length > 0) {
                    var adpSelected = activeDeliveryPersons[0];
                    order.currentState = constants.REQUEST_ASSIGNED;
                    order.stateRecord[constants.REQUEST_ASSIGNED].time = Date.now();
                    order.deliveryPersonID = adpSelected.deliveryPersonID;
                    order
                    .save()
                    .then(o => {
                        adpSelected.deliveryRequestOrderID = order.id;
                        adpSelected.numberOfRequestsToday += 1;
                        adpSelected
                        .save()
                        .then(adp => {
                            findDeliveryPerson(orders,index-1,500);
                            const userModel = require('../models/userModel');
                            userModel.findById(adp.deliveryPersonID,(err,user) => {
                                if(!err && user !== null) {
                                    user.deliveryPersonInfo.dailyRecord.numberOfRequest += 1;
                                    user.deliveryPersonInfo.weeklyRecord.numberOfRequest += 1;
                                    user.deliveryPersonInfo.monthlyRecord.numberOfRequest += 1;
                                    user
                                    .save()
                                    .catch(
                                        console.log("ERROR: "+err)
                                    );
                                }
                            });
                        })
                        .catch(err => {
                            console.log("ERROR: "+err)
                            findDeliveryPerson(orders,index-1,500);
                        });
                    })
                    .catch(err => {
                        console.log("ERROR: "+err)
                        findDeliveryPerson(orders,index-1,500);
                    });
                }
                else {
                    if(distance === 500) distance = 1000;
                    else if(distance === 1000 && order.distance >= 2) distance = 2000;
                    else {
                        distance = 500;
                        if(alternativeMedium)
                            index -= 1;
                        else
                            alternativeMedium = true;
                    }

                    findDeliveryPerson(orders,index,distance,alternativeMedium);
                }
            });
        }
    );
}

module.exports = findDeliveryPerson;