/**
 * Created by RSercan on 27.12.2015.
 */
/*global Async*/
import LOGGER from "../internal/logger";
import Helper from "./helper";
import {Meteor} from "meteor/meteor";
import {database} from "./methods_common";


const proceedMapReduceExecution = function (selectedCollection, map, reduce, options) {
    options = Helper.convertJSONtoBSON(options);

    LOGGER.info('[mapReduce]', selectedCollection, map, reduce, options);

    let result = Async.runSync(function (done) {
        try {
            const collection = database.collection(selectedCollection);
            collection.mapReduce(map, reduce, options, function (err, resultCollection) {
                if (err) {
                    done(err, null);
                    return;
                }
                if ((typeof options.out) == 'string') {
                    resultCollection.find().toArray(function (err, result) {
                        done(err, result);
                    });
                }
                else {
                    done(err, resultCollection);
                }
            });
        }
        catch (ex) {
            LOGGER.error('[mapReduce]', ex);
            done(new Meteor.Error(ex.message), null);
        }
    });

    return Helper.convertBSONtoJSON(result);
};

export const proceedQueryExecution = function (selectedCollection, methodArray, removeCollectionTopology) {
    LOGGER.info(JSON.stringify(methodArray), selectedCollection);

    let result = Async.runSync(function (done) {
        try {
            let execution = database.collection(selectedCollection);
            for (let i = 0; i < methodArray.length; i++) {
                let last = i == (methodArray.length - 1);
                let entry = methodArray[i];
                entry = Helper.convertJSONtoBSON(entry);
                for (let key in entry) {
                    if (entry.hasOwnProperty(key)) {
                        if (last && key == Object.keys(entry)[Object.keys(entry).length - 1]) {
                            entry[key].push(function (err, docs) {
                                done(err, docs);
                            });

                            execution[key].apply(execution, entry[key]);
                        }
                        else {
                            execution = execution[key].apply(execution, entry[key]);
                        }
                    }
                }
            }
        }
        catch (ex) {
            LOGGER.error(methodArray, ex);
            done(new Meteor.Error(ex.message), null);
        }
    });

    if (removeCollectionTopology) {
        Helper.removeCollectionTopology(result);
    }
    Helper.removeConnectionTopology(result);
    return Helper.convertBSONtoJSON(result);
};

