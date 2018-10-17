//**************************************************************************************************
// CASS UI Profile Explorer UI Utility Functions
//**************************************************************************************************

//TODO implement goToDisplayRoot

//**************************************************************************************************
// Constants

const DEBUG_CONSOLE = true;
const DEBUG_ALERT = false;

const LIST_VIEW_SCROLL_ITEM_OFFSET = 220;

// Screens
const GRAPH_SCREEN_SIMPLE = "graph-screen";
const GRAPH_SCREEN = "#" + GRAPH_SCREEN_SIMPLE;
const LIST_SCREEN_SIMPLE = "list-screen";
const LIST_SCREEN = "#" + LIST_SCREEN_SIMPLE;

// Various Page Element IDs
const CASSUI_MAIN_BUSY_CTR = "#cassUiMainBusyContainer";
const CASSUI_MAIN_BUSY_TXT = "#cassUiMainBusyText";
const CASSUI_MAIN_ERR_CTR = "#cassUiMainErrorContainer";
const CASSUI_MAIN_ERR_TXT = "#cassUiMainErrorText";
const CASSUI_HIGH_LVL_WARNING = ".cassUiHighLevelWarning";
const CASSUI_MAIN_CONTENTS_CTR = "#cassUiMainContentsContainer";

const CASSUI_MODAL_INPUT = ".cassUiModalInput";
const CASSUI_MODAL_BTN = ".cassUiModalButton";
const CASSUI_MODAL_BUSY_CTR = ".cassUiModalBusyCtr";
const CASSUI_MODAL_BUSY_TXT = ".cassUiModalBusyText";
const CASSUI_MODAL_ERROR_CTR = ".cassUiModalErrorCtr";
const CASSUI_MODAL_ERROR_TXT = ".cassUiModalErrorText";

const SHOW_GRAPH_VIEW_BTN = "#showGraphViewBtn";
const SHOW_LIST_VIEW_BTN = "#showListViewBtn";

//**************************************************************************************************
// Variables
var currentScreen;

//**************************************************************************************************
// General UI Utility Functions
//**************************************************************************************************

queryParams = function () {
    if (window.document.location.search == null)
        return {};
    var hashSplit = (window.document.location.search.split("?"));
    if (hashSplit.length > 1) {
        var o = {};
        var paramString = hashSplit[1];
        var parts = (paramString).split("&");
        for (var i = 0; i < parts.length; i++)
            o[parts[i].split("=")[0]] = decodeURIComponent(parts[i].replace(parts[i].split("=")[0] + "=", ""));
        return o;
    }
    return {};
};

queryParams = queryParams();

function debugMessage(msg) {
    if (DEBUG_CONSOLE) console.log(msg);
    if (DEBUG_ALERT) alert(msg);
}

function showScreen(newScreen) {
    $('.screen:visible').fadeOut('fast', function () {
        $('#' + newScreen).fadeIn('fast');
    });
}

function showPageMainContentsContainer() {
    if (!$(CASSUI_MAIN_CONTENTS_CTR).is(":visible")) {
        $(CASSUI_MAIN_BUSY_CTR).hide();
        $(CASSUI_MAIN_ERR_CTR).hide();
        $(CASSUI_MAIN_CONTENTS_CTR).show();
    }
}

function hidePageMainContentsContainer() {
    $(CASSUI_MAIN_CONTENTS_CTR).hide();
}


function showPageAsBusy(text) {
    $(CASSUI_MAIN_ERR_CTR).hide();
    $(CASSUI_HIGH_LVL_WARNING).hide();
    hidePageMainContentsContainer();
    $(CASSUI_MAIN_BUSY_TXT).html(text);
    $(CASSUI_MAIN_BUSY_CTR).show();
}

function showPageError(text) {
    $(CASSUI_MAIN_BUSY_CTR).hide();
    $(CASSUI_HIGH_LVL_WARNING).hide();
    hidePageMainContentsContainer();
    $(CASSUI_MAIN_ERR_TXT).html(text);
    $(CASSUI_MAIN_ERR_CTR).show();
    disableViewToggleButtons();
    showOnlyOpenFrameworkTool();
}

function disableModalInputsAndButtons() {
    $(CASSUI_MODAL_INPUT).attr("disabled", "true");
    $(CASSUI_MODAL_BTN).attr("disabled", "true");
}

