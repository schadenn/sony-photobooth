import { SERVER_PORT } from "../../constants"

function ImageReview({ src, time, onDoneClick }) {
  const srcPrefix = `http://${window.location.hostname}:${SERVER_PORT}/photos/`

  return (
    <div>
      <img
        src={srcPrefix + src}
        class="scale"
        alt="review"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: "2337",
        }}
      />
      <button
        id="doneBtn"
        onClick={onDoneClick}
        style={{
          height: "150px",
          width: "300px",
          position: "fixed",
          right: 0,
          bottom: 0,
          zIndex: "2338",
          fontSize: "3vw",
        }}
      >
        Fertig ({Math.round(time / 1000)})
      </button>
    </div>
  )
}

export default ImageReview
