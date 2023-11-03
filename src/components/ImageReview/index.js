import { useEffect, useState } from "react"
import { SERVER_PORT } from "../../constants"

function ImageReview({ src, time, onDoneClick }) {
  const [image, setImage] = useState()
  const srcPrefix = `http://${window.location.hostname}:${SERVER_PORT}/photos/`
  console.log("REVIEW", srcPrefix + src)
  useEffect(()=>{
    fetch(srcPrefix + src).then((res)=> res.blob()).then(blob => {
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      reader.onloadend = () => {
        setImage(reader.result)
      }
    })
  },  [])
  return (
    <div>
      <img
      key={time}
        src={image}
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
