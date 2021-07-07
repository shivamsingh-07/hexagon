import { useState, useEffect } from "react";
import io from "socket.io-client";

function Dashboard({ auth }) {
    const space = io.connect("http://localhost:5000/matchmaking");
    const [name, setName] = useState(auth.username);
    const [email, setEmail] = useState(auth.email);
    const [verified, setVerified] = useState(auth.verified);
    const [steamID, setSteamID] = useState(auth.steamID64);
    const [thumbnail, setThumbnail] = useState(auth.thumbnail);
    const [profile, setProfile] = useState(auth.profileUrl);
    const [message, setMessage] = useState("");

    const search = () => {
        space.emit("searching", {name, steamID, thumbnail, profile});
        setMessage("searching");
        // document.getElementById("play").hidden = true;
        // document.getElementById("cancel").hidden = false;
    };

    const cancel = () => {
        space.emit("cancel", steamID);
        setMessage("cancel");
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
            <span>{message}</span>
            <br />
            <a href="http://localhost:5000/auth/steam" target="_blank" hidden={steamID !== null}>
                Connect Steam
            </a>
        </div>
    );
}

export default Dashboard;
