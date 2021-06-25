const router = require("express").Router();
const JSZip = require("jszip");
const Match = require("../models/Match");
const match = require("../json/match.json");
const Room = require("../models/Room");
const Server = require("../models/Server");

router.get("/:match_id", (req, res) => {
    const matchID = req.params.match_id == null ? null : req.params.match_id;

    Match.findOne({ matchID }, { _id: 0, __v: 0 }, (err, data) => {
        if (err) throw err;
        if (!data) return res.status(400).json({ message: "Invalid match ID" });

        res.status(200).send(data);
    });
});

router.get("/:match_id/config", (req, res) => {
    const matchID = req.params.match_id == null ? null : req.params.match_id;

    Room.findOne({ roomID: matchID }, { _id: 0, __v: 0 }, (err, data) => {
        if (err) throw err;
        if (!data) res.status(400).json({ message: "Invalid match ID" });

        match.matchid = data.roomID;
        match.maplist = data.map;
        match.team1.players = data.team_1;
        match.team2.players = data.team_2;
        match.cvars.get5_web_api_url = `${process.env.SERVER_CONFIG_URL}`;

        res.status(200).send(match);
    });
});

router.post("/:match_id/map/:map_number/start", async (req, res) => {
    try {
        const matchID = req.params.match_id == null ? null : req.params.match_id;
        const mapName = req.body.mapname == null ? null : req.body.mapname;
        let matchFinalized = true;
        const matchValues = await Match.findOne({ matchID }, { _id: 0, __v: 0 });

        if (!matchValues) return res.status(404).send({ message: "Match not found!" });
        if (matchValues.endedAt == null && matchValues.cancelled == 0) matchFinalized = false;

        check_api_key(matchValues.apiKey, req.body.key, matchFinalized);

        await Match.findOneAndUpdate(
            { matchID },
            {
                map: mapName,
                startedAt: new Date().toISOString().slice(0, 19).replace("T", " ")
            }
        );
        res.status(200).send({ message: "Success" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.toString() });
    }
});

router.post("/:match_id/map/:map_number/update", async (req, res) => {
    try {
        const matchID = req.params.match_id == null ? null : req.params.match_id;
        const team1Score = req.body.team1score;
        const team2Score = req.body.team2score;
        let matchFinalized = true;
        const matchValues = await Match.findOne({ matchID }, { _id: 0, __v: 0 });

        if (!matchValues) return res.status(404).send({ message: "Match not found!" });
        if (matchValues.endedAt == null && matchValues.cancelled == 0) matchFinalized = false;

        check_api_key(matchValues.apiKey, req.body.key, matchFinalized);

        await Match.findOneAndUpdate(
            { matchID },
            {
                team_1_score: team1Score,
                team_2_score: team2Score
            }
        );
        res.status(200).send({ message: "Success" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.toString() });
    }
});

router.post("/:match_id/map/:map_number/finish", async (req, res) => {
    try {
        const matchID = req.params.match_id == null ? null : req.params.match_id;
        const winner = req.body.winner == null ? null : req.body.winner;
        let team1Score, team2Score, teamIdWinner;
        let matchFinalized = true;
        const matchValues = await Match.findOne({ matchID }, { _id: 0, __v: 0 });

        if (!matchValues) return res.status(404).send({ message: "Match not found!" });
        if (matchValues.endedAt == null && matchValues.cancelled == 0) matchFinalized = false;

        check_api_key(matchValues.apiKey, req.body.key, matchFinalized);

        if (winner == "team1") {
            teamIdWinner = "team_1";
            team1Score = matchValues.team_1_score + 1;
        } else if (winner == "team2") {
            teamIdWinner = "team_2";
            team2Score = matchValues.team_2_score + 1;
        }

        await Match.findOneAndUpdate(
            { matchID },
            {
                team_1_score: team1Score,
                team_2_score: team2Score,
                winner: teamIdWinner,
                endedAt: new Date().toISOString().slice(0, 19).replace("T", " ")
            }
        );
        res.status(200).send({ message: "Success" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.toString() });
    }
});

