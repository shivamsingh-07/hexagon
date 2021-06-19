const mailer = require("../utils/mailer");

describe("Email Service", () => {
    it("should sent an email", done => {
        mailer("crewthegroom@gmail.com", "Test Mail", "Hi, Abstergo \n\nNice to meet you. \n\nRegards \nHexagon Team")
            .then(() => done())
            .catch(err => console.log(err));
    });
});
