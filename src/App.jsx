import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom"

import Home from "./Home.jsx"
import Control from "./Control.jsx"
import Vote from "./Vote.jsx"

const App = () => (
  <div className="pajthy">
    <Router>
      <Header />
      <div className="countdown"></div>
      <Switch>
        <Route exact path="/">
          <Home />
        </Route>
        <Route path="/:sessionId/control">
          <Control />
        </Route>
        <Route path="/:sessionId">
          <Vote />
        </Route>
      </Switch>
    </Router>
  </div>)

const Header = () => {
  return (
    <header>
      <div className="logo"></div>
      <h1><Link to="/">Pajthy</Link></h1>
    </header>)
}

export default App