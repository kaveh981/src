'use strict';

exports.stringToNumber = function (requestParams, context, ee, next) {

    requestParams.json['proposal_id'] = Number(requestParams.json['proposal_id']);
    requestParams.json['partner_id'] = Number(requestParams.json['partner_id']);
    return next();

};
