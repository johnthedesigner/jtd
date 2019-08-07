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

          <div className="table-of-contents">
            <h3>Table of Contents</h3>
            <div className="table-of-contents__item">
              <span className="table-of-contents__name">
                1. "Answers First"
              </span>
              <Link
                className="table-of-contents__link"
                to="/work/answers-first"
              >
                What does that mean?
              </Link>
            </div>

            <div className="table-of-contents__item">
              <span className="table-of-contents__name">
                2. The Highlights Page
              </span>
              <Link className="table-of-contents__link" to="/work/highlights">
                Name it <em>"Highlights"</em> it better be good
              </Link>
            </div>

            <div className="table-of-contents__item">
              <span className="table-of-contents__name">
                3. A Refined Palette
              </span>
              <Link className="table-of-contents__link" to="/work/colors">
                Building the color palette you'll need later
              </Link>
            </div>

            <div className="table-of-contents__item">
              <span className="table-of-contents__name">4. Workflow</span>
              <Link className="table-of-contents__link" to="/work/framework">
                Guiding the user to work better
              </Link>
            </div>

            <div className="table-of-contents__item">
              <span className="table-of-contents__name">
                5. Comparing time periods
              </span>
              <Link className="table-of-contents__link" to="/work/comparisons">
                Nothing else compares
              </Link>
            </div>

            <div className="table-of-contents__item">
              <span className="table-of-contents__name">
                6. Fitering documents
              </span>
              <Link className="table-of-contents__link" to="/work/filtering">
                Faceted search FTW
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
}

export default IndexPage;