router.post("/:match_id/finish", async (req, res) => {
    try {
        const matchID = req.params.match_id == null ? null : req.params.match_id;
        const winner = req.body.winner == null ? null : req.body.winner;
        const forfeit = req.body.forfeit == null ? 0 : req.body.forfeit;
        let cancelled = 0;
        let team1Score = req.body.team1score;
        let team2Score = req.body.team2score;
        let teamIdWinner = null,
            matchFinalized = true;
        const matchValues = await Match.findOne({ matchID }, { _id: 0, __v: 0 });

        if (!matchValues) return res.status(404).send({ message: "Match not found!" });
        if (matchValues.endedAt == null && matchValues.cancelled == 0) matchFinalized = false;

        check_api_key(matchValues.apiKey, req.body.key, matchFinalized);

        if (winner === "team1") teamIdWinner = "team_1";
        else if (winner === "team2") teamIdWinner = "team_2";
        else if (winner === "none") {
            teamIdWinner = null;
            cancelled = 1;
            forfeit = 0;
        }

        if (forfeit === 1) {
            if (winner === "team1") {
                team1Score = 1;
                team2Score = 0;
            } else if (winner === "team2") {
                team1Score = 0;
                team2Score = 1;
            } else if (winner === "none") {
                team1Score = 0;
                team2Score = 0;
            }
        }

        await Match.findOneAndUpdate(
            { matchID },
            {
                forfeit: forfeit,
                cancelled: cancelled,
                winner: teamIdWinner,
                team_1_score: team1Score,
                team_2_score: team2Score,
                endedAt: new Date().toISOString().slice(0, 19).replace("T", " ")
            }
        );

        // Modify server availability
        Room.findOne({ roomID: matchID }, (err, data) => {
            if (err) throw err;

            Server.findOne({ credential: data.serverIP }, (err, server) => {
                if (err) throw err;

                server.availability = true;
                server.save().then(() => res.status(200).send({ message: "Success" }));
            });
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.toString() });
    }
});

router.post("/:match_id/map/:map_number/player/:steam_id/update", async (req, res) => {
    try {
        const matchID = req.params.match_id == null ? null : parseInt(req.params.match_id);
        const steamId = req.params.steam_id == null ? null : req.params.steam_id;
        const playerTeam = req.body.team == null ? null : req.body.team;
        const playerKills = req.body.kills == null ? null : parseInt(req.body.kills);
        const playerAssists = req.body.assists == null ? null : parseInt(req.body.assists);
        const playerDeaths = req.body.deaths == null ? null : parseInt(req.body.deaths);
        const playerFBA = req.body.flashbang_assists == null ? null : parseInt(req.body.flashbang_assists);
        const playerTKs = req.body.teamkills == null ? null : parseInt(req.body.teamkills);
        const playerSuicide = req.body.suicides == null ? null : parseInt(req.body.suicides);
        const playerDamage = req.body.damage == null ? null : parseInt(req.body.damage);
        const playerHSK = req.body.headshot_kills == null ? null : parseInt(req.body.headshot_kills);
        const playerRoundsPlayed = req.body.roundsplayed == null ? null : parseInt(req.body.roundsplayed);
        const playerBombsPlanted = req.body.bomb_plants == null ? null : parseInt(req.body.bomb_plants);
        const playerBombsDefused = req.body.bomb_defuses == null ? null : parseInt(req.body.bomb_defuses);
        const player1k = req.body["1kill_rounds"] == null ? null : parseInt(req.body["1kill_rounds"]);
        const player2k = req.body["2kill_rounds"] == null ? null : parseInt(req.body["2kill_rounds"]);
        const player3k = req.body["3kill_rounds"] == null ? null : parseInt(req.body["3kill_rounds"]);
        const player4k = req.body["4kill_rounds"] == null ? null : parseInt(req.body["4kill_rounds"]);
        const player5k = req.body["5kill_rounds"] == null ? null : parseInt(req.body["5kill_rounds"]);
        const player1v1 = req.body.v1 == null ? null : parseInt(req.body.v1);
        const player1v2 = req.body.v2 == null ? null : parseInt(req.body.v2);
        const player1v3 = req.body.v3 == null ? null : parseInt(req.body.v3);
        const player1v4 = req.body.v4 == null ? null : parseInt(req.body.v4);
        const player1v5 = req.body.v5 == null ? null : parseInt(req.body.v5);
        const playerFirstKillT = req.body.firstkill_t == null ? null : parseInt(req.body.firstkill_t);
        const playerFirstKillCT = req.body.firstkill_ct == null ? null : parseInt(req.body.firstkill_ct);
        const playerFirstDeathCT = req.body.firstdeath_ct == null ? null : parseInt(req.body.firstdeath_ct);
        const playerFirstDeathT = req.body.firstdeath_t == null ? null : parseInt(req.body.firstdeath_t);
        const playerKast = req.body.kast == null ? null : parseInt(req.body.kast);
        const playerContrib = req.body.contribution_score == null ? null : parseInt(req.body.contribution_score);
        const playerMvp = req.body.mvp == null ? null : parseInt(req.body.mvp);

        let matchFinalized = true;

        const matchValues = await Match.findOne({ matchID }, { _id: 0, __v: 0 });

        if (!matchValues) return res.status(404).send({ message: "Match not found!" });
        if (matchValues.endedAt == null && matchValues.cancelled == 0) matchFinalized = false;

        check_api_key(matchValues.apiKey, req.body.key, matchFinalized);

        if (playerTeam === "team1") playerTeamId = "team_1";
        else if (playerTeam === "team2") playerTeamId = "team_2";

        await Match.findOne({ matchID }, (err, data) => {
            if (err) throw err;

            data.playerTeamId.set(steamId, {
                playerKills,
                playerDeaths,
                playerRoundsPlayed,
                playerAssists,
                playerFBA,
                playerTKs,
                playerSuicide,
                playerHSK,
                playerDamage,
                playerBombsPlanted,
                playerBombsDefused,
                player1v1,
                player1v2,
                player1v3,
                player1v4,
                player1v5,
                player1k,
                player2k,
                player3k,
                player4k,
                player5k,
                playerFirstDeathCT,
                playerFirstDeathT,
                playerFirstKillCT,
                playerFirstKillT,
                playerKast,
                playerContrib,
                playerMvp
            });
            data.save();
        });

        res.status(200).send({ message: "Success" });
    } catch (err) {
        res.status(500).json({ message: err.toString() });
    }
});

