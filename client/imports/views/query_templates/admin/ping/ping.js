import {Template} from 'meteor/templating';
import {Meteor} from 'meteor/meteor';
import Helper from '/client/imports/helper';
import {initExecuteQuery} from '/client/imports/views/pages/admin_queries/admin_queries';

import './ping.html';

/**
 * Created by RSercan on 10.1.2016.
 */
Template.ping.onRendered(function () {
    Helper.changeRunOnAdminOptionVisibility(false);
});

Template.ping.executeQuery = function () {
    initExecuteQuery();

    Meteor.call("ping", function (err, result) {
        Helper.renderAfterQueryExecution(err, result, true);
    });
};