Meteor.methods({
    saveFindResult(selectedCollection, updateObjects, deleteObjectIds, addedObjects){
        for (let obj of updateObjects) {
            proceedQueryExecution(selectedCollection, [{"updateOne": [{_id: obj._id}, obj, {}]}]);
        }

        if (deleteObjectIds.length > 0) {
            proceedQueryExecution(selectedCollection, [{"deleteMany": [{_id: {$in: deleteObjectIds}}]}]);
        }

        if (addedObjects.length > 0) {
            proceedQueryExecution(selectedCollection, [{"insertMany": [addedObjects]}]);
        }
    },

    bulkWrite(selectedCollection, operations, options) {
        const methodArray = [
            {
                "bulkWrite": [operations, options]
            }
        ];
        return proceedQueryExecution(selectedCollection, methodArray);
    },

    updateOne(selectedCollection, selector, setObject, options) {
        const methodArray = [
            {
                "updateOne": [selector, setObject, options]
            }
        ];
        return proceedQueryExecution(selectedCollection, methodArray);
    },

    updateMany(selectedCollection, selector, setObject, options) {
        const methodArray = [
            {
                "updateMany": [selector, setObject, options]
            }
        ];
        return proceedQueryExecution(selectedCollection, methodArray);
    },

    stats(selectedCollection, options) {
        const methodArray = [
            {
                "stats": [options]
            }
        ];
        return proceedQueryExecution(selectedCollection, methodArray);
    },

    rename(selectedCollection, newName, options) {
        const methodArray = [
            {
                "rename": [newName, options]
            }
        ];

        return proceedQueryExecution(selectedCollection, methodArray, true);
    },

    reIndex(selectedCollection) {
        const methodArray = [
            {
                "reIndex": []
            }
        ];
        return proceedQueryExecution(selectedCollection, methodArray);
    },

    options(selectedCollection) {
        const methodArray = [
            {
                "options": []
            }
        ];
        return proceedQueryExecution(selectedCollection, methodArray);
    },

    mapReduce(selectedCollection, map, reduce, options) {
        return proceedMapReduceExecution(selectedCollection, map, reduce, options);
    },

    isCapped(selectedCollection) {
        const methodArray = [
            {
                "isCapped": []
            }
        ];
        return proceedQueryExecution(selectedCollection, methodArray);
    },

    insertMany(selectedCollection, docs, options) {
        const methodArray = [
            {
                "insertMany": [docs, options]
            }
        ];
        return proceedQueryExecution(selectedCollection, methodArray);
    },

    indexInformation(selectedCollection, isFull) {
        const methodArray = [
            {
                "indexInformation": [{'full': isFull}]
            }
        ];
        return proceedQueryExecution(selectedCollection, methodArray);
    },

    geoNear(selectedCollection, xAxis, yAxis, options) {
        const methodArray = [
            {
                "geoNear": [xAxis, yAxis, options]
            }
        ];
        return proceedQueryExecution(selectedCollection, methodArray);
    },

    geoHaystackSearch(selectedCollection, xAxis, yAxis, options) {
        const methodArray = [
            {
                "geoHaystackSearch": [xAxis, yAxis, options]
            }
        ];
        return proceedQueryExecution(selectedCollection, methodArray);
    },

    dropIndex(selectedCollection, indexName) {
        const methodArray = [
            {
                "dropIndex": [indexName]
            }
        ];

        return proceedQueryExecution(selectedCollection, methodArray);
    },

    distinct(selectedCollection, selector, fieldName, options) {
        const methodArray = [
            {
                "distinct": [fieldName, selector, options]
            }
        ];

        return proceedQueryExecution(selectedCollection, methodArray);
    },

    delete(selectedCollection, selector) {
        const methodArray = [
            {
                "deleteMany": [selector]
            }
        ];

        return proceedQueryExecution(selectedCollection, methodArray);
    },

    createIndex(selectedCollection, fields, options) {
        const methodArray = [
            {
                "createIndex": [fields, options]
            }
        ];

        return proceedQueryExecution(selectedCollection, methodArray);
    },

    findOne(selectedCollection, selector, cursorOptions) {
        const methodArray = [
            {
                "find": [selector]
            }
        ];
        for (let key in cursorOptions) {
            if (cursorOptions.hasOwnProperty(key) && cursorOptions[key]) {
                let obj = {};
                obj[key] = [cursorOptions[key]];
                methodArray.push(obj);
            }
        }
        methodArray.push({'limit': [1]});
        methodArray.push({'next': []});
        return proceedQueryExecution(selectedCollection, methodArray);
    },

    find(selectedCollection, selector, cursorOptions, executeExplain) {
        const methodArray = [
            {
                "find": [selector]
            }
        ];
        for (let key in cursorOptions) {
            if (cursorOptions.hasOwnProperty(key) && cursorOptions[key]) {
                let obj = {};
                obj[key] = [cursorOptions[key]];
                methodArray.push(obj);
            }
        }

        if (executeExplain) {
            methodArray.push({'explain': []});
        } else {
            methodArray.push({'toArray': []});
        }

        return proceedQueryExecution(selectedCollection, methodArray);
    },

    findOneAndUpdate(selectedCollection, selector, setObject, options) {
        const methodArray = [
            {
                "findOneAndUpdate": [selector, setObject, options]
            }
        ];
        return proceedQueryExecution(selectedCollection, methodArray);
    },

    findOneAndReplace(selectedCollection, selector, setObject, options) {
        const methodArray = [
            {
                "findOneAndReplace": [selector, setObject, options]
            }
        ];
        return proceedQueryExecution(selectedCollection, methodArray);
    },

    findOneAndDelete(selectedCollection, selector, options) {
        const methodArray = [
            {
                "findOneAndDelete": [selector, options]
            }
        ];
        return proceedQueryExecution(selectedCollection, methodArray);
    },

    aggregate(selectedCollection, pipeline, options = {}) {
        const methodArray = [
            {
                "aggregate": [pipeline, options]
            }
        ];
        return proceedQueryExecution(selectedCollection, methodArray);
    },

    count(selectedCollection, selector, options) {
        const methodArray = [
            {
                "count": [selector, options]
            }
        ];
        return proceedQueryExecution(selectedCollection, methodArray);
    },

    group (selectedCollection, keys, condition, initial, reduce, finalize, command){
        const methodArray = [
            {
                "group": [keys, condition, initial, reduce, finalize, command]
            }
        ];

        return proceedQueryExecution(selectedCollection, methodArray);
    }
});