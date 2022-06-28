import { useState } from "react"
import Gallery from "react-grid-gallery"
import Carousel from "react-gallery-carousel"
import "react-gallery-carousel/dist/index.css"
import { SERVER_PORT } from "../../constants"

function ShotsReview({ files, onDoneClick: onDone, isReviewing, onOpenClick }) {
  const [detailed, setDetailed] = useState(null)

  const onDoneClick = () => {
    setDetailed(null)
    onDone()
  }
  const srcPrefix = `http://${window.location.hostname}:${SERVER_PORT}/photos/`
  const images = files
    .map((src) => srcPrefix + src)
    .map((src) => ({
      src,
      thumbnail: src,
      thumbnailWidth: 280,
      thumbnailHeight: 174,
    }))

  return (
    <>
      {isReviewing ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            zIndex: "2337",
          }}
        >
          {detailed && (
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                top: "0",
                left: "0",
              }}
            >
              <Carousel
                images={images}
                index={detailed - 1}
                canAutoPlay={false}
                isMaximized
                shouldMinimizeOnSwipeDown={true}
                hasSizeButton={false}
                onSwipeEndDown={() => {
                  setDetailed(null)
                }}
              />
            </div>
          )}
          <div style={{ width: "100vw" }}>
            <Gallery
              images={images.reverse()}
              enableImageSelection={false}
              onClickThumbnail={(index) => setDetailed(index + 1)}
            />
          </div>
          <button
            id="doneBtn"
            onClick={onDoneClick}
            style={{
              height: "150px",
              width: "250px",
              position: "fixed",
              right: 0,
              bottom: 0,
              zIndex: "2338",
              fontSize: "3vw",
              cursor: "pointer",
            }}
          >
            Fertig
          </button>
        </div>
      ) : (
        <div
          className="flip"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "200px",
            height: "200px",
            zIndex: "2337",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "2vw",
            backgroundImage: `url(${srcPrefix + files.slice(-1)[0]})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            cursor: "pointer",
          }}
          onClick={onOpenClick}
          id="openManualPreview"
        >
          <p className="flip">Gallerie</p>
        </div>
      )}
    </>
  )
}

export default ShotsReview
