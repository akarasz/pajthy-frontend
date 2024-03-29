import { useState, useEffect, useContext, useRef } from "react"
import { useParams } from "react-router-dom"

import { LogoAnimationContext } from "./App.jsx"
import { Button } from "./Commons.jsx"

import { getSession, startVote, stopVote, resetVote, kickParticipant } from "./api.js"
import { baseUrl } from "./api.js"

import median from "median"

const Share = () => {
  const { sessionId } = useParams()

  const url = window.location.origin + "/" + sessionId

  const handleClick = () => {
    navigator.clipboard
      .writeText(url)
  }

  return (
    <div className="share">
      <div className="link">{url}</div>
      <button onClick={handleClick}>Copy</button>
    </div>)
}

const ControlButton = ({ open, hasVotes }) => {
  const { sessionId } = useParams()

  if (open) {
    return <Button text="STAHP!" className="danger" onClick={() => stopVote(sessionId)} />
  }

  if (hasVotes) {
    return <Button text="Reset" onClick={() => resetVote(sessionId)} />
  }

  return <Button text="Begin voting!" onClick={() => startVote(sessionId)} />
}

const Result = ({ participants, votes, inProgress }) => {
  if (participants.length === 0) {
    return null
  }

  return (
    <table className="votes">
      <tbody>
        {participants.map((name, i) =>
          <ResultRow key={i} name={name} vote={votes[name]} inProgress={inProgress} />
        )}
      </tbody>
    </table>)
}

const Aggregate = ({votes}) => {
  const values = Object.values(votes)
    .map(item => parseInt(item))
    .filter(item => !isNaN(item))

  if (values.length === 0) {
    return null
  }

  const avg = values.reduce((a, b) => a + b) / values.length
  const med = median(values)

  return (
    <table className="aggregate">
      <tbody>
        <tr>
          <td>Average</td>
          <td>{avg.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Median</td>
          <td>{med.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  )
}

const ResultRow = ({ name, vote, inProgress }) => {
  const markVoted = inProgress && vote

  return (
    <tr className={markVoted ? "already-voted" : null}>
      <td>{name} <KickButton name={name} /></td>
      <td>{inProgress ? null : vote}</td>
    </tr>)
}

const KickButton = ({ name }) => {
  const { sessionId } = useParams()

  return <span className="kick" onClick={() => kickParticipant(sessionId, name)}>(X)</span>
}

const Control = () => {
  const [session, setSession] = useState(null)
  const { sessionId } = useParams()
  const ws = useRef(null)
  const { setAnimated } = useContext(LogoAnimationContext)

  useEffect(() => {
    getSession(sessionId, (res) => {
      setSession(res)
      setAnimated(res.Open)
    })
  }, [sessionId, setAnimated])

  useEffect(() => { // handle websocket creation
    ws.current = new WebSocket("wss://" + baseUrl + "/" + sessionId + "/control/ws")

    return () => {
      ws.current.close();
    }
  }, [sessionId, setAnimated])

  useEffect(() => { // handle websocket onevent
    if (!ws.current) {
      return
    }

    ws.current.onmessage = (e) => {
      const event = JSON.parse(e.data)

      switch(event.Kind) {
        case "enabled":
          setAnimated(true)
          break
        case "disabled":
        case "reset":
          setAnimated(false)
          break
        default:
          break
      }

      setSession(current => { return { ...current, ...event.Data } })
    }
  }, [sessionId, setAnimated])

  if (!session) {
    return null
  }

  const participants = session.Participants || []
  const votes = session.Votes || {}

  return (
    <div className="admin content">
      <Share />
      <ControlButton open={session.Open} hasVotes={(Object.keys(votes)).length > 0} />
      <Result participants={participants} votes={votes} inProgress={session.Open} />
      {session.Open ? null : <Aggregate votes={votes}/>}
    </div>)
}

export default Control
