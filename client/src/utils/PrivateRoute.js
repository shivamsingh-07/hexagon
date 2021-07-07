import { useState, useEffect } from "react";
import { Route, Redirect } from "react-router-dom";
import axios from "axios";

function PrivateRoute({ component: Component, ...rest }) {
    const [auth, setAuth] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState({});

    useEffect(() => {
        (async () => {
            try {
                await axios.post("http://localhost:5000/auth", {}, { withCredentials: true }).then(response => {
                    if (response.status === 200 && response.data) {
                        setAuth(true);
                        setUser(response.data);
                    }
                });
            } catch (err) {
                console.log(err.response.data);
            }
            setLoading(false);
        })();
    }, []);

    if (!loading)
        return (
            <Route
                {...rest}
                render={props => {
                    if (auth) return <Component auth={user} />;
                    else return <Redirect to={{ pathname: "/auth/login", state: { from: props.location } }} />;
                }}
            />
        );
    return <></>;
}

export default PrivateRoute;
