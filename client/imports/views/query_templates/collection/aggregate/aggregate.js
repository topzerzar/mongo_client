import {Template} from "meteor/templating";
import {Meteor} from "meteor/meteor";
import Helper from "/client/imports/helper";
import {Session} from "meteor/session";
import Enums from "/lib/imports/enums";
import {initExecuteQuery} from "/client/imports/views/pages/browse_collection/browse_collection";
import {getAggregateOptions} from "/client/imports/views/query_templates_options/aggregate_options/aggregate_options";
import "./aggregate.html";

const toastr = require('toastr');
const Ladda = require('ladda');
/**
 * Created by RSercan on 2.1.2016.
 */
Template.aggregate.onRendered(function () {
    Helper.initializeCodeMirror($('#divPipeline'), 'txtPipeline');
    initializeOptions();
});

const initializeOptions = function () {
    const cmb = $('#cmbAggregateOptions');
    $.each(Helper.sortObjectByKey(Enums.AGGREGATE_OPTIONS), function (key, value) {
        cmb.append($("<option></option>")
            .attr("value", key)
            .text(value));
    });

    cmb.chosen();
    Helper.setOptionsComboboxChangeEvent(cmb);
};


Template.aggregate.executeQuery = function (historyParams) {
    initExecuteQuery();
    const selectedCollection = Session.get(Helper.strSessionSelectedCollection);
    let pipeline = historyParams ? JSON.stringify(historyParams.pipeline) : Helper.getCodeMirrorValue($('#divPipeline'));
    const options = historyParams ? historyParams.options : getAggregateOptions();

    pipeline = Helper.convertAndCheckJSON(pipeline);
    if (pipeline["ERROR"]) {
        toastr.error("Syntax error on pipeline: " + pipeline["ERROR"]);
        Ladda.stopAll();
        return;
    }

    if (options["ERROR"]) {
        toastr.error(options["ERROR"]);
        Ladda.stopAll();
        return;
    }

    const params = {
        pipeline: pipeline,
        options: options
    };

    Meteor.call("aggregate", selectedCollection, pipeline, options, function (err, result) {
            Helper.renderAfterQueryExecution(err, result, false, "aggregate", params, (!historyParams));
        }
    );
};

Template.aggregate.renderQuery = function (query) {
    if (query.queryParams && query.queryParams.pipeline) {
        // let codemirror initialize
        Meteor.setTimeout(function () {
            Helper.setCodeMirrorValue($('#divPipeline'), JSON.stringify(query.queryParams.pipeline, null, 1));
        }, 100);
    }


    if (query.queryParams.options) {
        let optionsArray = [];
        for (let property in query.queryParams.options) {
            if (query.queryParams.options.hasOwnProperty(property) && (_.invert(Enums.AGGREGATE_OPTIONS))[property]) {
                optionsArray.push((_.invert(Enums.AGGREGATE_OPTIONS))[property]);
            }
        }

        Meteor.setTimeout(function () {
            $('#cmbAggregateOptions').val(optionsArray).trigger('chosen:updated');
            Session.set(Helper.strSessionSelectedOptions, optionsArray);
        }, 100);

        // options load
        Meteor.setTimeout(function () {
            for (let i = 0; i < optionsArray.length; i++) {
                let option = optionsArray[i];
                let inverted = (_.invert(Enums.AGGREGATE_OPTIONS));
                if (option === inverted.collation) {
                    Helper.setCodeMirrorValue($('#divCollation'), JSON.stringify(query.queryParams.options.collation, null, 1));
                }
                if (option === inverted.bypassDocumentValidation) {
                    $('#divBypassDocumentValidation').iCheck(query.queryParams.options.bypassDocumentValidation ? 'check' : 'uncheck');
                }
                if (option === inverted.maxTimeMS) {
                    $('#inputMaxTimeMs').val(query.queryParams.options.maxTimeMS);
                }
                if (option === inverted.allowDiskUse) {
                    $('#divAllowDiskUse').iCheck(query.queryParams.options.allowDiskUse ? 'check' : 'uncheck');
                }
                if (option === inverted.explain) {
                    $('#divExecuteExplain').iCheck(query.queryParams.options.explain ? 'check' : 'uncheck');
                }
            }
        }, 200);
    }
};
