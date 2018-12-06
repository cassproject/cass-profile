//**************************************************************************************************
// CASS UI Profile Explorer Main Functions
//**************************************************************************************************

//TODO cleanFrameworkName expand on or get rid of
//TODO generateEvidenceSource expand this
//TODO loadPageContents At some point take loggedInPkPem check out and just start with setProfileUserAsLoggedInUserAndGo OR setUpForProfileUserSearch

//TODO getAssertionsForD3Node fix for multi node clusters
//TODO getAssertionsForCompetencyD3NodeTracker fix for multi node clusters
//TODO getAssertionsForCompetencyPacketData fix for multi node clusters
//TODO addChildToListView construct list view for multi node competency cluster
//TODO addChildToGraphProfileSummary construct list view for multi node competency cluster
//TODO categorizeFrameworksForSummary expand functionality

//TODO expandListViewToName think of something better than name

//TODO addSourceAssertionsToCompetencyDetailsModal combine with addSourceAssertionsToGraphSidebar
//TODO buildCompetencyDetailsModalEvidenceDiv combine with buildGraphSidebarEvidenceDiv

//todo profileExpExecuteAssertionValidation define and implement

//TODO Investigate MAX_ASSR_SEARCH_SIZE further

//TODO getConfidenceInAssertionSource expand on this

//TODO buildConfidenceExplanation check if a single claim is negative

//TODO Handle Same Competency IDs across multiple frameworks

//**************************************************************************************************
// Constants

//REMOVE SAMANTHA_SMITH_PK_PEM AND USAGES AT SOME POINT..ONLY FOR DEMO/DEV TO SAVE CLICKS
const SAMANTHA_SMITH_PK_PEM = "-----BEGIN PUBLIC KEY-----MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAogp5B7hoYRwZDjCb4NL/fNt3xTBvDMw08jLTdOcmyKVzetHgwTWRf3ojl1+EPqpgnVRxp/zk2/AQhYelJaU6JmzPBvx14FjxB3ObbYckXrBw60fQ643geAIY3lQAYH7YpBsDp/xCQlMCw7L1H70ZnRPWdxzl9ee20ZeQy367biWPbFQCBUFWHN+gXH2pGZkM8n3/ql6hQ9SFaVEkqzIFdHwTenfl5LYrGmiUuzBy4xfwXsd0NZSzOjxuZyGlupEDkqTh7bMmGJSe13+BlbQcVJ+OwYHM+RdLfk3zXia1cMrcJx/nZZUFxxQs4+V51bBbTG0ms7K9/O28U6Q5BytzNQIDAQAB-----END PUBLIC KEY-----";

//TODO Investigate MAX_ASSR_SEARCH_SIZE further
const MAX_ASSR_SEARCH_SIZE = 10000;

const PROFILE_DESCRIPTION_OWN = "The following areas of knowledge, skills, and abilities were determined for you based on all evidence currently available to CaSS:";
const PROFILE_DESCRIPTION_OTHER = "The following areas of knowledge, skills, and abilities were determined for this user based on all evidence currently available to CaSS and visible to you:";

const CREATE_IMPLIED_RELATIONS = true;

//**************************************************************************************************
// Variables

var profileUserName;
var profileUserPkPem;

var assertionList;
var assertionMap;

var assertionsToQuery;
var assertionsQueried;

var frameworksToCollapse;
var frameworksCollapsed;

var rawApplicableFrameworkList = [];
var applicableFrameworkList = [];
var applicableFrameworkMap = {};
var competencyAssertionMap = {};

var assertionEvidenceMap = {};
var badgeList = [];
var degreeCertList = [];
var assertionSourceMap = {};
var assertionNegativeMap = {};
var competencyFrameworkMap = {};
var frameworkGraphSummaryLiMap = {};

var hasFinishedLoading = false;

var evidenceTrail = [];

var currentAssertionShareId;
var ecAssertionSearchReturnList;
var assertionEnvelopeEcAssertionList;
var assertionEnvelopeList;
var assertionEnvelopeMap;
var assertionAssertionEnvelopeMap;
var assertionEnvelopeAssertionMap;
var newAssertionShareEnvelopeList;
var assertionShareEnvelopeAssignmentTracker;
var assertionEnvelopeListToSave;
var numberOfAssertionEnvelopesToSave;
var numberOfAssertionEnvelopesSaved;

var assertionValidationResultsMap;

var lastExpCgSidebarD3NodeName = "";

var frameworkNodePacketGraphMap = {};
var profileCompetencyData;
var profileDisplayHelperData;
var profileD3NodeString;

var profileToOpen;

//**************************************************************************************************
// Data Structures
//**************************************************************************************************

function newAssertionShareEnvelope(name) {
    this.name = name;
    this.assigned = true;
    this.contacts = [];
}

function evidenceSource(name, type, source, evDate, expDate, link, assertionId, evIdx) {
    this.name = name;
    this.type = type;
    this.source = source;
    this.evDate = evDate;
    this.expDate = expDate;
    this.link = link;
    this.assertionId = assertionId;
    this.evIdx = evIdx;
}

//**************************************************************************************************
// Utility Functions
//**************************************************************************************************

function isOwnProfile() {
    return loggedInPkPem == profileUserPkPem;
}

function getAssertionsForCompetency(compId) {
    return competencyAssertionMap[compId];
}

function getAssertionsForFramework(frameworkId) {
    var retAsArray = [];
    $(applicableFrameworkMap[frameworkId].competency).each(function (i, fc) {
        var compAs = getAssertionsForCompetency(fc);
        $(compAs).each(function (j, ca) {
            retAsArray.push(ca);
        });
    });
    return retAsArray;
}

//TODO getAssertionsForD3Node fix for multi node clusters
function getAssertionsForD3Node(d3Node) {
    if (d3Node && d3Node.data) evidenceTrail.push(d3Node.data.name.trim());
    var d3nt = profileCompetencyData.competencyD3NodeTrackerMap[d3Node.data.name.trim()];
    var asArray = getAssertionsForCompetency(d3nt.id);
    if (!asArray || asArray == null || asArray.length == 0) {
        if (!d3nt.d3Node || !d3nt.d3Node.parent || d3nt.d3Node.parent == null) return null;
        else return getAssertionsForD3Node(d3nt.d3Node.parent);
    }
    else return asArray;
}

//TODO getAssertionsForCompetencyD3NodeTracker fix for multi node clusters
function getAssertionsForCompetencyD3NodeTracker(d3nt) {
    var asArray = getAssertionsForCompetency(d3nt.id);
    if (!asArray || asArray == null || asArray.length == 0) {
        if (!d3nt.d3Node || !d3nt.d3Node.parent || d3nt.d3Node.parent == null) return null;
        else return getAssertionsForD3Node(d3nt.d3Node.parent);
    }
    else return asArray;
}

//TODO getAssertionsForCompetencyPacketData fix for multi node clusters
function getAssertionsForCompetencyPacketData(cpd) {
    var asArray = getAssertionsForCompetency(cpd.id);
    if (!asArray || asArray == null || asArray.length == 0) {
        var d3nt = profileCompetencyData.competencyD3NodeTrackerMap[cpd.id];
        if (!d3nt || !d3nt.d3Node || !d3nt.d3Node.parent || d3nt.d3Node.parent == null) return null;
        else return getAssertionsForD3Node(d3nt.d3Node.parent);
    }
    else return asArray;
}

function getEvidenceForAssertion(as) {
    var evArray = [];
    if (!assertionEvidenceMap[as.shortId()]) return evArray;
    for (var idx in assertionEvidenceMap[as.shortId()]) {
        if (assertionEvidenceMap[as.shortId()].hasOwnProperty(idx)) {
            evArray.push(assertionEvidenceMap[as.shortId()][idx]);
        }
    }
    return evArray;
}

function isFrameworkIdOrProfileUser(id) {
    if (id == profileUserName) return true;
    var x = applicableFrameworkMap[id];
    if (x) return true;
    else return false;
}

function getFrameworkName(frameworkId) {
    if (profileUserName && profileUserName != null && frameworkId == profileUserName) return profileUserName;
    if (!applicableFrameworkMap[frameworkId] || applicableFrameworkMap[frameworkId] == null) return null;
    return applicableFrameworkMap[frameworkId].name.trim();
}

function getFrameworkDescription(frameworkId) {
    if (profileUserName && profileUserName != null && frameworkId == profileUserName) {
        if (isOwnProfile()) return PROFILE_DESCRIPTION_OWN;
        else return PROFILE_DESCRIPTION_OTHER;
    }
    if (!applicableFrameworkMap[frameworkId] || applicableFrameworkMap[frameworkId] == null) return null;
    return applicableFrameworkMap[frameworkId].description.trim();
}

function getFrameworksForCompetency(competencyId) {
    var retArray = [];
    var fwo = competencyFrameworkMap[competencyId];
    if (!fwo) return retArray;
    for (var fwId in fwo) {
        if (fwo.hasOwnProperty(fwId)) {
            retArray.push(fwo[fwId]);
        }
    }
    return retArray;
}

function getCompetencyOrFrameworkName(cfId) {
    if (cfId == profileUserName) return profileUserName;
    if (cfId == profileUserName) return profileUserName;
    else if (isFrameworkIdOrProfileUser(cfId)) return getFrameworkName(cfId);
    else {
        var d3ft = profileCompetencyData.competencyD3NodeTrackerMap[cfId];
        if (!d3ft || d3ft == null) return "N/A";
        else return generateNameFromCassNodePacket(profileCompetencyData.competencyPacketDataMap[cfId].cassNodePacket);
    }
}

function buildCassEditorFrameworkHyperlinkListForCompetency(competencyId) {
    var fwa = getFrameworksForCompetency(competencyId);
    var retHtml = "";
    for (var i = 0; i < fwa.length; i++) {
        var fw = fwa[i];
        retHtml += generateAnchorLink("https://cassproject.github.io/cass-editor/?frameworkId=" + fw.shortId() + "&view=true", fw.name, fw.name);
        if (i < (fwa.length - 1)) retHtml += ", ";
    }
    return retHtml;
}


function buildFrameworkExplorerFrameworkHyperlinkListForCompetency(competencyId) {
    var fwa = getFrameworksForCompetency(competencyId);
    var retHtml = "";
    for (var i = 0; i < fwa.length; i++) {
        var fw = fwa[i];
        retHtml += "<a onclick=\"openFrameworkExplorer('" + fw.shortId() + "');\">" + escapeSingleQuote(fw.name) + "</a>"
        if (i < (fwa.length - 1)) retHtml += ", ";
    }
    return retHtml;
}

function buildHyperlinkListForCompetency(competencyId) {
    var compName = getCompetencyOrFrameworkName(competencyId);
    var fwa = getFrameworksForCompetency(competencyId);
    var retHtml = "";
    if (fwa.length == 1) {
        var fw = fwa[0];
        var linkHref = "https://cassproject.github.io/cass-editor/?frameworkId=" + fw.shortId() + "&competencyId=" + competencyId + "&view=true";
        retHtml += generateAnchorLink(linkHref, compName, compName);
    } else {
        for (var i = 0; i < fwa.length; i++) {
            var fw = fwa[i];
            var linkHref = "https://cassproject.github.io/cass-editor/?frameworkId=" + fw.shortId() + "&competencyId=" + competencyId + "&view=true";
            var linkName = compName + "(" + fw.name + ")";
            retHtml += generateAnchorLink(linkHref, linkName, linkName);
            if (i < (fwa.length - 1)) retHtml += ", ";
        }
    }
    return retHtml;
}

function getEvidenceTypeFAClass(type) {
    if ("Degree" == type) return FA_CLASS_DEGREE;
    else if ("Course" == type) return FA_CLASS_COURSE;
    else if ("Training" == type) return FA_CLASS_TRAINING;
    else if ("Badge" == type) return FA_CLASS_BADGE;
    else if ("Seminar" == type) return FA_CLASS_SEMINAR;
    else if ("Certification" == type) return FA_CLASS_CERTIFICATION;
    else if ("Certificate" == type) return FA_CLASS_CERTIFICATE;
    else return FA_CLASS_DEFAULT;
}

function getConfidenceClass(confidence) {
    var confPerc = confidence * 100;
    if (confPerc <= 100 && confPerc >= 90) return HIGH_CONF_CLASS;
    else if (confPerc <= 89 && confPerc >= 75) return MID_HIGH_CONF_CLASS;
    else if (confPerc <= 74 && confPerc >= 60) return MID_CONF_CLASS;
    else if (confPerc <= 59 && confPerc >= 35) return MID_LOW_CONF_CLASS;
    else return LOW_CONF_CLASS;
}

function determineConfidenceForAssertions(asArray) {
    var conf = 0;
    $(asArray).each(function (i, as) {
        var neg = assertionNegativeMap[as.shortId()];
        if (neg) conf = conf - parseFloat(as.confidence);
        else conf += parseFloat(as.confidence);
    });
    conf = Math.round((conf / asArray.length) * 100);
    return conf / 100;
}

function buildConfidenceTitle(confidence) {
    return "Confidence: " + (confidence * 100) + "%";
}

function divideAssertionsBySource(asArray) {
    var asBySource = {};
    for (var i = 0; i < asArray.length; i++) {
        var as = asArray[i];
        var source = assertionSourceMap[as.shortId()];
        if (!asBySource[source] || asBySource[source] == null) {
            asBySource[source] = [];
        }
        asBySource[source].push(as);
    }
    return asBySource;
}

function setUpCompetencyConfidenceView(confidence, iconId, cpdId) {
    $(iconId).attr("class", CONF_CLASS_BASE);
    $(iconId).attr("title", buildConfidenceTitle(confidence));
    $(iconId).attr("onclick","openConfidenceDetailsModal('" + escapeSingleQuote(cpdId) + "')");
    $(iconId).addClass(getConfidenceClass(confidence));
}

function buildConfidenceIcon(confidence) {
  var conf = confidence * 100;;
    var retHtml = "&nbsp;&nbsp;" +
        "<span class='badge'>" + conf + "</span>";
    return retHtml;
}

