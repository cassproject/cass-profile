//**************************************************************************************************
// CASS UI Profile Explorer Main Functions
//**************************************************************************************************

//TODO checkForProfileSearchbarEnter
//TODO setProfileUserAsLoggedInUserAndGo
//TODO setUpForProfileUserSearch
//TODO openProfileExpAssertionValidateModal
//TODO checkForProfileUserSearchbarEnter
//TODO openFrameworkInFrameworkExplorer

//TODO cleanFrameworkName expand on or get rid of
//TODO generateEvidenceSource expand this
//TODO loadPageContents At some point take loggedInPkPem check out and just start with setProfileUserAsLoggedInUserAndGo OR setUpForProfileUserSearch

//TODO getAssertionsForD3Node fix for multi node clusters
//TODO getAssertionsForCompetencyPackTracker fix for multi node clusters

//**************************************************************************************************
// Constants

//REMOVE SAMANTHA_SMITH_PK_PEM AND USAGES AT SOME POINT..ONLY FOR DEMO/DEV TO SAVE CLICKS
const SAMANTHA_SMITH_PK_PEM = "-----BEGIN PUBLIC KEY-----MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAogp5B7hoYRwZDjCb4NL/fNt3xTBvDMw08jLTdOcmyKVzetHgwTWRf3ojl1+EPqpgnVRxp/zk2/AQhYelJaU6JmzPBvx14FjxB3ObbYckXrBw60fQ643geAIY3lQAYH7YpBsDp/xCQlMCw7L1H70ZnRPWdxzl9ee20ZeQy367biWPbFQCBUFWHN+gXH2pGZkM8n3/ql6hQ9SFaVEkqzIFdHwTenfl5LYrGmiUuzBy4xfwXsd0NZSzOjxuZyGlupEDkqTh7bMmGJSe13+BlbQcVJ+OwYHM+RdLfk3zXia1cMrcJx/nZZUFxxQs4+V51bBbTG0ms7K9/O28U6Q5BytzNQIDAQAB-----END PUBLIC KEY-----";

const PROFILE_DESCRIPTION_OWN = "The following areas of knowledge, skills, and abilities were determined for you based on all evidence currently available to CASS:";
const PROFILE_DESCRIPTION_OTHER = "The following areas of knowledge, skills, and abilities were determined for this user based on all evidence currently available to CASS and visible to you:";

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
var d3FrameworkNodeMap = {};
var d3ProfileNode;
var d3ProfileNodeString;
var assertionEvidenceMap = {};
var badgeList = [];
var degreeCertList = [];
var assertionSourceMap = {};
var assertionNegativeMap = {};
var competencyFrameworkMap = {};
var frameworkGraphSummaryLiMap = {};

var hasFinishedLoading = false;

var evidenceTrail = [];

var contactsByNameMap;
var contactsByPkPemMap;
var contactDisplayList;

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

//TODO fix these
var frameworkNodePacketGraphMap = {};
var competencyClusterNodeArrayMap = {};
//var competencyPackTrackerMapByName = {}; //this could probably be removed now
var competencyPackTrackerMapById = {};


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

function doesCompetencyHaveAssertion(compId) {
    if (!competencyAssertionMap[compId] || competencyAssertionMap[compId] == null) return false;
    else return true;
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
    evidenceTrail.push(d3Node.data.name.trim());
    var cpt = competencyPackTrackerMapById[d3Node.data.name.trim()];
    var comp = cpt.cassNodePacket.getNodeList()[0];
    var asArray = getAssertionsForCompetency(comp.getId());
    if (!asArray || asArray == null || asArray.length == 0) {
        if (!cpt.d3Node || !cpt.d3Node.parent || cpt.d3Node.parent == null) return null;
        else return getAssertionsForD3Node(cpt.d3Node.parent);
    } else return asArray;
}

