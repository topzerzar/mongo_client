import {Template} from 'meteor/templating';
import {Meteor} from 'meteor/meteor';
import {Session} from 'meteor/session';
import {FlowRouter} from 'meteor/kadira:flow-router';
import Helper from '/client/imports/helper';
import {setResult} from './aggregate_result_modal/aggregate_result_modal';

import './aggregate_pipeline.html';

const toastr = require('toastr');
const Ladda = require('ladda');

/**
 * Created by RSercan on 14.5.2016.
 */
let stageNumbers = 0;

const initCodeMirrorStage = function () {
    Helper.initializeCodeMirror($('#wrapper' + stageNumbers), 'txtObjectStage' + stageNumbers);
};

const createPipeline = function (stageListElements) {
    const pipeline = [];
    stageListElements.each(function () {
        const stage = {};

        const liElement = $(this);
        const queryName = liElement.text().split(' ')[0].trim();
        if (liElement.find('[id^=inputNumberStage]').length != 0) {
            stage[queryName] = parseInt(liElement.find('[id^=inputNumberStage]').val());
        } else if (liElement.find('[id^=wrapper]').data('editor')) {
            let jsonValue = liElement.find('[id^=wrapper]').data('editor').getValue();
            jsonValue = Helper.convertAndCheckJSON(jsonValue);
            if (jsonValue["ERROR"]) {
                throw queryName + " error: " + jsonValue["ERROR"];
            }
            stage[queryName] = jsonValue;
        }
        else if (liElement.find('[id^=txtStringStage]').length != 0) {
            stage[queryName] = liElement.find('[id^=txtStringStage]').val();
        } else {
            throw queryName;
        }

        pipeline.push(stage);
    });

    return pipeline;
};

Template.aggregatePipeline.onRendered(function () {
    if (Session.get(Helper.strSessionCollectionNames) == undefined) {
        FlowRouter.go('/databaseStats');
        return;
    }

    let settings = this.subscribe('settings');
    let connections = this.subscribe('connections');

    this.autorun(() => {
        if (connections.ready() && settings.ready()) {
            $("#stages").sortable({
                connectWith: ".connectList"
            });

            $('#cmbStageQueries').chosen();

            stageNumbers = 0;

            Helper.initializeCollectionsCombobox();
        }
    });
});

Template.aggregatePipeline.events({
    'click #btnExecuteAggregatePipeline' (e) {
        e.preventDefault();

        let selectedCollection = $("#cmbCollections").chosen().val();
        const stages = $('#stages').find('li');
        if (!selectedCollection) {
            toastr.warning('Please select a collection first !');
            return;
        }

        if (stages.length == 0) {
            toastr.warning('At least one stage is required !');
            return;
        }

        Ladda.create(document.querySelector('#btnExecuteAggregatePipeline')).start();

        let pipeline;
        try {
            pipeline = createPipeline(stages);
        }
        catch (e) {
            toastr.error('One of the stages has error: ' + e);
            Ladda.stopAll();
            return;
        }


        Meteor.call("aggregate", selectedCollection, pipeline, function (err, result) {
                if (err || result.error) {
                    Helper.showMeteorFuncError(err, result, "Couldn't execute ");
                }
                else {
                    setResult(result.result);
                    $('#aggregateResultModal').modal('show');
                }

                Ladda.stopAll();
            }
        );

    },

    'change #cmbStageQueries'() {
        const cmb = $("#cmbStageQueries");
        let query = cmb.chosen().val();
        if (query) {
            query = '$' + query;
            let liElement = '<li class="success-element" id="stage' + stageNumbers + '">' + query + '<div id="wrapper' + stageNumbers + '" class="agile-detail">' +
                '<a id="remove-stage-element" href="#" data-number="' + stageNumbers + '" class="pull-right btn btn-xs btn-white"><i class="fa fa-remove"></i> Remove</a>';

            let stringInput = '<input type="text" class="form-control" id="txtStringStage' + stageNumbers + '"/>';
            let numberInput = '<input id="inputNumberStage' + stageNumbers + '" min="0" type="number" class="form-control">';
            let initCodeMirror;
            switch (query) {
                case '$limit':
                    liElement += numberInput;
                    break;
                case '$skip':
                    liElement += numberInput;
                    break;
                case '$out':
                    liElement += stringInput;
                    break;
                case '$sortByCount':
                    liElement += stringInput;
                    break;
                case '$count':
                    liElement += stringInput;
                    break;
                default:
                    initCodeMirror = true;
                    liElement += '<textarea id="txtObjectStage' + stageNumbers + '" class="form-control"></textarea>';
                    break;
            }

            liElement += '</div> </li>';
            $('#stages').append(liElement);

            if (initCodeMirror) {
                initCodeMirrorStage();
            }

            cmb.val('').trigger('chosen:updated');
            stageNumbers++;
        }
    },

    'click #remove-stage-element' (e) {
        e.preventDefault();
        const stageId = '#stage' + $(e.target).data('number');
        $(stageId).remove();
    }
});