function buildAssertionShareIcon(assertionShortId) {
    if (isOwnProfile()) {
        var retHtml = "&nbsp;&nbsp;" + "" +
            "<a class=\"assertionShareIcon\"><i class=\"fa fa-share-square\" onclick=\"shareAssertion('" + assertionShortId + "');\" " +
            "title=\"Share claim\" aria-hidden=\"true\"></i></a>";
        return retHtml;
    }
    else return "";
}

function buildAssertionValidIcon(assertionShortId,pad) {
    if (assertionValidationResultsMap.hasOwnProperty(assertionShortId)) {
        var isAsValid = assertionValidationResultsMap[assertionShortId];
        var sourceAsValidHtml = "";
        if (pad) sourceAsValidHtml += "&nbsp;&nbsp;";
        if (isAsValid) sourceAsValidHtml += "<i class=\"fa fa-chain asrValdValid\" aria-hidden=\"true\" title=\"Claim is valid\"></i>";
        else sourceAsValidHtml += "<i class=\"fa fa-chain-broken asrValdInValid\" aria-hidden=\"true\" title=\"Claim is invalid\"></i>";
        return sourceAsValidHtml;
    }
    else return "";
}

function toggleEvDivInd(ce) {
    if (ce.find('i:first').hasClass("fa-chevron-right")) {
        ce.find('i:first').attr("class", "fa fa-chevron-down");
        ce.attr("title", "Hide evidence");
    } else {
        ce.find('i:first').attr("class", "far fa-chevron-right");
        ce.attr("title", "View evidence");
    }
}

function buildHashStringFromStringArray(strArray) {
    if (!strArray || strArray == null) return "";
    var hashStr = "";
    for (var i=0;i<strArray.length;i++) {
        hashStr += strArray[i] + "|";
    }
    return hashStr;
}

function checkForProfileUserSearchbarEnter(event) {
    if (event.which == 13 || event.keyCode == 13) {
        $(PROF_USR_SRCH_INPT).autocomplete("close");
        setUpAndFetchAssertionsForSelectedUser($(PROF_USR_SRCH_INPT).val().trim());
    }
}

function checkForProfileSearchbarEnter(event) {
    if (event.which == 13 || event.keyCode == 13) {
        $(PROF_SRCH_INPT).autocomplete("close");
        findItemByProfileSearchBar($(PROF_SRCH_INPT).val().trim());
    }
}

function setProfileUserAsLoggedInUserAndGo() {
    hideProfileUserSearchContainer();
    setUpProfileUserAndFetchAssertions(loggedInIdentityName, loggedInPkPem);
}

function setUpForProfileUserSearch() {
    fillInProfileUserSearchAutoComplete();
    hideProfileExpTools();
    showProfileUserSearchContainer();
}

function toDateString(dt) {
    return (dt.getMonth() + 1) + "/" + dt.getDate() + "/" + dt.getFullYear();
}

//TODO getConfidenceInAssertionSource expand on this
function getConfidenceInAssertionSource(asr) {
    return 1;
}

function openFrameworkExplorer(frameworkId) {
    sendInitFrameworkExplorerMessage(frameworkId);
}

function confidenceToPercentage(conf) {
    if (conf) {
        var nconf = conf * 100;
        return nconf + "%";
    }
    return "n/a";
}

//**************************************************************************************************
// Confidence Details Modal
//**************************************************************************************************
function getHoldsNotHoldsConfDetailClass(isNegativeAssertion) {
    if (isNegativeAssertion) return "asrNotHolds";
    else return "asrHolds";
}

function addSourceAssertionsToConfidenceDetailList(source,sourceAssertionArray,confTracker) {
    $(sourceAssertionArray).each(function (i, as) {
        confTracker["totalNumberAsr"]++;
        var sourceAsStmtHtml;
        var confInAsrSource = getConfidenceInAssertionSource(source);
        var totalAsrConf = as.confidence * confInAsrSource;
        var isNegativeAssertion = assertionNegativeMap[as.shortId()];
        if (isNegativeAssertion) {
            sourceAsStmtHtml = "does not hold ";
            confTracker["totalNegConf"] += totalAsrConf;
        }
        else {
            sourceAsStmtHtml = "holds ";
            confTracker["totalPosConf"] += totalAsrConf;
        }
        sourceAsStmtHtml += getCompetencyOrFrameworkName(as.competency);
        var asLi = $("<li/>");
        var asLiDiv = $("<div>");
        asLiDiv.addClass("grid-x");
        var asLiDivHtml = "<div class=\"cell medium-3\"><span class=\"confDetailListItem\">" + source + "</span></div>";
        asLiDivHtml += "<div class=\"cell medium-3\"><span class=\"confDetailListItem " + getHoldsNotHoldsConfDetailClass(isNegativeAssertion) + "\">" +
                        sourceAsStmtHtml + "</span></div>";
        asLiDivHtml += "<div class=\"cell medium-2\"><span class=\"confDetailListItem\">" + confidenceToPercentage(as.confidence) + "</span></div>";
        asLiDivHtml += "<div class=\"cell medium-2\"><span class=\"confDetailListItem\">" + confidenceToPercentage(confInAsrSource) + "</span></div>";
        asLiDivHtml += "<div class=\"cell medium-2\"><span class=\"confDetailListItem\">" + confidenceToPercentage(totalAsrConf) + "</span></div>";
        asLiDiv.html(asLiDivHtml);
        asLi.append(asLiDiv);
        $(CONF_DTL_ASR_LIST).append(asLi);
    });
}

function buildConfidenceTracker() {
    var confTracker = {};
    confTracker["totalPosConf"] = 0;
    confTracker["totalNegConf"] = 0;
    confTracker["totalNumberAsr"] = 0;
    return confTracker;
}

//TODO buildConfidenceExplanation check if a single claim is negative
function buildConfidenceExplanation(confTracker,conf) {
    var dtlHtml;
    if (confTracker["totalNumberAsr"] == 1) {
        dtlHtml = "One claim has been made with a total confidence of <span class=\"confDetailListHdr\">" + confidenceToPercentage(conf) + "</span>";
    }
    else {
        dtlHtml = "Total confidence of positive claims <span class=\"asrHolds\">(" + confTracker["totalPosConf"]  + ")</span> " +
                  "minus the total confidence of negative claims <span class=\"asrNotHolds\">(" + confTracker["totalNegConf"]  + ")</span> " +
                  "divided by the total number of claims (" + confTracker["totalNumberAsr"] + ") = " +
                  "<span class=\"confDetailListHdr\">" + conf + " OR " + confidenceToPercentage(conf)  + "</span>" ;
    }
    $(CONF_DTL_EXP).html(dtlHtml);
}

function buildConfidenceDetails(cpd) {
    var confTracker = buildConfidenceTracker();
    $(CONF_DTL_ASR_LIST).empty();
    var asArray = getAssertionsForCompetencyPacketData(cpd);
    var conf = determineConfidenceForAssertions(asArray);
    $(CONF_DTL_CONF).html(confidenceToPercentage(conf));
    var asrBySource = divideAssertionsBySource(asArray);
    for (var source in asrBySource) {
        if (asrBySource.hasOwnProperty(source)) addSourceAssertionsToConfidenceDetailList(source, asrBySource[source],confTracker);
    }
    buildConfidenceExplanation(confTracker,conf);
}

function openConfidenceDetailsModal(cpdId) {
    hideModalBusy(CONF_DTL_MODAL);
    hideModalError(CONF_DTL_MODAL);
    enableModalInputsAndButtons();
    var cpd;
    if (cpdId) {
        cpd = profileCompetencyData.competencyPacketDataMap[cpdId.trim()];
        if (cpd) {
            $(CONF_DTL_COMP_NAME).html(cpd.name);
            buildConfidenceDetails(cpd);
            $(CONF_DTL_MODAL).foundation('open');
        }
        else {
            debugMessage("openConfidenceDetailsModal could not determine competency packet data for: " + cpdId);
        }
    }
}

//**************************************************************************************************
// Validate Assertions Modal
//**************************************************************************************************

function isAssertionValidationTypeValid() {
    var isValid = true;
    var types = $(ASR_VALD_TYPES).val();
    if (!types || types.length == 0) {
        isValid = false;
        showModalError(ASR_VALD_MODAL,"You must select at least one type of validation");
    }
    return isValid;
}

function handleProfileExpAssertionValidationFailure(err) {
    hideModalBusy(ASR_VALD_MODAL);
    enableModalInputsAndButtons();
    showModalError(ASR_VALD_MODAL,err);
}

function getTitleForAssertionValidity(asrValid) {
    if (asrValid) return "Claim is valid";
    else return "Claim is not valid";
}

function addSourceAssertionsToAssertionValidationResultsList(source, sourceAssertionArray) {
    $(sourceAssertionArray).each(function (i, as) {
        var isAsValid = assertionValidationResultsMap[as.shortId()];
        var sourceAsLi = $("<li/>");
        sourceAsLi.attr("title",getTitleForAssertionValidity(isAsValid));
        var sourceAsDiv = $("<div/>");
        sourceAsDiv.addClass("grid-x");
        var sourceAsStatementDiv = $("<div/>");
        sourceAsStatementDiv.addClass("cell medium-11");
        var sourceAsStmtHtml = "<span class=\"asrValdSource\">" + source + "</span> claims subject ";
        var isNegativeAssertion = assertionNegativeMap[as.shortId()];
        if (isNegativeAssertion) sourceAsStmtHtml += "does not hold ";
        else sourceAsStmtHtml += "holds ";
        sourceAsStmtHtml += "<span class=\"asrValdComp\">" + getCompetencyOrFrameworkName(as.competency) + "</span>";
        sourceAsStatementDiv.html(sourceAsStmtHtml);
        var sourceAsValidDiv = $("<div/>");
        sourceAsValidDiv.addClass("cell medium-1");
        sourceAsValidDiv.html(buildAssertionValidIcon(as.shortId(),false));
        sourceAsDiv.append(sourceAsStatementDiv);
        sourceAsDiv.append(sourceAsValidDiv);
        sourceAsLi.append(sourceAsDiv);
        $(ASR_VALD_RESULTS_LIST).append(sourceAsLi);
    });
}

function buildProfileExpAssertionValidationResultsList() {
    $(ASR_VALD_RESULTS_LIST).empty();
    var asrBySource = divideAssertionsBySource(assertionList);
    for (var source in asrBySource) {
        if (asrBySource.hasOwnProperty(source)) addSourceAssertionsToAssertionValidationResultsList(source, asrBySource[source]);
    }
}

function addExpCgCircleInvalidClassForInvalidAssertions() {
    for (var i=0;i<assertionList.length;i++) {
        var as = assertionList[i];
        var isAsValid = assertionValidationResultsMap[as.shortId()];
        if (!isAsValid) {
            var cgClass = generateExpCgCircleExtendedClass(as.competency);
            $("." + cgClass).addClass("invalid");
        }
    }
}

function handleProfileExpAssertionValidationSuccess() {
    //TODO make something up for now...
    hideModalBusy(ASR_VALD_MODAL);
    enableModalInputsAndButtons();
    $(ASR_VALD_SETUP_CTR).hide();
    buildProfileExpAssertionValidationResultsList();
    $(ASR_VALD_MODAL).removeClass("tiny").addClass("small");
    $(ASR_VALD_RESULTS_CTR).show();
    //update the circe graph sidebar so it shows validation results icons...
    if (lastExpCgSidebarD3NodeName != "") showCircleGraphSidebarDetails(lastExpCgSidebarD3NodeName);
    //update the circle graph circle classes
    removeAllExpCgCircleInvalidClasses();
    addExpCgCircleInvalidClassForInvalidAssertions();
}

function buildAssertionValidationResultsMap() {
    assertionValidationResultsMap = {};
    for (var i=0;i<assertionList.length;i++) {
        var result = true;
        if (i%4 == 0) result = false;
        assertionValidationResultsMap[assertionList[i].shortId()] = result;
    }
}

//todo profileExpExecuteAssertionValidation define and implement
function profileExpExecuteAssertionValidation() {
    buildAssertionValidationResultsMap();
    setTimeout(function () {
        handleProfileExpAssertionValidationSuccess();
    }, 3000);
}

function profileExpValidateAssertions() {
    hideModalError(ASR_VALD_MODAL);
    if (isAssertionValidationTypeValid()) {
        $(ASR_VALD_SETUP_BTN_CTR).hide();
        showModalBusy(ASR_VALD_MODAL,"Validating claims...");
        disableModalInputsAndButtons();
        profileExpExecuteAssertionValidation();
    }
}

function openProfileExpAssertionValidateModal() {
    $(ASR_VALD_TYPES).val("");
    hideModalBusy(ASR_VALD_MODAL);
    hideModalError(ASR_VALD_MODAL);
    enableModalInputsAndButtons();
    $(ASR_VALD_RESULTS_CTR).hide();
    $(ASR_VALD_SETUP_CTR).show();
    $(ASR_VALD_SETUP_BTN_CTR).show();
    $(ASR_VALD_MODAL).removeClass("small").addClass("tiny");
    $(ASR_VALD_MODAL).foundation('open');
}

//**************************************************************************************************
// Assertion Details Modal
//**************************************************************************************************

function buildAssertionDetailsLevel(level) {
    if (!level || level == null) $(ASR_DTL_LVL_LI).hide();
    else {
        $(ASR_DTL_LVL_LI).show();
        $(ASR_DTL_LVL).html(level);
    }
}

function buildAssertionDetailsHolds(negative) {
    var holdsHtml = "";
    if (negative) {
        $(ASR_DTL_HOLDS).attr("class", "asrNotHolds");
        holdsHtml += "<i class=\"fa fa-times\" aria-hidden=\"true\"></i>";
    } else {
        $(ASR_DTL_HOLDS).attr("class", "asrHolds");
        holdsHtml += "<i class=\"fa fa-check\" aria-hidden=\"true\"></i>";
    }
    $(ASR_DTL_HOLDS).html(holdsHtml);
}

