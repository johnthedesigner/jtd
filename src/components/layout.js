/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from "react";
import PropTypes from "prop-types";
import { useStaticQuery, graphql } from "gatsby";

import Header from "./header";
import "./normalize.css";
import "./layout.css";

const Layout = props => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `);

  if (props.showHeader) {
    return (
      <>
        <Header />
        <main>{props.children}</main>
      </>
    );
  } else {
    return (
      <>
        <main>{props.children}</main>
      </>
    );
  }
};

Layout.propTypes = {
  children: PropTypes.node.isRequired
};

export default Layout;
