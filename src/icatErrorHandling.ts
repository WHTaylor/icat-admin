type IcatError = "UnknownTable" | "BadRequest" | "EntityManagerException"

const patterns: { [key in IcatError]: RegExp } = {
    "UnknownTable": /No information to determine type of (.+) in the FROM clause/,
    "BadRequest": /400 Bad Request: (.+)/,
    "EntityManagerException":
        /An exception occurred while creating a query in EntityManager:\s+Exception Description: (.+)/
}

// Functions for turning an ICAT error message into something more understandable
const handlers: { [key in IcatError]: (match: RegExpMatchArray) => string } = {
    UnknownTable: m =>
        "Entity type '" + m[1] + "' does not exist " +
        "(likely an ICAT 5 entity on a server running ICAT 4)",
    BadRequest: m => m[1],
    EntityManagerException: m => m[1]
};

// If we hit an unknown error, just show the whole thing
const defaultHandler: (match: RegExpMatchArray) => string = m => m[0];

export function simplifyIcatErrMessage(err: string): string {
    let message = err;
    let match;
    do {
        match = false;
        for (let k in patterns) {
            let m = message.match(patterns[k as IcatError]);
            if (m != null) {
                match = true;
                const handler = handlers[k as IcatError] || defaultHandler;
                message = handler(m);
            }
        }
    } while (match);
    return message;
}