function addEvidenceLineToAssertionDetailsEvidenceList(assertionId, ev) {
    var evLi = $("<li/>");
    var evLiHtml = "<a title=\"Show " + ev.type.toLowerCase() + " details\" onclick=\"showEvidenceDetailsModal('" + assertionId + "','" + ev.evIdx + "')\">";
    evLiHtml += "<i class=\"fa " + getEvidenceTypeFAClass(ev.type) + "\" aria-hidden=\"true\"></i>&nbsp;";
    evLiHtml += ev.name + "</a>";
    evLi.html(evLiHtml);
    $(ASR_DTL_EV_LIST).append(evLi);
}

function buildAssertionDetailsEvidenceList(assertionId, evArray) {
    $(ASR_DTL_EV_LIST).empty();
    if (!evArray || evArray == null || evArray.length == 0) $(ASR_DTL_EV_LI).hide();
    else {
        $(ASR_DTL_EV_LI).show();
        $(evArray).each(function (i, ev) {
            addEvidenceLineToAssertionDetailsEvidenceList(assertionId, ev);
        });
    }
}

function showAssertionDetailsModal(assertionId) {
    var as = assertionMap[assertionId];
    $(ASR_DTL_SOURCE).html(assertionSourceMap[assertionId]);
    $(ASR_DTL_SUBJECT).html(profileUserName);
    var compName = getCompetencyOrFrameworkName(as.competency);
    $(ASR_DTL_COMP).html(buildHyperlinkListForCompetency(as.competency));
    $(ASR_DTL_FW_CTR).html(buildFrameworkExplorerFrameworkHyperlinkListForCompetency(as.competency));
    buildAssertionDetailsLevel(as.level);
    buildAssertionDetailsHolds(assertionNegativeMap[assertionId]);
    $(ASR_DTL_CONF).html((as.confidence * 100) + "%");
    $(ASR_DTL_DATE).html(toDateString(new Date(as.getAssertionDate())));
    $(ASR_DTL_EXP).html(toDateString(new Date(as.getExpirationDate())));
    $(ASR_DTL_URL).html(generateAnchorLink(as.shortId(), "JSON", compName + " Assertion"));
    buildAssertionDetailsEvidenceList(as.shortId(), getEvidenceForAssertion(as));
    $(ASR_DTL_MODAL).foundation('open');
}


//**************************************************************************************************
// Evidence Details Modal
//**************************************************************************************************

function getEvidenceLinkType(evLink) {
    if (evLink.indexOf(".jpg") >= 0) return "image";
    else if (evLink.indexOf(".jpeg") >= 0) return "image";
    else if (evLink.indexOf(".gif") >= 0) return "image";
    else if (evLink.indexOf(".png") >= 0) return "image";
    else if (evLink.indexOf(".pdf") >= 0) return "pdf";
    else if (evLink.indexOf(".html") >= 0) return "html";
    else return null;
}

function buildEvidenceDetailsImagePreview(ev) {
    var imgDiv = $("<div/>");
    var imgHtml = "<img id=\"imagePreviewObj\" src=\"" + ev.link + "\"></img>";
    imgDiv.html(imgHtml);
    $(EV_DTL_PRV_CTR).append(imgDiv);
}

function buildEvidenceDetailsHtmlPreview(ev) {
    var htmlDiv = $("<div/>");
    var htmlHtml = "<object id=\"htmlPreviewObj\" data=\"" + ev.link + "\" type=\"text/html\"></object>";
    htmlDiv.html(htmlHtml);
    $(EV_DTL_PRV_CTR).append(htmlDiv);
}

function buildEvidenceDetailsPdfPreview(ev) {
    var pdfDiv = $("<div/>");
    var pdfHtml = "<object id=\"pdfPreviewObj\" data=\"" + ev.link + "\" type=\"application/pdf\"></object>";
    pdfDiv.html(pdfHtml);
    $(EV_DTL_PRV_CTR).append(pdfDiv);
}

function buildEvidenceDetailsPreview(ev) {
    $(EV_DTL_PRV_CTR).empty();
    var evLinkType = (getEvidenceLinkType(ev.link));
    if (evLinkType != null) {
        if (evLinkType == "image") buildEvidenceDetailsImagePreview(ev);
        else if (evLinkType == "pdf") buildEvidenceDetailsPdfPreview(ev);
        else if (evLinkType == "html") buildEvidenceDetailsHtmlPreview(ev);
    }
}

function generateEvidenceDetailsAssertionLinks(ev) {
    var asrLinks = "<a onclick=\"showAssertionDetailsModal('" + ev.assertionId + "')\">Details</a>";
    asrLinks += ", " + generateAnchorLink(ev.assertionId, "JSON", ev.name + " - Evidence Assertion");
    return asrLinks;
}

function showEvidenceDetailsModal(assertionId, evIdx) {
    if (!assertionEvidenceMap[assertionId] || !assertionEvidenceMap[assertionId][evIdx]) return;
    var ev = assertionEvidenceMap[assertionId][evIdx];
    $(EV_DTL_NAME).html(ev.name);
    $(EV_DTL_TYPE).html(ev.type);
    $(EV_DTL_SOURCE).html(ev.source);
    $(EV_DTL_URL).html(generateAnchorLink(ev.link, "Evidence", ev.name + " - Evidence Link"));
    $(EV_DTL_ASR_ID).html(generateEvidenceDetailsAssertionLinks(ev));
    buildEvidenceDetailsPreview(ev);
    $(EV_DTL_MODAL).foundation('open');
}

//**************************************************************************************************
// Competency Details Modal
//**************************************************************************************************

//TODO buildCompetencyDetailsModalEvidenceDiv combine with buildGraphSidebarEvidenceDiv
function buildCompetencyDetailsModalEvidenceDiv(evDivId, as, evArray) {
    var evDiv = $("<div/>");
    evDiv.addClass("cdmAsrEvDiv");
    evDiv.attr("id", evDivId);
    evDiv.attr("style", "display:none");
    var evUl = $("<ul/>");
    $(evArray).each(function (i, ev) {
        var evLi = $("<li/>");
        var evLiHtml = "<a title=\"Show " + ev.type.toLowerCase() + " details\" onclick=\"showEvidenceDetailsModal('" + as.shortId() + "','" + ev.evIdx + "')\">";
        evLiHtml += "<i class=\"fa " + getEvidenceTypeFAClass(ev.type) + "\" aria-hidden=\"true\"></i>&nbsp;";
        evLiHtml += ev.name + "</a>";
        evLi.html(evLiHtml);
        evUl.append(evLi);
    });
    evDiv.append(evUl);
    return evDiv;
}

//TODO addSourceAssertionsToCompetencyDetailsModal combine with addSourceAssertionsToGraphSidebar
function addSourceAssertionsToCompetencyDetailsModal(sourceName, sourceAssertionArray) {
    $(COMP_DTL_ASR_CTR).append("<span class=\"cdmAsrSource\">" + sourceName + "</span>")
    var sourceUl = $("<ul/>");
    $(sourceAssertionArray).each(function (i, as) {
        var sourceAsLi = $("<li/>");
        sourceAsLi.addClass("cdmAsrText");
        var sourceAsLiHtml = "<a title=\"Show details\" onclick=\"showAssertionDetailsModal('" + as.shortId() + "')\">";
        var isNegativeAssertion = assertionNegativeMap[as.shortId()];
        
        if (isNegativeAssertion) sourceAsLiHtml += "does not hold ";
        else sourceAsLiHtml += "holds ";
        sourceAsLiHtml += "<strong>" + getCompetencyOrFrameworkName(as.competency) + "</strong></a>";
      
        sourceAsLiHtml += buildConfidenceIcon(as.confidence);
        sourceAsLiHtml + getCompetencyOrFrameworkName(as.competency) + "</a>";
        sourceAsLiHtml += buildAssertionValidIcon(as.shortId(),true);
        sourceAsLiHtml += buildAssertionShareIcon(as.shortId());
        var evArray = getEvidenceForAssertion(as);
        var evDiv = null;
        if (evArray && evArray.length > 0) {
            var evDivId = buildIDableString(as.shortId() + "_evdiv_cdm");
            evDiv = buildCompetencyDetailsModalEvidenceDiv(evDivId, as, evArray);
        }
        sourceAsLi.html(sourceAsLiHtml);
        if (evDiv != null) sourceAsLi.append(evDiv);
        sourceUl.append(sourceAsLi);
    });
    $(COMP_DTL_ASR_CTR).append(sourceUl);
}

function buildAssertionListForCompetencyDetailsModal(asArray) {
    $(COMP_DTL_ASR_CTR).empty();
    if (!asArray || asArray == null || asArray.length == 0) return;
    var asrBySource = divideAssertionsBySource(asArray);
    for (var source in asrBySource) {
        if (asrBySource.hasOwnProperty(source)) addSourceAssertionsToCompetencyDetailsModal(source, asrBySource[source]);
    }
}

function showCompetencyDetailsModal(compId) {
    var cpd = profileCompetencyData.competencyPacketDataMap[compId];
    if (!cpd) return;
    var comp = cpd.cassNodePacket.getNodeList()[0];
    if (!comp) return;
    $(COMP_DTL_NAME).html(comp.getName().trim());
    $(COMP_DTL_DESC).html(comp.getDescription().trim());
    $(COMP_DTL_FRM_NAME).html(buildFrameworkExplorerFrameworkHyperlinkListForCompetency(comp.id));
    var asArray = getAssertionsForCompetencyPacketData(cpd);
    var conf = determineConfidenceForAssertions(asArray);
    $(COMP_DTL_CONF).html((conf * 100) + "%");
    buildAssertionListForCompetencyDetailsModal(asArray);
    $(COMP_DTL_MODAL).foundation('open');
}


//**************************************************************************************************
// Assertion Envelopes/Grouping/Portfolio
//**************************************************************************************************
function showAssertionEnvelopesInListView() {
    alert("TODO showAssertionEnvelopesInListView");
}

function assertionIsPartOfEnvelope(assertionShortId,assertionEnvelopeId) {
    var asrList = assertionEnvelopeAssertionMap[assertionEnvelopeId];
    if (!asrList || asrList == null || asrList.length == 0) return false;
    for (var i=0;i<asrList.length;i++) {
        if (asrList[i].shortId() == assertionShortId) return true;
    }
    return false;
}

function contactIsAssignedToAssertionShareEnvelopeAssignmentTracker(contactPkPem,assertionEnvelopeId) {
    var aeat = assertionShareEnvelopeAssignmentTracker[assertionEnvelopeId];
    if (!aeat["newContacts"] || aeat["newContacts"].length <= 0) return false;
    for (var i=0;i<aeat["newContacts"].length;i++) {
        if (aeat["newContacts"][i] == contactPkPem) return true;
    }
    return false;
}

function contactIsAssignedToNewAssertionShareEnvelope(contactPkPem,naseIdx) {
    var nase = newAssertionShareEnvelopeList[naseIdx];
    if (!nase.contacts || nase.contacts.length <= 0) return false;
    for (var i=0;i<nase.contacts.length;i++) {
        if (nase.contacts[i] == contactPkPem) return true;
    }
    return false;
}

function generateAssertionDescriptionHtml(assertionShortId) {
    var asr = assertionMap[assertionShortId];
    if (!asr || asr == null) return "";
    var desc = "";
    desc += "<strong>" + assertionSourceMap[assertionShortId] + "</strong>";
    desc += "<i> claims subject ";
    var isNegativeAssertion = assertionNegativeMap[assertionShortId];
    if (isNegativeAssertion) desc += "does not hold ";
    else desc += "holds ";
    desc += " </i>";
    desc += "<strong>" + getCompetencyOrFrameworkName(asr.competency) + "</strong>";
    return desc;
}

function generateAssertionDescriptionSimpleHtml(assertionShortId) {
    var asr = assertionMap[assertionShortId];
    if (!asr || asr == null) return "";
    var desc = "";
    desc += assertionSourceMap[assertionShortId];
    desc += " claims subject ";
    var isNegativeAssertion = assertionNegativeMap[assertionShortId];
    if (isNegativeAssertion) desc += "does not hold ";
    else desc += "holds ";
    desc += getCompetencyOrFrameworkName(asr.competency);
    return desc;
}

function assertionShareCancelCreatePortfolio() {
    hideModalError(ASR_SHARE_MODAL);
    hideModalBusy(ASR_SHARE_MODAL);
    if (assertionEnvelopeList.length == 0 && newAssertionShareEnvelopeList.length == 0) {
        $(ASR_SHARE_MODAL).foundation('close');
    }
    else {
        $(ASR_SHARE_CREATE_PRTF_CTR).hide();
        $(ASR_SHARE_ASSIGN_PRTF_CTR).show();
    }
}

function buildEnvelopeContactsIconForAssertionShare(aesi,naseIdx) {
    var aesiParm;
    if (!aesi || aesi == null) aesiParm = "null";
    else aesiParm = "'" + aesi + "'";
    var naseIdxParm;
    if (naseIdx == 0) naseIdxParm = 0;
    else if (!naseIdx || naseIdx == null) naseIdxParm = "null";
    else naseIdxParm = naseIdx;
    var ciHtml = "<a  title=\"Manage portfolio contacts\" onclick=\"managePortfolioContactsForAssertionShare(" + aesiParm + "," + naseIdxParm + ");\" ";
    ciHtml += "class=\"portfolioContentsIcon\"><i class=\"fa fa-users\"></i></a>";
    return ciHtml;
}

function buildPortfolioContentsDivIdForAssertionShare(aesi) {
    return ASR_SHARE_PRTF_CONTENS_CTR_ID_PREFIX + buildIDableString(aesi);
}

