import { useState, useEffect } from "react";
import { useHistory, useParams } from "react-router-dom";
import axios from "axios";

function Match() {
    // const space = io.connect("http://localhost:5000/room");
    const [match, setMatch] = useState({});
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const { matchID } = useParams();
    const history = useHistory();

    useEffect(
        () =>
            (async () => {
                try {
                    await axios.get("http://localhost:5000/match/" + matchID, { withCredentials: true }).then(response => {
                        setMatch(response.data);
                        setLoading(false);

                        if (response.data.map.length <= 1) return history.push("/dashboard");

                        // let team;
                        // if(response.data.team_1.some((user, index, array) => {
                        //     return user.steamID == auth.steamID64;
                        // })) team = "Team_" + response.data.captain_1.name;
                        // else team = "Team_" + response.data.captain_2.name;
                    });
                } catch (err) {
                    setMessage(err.response.data.error);
                    // history.push("/");
                }
            })(),
        []
    );

    if (!loading)
        return (
            <div>
                <h1>Match #{matchID}</h1>
                <p>
                    {JSON.stringify(match)}
                </p>
            </div>
        );
    else return <div className="spinner-border" id="loader" role="status"></div>;
}

export default Match;
