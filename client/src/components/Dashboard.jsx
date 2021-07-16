import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";

function Dashboard({ auth }) {
    const space = io.connect(`${process.env.REACT_APP_API_URL}/matchmaking`);
    const [name, setName] = useState(auth.username);
    const [email, setEmail] = useState(auth.email);
    const [verified, setVerified] = useState(auth.verified);
    const [steamID, setSteamID] = useState(auth.steamID64);
    const [thumbnail, setThumbnail] = useState(auth.thumbnail);
    const [profile, setProfile] = useState(auth.profileUrl);
    const [message, setMessage] = useState("");
    const history = useHistory();

    const logout = async e => {
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/auth/logout`, {}, { withCredentials: true }).then(response => {
                setMessage(response.data.message);
                history.push("/");
            });
        } catch (err) {
            setMessage(err.response.data.error);
        }
    };

    const search = () => {
        if (!steamID) return setMessage("No steam account found!");
        space.emit("searching", { name, steamID, thumbnail, profile });
        setMessage("searching");
        // document.getElementById("play").hidden = true;
        // document.getElementById("cancel").hidden = false;
    };

    const cancel = () => {
        space.emit("cancel", steamID);
        setMessage("");
        // document.getElementById("play").hidden = false;
    };

    const accept = () => {
        space.emit("accepted", steamID);
        setMessage("accepted");
        // document.getElementById("accept").hidden = true;
    };

    space.on("matchFound", room => {
        setMessage("Join: " + room);
    });

    space.on("matchNotAccepted", () => {
        setMessage("Match was found but some player(s) failed to accept...");
        // document.getElementById("accept").hidden = true;
        // document.getElementById("play").hidden = false;
    });

    return (
        <div>
            <h1>Welcome {name}</h1>
            <br />
            <img src={thumbnail} alt="" />
            <br />
            <br />
            <span>Email: {email}</span>
            <br />
            <span>Verified: {verified.toString()}</span>
            <br />
            <span>SteamID: {steamID}</span>
            <br />
            <p>
                Profile:
                <a href={profile} target="_blank">
                    {profile}
                </a>
            </p>
            <br />
            <br />
            <button onClick={() => search()}>Play</button>
            <br />
            <button onClick={() => cancel()}>Cancel</button>
            <br />
            <span>{message}</span>
            <button onClick={() => logout()}>Logout</button>
            <br />
            <br />
            <a href={`${process.env.REACT_APP_API_URL}/auth/steam`} target="_blank" hidden={steamID !== null}>
                Connect Steam
            </a>
        </div>
    );
}

export default Dashboard;
