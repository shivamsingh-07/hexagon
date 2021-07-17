const router = require("express").Router();
const zip = require("jszip")();
const Match = require("../models/Match");
const match = require("../json/match.json");
const Room = require("../models/Room");
const Server = require("../models/Server");
const AWS = require("aws-sdk");

const s3 = new AWS.S3({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN
    }
});

router.get("/:match_id", (req, res) => {
    const matchID = req.params.match_id == null ? null : req.params.match_id;

    Match.findOne({ matchID }, { _id: 0, __v: 0 }, (err, data) => {
        if (err) throw err;
        if (!data) return res.status(400).json({ message: "Invalid match ID" });

        res.send(data);
    });
});

router.get("/:match_id/config", async (req, res) => {
    const matchID = req.params.match_id == null ? null : req.params.match_id;
    const matchValues = await Match.findOne({ matchID }, { _id: 0, __v: 0 });

    if (!matchValues) return res.status(404).send({ message: "Match not found!" });

    Room.findOne({ roomID: matchValues.roomID }, { _id: 0, __v: 0 }, (err, data) => {
        if (err) throw err;
        if (!data) res.status(400).json({ message: "Invalid room ID" });

        const team_1 = {};
        const team_2 = {};

        data.team_1.forEach(player => (team_1[player.steamID] = player.name));
        data.team_2.forEach(player => (team_2[player.steamID] = player.name));

        match.matchid = `${matchID}`;
        match.players_per_team = Math.floor((data.team_1.length + data.team_2.length) / 2);
        match.maplist = data.map;
        match.team1.name = "Team_" + data.captain_1.name;
        match.team1.players = team_1;
        match.team2.name = "Team_" + data.captain_2.name;
        match.team2.players = team_2;
        match.cvars.get5_web_api_url = `${process.env.SERVER_CONFIG_URL}`;

        res.status(200).json(match);
    });
});

router.post("/:match_id/map/:map_number/start", async (req, res) => {
    try {
        const matchID = req.params.match_id == null ? null : req.params.match_id;
        const apiKey = req.body.key == null ? null : req.body.key;
        const mapName = req.body.mapname == null ? null : req.body.mapname;
        const matchValues = await Match.findOne({ matchID, apiKey }, { _id: 0, __v: 0 });

        if (!matchValues) return res.status(404).send({ message: "Match not found!" });
        if (matchValues.endedAt != null && matchValues.cancelled != 0) throw "Match is already finalized.";

        await Match.findOneAndUpdate(
            { matchID, apiKey },
            {
                map: mapName,
                startedAt: new Date().toUTCString()
            }
        );
        res.status(200).send({ message: "Success" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.toString() });
    }
});

router.post("/:match_id/map/:map_number/update", async (req, res) => {
    try {
        const matchID = req.params.match_id == null ? null : req.params.match_id;
        const apiKey = req.body.key == null ? null : req.body.key;
        const team1Score = req.body.team1score;
        const team2Score = req.body.team2score;
        const matchValues = await Match.findOne({ matchID, apiKey }, { _id: 0, __v: 0 });

        if (!matchValues) return res.status(404).send({ message: "Match not found!" });
        if (matchValues.endedAt != null && matchValues.cancelled != 0) throw "Match is already finalized.";

        await Match.findOneAndUpdate(
            { matchID, apiKey },
            {
                team_1_score: team1Score,
                team_2_score: team2Score
            }
        );
        res.status(200).send({ message: "Success" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.toString() });
    }
});

router.post("/:match_id/map/:map_number/finish", async (req, res) => {
    try {
        const matchID = req.params.match_id == null ? null : req.params.match_id;
        const apiKey = req.body.key == null ? null : req.body.key;
        // const winner = req.body.winner == null ? null : req.body.winner;
        const team1Score = req.body.team1score;
        const team2Score = req.body.team2score;
        const matchValues = await Match.findOne({ matchID, apiKey }, { _id: 0, __v: 0 });

        if (!matchValues) return res.status(404).send({ message: "Match not found!" });
        if (matchValues.endedAt != null && matchValues.cancelled != 0) throw "Match is already finalized.";

        await Match.findOneAndUpdate(
            { matchID, apiKey },
            {
                team_1_score: team1Score,
                team_2_score: team2Score
            }
        );
        res.status(200).send({ message: "Success" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.toString() });
    }
});