function buildEnvelopeAssertionContentsDivForAssertionShare(aesi) {
    if (!aesi || aesi == null) return null;
    if (!assertionEnvelopeAssertionMap[aesi] || assertionEnvelopeAssertionMap[aesi] == null) return null;
    var ecaList = assertionEnvelopeAssertionMap[aesi];
    if (!ecaList || ecaList == null || ecaList.length == 0)  return null;
    var asrDiv =  $("<div/>");
    asrDiv.attr("style","display:none");
    asrDiv.attr("class","portfolioAssertionContents");
    var asrDivId = buildPortfolioContentsDivIdForAssertionShare(aesi);
    asrDiv.attr("id",asrDivId);
    var asrUl = $("<ul/>");
    for (var i=0;i<ecaList.length;i++) {
        var asrLi = $("<li/>");
        var asrLiHtml = generateAssertionDescriptionHtml(ecaList[i].shortId());
        asrLi.html(asrLiHtml);
        asrUl.append(asrLi);
    }
    asrDiv.append(asrUl);
    return asrDiv;
}

function buildEnvelopeAssertionContentsIconForAssertionShare(aesi) {
    if (!aesi || aesi == null) return "&nbsp;";
    if (!assertionEnvelopeAssertionMap[aesi] || assertionEnvelopeAssertionMap[aesi] == null) return "&nbsp;";
    var ecaList = assertionEnvelopeAssertionMap[aesi];
    if (!ecaList || ecaList == null || ecaList.length == 0)  return "&nbsp;";
    var asrDivId = buildPortfolioContentsDivIdForAssertionShare(aesi);
    var acHtml = "<a onclick=\"$('#" + asrDivId + "').toggle();\"";
    acHtml += " class=\"portfolioContentsIcon\" title=\"";
    acHtml += "Portfolio Contents:&#10;";
    for (var i=0;i<ecaList.length;i++) {
        acHtml += "   -" + generateAssertionDescriptionSimpleHtml(ecaList[i].shortId()) + "&#10;";
    }
    acHtml += "\"><i class=\"fa fa-info-circle\"></i></a>";
    return acHtml;
}

function buildAssertionSharePortfolioListLineItem(prtName,checkBoxId,checked,aesi,naseIdx) {
    var glLi = $("<li/>");
    var glLiHtml = "<div class=\"grid-x\">";
    glLiHtml += "<div class=\"cell small-10\">";
    glLiHtml += "<input id=\"" + checkBoxId + "\" type=\"checkbox\"";
    if (checked) glLiHtml += " checked ";
    glLiHtml += "></input>";
    glLiHtml += "<label for=\"" + checkBoxId + "\">" + prtName + "</label>";
    glLiHtml += "</div>";
    glLiHtml += "<div class=\"cell small-1\">";
    glLiHtml += buildEnvelopeAssertionContentsIconForAssertionShare(aesi);
    glLiHtml += "</div>";
    glLiHtml += "<div class=\"cell small-1\">";
    glLiHtml += buildEnvelopeContactsIconForAssertionShare(aesi,naseIdx);
    glLiHtml += "</div>";
    glLiHtml += "</div>";
    glLi.html(glLiHtml);
    var asrDiv = buildEnvelopeAssertionContentsDivForAssertionShare(aesi);
    if (asrDiv && asrDiv != null) glLi.append(asrDiv);
    return glLi;
}

function addAssertionEnvelopesToAssertionSharePortfolioList() {
    for (var aesi in assertionShareEnvelopeAssignmentTracker) {
        if (assertionShareEnvelopeAssignmentTracker.hasOwnProperty(aesi)) {
            var prtName = assertionShareEnvelopeAssignmentTracker[aesi]["name"];
            var checkBoxId = buildIDableString(ASR_SHARE_EX_AE_CB_ID_PREFIX + aesi);
            var checked = assertionShareEnvelopeAssignmentTracker[aesi]["newAssigned"];
            $(ASR_SHARE_ASSIGN_PRTF_LIST).append(buildAssertionSharePortfolioListLineItem(prtName,checkBoxId,checked,aesi,null));
        }
    }
}

function addNewAssertionShareEnvelopeListToAssertionSharePortfolioList() {
    for (var i=0;i<newAssertionShareEnvelopeList.length;i++) {
        var prtName = newAssertionShareEnvelopeList[i].name;
        var checkBoxId = ASR_SHARE_NEW_AE_CB_ID_PREFIX + i;
        var checked = newAssertionShareEnvelopeList[i].assigned;
        $(ASR_SHARE_ASSIGN_PRTF_LIST).append(buildAssertionSharePortfolioListLineItem(prtName,checkBoxId,checked,null,i));
    }
}

function buildAssertionSharePortfolioList() {
    $(ASR_SHARE_ASSIGN_PRTF_LIST).empty();
    addAssertionEnvelopesToAssertionSharePortfolioList();
    addNewAssertionShareEnvelopeListToAssertionSharePortfolioList();
}

function initAssertionShareEnvelopeTracker(assertionShortId) {
    assertionShareEnvelopeAssignmentTracker = {};
    for (var i=0;i<assertionEnvelopeList.length;i++) {
        var aeShortId = assertionEnvelopeList[i].shortId();
        var isAssigned = assertionIsPartOfEnvelope(assertionShortId,aeShortId);
        assertionShareEnvelopeAssignmentTracker[aeShortId] = {};
        assertionShareEnvelopeAssignmentTracker[aeShortId]["name"] = assertionEnvelopeList[i].name;
        assertionShareEnvelopeAssignmentTracker[aeShortId]["initialAssigned"] = isAssigned;
        assertionShareEnvelopeAssignmentTracker[aeShortId]["newAssigned"] = isAssigned;
        assertionShareEnvelopeAssignmentTracker[aeShortId]["initialContacts"] = assertionEnvelopeList[i].reader;
        assertionShareEnvelopeAssignmentTracker[aeShortId]["newContacts"] = assertionEnvelopeList[i].reader;
    }
}

function showAssertionShareAsBusy(busyMsg) {
    hideModalError(ASR_SHARE_MODAL);
    showModalBusy(ASR_SHARE_MODAL,busyMsg);
}

function showAssertionShareError(errMsg) {
    hideModalBusy(ASR_SHARE_MODAL);
    showModalError(ASR_SHARE_MODAL,errMsg);
}

function assertionShareNewPortfolio() {
    $(ASR_SHARE_CREATE_PRTF_NAME).val("");
    $(ASR_SHARE_ASSIGN_PRTF_CTR).hide();
    $(ASR_SHARE_CREATE_PRTF_CTR).show();
}

function assertionSharePortfolioAlreadyExists(candidateName) {
    var prtName;
    for (var aesi in assertionShareEnvelopeAssignmentTracker) {
        if (assertionShareEnvelopeAssignmentTracker.hasOwnProperty(aesi)) {
            prtName = assertionShareEnvelopeAssignmentTracker[aesi]["name"];
            if (prtName.toLowerCase() == candidateName.toLowerCase()) return true;
        }
    }
    for (var i=0;i<newAssertionShareEnvelopeList.length;i++) {
        prtName = newAssertionShareEnvelopeList[i].name;
        if (prtName.toLowerCase() == candidateName.toLowerCase()) return true;
    }
    return false;
}

function isAssertionShareCreatePortfolioInputValid() {
    var newPrtName = $(ASR_SHARE_CREATE_PRTF_NAME).val().trim();
    if (!newPrtName || newPrtName == "") {
        showAssertionShareError("Portfolio name is required");
        return false;
    }
    else if (assertionSharePortfolioAlreadyExists(newPrtName)) {
        showAssertionShareError("Portfolio already exists");
        return false;
    }
    return true;
}

function assertionShareCreatePortfolio() {
    if (isAssertionShareCreatePortfolioInputValid()) {
        var newPrtName = $(ASR_SHARE_CREATE_PRTF_NAME).val().trim("");
        var nase = new newAssertionShareEnvelope(newPrtName);
        newAssertionShareEnvelopeList.push(nase);
        var newIdx = newAssertionShareEnvelopeList.length - 1;
        var checkBoxId = ASR_SHARE_NEW_AE_CB_ID_PREFIX + newIdx;
        var checked = nase.assigned;
        $(ASR_SHARE_ASSIGN_PRTF_LIST).append(buildAssertionSharePortfolioListLineItem(newPrtName, checkBoxId, checked,null,newIdx));
        hideModalError(ASR_SHARE_MODAL);
        $(ASR_SHARE_CREATE_PRTF_CTR).hide();
        $(ASR_SHARE_ASSIGN_PRTF_CTR).show();
    }
}

function getNumberOfAssertionEnvelopesToSave() {
    var numToSave = 0;
    for (var property in assertionEnvelopeListToSave) {
        if (assertionEnvelopeListToSave.hasOwnProperty(property)) {
            numToSave++;
        }
    }
    return numToSave;
}

function handleSynchAssertionEnvelopesFromAssertionShareFailure(failMsg) {
    showPageError("rebuildAssertionEnvelopeDataFromAssertionShareFailure: " + failMsg);
    hideModalBusy(ASR_SHARE_MODAL);
    $(ASR_SHARE_MODAL).foundation('close');
}

function handleSynchAssertionEnvelopesFromAssertionShareSuccess(ecRldArray) {
    debugMessage("rebuildAssertionEnvelopeDataFromAssertionShareSuccess: " + ecRldArray.length);
    if (ecRldArray && ecRldArray != null) {
        for (var i=0;i<ecRldArray.length;i++) {
            processPotentialAssertionEnvelope(ecRldArray[i]);
        }
    }
    if (assertionEnvelopeList.length > 1) {
        assertionEnvelopeList.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });
    }
    hideModalBusy(ASR_SHARE_MODAL);
    $(ASR_SHARE_MODAL).foundation('close');
}

function synchAssertionEnvelopesFromAssertionShare() {
    showAssertionShareAsBusy("Synching portfolios...");
    assertionEnvelopeList = [];
    assertionEnvelopeMap = {};
    assertionAssertionEnvelopeMap = {};
    assertionEnvelopeAssertionMap = {};
    //repo.search(new AssertionEnvelope().getSearchStringByType(),null,handleSynchAssertionEnvelopesFromAssertionShareSuccess,handleSynchAssertionEnvelopesFromAssertionShareFailure);
    repo.searchWithParams(new AssertionEnvelope().getSearchStringByType(),{'size':MAX_ASSR_SEARCH_SIZE},null,handleSynchAssertionEnvelopesFromAssertionShareSuccess,handleSynchAssertionEnvelopesFromAssertionShareFailure);
}

function checkAssertionEnvelopeSaveFromAssertionShareComplete() {
    if (numberOfAssertionEnvelopesSaved >= numberOfAssertionEnvelopesToSave) {
        synchAssertionEnvelopesFromAssertionShare();
    }
}

function handleSaveAssertionEnvelopeFromAssertionShareSuccess(msg) {
    debugMessage("handleSaveAssertionEnvelopeFromAssertionShareSuccess: " + msg);
    numberOfAssertionEnvelopesSaved++;
    checkAssertionEnvelopeSaveFromAssertionShareComplete();
}

function handleSaveAssertionEnvelopeFromAssertionShareFailure(failMsg) {
    debugMessage("!!!!!!!!!!handleSaveAssertionEnvelopeFromAssertionShareFailure: " + failMsg);
    numberOfAssertionEnvelopesSaved++;
    checkAssertionEnvelopeSaveFromAssertionShareComplete();
}

function saveAssertionEnvelopeFromAssertionShare(ae) {
    debugMessage("saveAssertionEnvelopeFromAssertionShare: " + ae.shortId());
    var aeEv = EcEncryptedValue.toEncryptedValue(ae,false);
    EcRepository.save(aeEv,handleSaveAssertionEnvelopeFromAssertionShareSuccess,handleSaveAssertionEnvelopeFromAssertionShareFailure);
}

function saveModifiedAssertionEnvelopesFromAssertionShare() {
    numberOfAssertionEnvelopesToSave = getNumberOfAssertionEnvelopesToSave();
    numberOfAssertionEnvelopesSaved = 0;
    for (var aesi in assertionEnvelopeListToSave) {
        if (assertionEnvelopeListToSave.hasOwnProperty(aesi)) {
            saveAssertionEnvelopeFromAssertionShare(assertionEnvelopeListToSave[aesi]);
        }
    }
}

function addAssertionToAssertionEnvelope(assertionShortId,assertionEnvelopeId) {
    var ae = assertionEnvelopeMap[assertionEnvelopeId];
    if (ae && ae != null) {
        var asr = assertionMap[currentAssertionShareId];
        if (asr && asr != null) {
            ae.addAssertion(asr);
            assertionEnvelopeListToSave[assertionEnvelopeId] = ae;
        }
    }
}

function removeAssertionFromAssertionEnvelope(assertionShortId,assertionEnvelopeId) {
    var ae = assertionEnvelopeMap[assertionEnvelopeId];
    if (ae && ae != null) {
        ae.removeAssertionByShortId(assertionShortId);
        assertionEnvelopeListToSave[assertionEnvelopeId] = ae;
    }
}

function assertionShareCancelPortfolioContactsAssignment() {
    hideModalError(ASR_SHARE_MODAL);
    hideModalBusy(ASR_SHARE_MODAL);
    $(ASR_SHARE_PRTF_CONTACTS_CTR).hide();
    $(ASR_SHARE_ASSIGN_PRTF_CTR).show();
}

function assertionShareApplyPortfolioContactsForAesi(aesi) {
    var aeat = assertionShareEnvelopeAssignmentTracker[aesi];
    if (!aeat || aeat == null) return;
    aeat["newContacts"] = [];
    for (var i=0;i<contactDisplayList.length;i++) {
        var cdo = contactDisplayList[i];
        if (cdo.pkPem != loggedInPkPem && !cdo.hide){
            var checkBoxId = ASR_SHARE_ASGN_CONT_CB_ID_PREFIX + buildIDableString(cdo.pkPem);
            var isAssigned = $("#" + checkBoxId).prop("checked");
            if (isAssigned) aeat["newContacts"].push(cdo.pkPem);
        }
    }
}

