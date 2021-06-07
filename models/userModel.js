const mongoose = require('mongoose');
const deliveryPersonSchema = require('./deliveryPersonSchema')
const schema = mongoose.Schema;

const userSchema = new schema({
    countryCodeFull: {
        type: String
    },
    countryCode: {
        type: String
    },
    phoneNumber: {
        type: String,
        unique : true
    },
    password: {
        type: String
    },
    createdOn: {
        type: Date,
        default: Date.now
    },
    photo: {
        type:String
    },
    email: {
        type:String,
        default: ""
    },
    name: {
        type: String
    },
    loggedInInstances: {
        type: Number,
        default: 0
    },
    deliveryPersonInfo: {
        type: deliveryPersonSchema
    },
    activeDeliveryPersonID: {
        type: schema.Types.ObjectId,
        ref: 'activeDeliveryPersons'
    },
    cartItemNumber: {
        type: Number,
        default: 0
    },
    avgRating: {
        type: Number,
        default: 0
    },
    numberOfRatings: {
        type: Number,
        default: 0
    },
    numberOfCompletedOrders: {
        type: Number,
        default: 0
    },
    userType: {
        type: String,
        default: "General User"
    },
    balance: {
        type: Number,
        default: 0
    },
    rechargeRecords: [{
        rechargeAmount: Number,
        rechargeMedium: {
            type: String,
            default: "Qbird"
        },
        balanceAfterRecharge: Number,
        transactionID: schema.Types.ObjectId,
        time: {
            type: Date,
            default: Date.now
        }
    }]
});

const userModel = mongoose.model('users',userSchema,'users');

module.exports = userModel;