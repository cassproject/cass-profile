//**************************************************************************************************
// CASS UI Profile Explorer Session Functions
//**************************************************************************************************

const CASS_TRUST_NETWORK_LS_KEY = "cassTrustNetwork";

//**************************************************************************************************
// Variables

var repo;
var selectedServer;
var loggedInIdentityName;
var loggedInPk;
var loggedInPkPem;
var loggedInPpkPem;

var contactsByNameMap;
var contactsByPkPemMap = {};
var contactDisplayList;

//**************************************************************************************************
// Data Structures
//**************************************************************************************************

function contactDisplayObj(contact) {
    this.displayName = contact.displayName;
    this.pk = contact.pk;
    this.pkPem = contact.pk.toPem();
    this.hide = false;
}

//**************************************************************************************************
// Trust Network
//**************************************************************************************************

function fetchTrustNetworkFromLocalStorage() {
    var tnoString = localStorage.getItem(CASS_TRUST_NETWORK_LS_KEY);
    var nt = {};
    if (!tnoString || tnoString.trim() == "") return nt;
    try {
        var tno = JSON.parse(tnoString);
        return tno;
    }
    catch (e) {
        return nt;
    }
}

function saveTrustNetworkToLocalStorage(tno) {
    if (tno) {
        try {
            localStorage.setItem(CASS_TRUST_NETWORK_LS_KEY,JSON.stringify(tno));
        }
        catch (e) {
            localStorage.removeItem(CASS_TRUST_NETWORK_LS_KEY);
        }
    }
}

//**************************************************************************************************
// Contacts
//**************************************************************************************************

function buildContactDisplayList() {
    contactDisplayList = [];
    for (var cPkPem in contactsByPkPemMap) {
        if (contactsByPkPemMap.hasOwnProperty(cPkPem)) {
            var cdo = new contactDisplayObj(contactsByPkPemMap[cPkPem]);
            //applySamanthaContactsDisplayFilter(cdo);
            contactDisplayList.push(cdo);
        }
    }
    if (contactDisplayList.length > 1) {
        contactDisplayList.sort(function (a, b) {
            return a.displayName.localeCompare(b.displayName);
        });
    }
}

function buildContactsMaps() {
    contactsByNameMap = {};
    contactsByPkPemMap = {};
    for (var i = 0; i < EcIdentityManager.contacts.length; i++) {
        contactsByNameMap[EcIdentityManager.contacts[i].displayName] = EcIdentityManager.contacts[i];
        contactsByPkPemMap[EcIdentityManager.contacts[i].pk.toPem()] = EcIdentityManager.contacts[i];
    }
    buildContactDisplayList();
}

//**************************************************************************************************
// Repository Intialization
//**************************************************************************************************
function initRepo() {
    debugMessage("Initializing repository...");
    repo = new EcRepository();
    repo.selectedServer = selectedServer;
    debugMessage("Repository initialized.");
}

//**************************************************************************************************
// Identity Intialization
//**************************************************************************************************
function initSessionIdentity() {
    debugMessage("Initializing identity...");
    var eci = new EcIdentity();
    eci.source = selectedServer;
    eci.displayName = loggedInIdentityName;
    var eciPpk = EcPpk.fromPem(loggedInPpkPem);
    eci.ppk = eciPpk;
    EcIdentityManager.ids.push(eci);
    loggedInPk = EcIdentityManager.ids[0].ppk.toPk();
    loggedInPkPem = loggedInPk.toPem();
    debugMessage("Identity intialized:");
    debugMessage("Display Name: " + EcIdentityManager.ids[0].displayName);
    debugMessage("Public Key: " + loggedInPkPem);
}

function setupIdentity(serverParm,nameParm,pemParm) {
    debugMessage("Setting up identity...");
    selectedServer = serverParm;
    initRepo();
    loggedInIdentityName = nameParm;
    loggedInPpkPem = pemParm;
    initSessionIdentity();
    buildContactsMaps();
    debugMessage("Identity set up.");
}