function enableModalInputsAndButtons() {
    $(CASSUI_MODAL_INPUT).removeAttr("disabled");
    $(CASSUI_MODAL_BTN).removeAttr("disabled");
}

function showModalBusy(modalId,busyHtml) {
    hideModalError(modalId);
    disableModalInputsAndButtons();
    $(modalId + ' ' + CASSUI_MODAL_BUSY_TXT).html(busyHtml);
    $(modalId + ' ' + CASSUI_MODAL_BUSY_CTR).show();
}

function hideModalBusy(modalId) {
    $(modalId + ' ' + CASSUI_MODAL_BUSY_CTR).hide();
}

function showModalError(modalId,errorHtml) {
    hideModalBusy(modalId);
    enableModalInputsAndButtons();
    $(modalId + ' ' + CASSUI_MODAL_ERROR_TXT).html(errorHtml);
    $(modalId + ' ' + CASSUI_MODAL_ERROR_CTR).show();
}

function hideModalError(modalId) {
    $(modalId + ' ' + CASSUI_MODAL_ERROR_CTR).hide();
    $(CASSUI_MODAL_INPUT).removeClass("invalid");
}

function showModalInputAsInvalid(fieldId) {
    $(fieldId).addClass("invalid");
}

function generateAnchorLink(href, text, target) {
    return "<a href=\"" + href + "\" target=\"" + target + "\">" + escapeSingleQuote(text) + "</a>";
}

function buildFrameworkHyperlink(frameworkId,frameworkName) {
    return generateAnchorLink("https://cassproject.github.io/cass-editor/?frameworkId=" + frameworkId + "&view=true", frameworkName, frameworkName);
}

function buildFrameworkCompetencyHyperlink(frameworkId,competencyId,competencyName) {
    return generateAnchorLink("https://cassproject.github.io/cass-editor/?frameworkId=" + frameworkId + "&competencyId=" +  + "&view=true", competencyName, competencyName);
}

if ( typeof String.prototype.startsWith != 'function' ) {
    String.prototype.startsWith = function( str ) {
        return str.length > 0 && this.substring( 0, str.length ) === str;
    }
};

if ( typeof String.prototype.endsWith != 'function' ) {
    String.prototype.endsWith = function( str ) {
        return str.length > 0 && this.substring( this.length - str.length, this.length ) === str;
    }
};

//**************************************************************************************************
// Profile Explorer Page UI Functions
//**************************************************************************************************

//TODO implement goToDisplayRoot
function goToDisplayRoot() {
    // if (hasFinishedLoading) {
    //     //Node ID for a framework is its name..since that is the only node with a name ID, it should be fine...
    //     zoomExpCgByD3NodeId(currentFrameworkName, true);
    // }
}

//**************************************************************************************************
// List Screen Utility Functions
//**************************************************************************************************

// Toggle sorting items
$('#filter-options').on('click', 'li', function () {
    $('#filter-options li').removeClass('active');
    $(this).addClass('active');
});

// Expand or collapse list items and their children
$('#list-screen__root li').on('click', 'h3, h4, .fa-li', function (evt) {
    // keep click event from bubbling up through all nested lists items
    evt.stopPropagation();
    evt.preventDefault();

    // switch between classes: expanded and collapsed
    // switch out list icons for .fa-li items

    var obj = $(this).closest('li');
    var action = 'none';

    if (obj.hasClass('collapsed')) action = "expand";
    if (obj.hasClass('expanded')) action = "collapse";

    $("#profileSearchInput").val("");

    switch (action) {
        case 'expand':
            obj.removeClass('collapsed').addClass('expanded');
            obj.children('.title').children('.fa-li').removeClass('fa-caret-right').addClass('fa-caret-down');
            obj.children('ul').slideDown('fast');
            break;

        case 'collapse':
            obj.removeClass('expanded').addClass('collapsed');
            obj.children('.title').children('.fa-li').addClass('fa-caret-right').removeClass('fa-caret-down');
            obj.children('ul').slideUp('fast');

            break;

        default:
        // not expandable, do nothing.
    }
});

//**************************************************************************************************
// JQuery Functions
//**************************************************************************************************

jQuery.fn.scrollTo = function (elem, speed) {
    $(this).animate({
        scrollTop: $(this).scrollTop() - $(this).offset().top + $(elem).offset().top
    }, speed == undefined ? 1000 : speed);
    return this;
};

//**************************************************************************************************
// Foundation
//**************************************************************************************************

$(document).foundation();
