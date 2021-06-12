const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../server");

chai.should();
chai.use(chaiHttp);

describe("GET /", () => {
    it("should print `This is the API of Hexagon.`", done => {
        chai.request(server)
            .get("/")
            .end((err, res) => {
                res.should.have.status(200);
                res.text.should.equal("This is the API of Hexagon.");
                done();
            });
    });
});
