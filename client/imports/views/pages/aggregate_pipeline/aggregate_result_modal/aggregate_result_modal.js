import {Template} from 'meteor/templating';

import './aggregate_result_modal.html';

const JSONEditor = require('jsoneditor');
/**
 * Created by RSercan on 19.5.2016.
 */
Template.aggregateResultModal.onRendered(function () {
    const jsonEditor = new JSONEditor(document.getElementById('divJsonEditor'), {
        mode: 'tree',
        modes: ['code', 'form', 'text', 'tree', 'view'],
        search: true
    });

    $('#divJsonEditorWrapper').data('jsoneditor', jsonEditor);
});

export const setResult = function (value) {
    $('#divJsonEditorWrapper').data('jsoneditor').set(value);
};