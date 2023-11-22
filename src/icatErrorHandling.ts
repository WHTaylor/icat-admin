const patterns = {
    unknownTable: /No information to determine type of (.+) in the FROM clause/,
    badRequest: /400 Bad Request: (.+)/,
    entityManagerException: /An exception occurred while creating a query in EntityManager:\s+Exception Description: (.+)/
}

const handlers = {
    unknownTable: m =>
        "Entity type '" + m[1] + "' does not exist " +
        "(likely an ICAT 5 entity on a server running ICAT 4)",
    badRequest: m => m[1],
    entityManagerException: m => m[1]
};

export function simplifyIcatErrMessage(err: string): string {
    let message = err;
    let match;
    do {
        match = false;
        for (let k in patterns) {
            let m = message.match(patterns[k]);
            if (m != null) {
                match = true;
                message = handlers[k](m);
            }
        }
    } while (match);
    return message;
}
