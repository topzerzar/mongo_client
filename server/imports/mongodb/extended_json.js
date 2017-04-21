/**
 * Created by Sercan on 29.10.2016.
 */
const bson = require('bson');
const Binary = bson.Binary, Long = bson.Long, MaxKey = bson.MaxKey, MinKey = bson.MinKey, BSONRegExp = bson.BSONRegExp, Timestamp = bson.Timestamp, ObjectId = bson.ObjectId, Code = bson.Code, Decimal128 = bson.Decimal128;


export const serialize = function (obj) {
    // there are some other objects such as Math, Date etc..
    if (obj && (typeof obj === 'object') && Object.prototype.toString.call(obj) !== '[object Array]' && serializeResult(obj)) {
        return serializeResult(obj);
    }

    for (let property in obj) {
        if (obj.hasOwnProperty(property) && obj[property] !== null) {
            if ((typeof obj[property] === 'object') && Object.prototype.toString.call(obj[property]) !== '[object Array]') {
                if (serializeResult(obj[property])) {
                    obj[property] = serializeResult(obj[property]);
                } else {
                    obj[property] = serialize(obj[property]);
                }
            }
            else if (Object.prototype.toString.call(obj[property]) === '[object Array]') {
                for (let i = 0; i < obj[property].length; i++) {
                    if (obj[property][i] !== null && (typeof obj[property][i] === 'object') && Object.prototype.toString.call(obj[property][i]) !== '[object Array]' && serializeResult(obj[property][i])) {
                        obj[property][i] = serializeResult(obj[property][i]);
                    }
                    else {
                        obj[property][i] = serialize(obj[property][i]);
                    }
                }
            }
        }
    }

    return obj;
};

export const deserialize = function (obj) {
    if (obj && Object.prototype.toString.call(obj) === '[object Object]' && deserializeResult(obj)) {
        return deserializeResult(obj);
    }

    for (let property in obj) {
        if (obj.hasOwnProperty(property) && obj[property]) {
            if (Object.prototype.toString.call(obj[property]) === '[object Object]') {
                if (deserializeResult(obj[property])) {
                    obj[property] = deserializeResult(obj[property]);
                } else {
                    obj[property] = deserialize(obj[property]);
                }
            }
            else if (Object.prototype.toString.call(obj[property]) === '[object Array]') {
                for (let i = 0; i < obj[property].length; i++) {
                    if (obj[property][i] !== null && Object.prototype.toString.call(obj[property][i]) === '[object Object]' && deserializeResult(obj[property][i])) {
                        obj[property][i] = deserializeResult(obj[property][i]);
                    }
                    else {
                        obj[property][i] = deserialize(obj[property][i]);
                    }
                }
            }
        }
    }

    return obj;
};

const deserializeResult = function (doc) {
    if (doc['$binary'] != undefined) {
        return new Binary(new Buffer(doc['$binary'], 'base64'), new Buffer(doc['$type'], 'hex')[0]);
    } else if (doc['$code'] != undefined) {
        return new Code(doc['$code'], doc['$scope']);
    } else if (doc['$date'] != undefined) {
        if (typeof doc['$date'] == 'string') {
            return new Date(doc['$date']);
        } else if (typeof doc['$date'] == 'object'
            && doc['$date']['$numberLong']) {
            let date = new Date();
            date.setTime(parseInt(doc['$date']['$numberLong'], 10));
            return date;
        }
    } else if (doc['$numberLong'] != undefined) {
        return Long.fromString(doc['$numberLong']);
    } else if (doc['$maxKey'] != undefined) {
        return new MaxKey();
    } else if (doc['$minKey'] != undefined) {
        return new MinKey();
    } else if (doc['$oid'] != undefined) {
        return new ObjectId(new Buffer(doc['$oid'], 'hex'));
    } else if (doc['$regex'] != undefined) {
        let options = doc['$options'];
        if (!options) {
            options = "";
        }
        return new BSONRegExp(doc['$regex'], options)
    } else if (doc['$timestamp'] != undefined) {
        return new Timestamp(doc['$timestamp'].i, doc['$timestamp'].t);
    } else if (doc['$numberDecimal'] != undefined) {
        return new Decimal128.fromString(doc['$numberDecimal']);
    } else if (doc['$undefined'] != undefined) {
        return undefined;
    }
};

const serializeResult = function (doc) {
    if (doc instanceof Binary || doc._bsontype == 'Binary') {
        return {
            '$binary': doc.buffer.toString('base64'),
            '$type': new Buffer([doc.sub_type]).toString('hex')
        };
    } else if (doc instanceof Code || doc._bsontype == 'Code') {
        let res = {'$code': doc.code};
        if (doc.scope) res['$scope'] = doc.scope;
        return res;
    } else if (doc instanceof Date) {
        return {'$date': doc.toISOString()};
    } else if (doc instanceof Long || doc._bsontype == 'Long') {
        return {'$numberLong': doc.toString()};
    } else if (doc instanceof MaxKey || doc._bsontype == 'MaxKey') {
        return {'$maxKey': true};
    } else if (doc instanceof MinKey || doc._bsontype == 'MinKey') {
        return {'$minKey': true};
    } else if (doc instanceof ObjectId || doc._bsontype == 'ObjectID') {
        return {'$oid': doc.toString()};
    } else if (doc instanceof BSONRegExp) {
        return {'$regex': doc.pattern, '$options': doc.options};
    } else if (doc instanceof Timestamp || doc._bsontype == 'Timestamp') {
        return {'$timestamp': {t: doc.high_, i: doc.low_}};
    } else if (doc instanceof Decimal128 || doc._bsontype == 'Decimal128') {
        return {'$numberDecimal': doc.toString()};
    } else if (doc === undefined) {
        return {'$undefined': true};
    }
};