router.post("/:match_id/finish", async (req, res) => {
    try {
        const matchID = req.params.match_id == null ? null : req.params.match_id;
        const apiKey = req.body.key == null ? null : req.body.key;
        const winner = req.body.winner == null ? null : req.body.winner;
        const forfeit = req.body.forfeit == null ? 0 : req.body.forfeit;
        let cancelled = 0;

        const matchValues = await Match.findOne({ matchID, apiKey }, { _id: 0, __v: 0 });

        if (!matchValues) return res.status(404).send({ message: "Match not found!" });
        if (matchValues.endedAt != null && matchValues.cancelled != 0) throw "Match is already finalized.";

        if (winner === "none") {
            cancelled = 1;
            forfeit = 0;
        }

        await Match.findOneAndUpdate(
            { matchID, apiKey },
            {
                forfeit,
                cancelled,
                winner: winner.slice(0, 4) + "_" + winner.slice(4),
                endedAt: new Date().toUTCString()
            }
        );

        Room.findOne({ roomID: matchValues.roomID }, async (err, data) => {
            if (err) throw err;

            await Server.findOneAndUpdate({ credential: data.serverIP }, { availability: true });
            res.status(200).send({ message: "Success" });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.toString() });
    }
});

router.post("/:match_id/map/:map_number/player/:steam_id/update", async (req, res) => {
    try {
        const matchID = req.params.match_id == null ? null : parseInt(req.params.match_id);
        const apiKey = req.body.key == null ? null : req.body.key;
        const steamId = req.params.steam_id == null ? null : req.params.steam_id;
        const playerTeam = req.body.team == null ? null : req.body.team;
        const playerName = req.body.name == null ? null : req.body.name;
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

        const matchValues = await Match.findOne({ matchID, apiKey }, { _id: 0, __v: 0 });

        if (!matchValues) return res.status(404).send({ message: "Match not found!" });
        if (matchValues.endedAt != null && matchValues.cancelled != 0) throw "Match is already finalized.";

        Match.findOne({ matchID, apiKey }, (err, data) => {
            if (err) throw err;

            data[playerTeam.slice(0, 4) + "_" + playerTeam.slice(4)].set(steamId, {
                playerName,
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

            data.save().then(() => res.status(200).send({ message: "Success" }));
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.toString() });
    }
});

router.post("/:match_id/map/:map_number/demo", async (req, res) => {
    try {
        const matchID = req.params.match_id == null ? null : req.params.match_id;
        const apiKey = req.body.key == null ? null : req.body.key;
        const demoFile = req.body.demoFile == null ? null : req.body.demoFile;
        const matchValues = await Match.findOne({ matchID, apiKey }, { _id: 0, __v: 0 });

        if (!matchValues) return res.status(404).send({ message: "Match not found!" });
        if (matchValues.endedAt != null && matchValues.cancelled != 0) throw "Match is already finalized.";

        await Match.findOneAndUpdate(
            { matchID, apiKey },
            {
                demoFile
            }
        );
        res.status(200).send({ message: "Success" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.toString() });
    }
});

router.put("/:match_id/map/:map_number/demo/upload/:api_key", async (req, res) => {
    try {
        const matchID = req.params.match_id == null ? null : req.params.match_id;
        const apiKey = req.params.api_key;
        const matchValues = await Match.findOne({ matchID, apiKey }, { _id: 0, __v: 0 });

        if (!matchValues) return res.status(404).send({ message: "Match not found!" });
        if (matchValues.endedAt != null && matchValues.cancelled != 0) throw "Match is already finalized.";

        const endTimeMs = new Date(matchValues.endedAt);
        const timeDifference = Math.abs(new Date() - endTimeMs);
        const minuteDifference = Math.floor(timeDifference / 1000 / 60);
        if (minuteDifference > 10) return res.status(500).json({ message: "Demo can no longer be uploaded." });

        zip.file(matchValues.roomID + "-" + matchValues.demoFile.split("-")[1], req.body, { binary: true });
        zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }).then(buffer =>
            s3.upload(
                {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: "demos/" + matchValues.roomID + ".zip",
                    Body: buffer,
                    ACL: "public-read"
                },
                async (err, data) => {
                    if (err) throw err;

                    await Match.findOneAndUpdate(
                        { matchID, apiKey },
                        {
                            demoFile: data.Location
                        }
                    );

                    res.status(200).send({ message: "Success" });
                }
            )
        );
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.toString() });
    }
});

module.exports = router;
