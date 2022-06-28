import { useState, useEffect, useRef, useCallback } from "react"

import "./App.css"
import ImageReview from "./components/ImageReview"
import ShotsReview from "./components/ShotsReview"
import { SHOTTIME, REVIEWTIME, SERVER_PORT } from "./constants"
import { socket } from "./components/WebSocket"

function App() {
  const [photoSrc, setPhotoSrc] = useState("")
  const [shots, setShots] = useState([])
  const [shotTimer, setShotTimer] = useState(SHOTTIME)
  const [reviewTimer, setReviewTimer] = useState(REVIEWTIME)
  const [takingPhoto, setTakingPhoto] = useState(false)
  const [manualReview, setManualReview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [noReview, setNoReview] = useState(false)
  const reviewInterval = useRef([])
  const shotInterval = useRef([])

  const fetchPhotos = () => {
    fetch(`http://localhost:${SERVER_PORT}/getPhotos`)
      .then((res) => res.json())
      .then((res) => setShots(res.files))
      .catch((e) => console.error("Failed to fetch", e))
  }

  const startRec = () => {
    fetch(`http://localhost:${SERVER_PORT}/startMovieRec`)
      .then((res) => console.log(res) || res.json())
      .then((res) => console.log(res))
      .catch((e) => console.error("Failed to fetch", e))
  }

  const stopRec = () => {
    fetch(`http://localhost:${SERVER_PORT}/stopMovieRec`)
      .then((res) => console.log(res) || res.json())
      .then((res) => console.log(res))
      .catch((e) => console.error("Failed to fetch", e))
  }

  const getEvent = () => {
    fetch(`http://localhost:${SERVER_PORT}/getEvent`)
      .then((res) => console.log(res) || res.json())
      .then((res) => console.log(res))
      .catch((e) => console.error("Failed to fetch", e))
  }

  const takePhoto = useCallback(() => {
    setTimeout(() => setLoading(true), 900)
    fetch(`http://localhost:${SERVER_PORT}/takePhoto`)
      .then((res) => res.json())
      .then((res) => {
        setPhotoSrc(res.file)
        setTakingPhoto(false)
        setTimeout(() => setLoading(false), 200)
        fetchPhotos()
      })
      .catch((e) => console.error("Failed to fetch", e))
  }, [])

  useEffect(() => {
    socket.on("start-timer", ({ time }) => {
      setShotTimer(time * 1000)
      shotInterval.current.push("websocket_controlled")
      setNoReview(true)
    })
    socket.on(
      "time-left",
      ({ time }) => console.log("time-left", time) || setShotTimer(time * 1000)
    )
    socket.on("end-timer", () => {
      setShotTimer(0)
    })
    fetchPhotos()
  }, [])

  useEffect(() => {
    if (photoSrc) {
      if (noReview) {
        setNoReview(false)
      } else {
        reviewInterval.current.push(
          setInterval(() => setReviewTimer((oldValue) => oldValue - 10), 10)
        )
      }
    }
  }, [photoSrc])

  useEffect(() => {
    if (!reviewTimer) {
      reviewInterval.current.forEach((interval) => clearInterval(interval))
      reviewInterval.current = []
      setReviewTimer(REVIEWTIME)
      window.location.href = window.location.href
    }
  }, [reviewTimer])

  useEffect(() => {
    if (shotTimer < 2000) setTakingPhoto(true)
    if (!(shotTimer % 1000) && shotTimer)
      fetch("http://localhost:3000/triggerFocus")
    if (shotTimer === 0) {
      takePhoto()
      shotInterval.current
        .filter((id) => id !== "websocket_controlled")
        .forEach((interval) => clearInterval(interval))
      shotInterval.current = []
      setShotTimer(SHOTTIME)
    }
  }, [shotTimer, takePhoto])

  return (
    <div
      className="App"
      style={{
        position: "absolute",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        left: 0,
        top: 0,
      }}
    >
      {photoSrc && reviewTimer && reviewInterval.current.length ? (
        <ImageReview
          src={photoSrc}
          time={reviewTimer}
          onDoneClick={() => {
            setReviewTimer(0)
            window.location.href = window.location.href
          }}
        />
      ) : null}
      {shots.length ? (
        <ShotsReview
          files={shots}
          isReviewing={manualReview}
          onOpenClick={() => setManualReview(true)}
          onDoneClick={() => setManualReview(false)}
        />
      ) : null}
      {!manualReview ? (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={(ev) => {
            if (
              !["doneBtn", "openManualPreview", "startRec", "stopRec"].includes(
                ev.target.id
              )
            ) {
              shotInterval.current.push(
                setInterval(() => setShotTimer((oldValue) => oldValue - 10), 10)
              )
            }
          }}
        >
          {false && (
            <div
              style={{
                zIndex: "1337",
                width: "60%",
                height: "150px",
                backgroundColor: "rgba(0,0,0,0.3)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <button id="startRec" onClick={startRec}>
                Start Rec
              </button>
              <button id="stopRec" onClick={stopRec}>
                Stop Rec
              </button>
              <button id="stopRec" onClick={getEvent}>
                Get Event
              </button>
            </div>
          )}
          <div
            style={{
              zIndex: "1337",
              width: "100%",
              height: "150px",
              backgroundColor: "rgba(0,0,0,0.3)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <p style={{ fontSize: "5vw" }}>
              {(loading && "Foto kommt sofort") ||
                (takingPhoto && "Lächeln bitte :)") ||
                (!shotInterval.current.length &&
                  "👆 Antippen für ein Foto 👆") ||
                Math.round(shotTimer / 1000)}
            </p>
          </div>
          {!loading && (
            <img
              class="videoStream"
              src={`http://localhost:${SERVER_PORT}/startViewFinder`}
              alt="video stream"
              style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                left: 0,
                top: 0,
                zIndex: "0",
              }}
            />
          )}
        </div>
      ) : null}
    </div>
  )
}

export default App