function assertionShareApplyPortfolioContactsForNaseIdx(naseIdx) {
    var nase = newAssertionShareEnvelopeList[naseIdx];
    if (!nase || nase == null) return;
    nase.contacts = [];
    for (var i=0;i<contactDisplayList.length;i++) {
        var cdo = contactDisplayList[i];
        if (cdo.pkPem != loggedInPkPem && !cdo.hide){
            var checkBoxId = ASR_SHARE_ASGN_CONT_CB_ID_PREFIX + buildIDableString(cdo.pkPem);
            var isAssigned = $("#" + checkBoxId).prop("checked");
            if (isAssigned) nase.contacts.push(cdo.pkPem);
        }
    }
}

function assertionShareApplyPortfolioContacts() {
    var prtType = $(ASR_SHARE_PRTF_CONTACTS_PRTF_TYPE).val();
    if ("aesi" == prtType) {
        var aesi = $(ASR_SHARE_PRTF_CONTACTS_PRTF_TYPE_LKP).val();
        assertionShareApplyPortfolioContactsForAesi(aesi);
    }
    else {
        var naseIdx = $(ASR_SHARE_PRTF_CONTACTS_PRTF_TYPE_LKP).val();
        assertionShareApplyPortfolioContactsForNaseIdx(naseIdx);
    }
    hideModalError(ASR_SHARE_MODAL);
    hideModalBusy(ASR_SHARE_MODAL);
    $(ASR_SHARE_PRTF_CONTACTS_CTR).hide();
    $(ASR_SHARE_ASSIGN_PRTF_CTR).show();
}

function buildAssertionShareContactAssignmentLineItem(cntName,checkBoxId,checked) {
    var cntLi = $("<li/>");
    var cntLiHtml = "<input id=\"" + checkBoxId + "\" type=\"checkbox\"";
    if (checked) cntLiHtml += " checked ";
    cntLiHtml += "></input>";
    cntLiHtml += "<label for=\"" + checkBoxId + "\">" + cntName + "</label>";
    cntLi.html(cntLiHtml);
    return cntLi;
}

function buildContactListForMangePortfolioContactsAssertionShare(aesi,naseIdx) {
    $(ASR_SHARE_PRTF_CONTACTS_LIST).empty();
    for (var i=0;i<contactDisplayList.length;i++) {
        var cdo = contactDisplayList[i];
        if (cdo.pkPem != loggedInPkPem && !cdo.hide){
            var cntName = cdo.displayName;
            var checkBoxId = ASR_SHARE_ASGN_CONT_CB_ID_PREFIX + buildIDableString(cdo.pkPem);
            var checked = false;
            if (aesi && aesi != null) checked = contactIsAssignedToAssertionShareEnvelopeAssignmentTracker(cdo.pkPem,aesi);
            else checked = contactIsAssignedToNewAssertionShareEnvelope(cdo.pkPem,naseIdx);
            var cntLi = buildAssertionShareContactAssignmentLineItem(cntName,checkBoxId,checked);
            $(ASR_SHARE_PRTF_CONTACTS_LIST).append(cntLi);
        }
    }
}

function addPortfolioNameForMangePortfolioContactsAssertionShare(aesi,naseIdx) {
    var prtfName = "UNKNOWN";
    if (aesi && aesi != null) {
        prtfName = assertionEnvelopeMap[aesi].name;
        $(ASR_SHARE_PRTF_CONTACTS_PRTF_TYPE).val("aesi");
        $(ASR_SHARE_PRTF_CONTACTS_PRTF_TYPE_LKP).val(aesi);
    }
    else {
        prtfName = newAssertionShareEnvelopeList[naseIdx].name;
        $(ASR_SHARE_PRTF_CONTACTS_PRTF_TYPE).val("naseIdx");
        $(ASR_SHARE_PRTF_CONTACTS_PRTF_TYPE_LKP).val(naseIdx);
    }
    $(ASR_SHARE_PRTF_CONTACTS_PRTF_NAME).html(prtfName);
}

function managePortfolioContactsForAssertionShare(aesi,naseIdx) {
    if ((!aesi || aesi == null) && (!naseIdx && naseIdx == null)) return;
    addPortfolioNameForMangePortfolioContactsAssertionShare(aesi,naseIdx);
    buildContactListForMangePortfolioContactsAssertionShare(aesi,naseIdx);
    hideModalError(ASR_SHARE_MODAL);
    hideModalBusy(ASR_SHARE_MODAL);
    $(ASR_SHARE_ASSIGN_PRTF_CTR).hide();
    $(ASR_SHARE_PRTF_CONTACTS_CTR).show();
}

function removeAllAssertionEnvelopeReaders(ae) {
    if (!ae.reader || ae.reader == null || ae.reader.length == 0) return;
    var pksToRemove = [];
    for (var i=0;i<ae.reader.length;i++) {
        var pk = contactsByPkPemMap[ae.reader[i]].pk;
        if (pk && pk != null) {
            pksToRemove.push(pk);
        }
    }
    for (var i=0;i<pksToRemove.length;i++) {
        ae.removeReader(pksToRemove[i]);
    }
}

function synchAssertionEnvelopeReadersFromTracker(assertionEnvelopeId) {
    var ae = assertionEnvelopeMap[assertionEnvelopeId];
    if (ae && ae != null) {
        var aeat = assertionShareEnvelopeAssignmentTracker[assertionEnvelopeId];
        removeAllAssertionEnvelopeReaders(ae);
        for (var i=0;i<aeat["newContacts"].length;i++) {
            var pk = contactsByPkPemMap[aeat["newContacts"][i]].pk;
            ae.addReader(pk);
        }
        assertionEnvelopeListToSave[assertionEnvelopeId] = ae;
    }
}

function saveChangedExistingEnvelopesForAssertionShare() {
    for (var aesi in assertionShareEnvelopeAssignmentTracker) {
        if (assertionShareEnvelopeAssignmentTracker.hasOwnProperty(aesi)) {
            var initialAssigned = assertionShareEnvelopeAssignmentTracker[aesi]["initialAssigned"];
            var newAssigned = assertionShareEnvelopeAssignmentTracker[aesi]["newAssigned"];
            if (initialAssigned != newAssigned) {
                if (newAssigned) addAssertionToAssertionEnvelope(currentAssertionShareId,aesi);
                else if (!newAssigned) removeAssertionFromAssertionEnvelope(currentAssertionShareId,aesi);
            }
            var initialContactsHash = buildHashStringFromStringArray(assertionShareEnvelopeAssignmentTracker[aesi]["initialContacts"]);
            var newContactsHash = buildHashStringFromStringArray(assertionShareEnvelopeAssignmentTracker[aesi]["newContacts"]);
            if (initialContactsHash != newContactsHash) {
                synchAssertionEnvelopeReadersFromTracker(aesi);
            }
        }
    }
}

function addAssertionReadersFromNewAssertionShareEnvelopContacts(ae,nase) {
    for (var j=0;j<nase.contacts.length;j++) {
        var ct = contactsByPkPemMap[nase.contacts[j]];
        ae.addReader(ct.pk);
    }
}

//TODO createNewEnvelopesForAssertionShare add all ids as owners
function createNewEnvelopesForAssertionShare() {
    for (var i=0;i<newAssertionShareEnvelopeList.length;i++) {
        if (newAssertionShareEnvelopeList[i].assigned) {
            var asr = assertionMap[currentAssertionShareId];
            if (asr && asr != null) {
                var nase = newAssertionShareEnvelopeList[i];
                var newAe = new AssertionEnvelope();
                newAe.name = nase.name;
                newAe.addAssertion(asr);
                newAe.addOwner(EcIdentityManager.ids[0].ppk.toPk());
                addAssertionReadersFromNewAssertionShareEnvelopContacts(newAe,nase);
                newAe.generateId(repo.selectedServer);
                assertionEnvelopeListToSave[newAe.shortId()] = newAe;
            }
        }
    }
}

function saveEnvelopesForAssertionShare() {
    assertionEnvelopeListToSave = {};
    saveChangedExistingEnvelopesForAssertionShare();
    createNewEnvelopesForAssertionShare();
    if (getNumberOfAssertionEnvelopesToSave() > 0) saveModifiedAssertionEnvelopesFromAssertionShare();
    else {
        hideModalBusy(ASR_SHARE_MODAL);
        $(ASR_SHARE_MODAL).foundation('close');
    }
}

function updateNewEnvelopeAssignmentsForAssertionShare() {
    for (var i=0;i<newAssertionShareEnvelopeList.length;i++) {
        var checkBoxId = ASR_SHARE_NEW_AE_CB_ID_PREFIX + i
        var isAssigned = $("#" + checkBoxId).prop("checked");
        newAssertionShareEnvelopeList[i].assigned  = isAssigned;
    }
}

function updateExistingEnvelopeAssignmentsForAssertionShare() {
    for (var aesi in assertionShareEnvelopeAssignmentTracker) {
        if (assertionShareEnvelopeAssignmentTracker.hasOwnProperty(aesi)) {
            var checkBoxId = buildIDableString(ASR_SHARE_EX_AE_CB_ID_PREFIX + aesi);
            var isAssigned = $("#" + checkBoxId).prop("checked");
            assertionShareEnvelopeAssignmentTracker[aesi]["newAssigned"] = isAssigned;
        }
    }
}

function assertionShareSave() {
    showAssertionShareAsBusy("Saving portfolios...");
    updateExistingEnvelopeAssignmentsForAssertionShare();
    updateNewEnvelopeAssignmentsForAssertionShare();
    saveEnvelopesForAssertionShare();
}

function shareAssertion(assertionShortId) {
    hideModalError(ASR_SHARE_MODAL);
    hideModalBusy(ASR_SHARE_MODAL);
    enableModalInputsAndButtons();
    $(ASR_SHARE_PRTF_CONTACTS_CTR).hide();
    $(ASR_SHARE_CREATE_PRTF_NAME).val("");
    newAssertionShareEnvelopeList = [];
    currentAssertionShareId = assertionShortId;
    $(ASR_SHARE_ASR_DESC).html(generateAssertionDescriptionHtml(assertionShortId));
    initAssertionShareEnvelopeTracker(assertionShortId);
    if (assertionEnvelopeList.length == 0) {
        $(ASR_SHARE_ASSIGN_PRTF_CTR).hide();
        $(ASR_SHARE_CREATE_PRTF_CTR).show();
    }
    else {
        buildAssertionSharePortfolioList();
        $(ASR_SHARE_CREATE_PRTF_CTR).hide();
        $(ASR_SHARE_ASSIGN_PRTF_CTR).show();
    }
    $(ASR_SHARE_MODAL).foundation('open');
}

//**************************************************************************************************
// Credential View Manipulation
//**************************************************************************************************

function buildDegreeCertView() {
    $(degreeCertList).each(function (i, dc) {
        var dcIconDiv = $("<div/>");
        dcIconDiv.attr("class", "cell small-2 medium-1");
        var dcIconHtml = "<div class=\"cass-badge\"><img src=\"img/icon-degree.png\">";
        dcIconHtml += "<span>" + dc.type + "</span></div>";
        dcIconDiv.html(dcIconHtml);
        var dcDetailsDiv = $("<div/>");
        dcDetailsDiv.attr("class", "cell small-10 medium-11");
        var dcDetailsHtml = "<h4><a onclick=\"showEvidenceDetailsModal('" + dc.assertionId + "','" + dc.evIdx + "')\">" + dc.name + "</a></h4>";
        dcDetailsHtml += "<span>" + dc.source + "</span>";
        dcDetailsDiv.html(dcDetailsHtml);
        $(COMP_CRED_DEG_CERT_CTR).append(dcIconDiv);
        $(COMP_CRED_DEG_CERT_CTR).append(dcDetailsDiv);
    });
}

function buildBadgeView() {
    $(badgeList).each(function (i, bdg) {
        var badgeDiv = $("<div/>");
        badgeDiv.attr("class", "cell");
        var bdHtml = "<a onclick=\"showEvidenceDetailsModal('" + bdg.assertionId + "','" + bdg.evIdx + "')\">";
        bdHtml += "<div class=\"cass-badge\"><img src=\"" + bdg.link + "\">";
        bdHtml += "<span>" + bdg.name + "</span></div></a>";
        badgeDiv.html(bdHtml);
        $(COMP_CRED_BADGE_CTR).append(badgeDiv);
    });
}

function buildCredentialView() {
    $(COMP_CRED_BADGE_CTR).empty();
    $(COMP_CRED_DEG_CERT_CTR).empty();
    if (badgeList.length == 0 && degreeCertList.length == 0) $(COMP_CRED_CTR).hide();
    else {
        buildBadgeView();
        buildDegreeCertView();
        $(COMP_CRED_CTR).show();
    }
}

//**************************************************************************************************
// List View
//**************************************************************************************************

function expandListViewToObject(expObj) {
    if (expObj.hasClass("collapsed") || expObj.hasClass("expanded")) {
        expObj.removeClass('collapsed').addClass('expanded');
        expObj.children('.title').children('.fa-li').removeClass('fa-caret-right').addClass('fa-caret-down');
        if (expObj.parent("ul") && expObj.parent("ul").hasClass("fa-ul")) {
            expObj.parent("ul").attr('style', 'display:block');
        }
        if (expObj.parent("ul").parent("li")) {
            expandListViewToObject(expObj.parent("ul").parent("li"));
        }
    }
}

//TODO expandListViewToName think of something better than name
function expandListViewToName(name) {
    var obj = $("#" + buildIDableString(name) + "_lvi");
    //obj.removeClass('collapsed').addClass('expanded');
    obj.attr('style', 'display:block');
    if (obj.parent("ul") && obj.parent("ul").hasClass("fa-ul")) {
        obj.parent("ul").attr('style', 'display:block');
    }
    if (obj.parent("ul").parent("li")) {
        expandListViewToObject(obj.parent("ul").parent("li"));
    }
}

function scrollToCompInListView(compName) {
    if ($('#' + buildIDableString(compName) + "_lvi").length > 0) {
        expandListViewToName(compName);
        $('html, body').animate({
            scrollTop: ($('#' + buildIDableString(compName) + "_lvi").offset().top - LIST_VIEW_SCROLL_ITEM_OFFSET)
        }, 500);
    }
}

