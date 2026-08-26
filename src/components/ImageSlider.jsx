import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Default_image from "../assets/images/default_image.png";
import { formatImageUrl } from "../global/helper";

const ImageSlider = ({
  images,
  width = "125px",
  height = "125px",
  autoplay = true,
  loop = true,
  delay = 3000,
  objectFit = "object-fit",
}) => {
  return (
    <div className={`w-[${width}] h-[${height}] relative`}>
      <style>
        {`
          :root {
            --swiper-navigation-size: 12px;
          }
        `}
      </style>
      <Swiper
        modules={[Navigation, Autoplay]}
        navigation={{
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        }}
        loop={loop}
        autoplay={
          autoplay
            ? {
                delay: delay,
                disableOnInteraction: false,
              }
            : false
        }
      >
        {images && images.length > 0 ? (
          images.map((image, idx) => (
            <SwiperSlide key={idx}>
              <img
                src={formatImageUrl(image) || Default_image}
                alt={`Image ${idx + 1}`}
                className={`w-[${width}] h-[${height}] ${objectFit}`}
              />
            </SwiperSlide>
          ))
        ) : (
          <SwiperSlide>
            <img
              src={Default_image}
              alt="Default image"
              className={`w-[${width}] h-[${height}] ${objectFit}`}
            />
          </SwiperSlide>
        )}
      </Swiper>
      <button className="swiper-button-prev absolute left-0 top-1/2 -translate-y-1/2 bg-gray-200 p-2 rounded-full !w-[28px] !h-[28px] flex justify-center items-center"></button>
      <button className="swiper-button-next absolute right-0 top-1/2 -translate-y-1/2 bg-gray-200 p-1 rounded-full !w-[28px] !h-[28px] flex justify-center items-center"></button>
    </div>
  );
};

export default ImageSlider;
