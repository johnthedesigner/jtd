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
                Hi, I’m John Livornese. I’m the head of product design for{" "}
                <a href="http://luminoso.com" target="_blank">
                  Luminoso
                </a>
                , in Boston, Massachusetts. We make AI-based text analytics
                software and{" "}
                <a href="http://luminoso.com/jobs" target="_blank">
                  <em>we're hiring</em>
                </a>
                . Since you’re here anyway, why not check out some of my{" "}
                <a href="#work">work</a>, or you could{" "}
                <a href="mailto:john@johnthedesigner.com">get in touch</a>. We
                could talk design or whatever, no pressure.
              </h2>
            </div>
          </div>

          <div className="table-of-contents" id="work">
            <h3>Some of my recent work</h3>
            <div className="table-of-contents__item">
              <span className="table-of-contents__name">
                1. The Highlights Page
              </span>
              <Link className="table-of-contents__link" to="/work/highlights">
                The cornerstone of our UI
              </Link>
            </div>

            <div className="table-of-contents__item">
              <span className="table-of-contents__name">
                2. "Answers First"
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
                3. Improving the Analysis Workflow
              </span>
              <Link className="table-of-contents__link" to="/work/workflow">
                No more analysis paralysis
              </Link>
            </div>

            <div className="table-of-contents__item">
              <span className="table-of-contents__name">
                4. Comparing time periods
              </span>
              <Link className="table-of-contents__link" to="/work/comparisons">
                What even happened last week?
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
}

export default IndexPage;