function generateCompetencyLineItemHtmlForListView(cpd, comp, frameworkName, hasChildren) {
    var asArray = getAssertionsForCompetencyPacketData(cpd);
    var conf = determineConfidenceForAssertions(asArray);
    var confidenceValue = conf * 100;
  console.log('this is confidence', confidenceValue);
    var liHtml = 
        "<span class=\"competency-type\">" +
        "<a onclick=\"openConfidenceDetailsModal('" + escapeSingleQuote(cpd.id) + "')\">" + "<span class=\"badge " + CONF_CLASS_BASE + " " + getConfidenceClass(conf) + "\" title=\"" + buildConfidenceTitle(conf) + "\" aria-hidden=\"true\"></span>" + confidenceValue + "</a>"  + "&nbsp;&nbsp;&nbsp;" +
        "<a onclick=\"showCompetencyDetailsModal('" + escapeSingleQuote(comp.getId().trim()) + "');\">" +
        "<i class=\"fa fa-info-circle\" title=\"Show more details\" aria-hidden=\"true\"></i></a></span>" +
        "<h4 class=\"title\">";
    if (hasChildren) liHtml += "<i class=\"fa-li fa fa-caret-right\"></i>";
    if (comp.getName() != null) liHtml += comp.getName().trim() + "</h4>";
    else liHtml += "</h4>";
    if (comp.getDescription() != null) liHtml += "<p>" + comp.getDescription().trim() + "</p>";
    return liHtml;
}

//TODO addChildToListView construct list view for multi node competency cluster
function addChildToListView(parentUl, childCpd, frameworkName) {
    var childLi = $("<li/>");
    if (childCpd.cassNodePacket.getNodeList().length > 1) {
        childLi.html("<i>TODO: construct list view for multi node competency cluster</i>");
    } else {
        var comp = childCpd.cassNodePacket.getNodeList()[0];
        if (childCpd.children && childCpd.children.length > 0) childLi.addClass("collapsed");
        childLi.attr("id", buildIDableString(comp.getName().trim()) + "_lvi");
        var hasChildren = childCpd.children && childCpd.children.length > 0;
        childLi.html(generateCompetencyLineItemHtmlForListView(childCpd, comp, frameworkName, hasChildren));
        if (hasChildren) {
            childCpd.children.sort(function (a, b) {return a.name.localeCompare(b.name);});
            var childsChildUl = $("<ul/>");
            childsChildUl.attr("class", "fa-ul");
            childsChildUl.attr("style", "display:none");
            $(childCpd.children).each(function (i, cc) {
                addChildToListView(childsChildUl, cc, frameworkName);
            });
            childLi.append(childsChildUl);
        }
    }
    parentUl.append(childLi);
}

function addFrameworkToListView(frameworkId) {
    var d3fn = profileDisplayHelperData.frameworkHelperMap[frameworkId];
    if (!d3fn || d3fn == null) return;
    var frameworkLi = $("<li/>");
    frameworkLi.attr("style", "display:block");
    var frameworkLiHtml;
    var frameworkName = getFrameworkName(frameworkId);
    frameworkLi.attr("id", buildIDableString(frameworkName) + "_lvi");
    if (d3fn.children && d3fn.children.length > 0) {
        frameworkLi.addClass("expanded");
        frameworkLiHtml = "<h4 class=\"root title\"><i class=\"fa-li fa fa-caret-down\"></i> " + frameworkName + "</h4>";
    } else {
        frameworkLiHtml = "<h4 class=\"title\">" + frameworkName + "</h4>";
    }
    frameworkLi.html(frameworkLiHtml);
    if (d3fn.children && d3fn.children.length > 0) {
        d3fn.children.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });
        var childUl = $("<ul/>");
        childUl.attr("class", "fa-ul");
        childUl.attr("style", "display:block");
        $(d3fn.children).each(function (i, c) {
            addChildToListView(childUl, c, frameworkName);
        });
        frameworkLi.append(childUl);
    }
    $(PROF_CONTENTS_LIST).append(frameworkLi);
}

function buildListView() {
    $(PROF_CONTENTS_LIST).empty();
    for (var i = 0; i < applicableFrameworkList.length; i++) {
        var fw = applicableFrameworkList[i];
        debugMessage("Adding framework to list view: " + fw.shortId());
        addFrameworkToListView(fw.shortId());
    }
    setCompetencyListViewActions();
}

//**************************************************************************************************
// Graph View Sidebar (Right-Hand Side)
//**************************************************************************************************

function addCompetencyGraphSidebarParentToList(relatedList, d3Node) {
    if (d3Node.parent) {
        var itemName = getCompetencyOrFrameworkName( d3Node.parent.data.name.trim());
        var cLiHtml = " <li title=\" Find '" + escapeSingleQuote(itemName) + "'\" onclick=\"zoomExpCgByD3NodeId('" + escapeSingleQuote(d3Node.parent.data.name.trim()) + "',true)\">" +
            "<i class=\"fa-li fa fa-arrow-circle-up\"></i><a><strong>" + itemName + "</strong></a></li>";
        relatedList.append(cLiHtml);
    }
}

function addCompetencyGraphSidebarChildrenToList(relatedList, d3Node) {
    if (d3Node.children) {
        $(d3Node.children).each(function (i, c) {
            var itemName = getCompetencyOrFrameworkName(c.data.name.trim());
            var cLiHtml = " <li title=\" Find '" + escapeSingleQuote(itemName) + "'\" onclick=\"zoomExpCgByD3NodeId('" + escapeSingleQuote(c.data.name.trim()) + "',true)\">" +
                "<i class=\"fa-li fa fa-arrow-circle-o-right\"></i><a>" + itemName + "</a></li>";
            relatedList.append(cLiHtml);
        });
    }
}

function buildCompetencyGraphSidebarRelatedList(d3Node) {
    var relatedList = $(CIR_FCS_DTL_REL_LIST);
    relatedList.empty();
    if (d3Node && (d3Node.children || d3Node.parent)) {
        addCompetencyGraphSidebarParentToList(relatedList, d3Node);
        addCompetencyGraphSidebarChildrenToList(relatedList, d3Node);
    }
}

function buildGraphSidebarEvidenceDiv(evDivId, as, evArray) {
    var evDiv = $("<div/>");
    evDiv.addClass("cirAsrEvDiv");
    evDiv.attr("id", evDivId);
    evDiv.attr("style", "display:none");
    var evUl = $("<ul/>");
    $(evArray).each(function (i, ev) {
        var evLi = $("<li/>");
        var evLiHtml = "<a title=\"Show " + ev.type.toLowerCase() + " details\" onclick=\"showEvidenceDetailsModal('" + as.shortId() + "','" + ev.evIdx + "')\">";
        evLiHtml += "<i class=\"fa " + getEvidenceTypeFAClass(ev.type) + "\" aria-hidden=\"true\"></i>&nbsp;";
        evLiHtml += ev.name + "</a>";
        evLi.html(evLiHtml);
        evUl.append(evLi);
    });
    evDiv.append(evUl);
    return evDiv;
}
 
function toggleSourceAssertions() {
  $("#circleFocusDetailsAssertionListContainer ul").toggle();
  
  if($("#circleFocusDetailsAssertionListContainer .cirAsrSourceExpand").hasClass("fa-chevron-right")) {
     $("#circleFocusDetailsAssertionListContainer .cirAsrSourceExpand").removeClass('fa-chevron-right').addClass('fa-chevron-down');
  } else {
    $("#circleFocusDetailsAssertionListContainer .cirAsrSourceExpand").removeClass('fa-chevron-down').addClass('fa-chevron-right');
  }
 
}

function addSourceAssertionsToGraphSidebar(sourceName, sourceAssertionArray) {
    $(CIR_FCS_DTL_ASR_LIST_CTR)
      .append("<span onclick='toggleSourceAssertions()' class=\"cirAsrSource\">" + sourceName +  
              "<i class=\"cirAsrSourceExpand fa fa-chevron-right\"></i></span>"); 
    var sourceUl = $("<ul/>");
    $(sourceAssertionArray).each(function (i, as) {
        var sourceAsLi = $("<li/>");
        sourceAsLi.addClass("cirAsrText");
        var sourceAsLiHtml = buildConfidenceIcon(as.confidence);
      
        sourceAsLiHtml += "<a title=\"Show details\" onclick=\"showAssertionDetailsModal('" + as.shortId() + "')\"";
        var isNegativeAssertion = assertionNegativeMap[as.shortId()];
        if (isNegativeAssertion) sourceAsLiHtml += "does not hold ";
        else sourceAsLiHtml += "holds ";
        sourceAsLiHtml += "<strong>" + getCompetencyOrFrameworkName(as.competency) + "</strong></a>";
        
        sourceAsLiHtml += buildAssertionValidIcon(as.shortId(),true);
        sourceAsLiHtml += buildAssertionShareIcon(as.shortId());
        var evArray = getEvidenceForAssertion(as);
        var evDiv = null;
        if (evArray && evArray.length > 0) {
            var evDivId = buildIDableString(as.shortId() + "_evdiv_csr");
            evDiv = buildGraphSidebarEvidenceDiv(evDivId, as, evArray);
        }
        sourceAsLi.html(sourceAsLiHtml);
        if (evDiv != null) sourceAsLi.append(evDiv);
        sourceUl.append(sourceAsLi);
    });
    $(CIR_FCS_DTL_ASR_LIST_CTR).append(sourceUl);
}

function buildCompetencyGraphSidebarAssertionList(asArray) {
    $(CIR_FCS_DTL_ASR_LIST_CTR).empty();
    if (!asArray || asArray == null || asArray.length == 0) return;
    var asrBySource = divideAssertionsBySource(asArray);
    for (var source in asrBySource) {
        if (asrBySource.hasOwnProperty(source)) addSourceAssertionsToGraphSidebar(source, asrBySource[source]);
    }
}

function showCompetencyGraphSidebarSingleNodePacketDetails(cpd) {
    var comp = cpd.cassNodePacket.getNodeList()[0];
    scrollToNameInGraphViewSummary(comp.getName().trim());
    $(CIR_FCS_COMP_TOOLS).show();
    $(CIR_FCS_DTL_COMP_DTL_LINK).off("click").click(function () {
        showCompetencyDetailsModal(comp.getId().trim());
    });
    $(CIR_FCS_DTL_SING_NAME).html(comp.getName().trim());
    if (comp.getDescription() && comp.getDescription().trim().length > 0) {
        $(CIR_FCS_DTL_SING_DESC).html(comp.getDescription().trim());
    } else $(CIR_FCS_DTL_SING_DESC).html("<i>No description available</i>");
    evidenceTrail = [];
    var asArray = getAssertionsForCompetencyPacketData(cpd);
    var conf = determineConfidenceForAssertions(asArray);
    setUpCompetencyConfidenceView(conf, CIR_FCS_DTL_COMP_CONF, cpd.id);
    buildCompetencyGraphSidebarAssertionList(asArray);
    buildCompetencyGraphSidebarRelatedList(profileCompetencyData.competencyD3NodeTrackerMap[cpd.id].d3Node);
    showCircleSidebarDetails();
}

function showCompetencyGraphSidebarFrameworkNodeDetails(frameworkId) {
    var frameworkName = getFrameworkName(frameworkId);
    scrollToNameInGraphViewSummary(frameworkName);
    var frameworkDesc = getFrameworkDescription(frameworkId);
    $(CIR_FCS_COMP_TOOLS).hide();
    $(CIR_FCS_DTL_SING_NAME).html(frameworkName);
    if (frameworkDesc && frameworkDesc.length > 0) $(CIR_FCS_DTL_SING_DESC).html(frameworkDesc);
    else $(CIR_FCS_DTL_SING_DESC).html("<i>No description available</i>");
    if (frameworkName == profileUserName) buildCompetencyGraphSidebarAssertionList(assertionList);
    else buildCompetencyGraphSidebarAssertionList(getAssertionsForFramework(frameworkId));
    buildCompetencyGraphSidebarRelatedList(profileCompetencyData.competencyD3NodeTrackerMap[frameworkId].d3Node);
    if (frameworkName == profileUserName) {
        hideCircleSidebarDetails();
        removeAllGraphViewSummaryHighLighting();
    }
    else showCircleSidebarDetails();
}


function showCompetencyGraphSidebarMultiNodePacketDetails(cpd) {
    alert("TODO: Build details for multi competency node package");
}

function showCircleGraphSidebarDetails (d3NodeName) {
    hideCircleSidebarDetails();
    lastExpCgSidebarD3NodeName = d3NodeName;
    if (!d3NodeName || d3NodeName == null) return;
    if (isFrameworkIdOrProfileUser(d3NodeName)) showCompetencyGraphSidebarFrameworkNodeDetails(d3NodeName);
    else {
        var cpd = profileCompetencyData.competencyPacketDataMap[d3NodeName];
        if (!cpd || cpd == null) debugMessage("Cannot locate competency packet data for: " + d3NodeName);
        else {
            if (!cpd.cassNodePacket || cpd.cassNodePacket == null) debugMessage("cpt.cassNodePacket is null: " + d3NodeName);
            else if (!cpd.cassNodePacket.getNodeList() || cpd.cassNodePacket.getNodeList() == null) debugMessage("cpt.cassNodePacket.getNodePacketList() is null: " + d3NodeName);
            else if (cpd.cassNodePacket.getNodeList().length == 1) showCompetencyGraphSidebarSingleNodePacketDetails(cpd);
            else showCompetencyGraphSidebarMultiNodePacketDetails(cpd);
        }
    }
}

//**************************************************************************************************
// Graph View Summary (Left-Hand Side)
//**************************************************************************************************

function expandGraphViewSummaryToObject(expObj) {
    if (expObj.hasClass("gpsiChild")) {
        expObj.attr("style", "display:block");
        if (expObj.parent().children().eq(1) && expObj.parent().children().eq(1).find("i:first")) {
            var ic = expObj.parent().children().eq(0).find("i:first");
            if (ic && (ic.hasClass("fa-chevron-down") || ic.hasClass("fa-chevron-right"))) {
                ic.attr("class", "fa fa-chevron-down");
            }
        }
        if (expObj.parent() && expObj.parent().parent()) {
            expandGraphViewSummaryToObject(expObj.parent().parent());
        }
    }
}

