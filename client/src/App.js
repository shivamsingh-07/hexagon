import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import "./App.css";
import PrivateRoute from "./utils/PrivateRoute";
import Home from "./components/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import Room from "./components/Room";
import Match from "./components/Match";

function App() {
    return (
        <Router>
            <Switch>
                <Route path="/" exact component={Home} />
                <Route path="/auth/login" exact component={Login} />
                <Route path="/auth/signup" exact component={Signup} />
                <PrivateRoute path="/dashboard" exact component={Dashboard} />
                <PrivateRoute path="/room/:roomID" exact component={Room} />
                <Route path="/match/:matchID" exact component={Match} />
            </Switch>
        </Router>
    );
}

export default App;