//TODO getAssertionsForCompetencyPackTracker fix for multi node clusters
function getAssertionsForCompetencyPackTracker(cpTracker) {
    var comp = cpTracker.cassNodePacket.getNodeList()[0];
    var asArray = getAssertionsForCompetency(comp.getId());
    if (!asArray || asArray == null || asArray.length == 0) {
        if (!cpTracker.d3Node || !cpTracker.d3Node.parent || cpTracker.d3Node.parent == null) return null;
        else return getAssertionsForD3Node(cpTracker.d3Node.parent);
    } else return asArray;
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

function getCompetencyOrFrameworkName(competencyId) {
    //yes...this first if is weird...but it is an easy solution to a problem
    // specifically if trying to get the competency name for a D3 circle ID and that D3 circle is the
    // outer framework circle...
    if (competencyId == profileUserName) return profileUserName;
    var cpt = competencyPackTrackerMapById[competencyId];
    if (!cpt || cpt == null) return "N/A";
    else if (cpt.isFramework) return getFrameworkName(competencyId);
    else return generateNameFromCassNodePacket(cpt.cassNodePacket);
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
        retHtml += "<a onclick=\"openFrameworkInFrameworkExplorer('" + fw.shortId() + "');\">" + escapeSingleQuote(fw.name) + "</a>"
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

function setUpCompetencyConfidenceView(confidence, iconId) {
    $(iconId).attr("class", CONF_CLASS_BASE);
    $(iconId).attr("title", buildConfidenceTitle(confidence));
    $(iconId).addClass(getConfidenceClass(confidence));
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

function buildConfidenceIcon(conf) {
    var retHtml = "&nbsp;&nbsp;" + "" +
        "<i class=\"" + CONF_CLASS_BASE + " " + getConfidenceClass(conf) + "\" title=\"" + buildConfidenceTitle(conf) + "\" aria-hidden=\"true\"></i>";
    return retHtml;
}

function buildAssertionShareIcon(assertionShortId) {
    if (isOwnProfile()) {
        var retHtml = "&nbsp;&nbsp;" + "" +
            "<a class=\"assertionShareIcon\"><i class=\"fa fa-share-alt-square\" onclick=\"shareAssertion('" + assertionShortId + "');\" " +
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
        ce.find('i:first').attr("class", "fa fa-chevron-right");
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
    // if (event.which == 13 || event.keyCode == 13) {
    //     $(PROF_USR_SRCH_INPT).autocomplete("close");
    //     setUpAndFetchAssertionsForSelectedUser($(PROF_USR_SRCH_INPT).val().trim());
    // }
}

function checkForProfileSearchbarEnter(event) {
    // if (event.which == 13 || event.keyCode == 13) {
    //     $(PROF_SRCH_INPT).autocomplete("close");
    //     findItemByProfileSearchBar($(PROF_SRCH_INPT).val().trim());
    // }
}

function setProfileUserAsLoggedInUserAndGo() {
    // hideProfileUserSearchContainer();
    // setUpProfileUserAndFetchAssertions(loggedInIdentityName, loggedInPkPem);
}

function setUpForProfileUserSearch() {
    // fillInProfileUserSearchAutoComplete();
    // showOnlyProfileExplorerMainMenu();
    // showProfileUserSearchContainer();
}

function openFrameworkInFrameworkExplorer(frameworkId) {
    // loadLocalStorageWithCassProfileExpToFrameworkExpStuff();
    // localStorage.setItem(LS_FRAMEWORK_TO_OPEN_KEY,frameworkId);
    // window.open(FWK_EXP_LINK, '_blank');
    // //alert("OPEN FRAMEWORK: " + frameworkId);
}

//**************************************************************************************************
// Explorer Circle Graph Supporting Functions
//**************************************************************************************************

//**************************************************************************************************
// Validate Assertions Modal
//**************************************************************************************************

function openProfileExpAssertionValidateModal() {
    // $(ASR_VALD_TYPES).val("");
    // $(ASR_VALD_ERROR_CTR).hide();
    // $(ASR_VALD_BUSY_CTR).hide();
    // $(ASR_VALD_RESULTS_CTR).hide();
    // $(ASR_VALD_SETUP_CTR).show();
    // $(ASR_VALD_SETUP_BTN_CTR).show();
    // $(ASR_VALD_MODAL).removeClass("small").addClass("tiny");
    // $(ASR_VALD_MODAL).foundation('open');
}

//**************************************************************************************************
// Framework Collapsing
//**************************************************************************************************

//TODO LEFT OFF HERE

function checkAllApplicableFrameworksCollapsed() {
    if (frameworksCollapsed >= frameworksToCollapse) {
        debugMessage("All frameworks collapsed..");
        debugMessage(frameworkNodePacketGraphMap);
        buildFrameworkCompetencyCluseterNodeArrays();
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
    frameworkNodePacketGraphMap = {}
    var fc;
    for (var i = 0; i < applicableFrameworkList.length; i++) {
        var fw = applicableFrameworkList[i];
        fc = new FrameworkCollapser();
        debugMessage("Collapsing framework: " + fw.shortId());
        fc.collapseFramework(repo, fw, CREATE_IMPLIED_RELATIONS, handleCollapseApplicableFrameworkSuccess, handleCollapseApplicableFrameworkFailure);
    };
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
    repo.search(new AssertionEnvelope().getSearchStringByType(),null,handleGetAssertionEnvelopesSuccess,handleGetAssertionEnvelopesFailure);
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
    EcAssertion.search(repo, getAssertionSearchQueryForProfileUser(), handleGetAssertionsSuccess, handleGetAssertionsFailure, null);
}

function setUpProfileUserAndFetchAssertions(puName, puPem) {
    profileUserName = puName;
    setProfileName(profileUserName);
    profileUserPkPem = puPem;
    hideProfileExpTools();
    disableViewToggleButtons();
    showPageAsBusy("Fetching user assertions...");
    fetchAssertions();
}

function setProfileUserAsLoggedInUserAndGo() {
    hideProfileUserSearchContainer();
    setUpProfileUserAndFetchAssertions(loggedInIdentityName, loggedInPkPem);
}

function setUpForProfileUserSearch() {
    fillInProfileUserSearchAutoComplete();
    showOnlyOpenProfileTools();
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
    //TODO loadPageContents At some point take loggedInPkPem check out and just start with setProfileUserAsLoggedInUserAndGo OR setUpForProfileUserSearch
    if (loggedInPkPem == SAMANTHA_SMITH_PK_PEM) setProfileUserAsLoggedInUserAndGo();
    else setUpForProfileUserSearch();
}
