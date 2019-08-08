import React from "react";
import { Link } from "gatsby";

import Layout from "../../components/layout";
import SEO from "../../components/seo";

const SecondPage = () => (
  <Layout showHeader={true}>
    <SEO title="Comparing Time Periods" />
    <div id="main">
      <div className="intro">
        <div className="intro-copy">
          <h1>Comparing Time Periods</h1>
          <h2 className="intro-copy__headline">
            Learn from history or be doomed to repeat it.
          </h2>
        </div>
      </div>
      <div className="work__copy">
        <h3>What was the problem?</h3>
        <p>
          In our flagship product, users can apply filters to look at narrow
          ranges of time, such as the past week, to understand what's going on
          lately. User interviews and feedback led us to add the ability to
          compare to a previous time range directly in Drivers UI.
        </p>
        <h3>How did we approach this design?</h3>
        <p>
          There were a lot of variables to consider with this feature, and to
          cover all of our bases required sharing the design early and
          incorporating a number of rounds of feedback. This feature was largely
          shaped on the whiteboard, in meetings with stakeholders from product
          management and engineering and with regular users of the product.
        </p>
        <p>
          A project's data could have more than one date field and a user would
          have to narrow their view down to a particular date range in order to
          do a comparison. In order to build this feature in a way that users
          could discover, learn and use themselves, we need to introduce new
          elements that would send clear signals to the user about what date
          ranges they were seeing.
        </p>
      </div>
      <div className="work__art-container">
        <div className="figma-iframe--small">
          <iframe
            style={{ border: "none" }}
            width="100%"
            src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FLjBh1XJwgn5GRMZHODotEn%2FCompare-to-previous-period%3Fnode-id%3D11%253A944"
            allowFullScreen
          ></iframe>
          <h4 className="work__art-caption">
            A scatterplot visualization from the Drivers tool, showing the
            current date range with out a comparison view
          </h4>
        </div>
        <div className="figma-iframe--small">
          <iframe
            title="iframe 2"
            style={{ border: "none" }}
            width="100%"
            src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FLjBh1XJwgn5GRMZHODotEn%2FCompare-to-previous-period%3Fnode-id%3D11%253A0"
            allowFullScreen
          ></iframe>
          <h4 className="work__art-caption">
            A scatterplot visualization from the Drivers tool, showing the
            current date range being compared to the previous period
          </h4>
        </div>
      </div>
      <div className="work__art-container">
        <div className="figma-iframe--large">
          <iframe
            title="iframe 1"
            style={{ border: "none" }}
            width="100%"
            src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FLjBh1XJwgn5GRMZHODotEn%2FCompare-to-previous-period%3Fnode-id%3D11%253A1436"
            allowFullScreen
          ></iframe>
          <h4 className="work__art-caption">
            Full-page mockup of the Drivers tool, showing views without a
            comparison, with a comparison, and while curating the concepts to be
            visualized in the scatterplot
          </h4>
        </div>
      </div>
      <div className="work__copy">
        <h3>How did we approach this design?</h3>
        <p>
          This addition to the Drivers feature is brand new and we're only just
          getting initial feedback. We will look to learn a lot from releasing
          this initial version to our users. For example: What sorts of time
          periods do our users wish to compare? Are the basic comparison options
          we've given them enough for their purposes? How often do people want
          to compare the same terms from one period to the next, versus
          comparing which different terms were more uniquely important from
          period to period?
        </p>
      </div>
    </div>
  </Layout>
);

export default SecondPage;
