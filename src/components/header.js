import { Link } from "gatsby";
import PropTypes from "prop-types";
import React from "react";

const Header = ({ siteTitle }) => (
  <header
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      textAlign: "center"
    }}
  >
    <div>
      <h1>
        <Link to="/">{siteTitle}</Link>
      </h1>
    </div>
  </header>
);

Header.propTypes = {
  siteTitle: PropTypes.string
};

Header.defaultProps = {
  siteTitle: ``
};

export default Header;
