const shopModel = require('../models/shopModel');

const applyMonthlyChargeOnShop = () => {
    shopModel.find({},(err,shops) => {
        if(err) {
            console.log(err);
            console.log("Failed to calculate MonthlyChargeOnShops . . .");
            return;
        }
        if(!shops) {
            console.log("Error in shop collection or not exist");
            return;
        }

        shops.forEach(shop => {
            var currentDate = new Date(Date.now() + 21600000);
            var currentYear = currentDate.getFullYear();
            var monthIndex = currentDate.getMonth();
            var length = shop.yearlySale.length;

            if(length < 1 || shop.yearlySale[length-1].year !== currentYear) {
                var monthlySale = new Array(12).fill(0);
                shop.yearlySale.push({
                    year: currentYear,
                    sale: 0,
                    monthlySale: monthlySale
                })
                length = shop.yearlySale.length;
            }

            var lastMonthSale = 0;

            if(monthIndex === 0) {
                if(length > 1) {
                    lastMonthSale = shop.yearlySale[length-2].monthlySale[11];
                }
            }
            else {
                lastMonthSale = shop.yearlySale[length-1].monthlySale[monthIndex-1];
            }

            var totalCharge = 0;

            if(shop.dealWithShop) {
                shop.dealWithShop.forEach(deal => {
                    if((deal.minOrder && lastMonthSale < deal.minOrder) || (deal.maxOrder && lastMonthSale > deal.maxOrder)) return;

                    if(deal.dealType === "Amount")
                        totalCharge += deal.dealQuantity;
                    else
                        totalCharge += Math.round(lastMonthSale * deal.dealQuantity) / 100;
                    
                });
            }

            shop.balance -= totalCharge;

            var todayDate = currentDate.getDate();
            var currentMonthSale = new Array(todayDate).fill(0);
            shop.dailySale.unshift(currentMonthSale);
            if(shop.dailySale.length > 4)
                shop.dailySale.pop();
        });
    })
}

module.exports = applyMonthlyChargeOnShop;