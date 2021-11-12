function queryUrlClause(args) {
    return Object.entries(args)
        .map(kv => kv.map(encodeURIComponent).join('='))
        .join('&');
}

class IcatClient {
    constructor(host) {
        this.serviceUrl = host + "/icat";
    }

    async login(plugin, username, password) {
        const creds = {
            "plugin": plugin, 
             "credentials": [
                {"username": username},
                {"password": password}]};
        const form = new FormData();
        form.append('json', JSON.stringify(creds));
        return fetch(
            this.serviceUrl + "/session", {
                method: "POST",
                body: new URLSearchParams(form),
            })
        .then(res => {
            if (res.ok) return res
            else throw new Error(res)
        })
        .then(res => res.json())
        .then(j => j["sessionId"]);
    }

    async getEntries(sessionId, table, offset, limit) {
        const query = `select e from ${table} e limit ${offset}, ${limit}`;
        const params = {
            "sessionId": sessionId,
            "query": query,
        }
        const url = `${this.serviceUrl}/entityManager?${queryUrlClause(params)}`;
        return fetch(url)
        .then(res => {
            if (res.ok) return res
            else throw new Error(res)
        })
        .then(res => res.json());
    }
}

export const entityNames = ["Application", "DataCollection", "DataCollectionDatafile", "DataCollectionDataset", "DataCollectionParameter", "Datafile", "DatafileFormat", "DatafileParameter", "Dataset", "DatasetParameter", "DatasetType", "Facility", "FacilityCycle", "Grouping", "Instrument", "InstrumentScientist", "Investigation", "InvestigationGroup", "InvestigationInstrument", "InvestigationParameter", "InvestigationType", "InvestigationUser", "Job", "Keyword", "ParameterType", "PermissibleStringValue", "PublicStep", "Publication", "RelatedDatafile", "Rule", "Sample", "SampleParameter", "SampleType", "Shift", "Study", "StudyInvestigation", "User", "UserGroup"];

export default IcatClient;
