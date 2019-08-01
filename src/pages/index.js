import React from "react";
import _ from "lodash";

import Layout from "../components/layout";
// import Image from "../components/image";
import SEO from "../components/seo";
import "./index.css";

const generateButton = heroSize => {
  let buttonHeight = _.sample([24, 32, 48]);
  let buttonWidth = _.random(100, 150, false);
  return {
    height: buttonHeight,
    width: buttonWidth,
    x: _.random(0, heroSize.width - buttonWidth, false),
    y: _.random(0, heroSize.height - buttonHeight, false),
    background: _.sample(["rebeccapurple", "#2efccf", "#ffcd73"]),
    textColor: "white",
    border: "white",
    text: "Click me!"
  };
};

class IndexPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      buttons: [],
      heroSize: { width: 0, height: 0 }
    };
    this.heroRef = React.createRef();
  }

  componentDidMount() {
    let heroBoundingBox = this.heroRef.current.getBoundingClientRect();
    let heroSize = {
      width: heroBoundingBox.width,
      height: heroBoundingBox.height
    };
    let buttons = _.times(150, () => {
      return generateButton(heroSize);
    });
    this.setState({ buttons, heroSize });
  }

  render() {
    return (
      <Layout>
        <SEO title="Home" />
        <div className="hero" ref={this.heroRef}>
          <svg
            width={this.state.heroSize.width}
            height={this.state.heroSize.height}
            style={{
              position: "absolute",
              top: 0,
              left: 0
            }}
          >
            <defs>
              <filter id="shadow">
                <feDropShadow dx="0" dy="3" stdDeviation="2" />
              </filter>
            </defs>
            {_.map(this.state.buttons, (button, index) => {
              return (
                <rect
                  key={index}
                  height={button.height}
                  width={button.width}
                  x={button.x}
                  y={button.y}
                  fill={button.background}
                  filter={"url(#shadow)"}
                >
                  <text>{button.text}</text>
                </rect>
              );
            })}
          </svg>
        </div>
      </Layout>
    );
  }
}

export default IndexPage;