router.post("/:match_id/vetoUpdate", (req, res) => {
    try {
        // const matchID = req.params.match_id == null ? null : req.params.match_id;
        // const teamString = req.body.teamString == null ? null : req.body.teamString;
        // const mapBan = req.body.map == null ? null : req.body.map;
        // const pickOrBan = req.body.pick_or_veto == null ? null : req.body.pick_or_veto;
        // let matchFinalized = true;
        // const matchValues = await Match.findOne({ matchID }, { _id: 0, __v: 0 });

        // if (!matchValues) return res.status(404).send({ message: "Match not found!" });
        // if (matchValues.endedAt == null && matchValues.cancelled == 0) matchFinalized = false;

        // check_api_key(matchValues.apiKey, req.body.key, matchFinalized);

        // This route is not required
        console.log("Veto:", req.body);
        res.status(200).send({ message: "Success" });
    } catch (err) {
        res.status(500).json({ message: err.toString() });
    }
});

router.post("/:match_id/map/:map_number/demo", async (req, res) => {
    try {
        const matchID = req.params.match_id == null ? null : req.params.match_id;
        const demoFile = req.body.demoFile == null ? null : req.body.demoFile;
        const matchValues = await Match.findOne({ matchID }, { _id: 0, __v: 0 });

        if (!matchValues) return res.status(404).send({ message: "Match not found!" });
        if (matchValues.endedAt == null && matchValues.cancelled == 0) matchFinalized = false;

        check_api_key(matchValues.apiKey, req.body.key, matchFinalized);

        await Match.findOneAndUpdate(
            { matchID },
            {
                demoFile: demoFile.split("/").pop()
            }
        );
        res.status(200).send({ message: "Success" });
    } catch (err) {
        res.status(500).json({ message: err.toString() });
    }
});

router.put("/:match_id/map/:map_number/demo/upload/:api_key", async (req, res) => {
    try {
        const matchID = req.params.match_id;
        const apiKey = req.params.api_key;
        const zip = new JSZip();
        const matchValues = await Match.findOne({ matchID }, { _id: 0, __v: 0 });

        if (!matchValues) return res.status(404).send({ message: "Match not found!" });
        if (matchValues.endedAt == null && matchValues.cancelled == 0) matchFinalized = false;

        check_api_key(matchValues.apiKey, apiKey, matchFinalized);

        const endTimeMs = new Date(matchValues.endedAt);
        const timeDifference = Math.abs(new Date() - endTimeMs);
        const minuteDifference = Math.floor(timeDifference / 1000 / 60);
        if (minuteDifference > 8) return res.status(500).json({ message: "Demo can no longer be uploaded." });

        // TODO: Upload demo to AWS S3 bucket
        zip.file(matchValues.demoFile, req.body, { binary: true });
        zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }).then(buf => {
            fs.writeFile("public/" + matchValues.demoFile, buf, "binary", err => {
                if (err) throw err;
                res.status(200).send({ message: "Success!" });
            });
        });
    } catch (err) {
        res.status(500).json({ message: err.toString() });
    }
});

const check_api_key = (match_api_key, given_api_key, match_finished) => {
    if (match_api_key.localeCompare(given_api_key) !== 0) throw "Not a correct API Key.";
    if (match_finished == true) throw "Match is already finalized.";
};

module.exports = router;