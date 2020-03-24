import React, { Component } from 'react'


type Props = {}
type State = {
    isHidden: boolean
  }
  

class MoratoriumBanner extends Component<Props,State> {
    constructor(Props: Props) {
      super(Props);
  
      this.state = {
        isHidden: false
      }
  
    }
  
    closeBanner = () => this.setState({isHidden: true});
  
    render() {
      return (
        <section className={"hero is-warning is-small " + (this.state.isHidden && "is-hidden")}>
          <div className="hero-body">
          <div className="close-button is-absolute is-size-5 is-pulled-right" onClick = {this.closeBanner}>✕</div>
            <div className="container">
              <p>
                  <span className="has-text-weight-bold">COVID-19 Update: </span>
                  JustFix.nyc is still in operation, and we are adapting our products to match new rules put in place during the Covid-19 public health crisis. 
                  Thanks to organizing from tenant leaders, renters now have stronger protections during this time, including a full halt on eviction cases. 
                  {' '}<a href="https://www.righttocounselnyc.org/moratorium_faq" rel="noopener noreferrer">
                    <span className="has-text-weight-bold">Learn more</span>
                  </a>
              </p>
            </div>
          </div>
        </section>
      );
    }
  }

  export default MoratoriumBanner;