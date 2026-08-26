import Slider from "react-slick";

function SampleArrow() {
  return <div className="hidden" />;
}

const AuthCarousel = ({ titleClass, paraClass }) => {
  const settings = {
    dots: true,
    infinite: true,
    autoplay: false,
    speed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    nextArrow: <SampleArrow />,
    prevArrow: <SampleArrow />,
  };
  return (
    <div className="auth-carousel">
      <Slider {...settings}>
        {[0, 1].map((idx) => (
          <div key={idx}>
            <h1
              className={`text-4xl font-bold leading-10 ${
                titleClass || "text-white"
              }`}
            >
              Your Companion for
              <br />
              Hajj & Umrah Travel
            </h1>
            <p
              className={`mt-5 text-lg leading-6 max-md:mr-2.5 ${
                paraClass || "text-white"
              } font-light`}
            >
              Book Safe and Confirmable Rides to Holy
              <br />
              Cities with Ease. Plan Your Pilgrimage with
              <br />
              Trusted Transportation.
            </p>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default AuthCarousel;
