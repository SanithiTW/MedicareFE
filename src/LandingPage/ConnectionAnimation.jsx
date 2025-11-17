import React from "react";
import Lottie from "lottie-react";
import animationData from "../assets/lottie/doctor-pharmacy-patient.json";

export default function ConnectionAnimation() {
  return (
    <div style={{ width: "600px", margin: "0 auto" }}>
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ width: "100%" }}
      />
    </div>
  );
}
