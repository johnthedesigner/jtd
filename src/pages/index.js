import React from "react";

import Layout from "../components/layout";
import Image from "../components/image";
import SEO from "../components/seo";
import "./index.css";

class IndexPage extends React.Component {
  render() {
    return (
      <Layout>
        <SEO title="Home" />
        <div id="work">
          <div className="intro">
            <div className="intro-copy">
              <svg
                viewBox="0 0 640 200"
                fill="none"
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
              <h2 className="intro-copy__headline">
                These are some examples of my recent work. Please{" "}
                <a href="mailto:john@johnthedesigner.com">get in touch</a> If
                you've got any questions or want to know more how the design for
                these features came together.
              </h2>
            </div>
          </div>
          <div className="work-copy">
            <h3>1. The Highlights Page</h3>
            <h2>
              The Highlights page is a new homepage for projects in our flagship
              application. It's the cornerstone of our new "Answers first"
              strategy.
            </h2>
            <p>
              Sed venenatis ipsum metus, vel blandit nunc venenatis sit amet.
              Aliquam erat volutpat. Cras lacinia felis cursus magna tincidunt
              porta. Nunc ut augue ultrices, condimentum mi eu, lobortis urna.
              Quisque suscipit iaculis sollicitudin. Pellentesque habitant morbi
              tristique senectus et netus et malesuada fames ac turpis egestas.
            </p>
          </div>
          <div className="figma-iframe__container">
            <div className="figma-iframe--large">
              <iframe
                title="iframe 1"
                style={{ border: "none" }}
                width="100%"
                src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FVcKqDhujLs16b1wQrcgR7L%2FHighlights-full-page-mock%3Fnode-id%3D1%253A645"
                allowFullScreen
              ></iframe>
              <h4 className="figma-iframe__caption">
                Full-page mockup of the highlights page
              </h4>
            </div>
            <div className="figma-iframe--small">
              <iframe
                title="iframe 2"
                style={{ border: "none" }}
                width="100%"
                src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FVcKqDhujLs16b1wQrcgR7L%2FHighlights-full-page-mock%3Fnode-id%3D1%253A645"
                allowFullScreen
              ></iframe>
              <h4 className="figma-iframe__caption">
                Sed venenatis ipsum metus, vel blandit nunc venenatis sit amet.
                Aliquam erat volutpat. Cras lacinia felis cursus magna tincidunt
                porta. Nunc ut augue ultrices, condimentum mi eu, lobortis urna.
                Quisque suscipit iaculis sollicitudin. Pellentesque habitant
                morbi tristique senectus et netus et malesuada fames ac turpis
                egestas.
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
              <h4 className="figma-iframe__caption">
                Full-page mockup of the highlights page
              </h4>
            </div>
          </div>
          <div className="work-copy">
            <p>
              Sed venenatis ipsum metus, vel blandit nunc venenatis sit amet.
              Aliquam erat volutpat. Cras lacinia felis cursus magna tincidunt
              porta. Nunc ut augue ultrices, condimentum mi eu, lobortis urna.
              Quisque suscipit iaculis sollicitudin. Pellentesque habitant morbi
              tristique senectus et netus et malesuada fames ac turpis egestas.
            </p>
          </div>
          <div className="figma-iframe__container">
            <div className="figma-iframe--small">
              <iframe
                title="iframe 4"
                style={{ border: "none" }}
                width="100%"
                src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FVcKqDhujLs16b1wQrcgR7L%2FHighlights-full-page-mock%3Fnode-id%3D1%253A645"
                allowFullScreen
              ></iframe>
              <h4 className="figma-iframe__caption">
                Sed venenatis ipsum metus, vel blandit nunc venenatis sit amet.
                Aliquam erat volutpat. Cras lacinia felis cursus magna tincidunt
                porta. Nunc ut augue ultrices, condimentum mi eu, lobortis urna.
                Quisque suscipit iaculis sollicitudin. Pellentesque habitant
                morbi tristique senectus et netus et malesuada fames ac turpis
                egestas.
              </h4>
            </div>
            <div className="figma-iframe--small">
              <iframe
                title="iframe 5"
                style={{ border: "none" }}
                width="100%"
                src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FVcKqDhujLs16b1wQrcgR7L%2FHighlights-full-page-mock%3Fnode-id%3D1%253A645"
                allowFullScreen
              ></iframe>
              <h4 className="figma-iframe__caption">
                Full-page mockup of the highlights page
              </h4>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
}

export default IndexPage;
