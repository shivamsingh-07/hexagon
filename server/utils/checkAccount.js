require("dotenv").config();
const SteamAPI = require("steamapi");
const steam = new SteamAPI(process.env.STEAM_AUTH_KEY);

module.exports = id =>
    new Promise((resolve, reject) =>
        steam
            .getUserBans(id)
            .then(user => {
                if (!user.vacBanned && !user.communityBanned && user.gameBans == 0) {
                    steam.getUserSummary(id).then(summary => {
                        if (summary.visibilityState >= 3) {
                            steam
                                .getUserOwnedGames(id)
                                .then(games => {
                                    const csgo = games.filter(game => game.appID == 730)[0];
                                    if (Math.round(csgo.playTime / 60) >= 100) resolve(0);
                                    else resolve(3);
                                })
                                .catch(err => reject(err.message));
                        } else resolve(2);
                    });
                } else resolve(1);
            })
            .catch(err => reject(err.message))
    );
