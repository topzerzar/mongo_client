import {Template} from "meteor/templating";
import {Meteor} from "meteor/meteor";
import Helper from "/client/imports/helper";
import "./view_raw.html";

const toastr = require('toastr');
const Ladda = require('ladda');

export const initialize = function () {
    const modal = $('#viewRawModal');
    const selectedCollection = modal.data('collection');
    const indexName = modal.data('index');

    if (!selectedCollection || !indexName) {
        toastr.error("Couldn't find collection or index name, please try again...");
        modal.modal('hide');
        return;
    }

    Ladda.create(document.querySelector('#btnCloseRawViewModal')).start();
    Meteor.call("indexInformation", selectedCollection, true, function (err, indexInformation) {
        if (err || indexInformation.error) {
            Helper.showMeteorFuncError(err, indexInformation, "Couldn't fetch index information");
        }
        else {
            let found = false;
            for (let index of indexInformation.result) {
                if (index.name === indexName) {
                    found = true;
                    Helper.setCodeMirrorValue($('#divViewRaw'), JSON.stringify(index, null, 1), $('#txtViewRaw'));
                    $('#viewRawTitle').html(index.name);
                }
            }

            if (!found) {
                toastr.error("Couldn't find index: " + indexName);
            }
        }

        Ladda.stopAll();

    });

};

Template.viewRaw.onRendered(function () {
    Helper.initializeCodeMirror($('#divViewRaw'), 'txtViewRaw', false, 300);
});