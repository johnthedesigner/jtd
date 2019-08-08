import { Link } from "gatsby";
import PropTypes from "prop-types";
import React from "react";

import "./header.css";

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
    <div className="nav__menu">
      <Link className="nav__item" to="/">
        ← Back to Home
      </Link>
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
