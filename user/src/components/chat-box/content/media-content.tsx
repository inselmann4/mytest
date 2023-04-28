import { useState } from "react";
import ImageBox from "src/components/conversation/image-box";

interface IProps {
  items: any;
  type: string;
  authUser: any;
}

function MediaContent({ items, type, authUser }: IProps) {
  const [activeImage, setActiveImage] = useState("");

//  console.log(items)

  return (
    <>
      <div className="form-row">
        {items?.map((item) => (
          <div className="col m-auto" key={item?._id}>
            <a
              target="_blank"
              role="button"
              className="popup-media"
              onClick={() => {
                if (type === "video") {
                  return;
                }
                setActiveImage(
                  `${item?.fileUrl}?userId=${authUser._id}&mediaId=${item._id}`
                );
		window.open(item?.thumbUrl, "_blank");
              }}
            >
              {/* type = photo */}
              {type === "photo" && (
                <img
                  alt="media_thumb"
                  className="img-fluid rounded"
                  src={item?.thumbUrl}
                />
              )}
              {/* type = video */}
              {type === "video" && (
                <video
                  controls
                  src={`${item?.fileUrl}?userId=${authUser._id}&mediaId=${item._id}`}
                  width="100%"
                />
              )}
            </a>
          </div>
        ))}
      </div>

      <ImageBox image={activeImage} />
    </>
  );
}

export default MediaContent;
