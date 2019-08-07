import React from "react";
import { Link } from "gatsby";

import Layout from "../components/layout";
import Image from "../components/image";
import SEO from "../components/seo";
import Logo from "../components/Logo";
import "./index.css";

class IndexPage extends React.Component {
  render() {
    return (
      <Layout>
        <SEO title="Home" />
        <div id="main">
          <div className="intro">
            <div className="intro-copy">
              <Logo fill="none" />
              <h2 className="intro-copy__headline">
                These are some examples of my recent work. Please{" "}
                <a href="mailto:john@johnthedesigner.com">get in touch</a> If
                you've got any questions or want to know more how the design for
                these features came together.
              </h2>
            </div>
          </div>

          <div className="work__copy">
            <h3>1. The Highlights Page</h3>
            <h4>
              <Link to="/work/highlights">
                When you name something <em>highlights</em>, people expect
                something good
              </Link>
            </h4>
          </div>

          <div className="work__copy">
            <h3>1. The Highlights Page</h3>
            <h4>
              <Link to="/work/highlights">
                When you name something highlights, people expect something good
              </Link>
            </h4>
          </div>

          <div className="work__copy">
            <h3>1. The Highlights Page</h3>
            <h4>
              <Link to="/work/highlights">
                When you name something highlights, people expect something good
              </Link>
            </h4>
          </div>

          <div className="work__copy">
            <h3>1. The Highlights Page</h3>
            <h4>
              <Link to="/work/highlights">
                When you name something highlights, people expect something good
              </Link>
            </h4>
          </div>
        </div>
      </Layout>
    );
  }
}

export default IndexPage;