function removeAllGraphViewSummaryHighLighting() {
    $(".psiItem.active").removeClass("active");
}

//TODO expandGraphViewSummaryToName think of something better than name
function expandGraphViewSummaryToName(name) {
    var obj = $("#" + buildIDableString(name) + "_psi");
    removeAllGraphViewSummaryHighLighting();
    obj.addClass("active");
    var objPP = obj.parent().parent();
    expandGraphViewSummaryToObject(objPP);
}

function scrollToNameInGraphViewSummary(name) {
    if ($("#" + buildIDableString(name) + "_psi").length > 0) {
        expandGraphViewSummaryToName(name);
        $(CIR_FCS_SUM_LIST_CTR).scrollTo("#" + buildIDableString(name) + "_psi", 500);
    }
}

function toggleGraphProfileSummaryChild(ce) {
    if (ce.find('i:first').hasClass("fa-chevron-right")) {
        ce.find('i:first').attr("class", "fa fa-chevron-down");
        ce.parent().find('ul:first').attr("style", "display:block");
    } else {
        ce.find('i:first').attr("class", "fa fa-chevron-right");
        ce.parent().find('ul:first').attr("style", "display:none");
    }
}

function generateCompetencyLineItemHtmlForGraphProfileSummary(comp, hasChildren) {
    var liHtml = "";
    if (hasChildren) liHtml += "<a onclick=\"toggleGraphProfileSummaryChild($(this))\"><i class=\"fa fa-chevron-right " + CIR_FCS_SUM_ITEM_CLASS_ID + "\" aria-hidden=\"true\"></i></a>";
    else liHtml += "<i class=\"fa fa-circle " + CIR_FCS_SUM_ITEM_CLASS_ID + "\" aria-hidden=\"true\"></i>";
    liHtml += "&nbsp;&nbsp;<a class=\"psiItem\" id=\"" + buildIDableString(comp.getName().trim()) + "_psi" + "\" " +
        "onclick=\"zoomExpCgByD3NodeId('" + escapeSingleQuote(comp.getId().trim()) + "',true)\">" + comp.getName().trim() + "</a>";
    return liHtml;
}

//TODO addChildToGraphProfileSummary construct list view for multi node competency cluster
function addChildToGraphProfileSummary(parentUl, childCpd) {
    var childLi = $("<li/>");
    if (childCpd.cassNodePacket.getNodeList().length > 1) childLi.html("<i>TODO: construct list view for multi node competency cluster</i>");
    else {
        var comp = childCpd.cassNodePacket.getNodeList()[0];
        var hasChildren = childCpd.children.length > 0;
        childLi.html(generateCompetencyLineItemHtmlForGraphProfileSummary(comp, hasChildren));
        if (hasChildren) {
            childCpd.children.sort(function (a, b) {return a.name.localeCompare(b.name);});
            var childsChildUl = $("<ul/>");
            childsChildUl.attr("class", "fa-ul gpsiChild");
            childsChildUl.attr("style", "display:none");
            $(childCpd.children).each(function (i, cc) {
                addChildToGraphProfileSummary(childsChildUl, cc);
            });
            childLi.append(childsChildUl);
        }
    }
    parentUl.append(childLi);
}

function addChildrenToGraphProfileSummaryFrameworks() {
    $(applicableFrameworkList).each(function (i, fw) {
        var fnpg = frameworkNodePacketGraphMap[fw.shortId()];
        if (fnpg && fnpg != null) {
            var d3fn = profileDisplayHelperData.frameworkHelperMap[fw.shortId()];
            if (!d3fn || d3fn == null) return;
            if (d3fn.children && d3fn.children.length > 0) {
                d3fn.children.sort(function (a, b) {
                    return a.name.localeCompare(b.name);
                });
                var childUl = $("<ul/>");
                childUl.attr("class", "fa-ul gpsiChild");
                childUl.attr("style", "display:none");
                $(d3fn.children).each(function (i, c) {
                    addChildToGraphProfileSummary(childUl, c);
                });
                frameworkGraphSummaryLiMap[fw.shortId()].append(childUl);
            }
        }
    });
}

//TODO categorizeFrameworksForSummary expand functionality
function categorizeFrameworksForSummary() {
    var frameworkCategories = {};
    frameworkCategories["Personal"] = [];
    frameworkCategories["Technical"] = [];
    frameworkCategories["Other"] = [];
    $(applicableFrameworkList).each(function (i, fw) {
        var fnpg = frameworkNodePacketGraphMap[fw.shortId()];
        if (fnpg && fnpg != null) {
            var fwn = fw.name.trim().toLowerCase();
            if (fwn.indexOf("programming") >= 0 ||
                fwn.indexOf("database") >= 0 ||
                fwn.indexOf("software") >= 0 ||
                fwn.indexOf("engineering") >= 0) frameworkCategories["Technical"].push(fw);
            else if (fwn.indexOf("leadership") >= 0 ||
                fwn.indexOf("education") >= 0 ||
                fwn.indexOf("spoken") >= 0 ||
                fwn.indexOf("personal") >= 0) frameworkCategories["Personal"].push(fw);
            else frameworkCategories["Other"].push(fw);
        }
    });
    return frameworkCategories;
}

function addFrameworkCategoryToGraphProfileSummary(categoryName, fwArray) {
    if (!fwArray || fwArray.length == 0) return;
    var catDiv = $("<div/>");
    catDiv.addClass("frameworkCategoryGraphSummaryContainer");
    var catSpan = $("<span/>");
    catSpan.addClass("frameworkCategoryGraphSummaryName");
    catSpan.html(categoryName);
    catDiv.append(catSpan);
    var catUl = $("<ul/>");
    catUl.addClass("fa-ul");
    $(fwArray).each(function (i, fw) {
        var fwLi = $("<li/>");
        var fwLiHtml = "<a onclick=\"toggleGraphProfileSummaryChild($(this))\">" +
            "<i class=\"fa fa-chevron-right " + CIR_FCS_SUM_ITEM_CLASS_ID + "\" aria-hidden=\"true\"></i></a>" +
            "&nbsp;&nbsp;<a class=\"psiItem\" id=\"" + buildIDableString(fw.name.trim()) + "_psi" + "\" " +
            "onclick=\"zoomExpCgByD3NodeId('" + escapeSingleQuote(fw.shortId().trim()) + "',true)\">" +
            fw.name.trim() + "</a>";
        fwLi.html(fwLiHtml);
        frameworkGraphSummaryLiMap[fw.shortId()] = fwLi;
        catUl.append(fwLi);
    });
    catDiv.append(catUl);
    $(CIR_FCS_SUM_LIST_CTR).append(catDiv);
}

function buildGraphProfileSummaryFrameworkCategories() {
    $(CIR_FCS_SUM_LIST_CTR).empty();
    frameworkGraphSummaryLiMap = {};
    applicableFrameworkList.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    });
    var frameworkCategories = categorizeFrameworksForSummary();
    for (var category in frameworkCategories) {
        if (frameworkCategories.hasOwnProperty(category)) {
            addFrameworkCategoryToGraphProfileSummary(category, frameworkCategories[category]);
        }
    }
}

function buildUserGraphProfileSummary() {
    if (isOwnProfile()) $(CIR_FCS_SUM_DESC).html(PROFILE_DESCRIPTION_OWN);
    else $(CIR_FCS_SUM_DESC).html(PROFILE_DESCRIPTION_OTHER);
    buildGraphProfileSummaryFrameworkCategories();
    addChildrenToGraphProfileSummaryFrameworks();
}

//**************************************************************************************************
// Profile Search Auto Complete
//**************************************************************************************************

function findItemByProfileSearchBar(selectedValue) {
    if (competencySearchAutoCompleteMap.hasOwnProperty(selectedValue)) {
        if ($(GRAPH_SCREEN).attr("style").indexOf("none") < 0) {
            zoomExpCircleGraphByAutoComplete(selectedValue);
        }
        else {
            scrollToCompInListView(selectedValue);
        }
    }
}

function buildProfileSearchAutoCompleteDataFromAutoCompleteMap() {
    var data = [];
    for (var property in competencySearchAutoCompleteMap) {
        if (competencySearchAutoCompleteMap.hasOwnProperty(property)) {
            data.push(property);
        }
    }
    return data;
}

function fillInProfileSearchAutoComplete() {
    $(PROF_SRCH_INPT).autocomplete({
        source: buildProfileSearchAutoCompleteDataFromAutoCompleteMap(),
        select: function (event, ui) {
            findItemByProfileSearchBar(ui.item.label);
        }
    });
}

//**************************************************************************************************
// Explorer Circle Graph Supporting Functions
//**************************************************************************************************

//d.data.name should be the competency ID, framework ID, or profile user name if the circle is the outer circle....
function getExplorerCgCircleText(d) {
    if (!d || !d.data || !d.data.name) return "UNDEFINED 'D'";
    else if (profileCompetencyData.competencyD3NodeTrackerMap[d.data.name]) {
        var text = getCompetencyOrFrameworkName(d.data.name);
        if (text == "") text = "UNDEFINED NODE PACKET";
        return text;
    }
    return "UNDEFINED NAME";
}

function getCompetencyD3NodeTracker(compId) {
    return profileCompetencyData.competencyD3NodeTrackerMap[compId];
}

function getCassNodePacket(compId) {
    var cpd = profileCompetencyData.competencyPacketDataMap[compId];
    if (!cpd) return null;
    else return cpd.cassNodePacket;
}

//**************************************************************************************************
// Build Profile Display
//**************************************************************************************************

function buildProfileDisplays() {
    showPageAsBusy("Building profile display...");
    clearFrameworkExpCircleSvg();
    buildExpGraphCircles(null, JSON.parse(profileD3NodeString));
    buildUserGraphProfileSummary();
    buildListView();
    buildCredentialView();
    showPageMainContentsContainer();
    fillInProfileSearchAutoComplete();
    clearProfileSearchBar();
    showProfileSearchBar();
    hasFinishedLoading = true;
    enableViewToggleButtons();
    showAllProfileExpTools();
}


//**************************************************************************************************
// Display Data Building
//**************************************************************************************************

function buildProfileDisplayData() {
    showPageAsBusy("Preparing data for display...");
    profileDisplayHelperData = setUpD3ProfileNodes(profileUserName,applicableFrameworkList,profileCompetencyData);
    profileD3NodeString = buildD3JsonString(profileDisplayHelperData.profileHelper);
    debugMessage("profileCompetencyData: ");
    debugMessage(profileCompetencyData);
    debugMessage("profileDisplayHelperData: ");
    debugMessage(profileDisplayHelperData);
    debugMessage("d3ProfileNode JSON String:");
    debugMessage(profileD3NodeString);
    buildProfileDisplays();
}

//**************************************************************************************************
// Framework Collapsing
//**************************************************************************************************

function registerCompetencyFramework(competencyId,frameworkId) {
    var ecf = applicableFrameworkMap[frameworkId];
    if (ecf) {
        if (!competencyFrameworkMap[competencyId]) competencyFrameworkMap[competencyId] = {};
        competencyFrameworkMap[competencyId][ecf.shortId()] = ecf;
    }
}

function buildCompetencyFrameworkMap() {
    for (var frameworkId in applicableFrameworkMap) {
        if (applicableFrameworkMap.hasOwnProperty(frameworkId)) {
            var cpdArray = profileCompetencyData.frameworkCompetencyPacketDataArrayMap[frameworkId];
            $(cpdArray).each(function (i, cpd) {
                registerCompetencyFramework(cpd.id,frameworkId);
            });
        }
    }
}

function processCollapsedFrameworkData() {
    showPageAsBusy("Processing collapsed data...");
    profileCompetencyData = buildProfileFrameworkCompetencyData(applicableFrameworkList,frameworkNodePacketGraphMap,competencyAssertionMap);
    buildCompetencyFrameworkMap();
    buildProfileDisplayData();
}

function checkAllApplicableFrameworksCollapsed() {
    if (frameworksCollapsed >= frameworksToCollapse) {
        debugMessage("All frameworks collapsed..");
        debugMessage(frameworkNodePacketGraphMap);
        processCollapsedFrameworkData();
    }
}

function handleCollapseApplicableFrameworkFailure(failMsg) {
    frameworksCollapsed++;
    debugMessage("handleCollapseApplicableFrameworkFailure: " + failMsg);
    checkAllApplicableFrameworksCollapsed();
}

function handleCollapseApplicableFrameworkSuccess(fwId, frameworkNodePacketGraph) {
    frameworksCollapsed++;
    frameworkNodePacketGraphMap[fwId] = frameworkNodePacketGraph;
    checkAllApplicableFrameworksCollapsed();
}

function collapseApplicableFrameworks() {
    showPageAsBusy("Collapsing frameworks...");
    frameworksCollapsed = 0;
    frameworksToCollapse = applicableFrameworkList.length;
    frameworkNodePacketGraphMap = {};
    var fc;
    for (var i = 0; i < applicableFrameworkList.length; i++) {
        var fw = applicableFrameworkList[i];
        fc = new FrameworkCollapser();
        debugMessage("Collapsing framework: " + fw.shortId());
        fc.collapseFramework(repo, fw, CREATE_IMPLIED_RELATIONS, handleCollapseApplicableFrameworkSuccess, handleCollapseApplicableFrameworkFailure);
    }
}

//**************************************************************************************************
// Framework Fetching
//**************************************************************************************************

//TODO cleanFrameworkName expand on or get rid of
function cleanFrameworkName(fw) {
    fw.name = fw.name.replace("CAP ", "");
}

