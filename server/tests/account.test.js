const check = require("../utils/checkAccount");

describe("Account Check", () => {
    before(() => {
        require("dotenv").config();
    });

    it("should be banned", done => {
        check("76561198398983515").then(res => res === 1 && done());
    });

    it("should be private", done => {
        check("76561199014297783").then(res => res === 2 && done());
    });

    it("should have less playtime", done => {
        check("76561199179954772").then(res => res === 3 && done());
    });

    it("should be a valid account", done => {
        check("76561198344056201").then(res => res === 0 && done());
    });
});

/*
Error Codes:

0 - Valid Account
1 - Banned Account
2 - Private Account
3 - CS:GO Playtime < 100 hrs
*/
