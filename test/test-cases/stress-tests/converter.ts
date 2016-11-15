'use strict';

module.exports = {
  stringToNumber: stringToNumber,
};

function stringToNumber(requestParams, context, ee, next) {

    requestParams.json['proposal_id'] = Number(requestParams.json['proposal_id']);
    requestParams.json['partner_id'] = Number(requestParams.json['partner_id']);
    return next();
    
}
