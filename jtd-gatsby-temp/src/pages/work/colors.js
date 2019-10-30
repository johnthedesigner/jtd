import React from "react";

import Layout from "../../components/layout";
import SEO from "../../components/seo";

const SecondPage = () => (
  <Layout showHeader={true}>
    <SEO title="Page two" />
    <div id="main">
      <div className="intro">
        <div className="intro-copy">
          <h1>A Refined Palette</h1>
          <h2 className="intro-copy__headline">
            Building the color palette you'r egoing to need later
          </h2>
        </div>
      </div>
      <div className="work__copy">
        <h3>What was the problem?</h3>
        <p>
          Sed venenatis ipsum metus, vel blandit nunc venenatis sit amet.
          Aliquam erat volutpat. Cras lacinia felis cursus magna tincidunt
          porta. Nunc ut augue ultrices, condimentum mi eu, lobortis urna.
          Quisque suscipit iaculis sollicitudin. Pellentesque habitant morbi
          tristique senectus et netus et malesuada fames ac turpis egestas.
        </p>
        <h3>How did we approach this design?</h3>
        <p>
          Sed venenatis ipsum metus, vel blandit nunc venenatis sit amet.
          Aliquam erat volutpat. Cras lacinia felis cursus magna tincidunt
          porta. Nunc ut augue ultrices, condimentum mi eu, lobortis urna.
          Quisque suscipit iaculis sollicitudin. Pellentesque habitant morbi
          tristique senectus et netus et malesuada fames ac turpis egestas.
        </p>
      </div>
      <div className="work__art-container">
        <div className="figma-iframe--large">
          <iframe
            title="iframe 1"
            style={{ border: "none" }}
            width="100%"
            src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FVcKqDhujLs16b1wQrcgR7L%2FHighlights-full-page-mock%3Fnode-id%3D1%253A645"
            allowFullScreen
          ></iframe>
          <h4 className="work__art-caption">
            Full-page mockup of the highlights page
          </h4>
        </div>
      </div>
      <div className="work__art-container">
        <div className="figma-iframe--small">
          <iframe
            title="iframe 2"
            style={{ border: "none" }}
            width="100%"
            src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FVcKqDhujLs16b1wQrcgR7L%2FHighlights-full-page-mock%3Fnode-id%3D1%253A645"
            allowFullScreen
          ></iframe>
          <h4 className="work__art-caption">
            Sed venenatis ipsum metus, vel blandit nunc venenatis sit amet.
            Aliquam erat volutpat. Cras lacinia felis cursus magna tincidunt
            porta.
          </h4>
        </div>
        <div className="figma-iframe--small">
          <iframe
            title="iframe 3"
            style={{ border: "none" }}
            width="100%"
            src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FVcKqDhujLs16b1wQrcgR7L%2FHighlights-full-page-mock%3Fnode-id%3D1%253A645"
            allowFullScreen
          ></iframe>
          <h4 className="work__art-caption">
            Full-page mockup of the highlights page
          </h4>
        </div>
      </div>
      <div className="work__copy">
        <h3>How did we approach this design?</h3>
        <p>
          Sed venenatis ipsum metus, vel blandit nunc venenatis sit amet.
          Aliquam erat volutpat. Cras lacinia felis cursus magna tincidunt
          porta. Nunc ut augue ultrices, condimentum mi eu, lobortis urna.
          Quisque suscipit iaculis sollicitudin. Pellentesque habitant morbi
          tristique senectus et netus et malesuada fames ac turpis egestas.
        </p>
      </div>
    </div>
  </Layout>
);

export default SecondPage;
