import React from "react";

const Logo = props => {
  return (
    <svg
      viewBox="0 0 640 200"
      fill={props.fill}
      xmlns="http://www.w3.org/2000/svg"
      className="intro-logo"
    >
      <rect x="220" width="100" height="100" />
      <rect x="320" width="100" height="100" />
      <rect x="270" y="100" width="100" height="100" />
      <rect x="440" width="100" height="100" />
      <rect x="440" y="100" width="100" height="100" />
      <path d="M540 200C595.228 200 640 155.228 640 100L540 100L540 200Z" />
      <path d="M640 100C640 44.7715 595.228 3.91405e-06 540 8.74228e-06L540 100L640 100Z" />
      <rect x="100" width="100" height="100" />
      <path d="M100 200C155.228 200 200 155.228 200 100L100 100L100 200Z" />
      <path d="M0 100C0 155.228 44.7715 200 100 200L100 100L0 100Z" />
    </svg>
  );
};

export default Logo;
