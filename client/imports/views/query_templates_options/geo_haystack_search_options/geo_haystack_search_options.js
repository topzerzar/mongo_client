import {Template} from 'meteor/templating';
import Helper from '/client/imports/helper';
import Enums from '/lib/imports/enums';
import {Session} from 'meteor/session';
import {$} from 'meteor/jquery';

import '/client/imports/views/query_templates_options/max_distance/max_distance.html';
import '/client/imports/views/query_templates_options/limit/limit.html';

import './geo_haystack_search_options.html';

/**
 * Created by RSercan on 2.1.2016.
 */
Template.search.onRendered(function () {
    Helper.initializeCodeMirror($('#divSearch'), 'txtSearch');
});

export const getOptions = function () {
    const result = {};
    Helper.checkAndAddOption("SEARCH", $('#divSearch'), result, Enums.GEO_HAYSTACK_SEARCH_OPTIONS);

    if ($.inArray("MAX_DISTANCE", Session.get(Helper.strSessionSelectedOptions)) != -1) {
        const maxDistanceValue = $('#inputMaxDistance').val();
        if (maxDistanceValue) {
            result[Enums.GEO_HAYSTACK_SEARCH_OPTIONS.MAX_DISTANCE] = parseInt(maxDistanceValue);
        }
    }

    if ($.inArray("LIMIT", Session.get(Helper.strSessionSelectedOptions)) != -1) {
        const limitVal = $('#inputLimit').val();
        if (limitVal) {
            result[Enums.GEO_HAYSTACK_SEARCH_OPTIONS.LIMIT] = parseInt(limitVal);
        }
    }

    return result;
};