function filterApplicableFrameworks() {
    debugMessage("filterApplicableFrameworks");
    applicableFrameworkList = [];
    applicableFrameworkMap = {};
    for (var i = 0; i < rawApplicableFrameworkList.length; i++) {
        fw = rawApplicableFrameworkList[i];
        cleanFrameworkName(fw);
        if (!applicableFrameworkMap[fw.shortId()] || applicableFrameworkMap[fw.shortId()] == null) {
            applicableFrameworkMap[fw.shortId()] = fw;
            applicableFrameworkList.push(fw);
        }
    }
}

function checkAllAssertionsQueried() {
    if (assertionsQueried >= assertionsToQuery) {
        debugMessage("All assertions queried...");
        debugMessage(rawApplicableFrameworkList);
        filterApplicableFrameworks();
        collapseApplicableFrameworks();
    }
    else {
        showPageAsBusy("Fetching frameworks (" + assertionsQueried + "  of " + assertionsToQuery + ")...");
    }
}

function handleSearchFrameworkFailure(msg) {
    assertionsQueried++;
    debugMessage("handleSearchFrameworkFailure: " + msg);
    checkAllAssertionsQueried();
}

function handleSearchFrameworkSuccess(arrayOfEcFrameworks, competencyId) {
    assertionsQueried++;
    debugMessage("handleSearchFrameworkSuccess: " + arrayOfEcFrameworks.length);
    $(arrayOfEcFrameworks).each(function (i, fw) {
        rawApplicableFrameworkList.push(fw);
        if (!competencyFrameworkMap[competencyId]) competencyFrameworkMap[competencyId] = {};
        competencyFrameworkMap[competencyId][fw.shortId()] = fw;
    });
    checkAllAssertionsQueried();
}

function fetchAssertionCompetencyFrameworks() {
    showPageAsBusy("Fetching frameworks...");
    assertionsQueried = 0;
    assertionsToQuery = assertionList.length;
    rawApplicableFrameworkList = [];
    $(assertionList).each(function (i, as) {
        debugMessage("Fetching framework for competency: " + as.competency);
        EcFramework.search(repo, "(competency:\"" + as.competency + "\")",
            function (arrayOfEcFrameworks) {
                handleSearchFrameworkSuccess(arrayOfEcFrameworks, as.competency);
            },
            handleSearchFrameworkFailure);
    });
}

//**************************************************************************************************
// Assertion and Envelope (Portfolio) Fetching
//**************************************************************************************************

//TODO generateEvidenceSource expand this
function generateEvidenceSource(evidenceStr, as, evIdx) {
    var evPieces = evidenceStr.split("|");
    if (evPieces && evPieces.length == 4 && evPieces[0] == "ProfDemo") {
        var evSource = new evidenceSource(evPieces[2], evPieces[1], as.getAgentName(), as.getAssertionDate(), as.getExpirationDate(), evPieces[3], as.shortId(), evIdx);
        return evSource;
    }
    else {
        debugMessage("!!!Invalid evidence for demo: " + evidenceStr);
        return null;
    }
}

function registerCredential(ev) {
    if (ev.type.toLowerCase() == "badge") badgeList.push(ev);
    else if (ev.type.toLowerCase() == "degree" ||
        ev.type.toLowerCase() == "certificate" ||
        ev.type.toLowerCase() == "certification") degreeCertList.push(ev);
}

function buildAssertionMaps() {
    showPageAsBusy("Processing assertions (step 3 of 3)...");
    assertionMap = {};
    assertionEvidenceMap = {};
    assertionSourceMap = {};
    assertionNegativeMap = {};
    badgeList = [];
    degreeCertList = [];
    $(assertionList).each(function (i, as) {
        assertionMap[as.shortId()] = as;
        assertionSourceMap[as.shortId()] = as.getAgentName();
        assertionNegativeMap[as.shortId()] = as.getNegative();
        for (var i = 0; i < as.getEvidenceCount(); i++) {
            var evidenceStr = as.getEvidence(i);
            var ev = generateEvidenceSource(evidenceStr, as, i);
            if (ev) {
                if (!assertionEvidenceMap[as.shortId()]) {
                    assertionEvidenceMap[as.shortId()] = {};
                }
                assertionEvidenceMap[as.shortId()][i] = ev;
                registerCredential(ev);
            }
        }
    });
}

function handleNoAssertionsFound() {
    if (isOwnProfile()) showNoAssertionsFoundForOwnProfileWarning();
    else showNoAssertionsFoundForProfileUserSearchWarning();
}

function filterAssertionsBySubject(arrayOfEcAssertions) {
    var filteredEcAssertions = [];
    for (var i = 0; i < arrayOfEcAssertions.length; i++) {
        var ecaSubj = arrayOfEcAssertions[i].getSubject();
        if (ecaSubj && ecaSubj != null) {
            if (ecaSubj.toPem() == profileUserPkPem) {
                filteredEcAssertions.push(arrayOfEcAssertions[i]);
            }
        }
    }
    return filteredEcAssertions;
}

function buildCompetencyAssertionMaps() {
    showPageAsBusy("Processing assertions (step 2 of 3)...");
    competencyAssertionMap = {};
    $(assertionList).each(function (i, as) {
        if (!competencyAssertionMap[as.competency] || competencyAssertionMap[as.competency] == null) {
            competencyAssertionMap[as.competency] = [];
        }
        competencyAssertionMap[as.competency].push(as);
    });
}

function processRelevantAssertions() {
    showPageAsBusy("Processing assertions (step 1 of 3)...");
    if (assertionList.length == 0) handleNoAssertionsFound();
    else {
        assertionList.sort(function (a, b) {
            return a.getAssertionDate() - b.getAssertionDate();
        });
        debugMessage(assertionList);
        buildCompetencyAssertionMaps();
        buildAssertionMaps();
        fetchAssertionCompetencyFrameworks();
    }
}

//If user is viewing own profile, you shouldn't need the assertions in the envelopes.
//However, the user still needs to have a list of owned envelopes so they can be managed
function buildAssertionListFromSearchAndEnvelopes() {
    var ao = {};
    if (!isOwnProfile()) {
        for (var i = 0; i < assertionEnvelopeEcAssertionList.length; i++) {
            ao[assertionEnvelopeEcAssertionList[i].shortId()] = assertionEnvelopeEcAssertionList[i];
        }
    }
    for (var i=0;i<ecAssertionSearchReturnList.length;i++) {
        ao[ecAssertionSearchReturnList[i].shortId()] = ecAssertionSearchReturnList[i];
    }
    for (var asid in ao) {
        if (ao.hasOwnProperty(asid)) {
            assertionList.push(ao[asid]);
        }
    }
}

function isEnvelopeOwnedByProfileUser(asrEnv) {
    if (!asrEnv.owner || asrEnv.owner == null) return false;
    for (var j=0;j<asrEnv.owner.length;j++) {
        if (asrEnv.owner[j] == profileUserPkPem) return true;
    }
    return false;
}

function isEncryptedAssertionEnvelope(asrEnv) {
    if (asrEnv.encryptedType && asrEnv.encryptedType == "AssertionEnvelope") return true;
    return false;
}

function registerAssertionEnvelopeAssertions(asrEnv) {
    if (asrEnv.assertion && asrEnv.assertion != null) {
        for (var i=0;i<asrEnv.assertion.length;i++) {
            var eca = new EcAssertion();
            eca.copyFrom(asrEnv.getAssertion(i));
            assertionEnvelopeEcAssertionList.push(eca);
            if (!assertionAssertionEnvelopeMap[eca.shortId()] || assertionAssertionEnvelopeMap[eca.shortId()] == null) {
                assertionAssertionEnvelopeMap[eca.shortId()] = [];
            }
            assertionAssertionEnvelopeMap[eca.shortId()].push(asrEnv);
            if (!assertionEnvelopeAssertionMap[asrEnv.shortId()] || assertionEnvelopeAssertionMap[asrEnv.shortId()] == null) {
                assertionEnvelopeAssertionMap[asrEnv.shortId()] = [];
            }
            assertionEnvelopeAssertionMap[asrEnv.shortId()].push(eca);
        }
    }
}

function processPotentialAssertionEnvelope(potAsrEnv) {
    debugMessage("processPotentialAssertionEnvelope: " + potAsrEnv.id);
    if (isEncryptedAssertionEnvelope(potAsrEnv) && isEnvelopeOwnedByProfileUser(potAsrEnv)) {
        var nv = new EcEncryptedValue();
        nv.copyFrom(potAsrEnv);
        var aed = nv.decryptIntoObject();
        var realAsrEnv = new AssertionEnvelope();
        realAsrEnv.copyFrom(aed);
        assertionEnvelopeList.push(realAsrEnv);
        assertionEnvelopeMap[realAsrEnv.shortId()] = realAsrEnv;
        registerAssertionEnvelopeAssertions(realAsrEnv);
    }
}

function handleGetAssertionEnvelopesSuccess(ecRldArray) {
    debugMessage("handleGetAssertionEnvelopesSuccess: " + ecRldArray.length);
    if (ecRldArray && ecRldArray != null) {
        for (var i=0;i<ecRldArray.length;i++) {
            processPotentialAssertionEnvelope(ecRldArray[i]);
        }
    }
    if (assertionEnvelopeList.length > 1) {
        assertionEnvelopeList.sort(function (a, b) {
            return a.name.localeCompare(b.name);
        });
    }
    buildAssertionListFromSearchAndEnvelopes();
    processRelevantAssertions();
}

function handleGetAssertionEnvelopesFailure(failMsg) {
    debugMessage("handleGetAssertionEnvelopesFailure: " + failMsg);
    showPageError("Portfolio fetch failed: " + failMsg);
}

function fetchAssertionEnvelopes() {
    showPageAsBusy("Fetching portfolios...");
    //repo.search(new AssertionEnvelope().getSearchStringByType(),null,handleGetAssertionEnvelopesSuccess,handleGetAssertionEnvelopesFailure);
    repo.searchWithParams(new AssertionEnvelope().getSearchStringByType(),{'size':MAX_ASSR_SEARCH_SIZE},null,handleGetAssertionEnvelopesSuccess,handleGetAssertionEnvelopesFailure);
}

function handleGetAssertionsSuccess(arrayOfEcAssertions) {
    debugMessage("handleGetAssertionsSuccess: " + arrayOfEcAssertions.length);
    ecAssertionSearchReturnList = filterAssertionsBySubject(arrayOfEcAssertions);
    debugMessage("ecAssertionSearchReturnList(filtered): " + ecAssertionSearchReturnList.length);
    fetchAssertionEnvelopes();
}

function handleGetAssertionsFailure(failMsg) {
    debugMessage("handleGetAssertionsFailure: " + failMsg);
    showPageError("Assertion fetch failed: " + failMsg);
}

function getAssertionSearchQueryForProfileUser() {
    var searchQuery = "(\\*@reader:\"" + profileUserPkPem + "\")";
    debugMessage("Assertion search query: " + searchQuery);
    return searchQuery;
}

function fetchAssertions() {
    assertionList = [];
    assertionValidationResultsMap = {};
    ecAssertionSearchReturnList = [];
    assertionEnvelopeEcAssertionList = [];
    assertionEnvelopeList = [];
    assertionEnvelopeMap = {};
    assertionAssertionEnvelopeMap = {};
    assertionEnvelopeAssertionMap = {};
    lastExpCgSidebarD3NodeName = "";
    EcAssertion.search(repo, getAssertionSearchQueryForProfileUser(), handleGetAssertionsSuccess, handleGetAssertionsFailure, {'size':MAX_ASSR_SEARCH_SIZE});
}

function setUpProfileUserAndFetchAssertions(puName, puPem) {
    profileUserName = puName;
    setProfileName(profileUserName);
    showMainMenu();
    profileUserPkPem = puPem;
    hideProfileExpTools();
    hideCircleSidebarDetails();
    disableViewToggleButtons();
    showPageAsBusy("Fetching user assertions...");
    fetchAssertions();
}

function setProfileUserAsLoggedInUserAndGo() {
    hideProfileUserSearchContainer();
    setUpProfileUserAndFetchAssertions(loggedInIdentityName, loggedInPkPem);
}

function setProfileUserAndGo(profilePem) {
    var ct = contactsByPkPemMap[profilePem];
    if (ct) {
        hideProfileUserSearchContainer();
        setUpProfileUserAndFetchAssertions(ct.displayName, profilePem);
    }
    else {
        debugMessage("setProfileUserAndGo: could not locate contact info for: " + profilePem);
        setUpForProfileUserSearch();
    }
}

function setUpForProfileUserSearch() {
    fillInProfileUserSearchAutoComplete();
    clearProfileUserSearchBar();
    showProfileUserSearchContainer();
}

//**************************************************************************************************
// Profile User Search Auto Complete
//**************************************************************************************************

function setUpAndFetchAssertionsForSelectedUser(selectedValue) {
    if (contactsByNameMap.hasOwnProperty(selectedValue)) {
        var ct = contactsByNameMap[selectedValue];
        hideProfileUserSearchContainer();
        setUpProfileUserAndFetchAssertions(ct.displayName, ct.pk.toPem());
    }
}

function buildProfileUserSearchAutoCompleteData() {
    var data = [];
    for (var contactName in contactsByNameMap) {
        if (contactsByNameMap.hasOwnProperty(contactName)) {
            data.push(contactName);
        }
    }
    return data;
}

function fillInProfileUserSearchAutoComplete() {
    $(PROF_USR_SRCH_INPT).autocomplete({
        source: buildProfileUserSearchAutoCompleteData(),
        select: function (event, ui) {
            setUpAndFetchAssertionsForSelectedUser(ui.item.label);
        }
    });
}

//**************************************************************************************************
// Page Load
//**************************************************************************************************

function loadPageContents() {
    hideProfileExpTools();
    if (profileToOpen && profileToOpen != "") {
        var tp = profileToOpen;
        profileToOpen = "";
        setProfileUserAndGo(tp);
    }
    //TODO loadPageContents At some point take loggedInPkPem check out and just start with setProfileUserAsLoggedInUserAndGo OR setUpForProfileUserSearch
    else if (loggedInPkPem == SAMANTHA_SMITH_PK_PEM) setProfileUserAsLoggedInUserAndGo();
    else setUpForProfileUserSearch();
}
